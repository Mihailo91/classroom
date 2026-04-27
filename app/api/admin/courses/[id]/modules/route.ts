import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/courses/[id]/modules
 * Add a new module to a course
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  try {
    const { id: courseId } = await params;
    const body = await request.json();
    const { title, description, order } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: "Missing required field: title" },
        { status: 400 }
      );
    }

    if (order !== undefined && (!Number.isInteger(order) || order < 0)) {
      return NextResponse.json(
        { error: "order must be a non-negative integer" },
        { status: 400 }
      );
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // If no order provided, append to end (transactional to avoid race conditions)
    let moduleOrder = order;
    const module = await prisma.$transaction(async (tx) => {
      if (moduleOrder === undefined) {
        const lastModule = await tx.module.findFirst({
          where: { courseId },
          orderBy: { order: "desc" },
        });
        moduleOrder = lastModule ? lastModule.order + 1 : 0;
      }

      return tx.module.create({
        data: {
          title,
          description: description || null,
          order: moduleOrder,
          courseId,
        },
      });
    });

    return NextResponse.json({ module }, { status: 201 });
  } catch (error) {
    console.error("Error creating module:", error);
    return NextResponse.json(
      { error: "Failed to create module" },
      { status: 500 }
    );
  }
}
