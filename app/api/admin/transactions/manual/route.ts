import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/transactions/manual
 * Record a manual payment (bank transfer) for a group course enrollment
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const {
      studentId,
      courseId,
      amountPaid,
      payerName,
      transactionRef,
      paymentNotes,
      paymentDate,
    } = await request.json();

    // Validate required fields
    if (!studentId || !courseId || !amountPaid || !payerName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Invalid student ID" },
        { status: 400 }
      );
    }

    // Verify group course exists
    const course = await prisma.groupCourse.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Invalid course ID" },
        { status: 400 }
      );
    }

    // Check if enrollment already exists
    const existingEnrollment = await prisma.groupEnrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    // Create or update enrollment and transaction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create or update enrollment
      const enrollment = await tx.groupEnrollment.upsert({
        where: {
          studentId_courseId: {
            studentId,
            courseId,
          },
        },
        create: {
          studentId,
          courseId,
          status: "ACTIVE",
          paymentMethod: "bank_transfer",
          transactionRef,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          amountPaid,
          payerName,
          paymentNotes,
        },
        update: {
          paymentMethod: "bank_transfer",
          transactionRef,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          amountPaid,
          payerName,
          paymentNotes,
        },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: studentId,
          grossAmount: amountPaid,
          discountAmount: 0,
          netAmount: amountPaid,
          status: "COMPLETED",
          completedAt: paymentDate ? new Date(paymentDate) : new Date(),
        },
      });

      return { enrollment, transaction };
    });

    return NextResponse.json({
      success: true,
      enrollment: result.enrollment,
      transaction: result.transaction,
    });
  } catch (error) {
    console.error("Manual transaction error:", error);
    return NextResponse.json(
      { error: "Failed to record manual payment" },
      { status: 500 }
    );
  }
}
