import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

/**
 * POST /api/test/enroll-group-course
 * Test endpoint to enroll a student in a group course
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    // Get course
    const course = await prisma.groupCourse.findUnique({
      where: { id: courseId },
      include: {
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

    // Check if course is accepting enrollments
    if (course.status !== "UPCOMING" && course.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Course is not accepting enrollments" },
        { status: 400 }
      );
    }

    // Check capacity
    if (course._count.enrollments >= course.maxStudents) {
      return NextResponse.json(
        { error: "Course is full" },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.groupEnrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: user.id,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Already enrolled in this course" },
        { status: 400 }
      );
    }

    // Create enrollment
    const enrollment = await prisma.groupEnrollment.create({
      data: {
        studentId: user.id,
        courseId,
        status: "ACTIVE",
      },
    });

    // Check if minimum students reached and update course status
    const updatedEnrollmentCount = course._count.enrollments + 1;
    if (
      course.status === "UPCOMING" &&
      updatedEnrollmentCount >= course.minStudents
    ) {
      await prisma.groupCourse.update({
        where: { id: courseId },
        data: { status: "ACTIVE" },
      });
    }

    return NextResponse.json({
      enrollment: {
        id: enrollment.id,
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
      },
      message:
        updatedEnrollmentCount >= course.minStudents
          ? "Enrolled successfully. Course is now active!"
          : "Enrolled successfully",
    });
  } catch (error) {
    console.error("Error enrolling in group course:", error);
    return NextResponse.json(
      { error: "Failed to enroll in course" },
      { status: 500 }
    );
  }
}
