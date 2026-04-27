import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

/**
 * PUT /api/admin/group-lessons/[id]
 * Update a group lesson
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { teacherId, scheduledAt, durationMin, notes, isHeld, presentStudents } = body;

    // Check if lesson exists
    const existingLesson = await prisma.groupLesson.findUnique({
      where: { id },
      select: {
        id: true,
        teacherId: true,
        scheduledAt: true,
        durationMin: true,
      },
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: "Group lesson not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Update teacher
    if (teacherId !== undefined && teacherId !== existingLesson.teacherId) {
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
        select: { role: true },
      });

      if (!teacher || (teacher.role !== "TEACHER" && teacher.role !== "ADMIN")) {
        return NextResponse.json(
          { error: "Invalid teacher ID or user is not a teacher" },
          { status: 400 }
        );
      }

      updateData.teacherId = teacherId;
    }

    // Update scheduled time
    if (scheduledAt !== undefined) {
      const scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid scheduled date" },
          { status: 400 }
        );
      }

      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: "Scheduled time must be in the future" },
          { status: 400 }
        );
      }

      updateData.scheduledAt = scheduledDate;

      // Check for scheduling conflicts if time or teacher changed
      const finalTeacherId = teacherId !== undefined ? teacherId : existingLesson.teacherId;
      const finalDuration = durationMin !== undefined ? durationMin : existingLesson.durationMin;
      const lessonEnd = new Date(scheduledDate.getTime() + finalDuration * 60000);

      const conflicts = await prisma.groupLesson.findMany({
        where: {
          id: { not: id }, // Exclude current lesson
          teacherId: finalTeacherId,
          scheduledAt: {
            gte: new Date(scheduledDate.getTime() - 3 * 60 * 60000),
            lte: lessonEnd,
          },
        },
        select: {
          id: true,
          scheduledAt: true,
          durationMin: true,
          course: {
            select: {
              title: true,
            },
          },
        },
      });

      for (const conflict of conflicts) {
        const conflictEnd = new Date(
          conflict.scheduledAt.getTime() + conflict.durationMin * 60000
        );

        if (
          (scheduledDate >= conflict.scheduledAt && scheduledDate < conflictEnd) ||
          (lessonEnd > conflict.scheduledAt && lessonEnd <= conflictEnd) ||
          (scheduledDate <= conflict.scheduledAt && lessonEnd >= conflictEnd)
        ) {
          return NextResponse.json(
            {
              error: `Teacher has a conflicting lesson: ${conflict.course.title} at ${conflict.scheduledAt.toISOString()}`,
            },
            { status: 409 }
          );
        }
      }
    }

    // Update duration
    if (durationMin !== undefined) {
      if (typeof durationMin !== "number" || durationMin < 1 || durationMin > 300) {
        return NextResponse.json(
          { error: "Duration must be between 1 and 300 minutes" },
          { status: 400 }
        );
      }
      updateData.durationMin = durationMin;
    }

    // Update notes
    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    // Update held status
    if (isHeld !== undefined) {
      updateData.isHeld = Boolean(isHeld);
    }

    // Update present students
    if (presentStudents !== undefined) {
      if (!Array.isArray(presentStudents)) {
        return NextResponse.json(
          { error: "Present students must be an array" },
          { status: 400 }
        );
      }
      updateData.presentStudents = presentStudents;
    }

    // Update lesson
    const lesson = await prisma.groupLesson.update({
      where: { id },
      data: updateData,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error("Error updating group lesson:", error);
    return NextResponse.json(
      { error: "Failed to update group lesson" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/group-lessons/[id]
 * Delete a group lesson
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    // Check if lesson exists
    const lesson = await prisma.groupLesson.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Group lesson not found" },
        { status: 404 }
      );
    }

    // Delete lesson
    await prisma.groupLesson.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Group lesson deleted successfully" });
  } catch (error) {
    console.error("Error deleting group lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete group lesson" },
      { status: 500 }
    );
  }
}
