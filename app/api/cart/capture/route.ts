import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { capturePayPalOrder } from "@/lib/paypal";
import { CartItemType, PackageSource } from "@prisma/client";
import { getLessonsIncluded, getExpiresAt } from "@/lib/packageUtils";

/**
 * POST /api/cart/capture
 * Capture PayPal payment and fulfill order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paypalOrderId } = await request.json();

    if (!paypalOrderId) {
      return NextResponse.json(
        { error: "PayPal Order ID required" },
        { status: 400 }
      );
    }

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { paypalOrderId },
      include: {
        user: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (transaction.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (transaction.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Transaction already completed" },
        { status: 400 }
      );
    }

    // Capture PayPal payment
    const captureResult = await capturePayPalOrder(paypalOrderId);

    if (captureResult.status !== "COMPLETED") {
      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        { error: "Payment capture failed" },
        { status: 400 }
      );
    }

    // Get cart items to fulfill
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Fulfill each cart item
    await prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        if (item.itemType === CartItemType.VIDEO_COURSE && item.courseId) {
          // Grant course access (idempotent via skipDuplicates)
          await tx.studentCourse.upsert({
            where: {
              studentId_courseId: {
                studentId: session.user.id,
                courseId: item.courseId,
              },
            },
            create: {
              studentId: session.user.id,
              courseId: item.courseId,
            },
            update: {},
          });
        } else if (
          item.itemType === CartItemType.GROUP_COURSE &&
          item.groupCourseId
        ) {
          // Enroll in group course (idempotent)
          await tx.groupEnrollment.upsert({
            where: {
              studentId_courseId: {
                studentId: session.user.id,
                courseId: item.groupCourseId,
              },
            },
            create: {
              studentId: session.user.id,
              courseId: item.groupCourseId,
              paymentMethod: "paypal",
              amountPaid: Number(item.priceSnapshot),
              paymentDate: new Date(),
            },
            update: {},
          });
        } else if (
          item.itemType === CartItemType.LESSON_PACKAGE &&
          item.lessonPackageId &&
          item.teacherId &&
          item.packageType
        ) {
          // Create student package (idempotent: skip if this transaction+package already fulfilled)
          const existing = await tx.studentPackage.findFirst({
            where: {
              transactionId: transaction.id,
              sourceLessonPackageId: item.lessonPackageId,
            },
          });

          if (!existing) {
            const lessonsTotal = getLessonsIncluded(item.packageType);
            const expiresAt = getExpiresAt(item.packageType);

            await tx.studentPackage.create({
              data: {
                studentId: session.user.id,
                teacherId: item.teacherId,
                sourceLessonPackageId: item.lessonPackageId,
                transactionId: transaction.id,
                packageType: item.packageType,
                lessonsTotal,
                lessonsUsed: 0,
                status: "ACTIVE",
                source: PackageSource.PAYPAL,
                expiresAt,
              },
            });
          }
        }
      }

      // Update transaction status
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: { couponCode: null },
      });

      // Increment coupon usage if applicable
      if (transaction.couponCode) {
        await tx.coupon.update({
          where: { code: transaction.couponCode },
          data: {
            usedCount: { increment: 1 },
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error("Capture error:", error);
    return NextResponse.json(
      { error: "Payment capture failed" },
      { status: 500 }
    );
  }
}
