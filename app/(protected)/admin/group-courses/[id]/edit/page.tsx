import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GroupCourseEditor from "./GroupCourseEditor";

export default async function EditGroupCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const { id } = await params;

  const [course, teachers, students] = await Promise.all([
    prisma.groupCourse.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lessons: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { scheduledAt: "asc" },
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        OR: [{ role: "TEACHER" }, { role: "ADMIN" }],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: {
        role: "STUDENT",
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!course) {
    notFound();
  }

  // Serialize Decimal for client component
  const serializedCourse = {
    ...course,
    price: Number(course.price),
    enrollments: course.enrollments.map((e) => ({
      ...e,
      amountPaid: e.amountPaid ? Number(e.amountPaid) : null,
    })),
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <GroupCourseEditor course={serializedCourse} teachers={teachers} students={students} />
      </div>
    </main>
  );
}
