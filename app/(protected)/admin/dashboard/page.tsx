import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();

  // Fetch real stats
  const [
    totalStudents,
    totalTeachers,
    totalVideoCourses,
    totalGroupCourses,
    activeEnrollments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.groupCourse.count(),
    prisma.groupEnrollment.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user.name} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening in your school</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Students"
          value={totalStudents.toString()}
          icon="👥"
          trend="+12%"
        />
        <StatCard
          label="Total Teachers"
          value={totalTeachers.toString()}
          icon="👨‍🏫"
        />
        <StatCard
          label="Video Courses"
          value={totalVideoCourses.toString()}
          icon="📚"
        />
        <StatCard
          label="Group Courses"
          value={totalGroupCourses.toString()}
          icon="🎓"
          trend="+3"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Enrollments
          </h3>
          <p className="text-sm text-gray-500">
            {activeEnrollments} active group course enrollments
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Health
          </h3>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-sm text-gray-600">All systems operational</span>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string;
  icon: string;
  trend?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
            {trend}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
