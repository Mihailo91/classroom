/**
 * Cart Utilities
 * Handles cart calculations, totals, and coupon application
 */

import { CartItem, CartItemType, PackageType, Coupon, DiscountType } from "@prisma/client";

type CartItemWithDetails = CartItem & {
  title?: string;
  description?: string;
};

/**
 * Calculate total amount before discount
 */
export function calculateGrossAmount(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    return sum + Number(item.priceSnapshot);
  }, 0);
}

/**
 * Apply coupon discount to gross amount
 */
export function calculateDiscount(
  grossAmount: number,
  coupon: Coupon | null
): number {
  if (!coupon || !coupon.isActive) return 0;

  // Check validity period
  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    return 0;
  }

  if (coupon.discountType === DiscountType.PERCENTAGE) {
    const percentage = Number(coupon.discountValue);
    return grossAmount * (percentage / 100);
  } else {
    // FIXED
    const fixedAmount = Number(coupon.discountValue);
    return Math.min(fixedAmount, grossAmount); // Don't discount more than the total
  }
}

/**
 * Calculate final net amount after discount
 */
export function calculateNetAmount(
  grossAmount: number,
  discountAmount: number
): number {
  return Math.max(0, grossAmount - discountAmount);
}

/**
 * Validate if coupon can be applied to cart items
 */
export function validateCouponApplicability(
  coupon: Coupon,
  items: CartItem[]
): { valid: boolean; reason?: string } {
  if (!coupon.isActive) {
    return { valid: false, reason: "Coupon is no longer active" };
  }

  const now = new Date();
  if (now < coupon.validFrom) {
    return { valid: false, reason: "Coupon is not yet valid" };
  }

  if (now > coupon.validUntil) {
    return { valid: false, reason: "Coupon has expired" };
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, reason: "Coupon has reached its usage limit" };
  }

  // Check if coupon applies to at least one item in cart
  const hasApplicableItem = items.some((item) => {
    if (item.itemType === CartItemType.LESSON_PACKAGE) {
      return coupon.applicableTo.includes("LESSON_PACKAGE");
    } else if (item.itemType === CartItemType.GROUP_COURSE) {
      return coupon.applicableTo.includes("GROUP_COURSE");
    } else if (item.itemType === CartItemType.VIDEO_COURSE) {
      return coupon.applicableTo.includes("VIDEO_COURSE");
    }
    return false;
  });

  if (!hasApplicableItem) {
    return {
      valid: false,
      reason: "Coupon cannot be applied to items in your cart",
    };
  }

  return { valid: true };
}

/**
 * Get package details for display
 */
export function getPackageDetails(packageType: PackageType): {
  name: string;
  lessons: number;
  validityDays: number;
} {
  switch (packageType) {
    case PackageType.SINGLE:
      return { name: "Single Class", lessons: 1, validityDays: 0 };
    case PackageType.STARTER:
      return { name: "Starter Pack", lessons: 4, validityDays: 30 };
    case PackageType.STANDARD:
      return { name: "Standard Pack", lessons: 8, validityDays: 60 };
    case PackageType.PREMIUM:
      return { name: "Premium Pack", lessons: 12, validityDays: 90 };
  }
}

/**
 * Format cart summary for display
 */
export function formatCartSummary(
  grossAmount: number,
  discountAmount: number,
  netAmount: number,
  couponCode?: string | null
) {
  return {
    subtotal: `€${grossAmount.toFixed(2)}`,
    discount: discountAmount > 0 ? `-€${discountAmount.toFixed(2)}` : null,
    coupon: couponCode || null,
    total: `€${netAmount.toFixed(2)}`,
  };
}
