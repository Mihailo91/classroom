import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/group-courses/[id]/enroll
 * Admin-only: Manually enroll a student with payment details
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: courseId } = await params;
    const body = await request.json();
    const {
      studentId,
      paymentMethod = "bank_transfer",
      transactionRef,
      paymentDate,
      amountPaid,
      payerName,
      paymentNotes,
    } = body;

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Check if course exists
    const course = await prisma.groupCourse.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Check if course is full
    if (course._count.enrollments >= course.maxStudents) {
      return NextResponse.json(
        { error: "Course is full" },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.groupEnrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Student is already enrolled in this course" },
        { status: 400 }
      );
    }

    // Create enrollment with payment details
    const enrollment = await prisma.groupEnrollment.create({
      data: {
        studentId,
        courseId,
        status: "ACTIVE",
        paymentMethod,
        transactionRef: transactionRef || null,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        amountPaid: amountPaid ? parseFloat(amountPaid) : null,
        payerName: payerName || null,
        paymentNotes: paymentNotes || null,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Student enrolled successfully",
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        student: enrollment.student,
        paymentMethod: enrollment.paymentMethod,
        transactionRef: enrollment.transactionRef,
        paymentDate: enrollment.paymentDate,
        amountPaid: enrollment.amountPaid ? Number(enrollment.amountPaid) : null,
        payerName: enrollment.payerName,
        paymentNotes: enrollment.paymentNotes,
      },
    });
  } catch (error) {
    console.error("Error enrolling student:", error);
    return NextResponse.json(
      { error: "Failed to enroll student" },
      { status: 500 }
    );
  }
}
