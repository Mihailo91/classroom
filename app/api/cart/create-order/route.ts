import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { createPayPalOrder } from "@/lib/paypal";
import { CartItemType } from "@prisma/client";

/**
 * POST /api/cart/create-order
 * Create a PayPal order and sync cart to database.
 * Validates all items against DB to prevent price manipulation.
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

    // Validate and resolve items from DB to prevent price manipulation
    const resolvedItems: {
      itemType: CartItemType;
      courseId?: string;
      groupCourseId?: string;
      lessonPackageId?: string;
      teacherId?: string;
      packageType?: string;
      priceSnapshot: number;
    }[] = [];

    for (const item of items) {
      if (item.type === "video") {
        const course = await prisma.course.findUnique({
          where: { id: item.id, isPublished: true },
          select: { id: true, price: true },
        });
        if (!course) {
          return NextResponse.json(
            { error: `Course not found: ${item.id}` },
            { status: 400 }
          );
        }
        resolvedItems.push({
          itemType: CartItemType.VIDEO_COURSE,
          courseId: course.id,
          priceSnapshot: Number(course.price),
        });
      } else if (item.type === "group") {
        const groupCourse = await prisma.groupCourse.findUnique({
          where: { id: item.id },
          select: { id: true, price: true, status: true },
        });
        if (!groupCourse || groupCourse.status === "CANCELLED") {
          return NextResponse.json(
            { error: `Group course not found: ${item.id}` },
            { status: 400 }
          );
        }
        resolvedItems.push({
          itemType: CartItemType.GROUP_COURSE,
          groupCourseId: groupCourse.id,
          priceSnapshot: Number(groupCourse.price),
        });
      } else if (item.type === "package") {
        const pkg = await prisma.lessonPackage.findUnique({
          where: { id: item.id, isActive: true },
          select: { id: true, price: true, teacherId: true, packageType: true },
        });
        if (!pkg) {
          return NextResponse.json(
            { error: `Lesson package not found or inactive: ${item.id}` },
            { status: 400 }
          );
        }
        resolvedItems.push({
          itemType: CartItemType.LESSON_PACKAGE,
          lessonPackageId: pkg.id,
          teacherId: pkg.teacherId,
          packageType: pkg.packageType,
          priceSnapshot: Number(pkg.price),
        });
      } else {
        return NextResponse.json(
          { error: `Unknown cart item type: ${item.type}` },
          { status: 400 }
        );
      }
    }

    // Calculate total from DB-resolved prices
    const total = resolvedItems.reduce((sum, item) => sum + item.priceSnapshot, 0);

    // Upsert the cart
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

    // Replace cart items
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    await prisma.cartItem.createMany({
      data: resolvedItems.map((item) => ({
        cartId: cart.id,
        itemType: item.itemType,
        courseId: item.courseId ?? null,
        groupCourseId: item.groupCourseId ?? null,
        lessonPackageId: item.lessonPackageId ?? null,
        teacherId: item.teacherId ?? null,
        packageType: (item.packageType as any) ?? null,
        priceSnapshot: item.priceSnapshot,
      })),
    });

    // Create PayPal order
    const paypalOrderId = await createPayPalOrder(total);

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user!.id,
        paypalOrderId,
        grossAmount: total,
        discountAmount: 0,
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
