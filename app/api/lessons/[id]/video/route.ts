import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessLesson } from "@/lib/course-access";

/**
 * GET /api/lessons/[id]/video
 * Get Vimeo ID for a lesson (with access control)
 * Only returns Vimeo ID if:
 * - User owns the course, OR
 * - Lesson is marked as preview
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: lessonId } = await params;

    const userId = session?.user?.id || null;
    const accessCheck = await canAccessLesson(userId, lessonId);

    if (!accessCheck.hasAccess || !accessCheck.lesson) {
      return NextResponse.json(
        { error: accessCheck.reason },
        { status: 403 }
      );
    }

    return NextResponse.json({
      lessonId: accessCheck.lesson.id,
      title: accessCheck.lesson.title,
      description: accessCheck.lesson.description,
      vimeoId: accessCheck.lesson.vimeoId,
      durationMinutes: accessCheck.lesson.durationMinutes,
      isPreview: accessCheck.lesson.isPreview,
    });
  } catch (error) {
    console.error("Error fetching lesson video:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson video" },
      { status: 500 }
    );
  }
}
