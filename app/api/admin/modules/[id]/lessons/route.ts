import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/modules/[id]/lessons
 * Add a new lesson to a module
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  try {
    const { id: moduleId } = await params;
    const body = await request.json();
    const { title, description, vimeoId, durationMinutes, isPreview, order } = body;

    // Validate required fields
    if (!title || !vimeoId) {
      return NextResponse.json(
        { error: "Missing required fields: title, vimeoId" },
        { status: 400 }
      );
    }

    // Verify module exists
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    // If no order provided, append to end
    let lessonOrder = order;
    if (lessonOrder === undefined) {
      const lastLesson = await prisma.lesson.findFirst({
        where: { moduleId },
        orderBy: { order: "desc" },
      });
      lessonOrder = lastLesson ? lastLesson.order + 1 : 0;
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description: description || null,
        vimeoId,
        durationMinutes: durationMinutes || null,
        isPreview: isPreview || false,
        order: lessonOrder,
        moduleId,
      },
    });

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}
