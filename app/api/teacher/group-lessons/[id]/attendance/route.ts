import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherOrAdmin } from "@/lib/api-helpers";

/**
 * PUT /api/teacher/group-lessons/[id]/attendance
 * Mark attendance for a group lesson
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireTeacherOrAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const { presentStudents, isHeld } = body;

    if (!Array.isArray(presentStudents)) {
      return NextResponse.json(
        { error: "presentStudents must be an array" },
        { status: 400 }
      );
    }

    // Get lesson with course
    const lesson = await prisma.groupLesson.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Verify teacher owns this course (unless admin)
    if (user.role !== "ADMIN" && lesson.course.teacherId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: Not your course" },
        { status: 403 }
      );
    }

    // Update lesson attendance
    const updatedLesson = await prisma.groupLesson.update({
      where: { id },
      data: {
        presentStudents,
        isHeld: isHeld !== undefined ? isHeld : true,
      },
    });

    return NextResponse.json({
      lesson: {
        id: updatedLesson.id,
        scheduledAt: updatedLesson.scheduledAt,
        durationMin: updatedLesson.durationMin,
        presentStudents: updatedLesson.presentStudents,
        isHeld: updatedLesson.isHeld,
      },
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: "Failed to update attendance" },
      { status: 500 }
    );
  }
}
