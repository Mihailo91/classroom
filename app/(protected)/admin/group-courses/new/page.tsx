import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CreateGroupCourseForm from "./CreateGroupCourseForm";

export default async function NewGroupCoursePage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Fetch all teachers
  const teachers = await prisma.user.findMany({
    where: {
      OR: [
        { role: "TEACHER" },
        { role: "ADMIN" },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Create New Group Course
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Set up a new group course with scheduled lessons
          </p>
        </div>

        <CreateGroupCourseForm teachers={teachers} />
      </div>
    </main>
  );
}
