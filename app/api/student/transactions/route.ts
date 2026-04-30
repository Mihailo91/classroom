import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/student/transactions
 * Get all transactions for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const transactions = await prisma.transaction.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        grossAmount: true,
        netAmount: true,
        discountAmount: true,
        status: true,
        couponCode: true,
        createdAt: true,
        completedAt: true,
        paypalOrderId: true,
      },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
