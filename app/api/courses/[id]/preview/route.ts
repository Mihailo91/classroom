import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/courses/[id]/preview
 * Get all preview lessons for a course (public access)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id, isPublished: true },
      select: {
        id: true,
        title: true,
        modules: {
          include: {
            lessons: {
              where: { isPreview: true },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Filter out modules with no preview lessons
    const modulesWithPreviews = course.modules
      .filter((module) => module.lessons.length > 0)
      .map((module) => ({
        id: module.id,
        title: module.title,
        lessons: module.lessons,
      }));

    return NextResponse.json({
      courseId: course.id,
      courseTitle: course.title,
      previewModules: modulesWithPreviews,
      totalPreviewLessons: modulesWithPreviews.reduce(
        (sum, m) => sum + m.lessons.length,
        0
      ),
    });
  } catch (error) {
    console.error("Error fetching preview lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch preview lessons" },
      { status: 500 }
    );
  }
}
