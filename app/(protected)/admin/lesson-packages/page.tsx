import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { listLessonPackages } from "@/lib/actions/lessonPackages";
import { LessonPackageActions } from "./LessonPackageActions";

const PACKAGE_LABELS: Record<string, string> = {
  SINGLE: "Single (1 lesson)",
  STARTER: "Starter (4 lessons)",
  STANDARD: "Standard (8 lessons)",
  PREMIUM: "Premium (12 lessons)",
};

export default async function AdminLessonPackagesPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/admin/dashboard");

  const packages = await listLessonPackages();

  const activeCount = packages.filter((p) => p.isActive).length;

  return (
    <main className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lesson Packages</h1>
          <p className="text-gray-500 mt-1">
            {packages.length} packages · {activeCount} active
          </p>
        </div>
        <Link
          href="/admin/lesson-packages/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + New Package
        </Link>
      </div>

      {packages.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-12 text-center">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No lesson packages yet
          </h3>
          <p className="text-gray-500 mb-6">
            Create packages for teachers so students can purchase private lesson bundles.
          </p>
          <Link
            href="/admin/lesson-packages/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Create First Package
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Teacher</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Package</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Lessons</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Price</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{pkg.teacher.name}</div>
                    <div className="text-sm text-gray-500">{pkg.teacher.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {PACKAGE_LABELS[pkg.packageType] ?? pkg.packageType}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{pkg.lessonsIncluded}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    €{Number(pkg.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        pkg.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {pkg.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/lesson-packages/${pkg.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <LessonPackageActions
                        packageId={pkg.id}
                        isActive={pkg.isActive}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
