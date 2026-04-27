import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { getStudentCourses } from "@/lib/course-access";

/**
 * GET /api/student/courses
 * Get all courses owned by the authenticated student
 */
export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const courses = await getStudentCourses(user.id!);

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error fetching student courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
