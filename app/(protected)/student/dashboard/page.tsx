import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getPackageSummary } from "@/lib/actions/studentPackages";

export default async function StudentDashboard() {
  const session = await auth();

  const [
    enrolledVideoCourses,
    enrolledGroupCourses,
    upcomingLessons,
    packageSummary,
  ] = await Promise.all([
    prisma.studentCourse.count({
      where: { studentId: session?.user.id },
    }),
    prisma.groupEnrollment.count({
      where: { studentId: session?.user.id, status: "ACTIVE" },
    }),
    prisma.groupLesson.count({
      where: {
        course: {
          enrollments: {
            some: { studentId: session?.user.id, status: "ACTIVE" },
          },
        },
        scheduledAt: { gte: new Date() },
      },
    }),
    getPackageSummary(session?.user.id),
  ]);

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user.name} 👋
        </h1>
        <p className="text-gray-500 mt-1">Continue your learning journey</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Video Courses"
          value={enrolledVideoCourses.toString()}
          icon="📚"
        />
        <StatCard
          label="Group Courses"
          value={enrolledGroupCourses.toString()}
          icon="👥"
        />
        <StatCard
          label="Upcoming Lessons"
          value={upcomingLessons.toString()}
          icon="📅"
        />
        <Link href="/student/private-lessons" className="block">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🎯</span>
              {packageSummary.totalRemaining > 0 && (
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                  {packageSummary.totalRemaining} left
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">Private Packages</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {packageSummary.totalActive}
            </p>
            <p className="text-xs text-gray-400 mt-1">active packages</p>
          </div>
        </Link>
      </div>

      {/* My Learning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">My Video Courses</h3>
            <Link
              href="/student/my-courses"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            {enrolledVideoCourses > 0
              ? `Continue learning with ${enrolledVideoCourses} course${enrolledVideoCourses !== 1 ? "s" : ""}`
              : "No courses enrolled yet"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">My Group Courses</h3>
            <Link
              href="/student/my-group-courses"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            {enrolledGroupCourses > 0
              ? `${enrolledGroupCourses} active group course${enrolledGroupCourses !== 1 ? "s" : ""}`
              : "No group courses enrolled yet"}
          </p>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  badge,
}: {
  label: string;
  value: string;
  icon: string;
  badge?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {badge && (
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
