import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getActivePackages, getMyPackages } from "@/lib/actions/studentPackages";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  EXHAUSTED: "bg-gray-100 text-gray-500",
  EXPIRED: "bg-red-100 text-red-600",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const PACKAGE_LABELS: Record<string, string> = {
  SINGLE: "Single",
  STARTER: "Starter",
  STANDARD: "Standard",
  PREMIUM: "Premium",
};

export default async function StudentPrivateLessonsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [allPackages, activePackages] = await Promise.all([
    getMyPackages(),
    getActivePackages(),
  ]);

  const totalRemaining = activePackages.reduce(
    (sum, pkg) => sum + (pkg.lessonsTotal - pkg.lessonsUsed),
    0
  );

  return (
    <main className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Private Lessons</h1>
          <p className="text-gray-500 mt-1">Your lesson packages and booking</p>
        </div>
        <Link
          href="/student/private-lessons/packages"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Browse Packages
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-sm text-gray-500 mb-1">Active Packages</p>
          <p className="text-3xl font-bold text-blue-600">{activePackages.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-sm text-gray-500 mb-1">Lessons Remaining</p>
          <p className="text-3xl font-bold text-green-600">{totalRemaining}</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-sm text-gray-500 mb-1">Total Packages</p>
          <p className="text-3xl font-bold text-gray-700">{allPackages.length}</p>
        </div>
      </div>

      {/* Active Packages */}
      {activePackages.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePackages.map((pkg) => {
              const remaining = pkg.lessonsTotal - pkg.lessonsUsed;
              const pct = Math.round((remaining / pkg.lessonsTotal) * 100);
              return (
                <div key={pkg.id} className="bg-white rounded-2xl shadow p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {PACKAGE_LABELS[pkg.packageType]} Package
                      </p>
                      <p className="text-sm text-gray-500">with {pkg.teacher.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[pkg.status]}`}>
                      {pkg.status}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{remaining} of {pkg.lessonsTotal} lessons left</span>
                      <span className="text-gray-500">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  {pkg.expiresAt && (
                    <p className="text-xs text-gray-400">
                      Expires {new Date(pkg.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Packages History */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Packages</h2>
        {allPackages.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No packages yet</h3>
            <p className="text-gray-500 mb-6">
              Purchase a lesson package to start booking 1-on-1 sessions with teachers.
            </p>
            <Link
              href="/student/private-lessons/packages"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Browse Packages
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Teacher</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Package</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Progress</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Expires</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{pkg.teacher.name}</td>
                    <td className="px-6 py-4 text-gray-700">{PACKAGE_LABELS[pkg.packageType]}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {pkg.lessonsTotal - pkg.lessonsUsed} / {pkg.lessonsTotal}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {pkg.expiresAt
                        ? new Date(pkg.expiresAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[pkg.status]}`}>
                        {pkg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

