import { auth } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import Link from "next/link";

export default async function StudentDashboard() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome, {session?.user.name} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">Student Dashboard</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Active Packages" value="—" />
          <StatCard label="Upcoming Lessons" value="—" />
          <StatCard label="Enrolled Courses" value="—" />
        </div>

        {/* Quick Links */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/student/my-courses"
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="text-3xl mb-2">📚</div>
              <h3 className="font-semibold text-gray-900 mb-1">My Courses</h3>
              <p className="text-sm text-gray-500">Access your purchased video courses</p>
            </Link>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 opacity-50">
              <div className="text-3xl mb-2">📖</div>
              <h3 className="font-semibold text-gray-900 mb-1">Browse Catalog</h3>
              <p className="text-sm text-gray-500">Coming in Phase 2</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
