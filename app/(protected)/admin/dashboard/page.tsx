import { auth } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";

export default async function AdminDashboard() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome, {session?.user.name} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">Admin Dashboard</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard label="Total Students" value="—" />
          <StatCard label="Total Teachers" value="—" />
          <StatCard label="Lessons This Month" value="—" />
          <StatCard label="Revenue This Month" value="—" />
        </div>

        <p className="mt-8 text-sm text-gray-400 text-center">
          More features coming in the next phases.
        </p>
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
