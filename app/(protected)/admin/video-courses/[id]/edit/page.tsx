import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import CourseEditor from "./CourseEditor";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      coverImageUrl: true,
      price: true,
      isPublished: true,
      modules: {
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          lessons: {
            select: {
              id: true,
              title: true,
              description: true,
              vimeoId: true,
              durationMinutes: true,
              isPreview: true,
              order: true,
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!course) {
    notFound();
  }

  // Serialize to JSON and back to strip all Prisma types completely
  const serializedCourse = JSON.parse(JSON.stringify({
    id: course.id,
    title: course.title,
    description: course.description,
    coverImageUrl: course.coverImageUrl,
    price: Number(course.price),
    isPublished: course.isPublished,
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      order: m.order,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        vimeoId: l.vimeoId,
        durationMinutes: l.durationMinutes,
        isPreview: l.isPreview,
        order: l.order,
      })),
    })),
  }));

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <CourseEditor course={serializedCourse} />
      </div>
    </main>
  );
}
