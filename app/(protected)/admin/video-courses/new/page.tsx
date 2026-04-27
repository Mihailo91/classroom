import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CreateCourseForm from "./CreateCourseForm";

export default async function NewCoursePage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Create New Course
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Add a new video course to the platform
          </p>
        </div>

        <CreateCourseForm />
      </div>
    </main>
  );
}
