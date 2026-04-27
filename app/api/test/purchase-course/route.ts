import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { grantCourseAccess } from "@/lib/course-access";

/**
 * POST /api/test/purchase-course
 * TEST ONLY: Manually grant course access for testing
 * This will be replaced with real payment flow in Phase 5
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { courseId, expiresInDays } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    // Calculate expiration date if specified
    let expiresAt: Date | null = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const studentCourse = await grantCourseAccess(
      user.id!,
      courseId,
      expiresAt
    );

    return NextResponse.json(
      {
        success: true,
        message: "Course access granted",
        studentCourse,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error granting course access:", error);
    return NextResponse.json(
      { error: "Failed to grant course access" },
      { status: 500 }
    );
  }
}
