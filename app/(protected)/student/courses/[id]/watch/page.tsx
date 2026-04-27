import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasAccess } from "@/lib/course-access";
import CoursePlayerClient from "./CoursePlayerClient";

export default async function CoursePlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lesson?: string; preview?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id: courseId } = await params;
  const { lesson: lessonIdParam, preview } = await searchParams;
  const isPreviewMode = preview === "true";

  const course = await prisma.course.findUnique({
    where: { id: courseId, isPublished: true },
    include: {
      modules: {
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!course) notFound();

  const owned = session.user.id
    ? await hasAccess(session.user.id, courseId)
    : false;

  // If not owned and not preview mode, redirect to course detail page
  if (!owned && !isPreviewMode) {
    redirect(`/student/courses/${courseId}`);
  }

  // Collect all accessible lessons
  const allLessons = course.modules.flatMap((m) =>
    m.lessons
      .filter((l) => owned || l.isPreview)
      .map((l) => ({ ...l, moduleTitle: m.title }))
  );

  if (allLessons.length === 0) {
    redirect(`/student/courses/${courseId}`);
  }

  // Determine which lesson to show
  const activeLessonId =
    lessonIdParam && allLessons.find((l) => l.id === lessonIdParam)
      ? lessonIdParam
      : allLessons[0].id;

  return (
    <CoursePlayerClient
      course={{
        id: course.id,
        title: course.title,
        modules: course.modules.map((m) => ({
          id: m.id,
          title: m.title,
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            vimeoId: owned || l.isPreview ? l.vimeoId : null,
            durationMinutes: l.durationMinutes,
            isPreview: l.isPreview,
            order: l.order,
          })),
        })),
      }}
      owned={owned}
      activeLessonId={activeLessonId}
    />
  );
}
