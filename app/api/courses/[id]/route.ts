import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAccess } from "@/lib/course-access";

/**
 * GET /api/courses/[id]
 * Get course details with modules and lessons
 * - For non-owners: Only show lesson titles and preview lessons
 * - For owners: Show all lessons with Vimeo IDs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id, isPublished: true },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            studentCourses: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Check if user owns the course
    const userOwns = session?.user?.id
      ? await hasAccess(session.user.id, course.id)
      : false;

    // Filter lesson data based on ownership
    const sanitizedModules = course.modules.map((module) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      order: module.order,
      lessons: module.lessons.map((lesson) => {
        // Owners see full details including vimeoId
        if (userOwns) {
          return {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            vimeoId: lesson.vimeoId,
            durationMinutes: lesson.durationMinutes,
            isPreview: lesson.isPreview,
            order: lesson.order,
          };
        }

        // Preview lessons: visible but vimeoId is fetched on-demand via /api/lessons/[id]/video
        if (lesson.isPreview) {
          return {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            durationMinutes: lesson.durationMinutes,
            isPreview: lesson.isPreview,
            order: lesson.order,
          };
        }

        // Locked lessons for non-owners
        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          durationMinutes: lesson.durationMinutes,
          isPreview: lesson.isPreview,
          order: lesson.order,
          locked: true,
        };
      }),
    }));

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        coverImageUrl: course.coverImageUrl,
        price: course.price,
        modules: sanitizedModules,
        studentCount: course._count.studentCourses,
        userOwns,
      },
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}
