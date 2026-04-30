import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { TransactionStatus } from "@prisma/client";

/**
 * GET /api/admin/transactions
 * Get all transactions with filters (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as TransactionStatus | null;
    const search = searchParams.get("search");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Build query filters
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (from || to) {
      where.createdAt = {};
      if (from) {
        where.createdAt.gte = new Date(from);
      }
      if (to) {
        where.createdAt.lte = new Date(to);
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Get admin transactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
