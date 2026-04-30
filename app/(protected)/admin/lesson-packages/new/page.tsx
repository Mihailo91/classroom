import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NewLessonPackageForm from "./NewLessonPackageForm";

export default async function NewLessonPackagePage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/admin/dashboard");

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER", status: "ACTIVE" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Lesson Package</h1>
        <p className="text-gray-500 mt-1">Create a lesson package for a teacher</p>
      </div>
      <div className="max-w-xl">
        <div className="bg-white rounded-2xl shadow p-6">
          <NewLessonPackageForm teachers={teachers} />
        </div>
      </div>
    </main>
  );
}
