"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CartItemType, PackageType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  calculateGrossAmount,
  calculateDiscount,
  calculateNetAmount,
  validateCouponApplicability,
} from "@/lib/cart";
import { createPayPalOrder } from "@/lib/paypal";

/**
 * Get or create user's cart
 */
export async function getCart() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  let cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId: session.user.id,
      },
      include: {
        items: true,
      },
    });
  }

  return cart;
}

/**
 * Add item to cart
 */
export async function addToCart(params: {
  itemType: CartItemType;
  teacherId?: string;
  packageType?: PackageType;
  groupCourseId?: string;
  courseId?: string;
  price: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get or create cart
    const cart = await getCart();

    // Check for duplicates
    const existing = cart.items.find((item) => {
      if (params.itemType === CartItemType.LESSON_PACKAGE) {
        return (
          item.teacherId === params.teacherId &&
          item.packageType === params.packageType
        );
      } else if (params.itemType === CartItemType.GROUP_COURSE) {
        return item.groupCourseId === params.groupCourseId;
      } else if (params.itemType === CartItemType.VIDEO_COURSE) {
        return item.courseId === params.courseId;
      }
      return false;
    });

    if (existing) {
      return { success: false, error: "Item already in cart" };
    }

    // Check if user already owns this item
    if (params.itemType === CartItemType.VIDEO_COURSE && params.courseId) {
      const alreadyOwned = await prisma.studentCourse.findUnique({
        where: {
          studentId_courseId: {
            studentId: session.user.id,
            courseId: params.courseId,
          },
        },
      });
      if (alreadyOwned) {
        return { success: false, error: "You already own this course" };
      }
    }

    if (params.itemType === CartItemType.GROUP_COURSE && params.groupCourseId) {
      const alreadyEnrolled = await prisma.groupEnrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: session.user.id,
            courseId: params.groupCourseId,
          },
        },
      });
      if (alreadyEnrolled) {
        return { success: false, error: "You are already enrolled in this group course" };
      }
    }

    // Add item to cart
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        itemType: params.itemType,
        teacherId: params.teacherId,
        packageType: params.packageType,
        groupCourseId: params.groupCourseId,
        courseId: params.courseId,
        priceSnapshot: params.price,
      },
    });

    revalidatePath("/student/cart");
    return { success: true };
  } catch (error) {
    console.error("Add to cart error:", error);
    return { success: false, error: "Failed to add item to cart" };
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(cartItemId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify item belongs to user's cart
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
      },
    });

    if (!cartItem || cartItem.cart.userId !== session.user.id) {
      return { success: false, error: "Item not found" };
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    revalidatePath("/student/cart");
    return { success: true };
  } catch (error) {
    console.error("Remove from cart error:", error);
    return { success: false, error: "Failed to remove item" };
  }
}

/**
 * Clear cart
 */
export async function clearCart() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Clear coupon too
      await prisma.cart.update({
        where: { id: cart.id },
        data: { couponCode: null },
      });
    }

    revalidatePath("/student/cart");
    return { success: true };
  } catch (error) {
    console.error("Clear cart error:", error);
    return { success: false, error: "Failed to clear cart" };
  }
}

/**
 * Apply coupon to cart
 */
export async function applyCoupon(code: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const cart = await getCart();

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return { success: false, error: "Invalid coupon code" };
    }

    // Validate coupon
    const validation = validateCouponApplicability(coupon, cart.items);
    if (!validation.valid) {
      return { success: false, error: validation.reason || "Invalid coupon" };
    }

    // Check per-user usage limit
    if (coupon.maxUsesPerUser) {
      const userUsageCount = await prisma.transaction.count({
        where: {
          userId: session.user.id,
          couponCode: coupon.code,
          status: "COMPLETED",
        },
      });

      if (userUsageCount >= coupon.maxUsesPerUser) {
        return {
          success: false,
          error: "You have already used this coupon the maximum number of times",
        };
      }
    }

    // Apply coupon
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: coupon.code },
    });

    revalidatePath("/student/cart");
    return { success: true };
  } catch (error) {
    console.error("Apply coupon error:", error);
    return { success: false, error: "Failed to apply coupon" };
  }
}

/**
 * Remove coupon from cart
 */
export async function removeCoupon() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (cart) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { couponCode: null },
      });
    }

    revalidatePath("/student/cart");
    return { success: true };
  } catch (error) {
    console.error("Remove coupon error:", error);
    return { success: false, error: "Failed to remove coupon" };
  }
}

/**
 * Checkout cart - create PayPal order
 */
export async function checkoutCart() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const cart = await getCart();

    if (cart.items.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    // Calculate totals
    const grossAmount = calculateGrossAmount(cart.items);
    
    let coupon = null;
    if (cart.couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: cart.couponCode },
      });
    }

    const discountAmount = calculateDiscount(grossAmount, coupon);
    const netAmount = calculateNetAmount(grossAmount, discountAmount);

    if (netAmount <= 0) {
      return { success: false, error: "Invalid cart total" };
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        grossAmount,
        discountAmount,
        netAmount,
        couponCode: cart.couponCode,
        status: "PENDING",
      },
    });

    // Create PayPal order
    const paypalOrderId = await createPayPalOrder(netAmount);

    // Update transaction with PayPal order ID
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { paypalOrderId },
    });

    return {
      success: true,
      paypalOrderId,
      transactionId: transaction.id,
    };
  } catch (error) {
    console.error("Checkout error:", error);
    return { success: false, error: "Failed to create order" };
  }
}
