import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherOrAdmin } from "@/lib/api-helpers";

/**
 * PUT /api/admin/group-lessons/[id]
 * Update a group lesson (Admin or assigned Teacher)
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
    const { scheduledAt, durationMin, notes, isHeld, presentStudents } = body;

    // Get lesson to check teacher ownership
    const lesson = await prisma.groupLesson.findUnique({
      where: { id },
      include: { 
        course: { select: { teacherId: true } },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Teachers can only edit their own course lessons
    if (user.role === "TEACHER" && lesson.course.teacherId !== user.id) {
      return NextResponse.json(
        { error: "You can only edit lessons for your own courses" },
        { status: 403 }
      );
    }

    // Update lesson
    const updatedLesson = await prisma.groupLesson.update({
      where: { id },
      data: {
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(durationMin && { durationMin }),
        ...(notes !== undefined && { notes }),
        ...(isHeld !== undefined && { isHeld }),
        ...(presentStudents && { presentStudents }),
      },
    });

    return NextResponse.json({ lesson: updatedLesson });
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/group-lessons/[id]
 * Delete a group lesson (Admin or assigned Teacher)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireTeacherOrAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    // Get lesson to check teacher ownership
    const lesson = await prisma.groupLesson.findUnique({
      where: { id },
      include: { course: { select: { teacherId: true } } },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Teachers can only delete their own course lessons
    if (user.role === "TEACHER" && lesson.course.teacherId !== user.id) {
      return NextResponse.json(
        { error: "You can only delete lessons for your own courses" },
        { status: 403 }
      );
    }

    await prisma.groupLesson.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 });
  }
}
