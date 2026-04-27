import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/group-courses
 * Public API to list group courses (only UPCOMING/ACTIVE)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    const courses = await prisma.groupCourse.findMany({
      where: {
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
        _count: {
          select: {
            enrollments: true,
            lessons: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Check enrollment status for current user
    const enrolledCourseIds = userId
      ? (
          await prisma.groupEnrollment.findMany({
            where: {
              studentId: userId,
              status: "ACTIVE",
            },
            select: {
              courseId: true,
            },
          })
        ).map((e) => e.courseId)
      : [];

    // Calculate available spots and serialize
    const coursesWithAvailability = courses.map((course) => ({
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
      lessonsCount: course._count.lessons,
      availableSpots: course.maxStudents - course._count.enrollments,
      isFull: course._count.enrollments >= course.maxStudents,
      isEnrolled: enrolledCourseIds.includes(course.id),
      createdAt: course.createdAt,
    }));

    return NextResponse.json({ courses: coursesWithAvailability });
  } catch (error) {
    console.error("Error fetching group courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch group courses" },
      { status: 500 }
    );
  }
}
