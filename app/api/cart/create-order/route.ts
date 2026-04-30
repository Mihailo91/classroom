import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { createPayPalOrder } from "@/lib/paypal";
import { CartItemType } from "@prisma/client";

/**
 * POST /api/cart/create-order
 * Create a PayPal order and sync cart to database
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { items, couponCode } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Cart items required" },
        { status: 400 }
      );
    }

    // Calculate total
    const total = items.reduce((sum: number, item: any) => sum + item.price, 0);

    // Sync items to database
    // First, upsert the cart
    const cart = await prisma.cart.upsert({
      where: { userId: user!.id },
      create: {
        userId: user!.id,
        couponCode: couponCode || null,
      },
      update: {
        couponCode: couponCode || null,
        updatedAt: new Date(),
      },
    });

    // Delete old cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Create new cart items
    const cartItems = items.map((item: any) => {
      // Map client-side cart format to database format
      const baseItem = {
        cartId: cart.id,
        priceSnapshot: item.price,
      };

      if (item.type === "video") {
        return {
          ...baseItem,
          itemType: CartItemType.VIDEO_COURSE,
          courseId: item.id,
        };
      } else if (item.type === "group") {
        return {
          ...baseItem,
          itemType: CartItemType.GROUP_COURSE,
          groupCourseId: item.id,
        };
      }

      throw new Error(`Unknown cart item type: ${item.type}`);
    });

    await prisma.cartItem.createMany({
      data: cartItems,
    });

    // Create PayPal order
    const paypalOrderId = await createPayPalOrder(total);

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: user!.id,
        paypalOrderId,
        grossAmount: total,
        discountAmount: 0, // No discounts for now
        netAmount: total,
        couponCode: couponCode || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ paypalOrderId });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
