import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getLessonPackageById } from "@/lib/actions/lessonPackages";
import EditLessonPackageForm from "./EditLessonPackageForm";

export default async function EditLessonPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/admin/dashboard");

  const { id } = await params;
  const pkg = await getLessonPackageById(id);

  if (!pkg) notFound();

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Lesson Package</h1>
        <p className="text-gray-500 mt-1">
          {pkg.teacher.name} · {pkg.packageType}
        </p>
      </div>
      <div className="max-w-xl">
        <div className="bg-white rounded-2xl shadow p-6">
          <EditLessonPackageForm pkg={pkg} />
        </div>
      </div>
    </main>
  );
}
