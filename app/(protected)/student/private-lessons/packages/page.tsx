import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listActiveLessonPackages } from "@/lib/actions/lessonPackages";
import PackageCatalogClient from "./PackageCatalogClient";

export default async function StudentPackagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const packages = await listActiveLessonPackages();

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Lesson Packages</h1>
        <p className="text-gray-500 mt-1">
          Purchase a package to book 1-on-1 sessions with a teacher
        </p>
      </div>

      {packages.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-12 text-center">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No packages available
          </h3>
          <p className="text-gray-500">Check back soon for available lesson packages.</p>
        </div>
      ) : (
        <PackageCatalogClient packages={packages} />
      )}
    </main>
  );
}
