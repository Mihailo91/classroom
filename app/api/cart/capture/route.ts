import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { capturePayPalOrder } from "@/lib/paypal";
import { CartItemType } from "@prisma/client";

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
          // Grant course access
          await tx.studentCourse.create({
            data: {
              studentId: session.user.id,
              courseId: item.courseId,
            },
          });
        } else if (
          item.itemType === CartItemType.GROUP_COURSE &&
          item.groupCourseId
        ) {
          // Enroll in group course
          await tx.groupEnrollment.create({
            data: {
              studentId: session.user.id,
              courseId: item.groupCourseId,
              paymentMethod: "paypal",
              amountPaid: Number(item.priceSnapshot),
              paymentDate: new Date(),
            },
          });
        }
        // Note: LESSON_PACKAGE fulfillment will be added in Phase 6
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
