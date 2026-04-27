import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function StudentDashboard() {
  const session = await auth();

  // Fetch student's stats
  const [
    enrolledVideoCourses,
    enrolledGroupCourses,
    upcomingLessons,
  ] = await Promise.all([
    prisma.studentCourse.count({
      where: { studentId: session?.user.id },
    }),
    prisma.groupEnrollment.count({
      where: {
        studentId: session?.user.id,
        status: "ACTIVE",
      },
    }),
    prisma.groupLesson.count({
      where: {
        course: {
          enrollments: {
            some: {
              studentId: session?.user.id,
              status: "ACTIVE",
            },
          },
        },
        scheduledAt: { gte: new Date() },
      },
    }),
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
        <StatCard
          label="Private Lessons"
          value="—"
          icon="🎯"
          badge="Coming Soon"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Learning Paths</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard
            href="/student/courses"
            icon="📚"
            title="Video Courses"
            description="Browse on-demand video courses"
            action="Browse"
          />
          <ActionCard
            href="/student/group-courses"
            icon="👥"
            title="Group Courses"
            description="Join scheduled group classes"
            action="Explore"
          />
          <ActionCard
            href="/student/private-lessons"
            icon="🎯"
            title="Private Lessons"
            description="Book 1-on-1 sessions"
            badge="Coming Soon"
          />
        </div>
      </div>

      {/* My Learning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              My Video Courses
            </h3>
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
            <h3 className="text-lg font-semibold text-gray-900">
              My Group Courses
            </h3>
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

function ActionCard({
  href,
  icon,
  title,
  description,
  action,
  badge,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  action?: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-100"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        {badge && (
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-3">{description}</p>
      {action && (
        <span className="text-sm text-blue-600 font-medium">
          {action} →
        </span>
      )}
    </Link>
  );
}
