import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/group-courses/[id]
 * Get single group course details with lesson schedule
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;
    const { id } = await params;

    const course = await prisma.groupCourse.findUnique({
      where: {
        id,
        status: {
          in: ["UPCOMING", "ACTIVE"],
        },
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        lessons: {
          where: {
            scheduledAt: {
              gte: new Date(),
            },
          },
          select: {
            id: true,
            scheduledAt: true,
            durationMin: true,
            isHeld: true,
          },
          orderBy: {
            scheduledAt: "asc",
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Group course not found" },
        { status: 404 }
      );
    }

    // Check if user is enrolled
    const isEnrolled = userId
      ? await prisma.groupEnrollment.findUnique({
          where: {
            studentId_courseId: {
              studentId: userId,
              courseId: id,
            },
            status: "ACTIVE",
          },
        })
      : null;

    // Serialize and calculate availability
    const serializedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      teacherId: course.teacher.id,
      teacherName: course.teacher.name,
      minStudents: course.minStudents,
      maxStudents: course.maxStudents,
      price: Number(course.price),
      status: course.status,
      enrolledCount: course._count.enrollments,
      availableSpots: course.maxStudents - course._count.enrollments,
      isFull: course._count.enrollments >= course.maxStudents,
      isEnrolled: !!isEnrolled,
      lessons: course.lessons.map((lesson) => ({
        id: lesson.id,
        scheduledAt: lesson.scheduledAt,
        durationMin: lesson.durationMin,
        isHeld: lesson.isHeld,
      })),
      createdAt: course.createdAt,
    };

    return NextResponse.json({ course: serializedCourse });
  } catch (error) {
    console.error("Error fetching group course:", error);
    return NextResponse.json(
      { error: "Failed to fetch group course" },
      { status: 500 }
    );
  }
}
