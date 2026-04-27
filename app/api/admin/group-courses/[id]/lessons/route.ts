import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherOrAdmin } from "@/lib/api-helpers";

/**
 * POST /api/admin/group-courses/[id]/lessons
 * Add a lesson to a group course (Admin or assigned Teacher)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireTeacherOrAdmin();
    if (error) return error;

    const { id: courseId } = await params;
    const body = await request.json();
    const { teacherId, scheduledAt, durationMin, notes } = body;

    // Validation
    if (!teacherId || !scheduledAt) {
      return NextResponse.json(
        { error: "Teacher ID and scheduled time are required" },
        { status: 400 }
      );
    }

    // Check if course exists
    const course = await prisma.groupCourse.findUnique({
      where: { id: courseId },
      select: { id: true, teacherId: true },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Group course not found" },
        { status: 404 }
      );
    }

    // Teachers can only schedule lessons for their own courses
    if (user.role === "TEACHER" && course.teacherId !== user.id) {
      return NextResponse.json(
        { error: "You can only schedule lessons for your own courses" },
        { status: 403 }
      );
    }

    // Verify teacher exists and has appropriate role
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

    // Validate scheduledAt is a valid future date
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

    // Validate duration
    const duration = durationMin || 50;
    if (typeof duration !== "number" || duration < 1 || duration > 300) {
      return NextResponse.json(
        { error: "Duration must be between 1 and 300 minutes" },
        { status: 400 }
      );
    }

    // Check for scheduling conflicts with same teacher
    const lessonEnd = new Date(scheduledDate.getTime() + duration * 60000);
    const conflicts = await prisma.groupLesson.findMany({
      where: {
        teacherId,
        scheduledAt: {
          gte: new Date(scheduledDate.getTime() - 3 * 60 * 60000), // 3 hours before
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

      // Check if time ranges overlap
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

    // Create lesson
    const lesson = await prisma.groupLesson.create({
      data: {
        courseId,
        teacherId,
        scheduledAt: scheduledDate,
        durationMin: duration,
        notes: notes || null,
      },
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

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error("Error creating group lesson:", error);
    return NextResponse.json(
      { error: "Failed to create group lesson" },
      { status: 500 }
    );
  }
}
