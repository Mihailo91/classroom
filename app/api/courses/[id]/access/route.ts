import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAccess } from "@/lib/course-access";

/**
 * GET /api/courses/[id]/access
 * Check if the current user has access to a course
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: courseId } = await params;

    // Anonymous users don't have access to courses (except preview lessons)
    if (!session?.user?.id) {
      return NextResponse.json({
        hasAccess: false,
        reason: "Not authenticated",
      });
    }

    const hasAccessToCourse = await hasAccess(session.user.id, courseId);

    return NextResponse.json({
      hasAccess: hasAccessToCourse,
      reason: hasAccessToCourse ? "Course owned" : "Course not owned",
    });
  } catch (error) {
    console.error("Error checking course access:", error);
    return NextResponse.json(
      { error: "Failed to check access" },
      { status: 500 }
    );
  }
}
