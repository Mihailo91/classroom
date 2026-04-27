import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TeacherDashboard() {
  const session = await auth();

  // Fetch teacher's stats
  const [myGroupCourses, activeEnrollments, upcomingLessons] = await Promise.all([
    prisma.groupCourse.count({
      where: { teacherId: session?.user.id },
    }),
    prisma.groupEnrollment.count({
      where: {
        course: { teacherId: session?.user.id },
        status: "ACTIVE",
      },
    }),
    prisma.groupLesson.count({
      where: {
        course: { teacherId: session?.user.id },
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
        <p className="text-gray-500 mt-1">Your teaching dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="My Group Courses"
          value={myGroupCourses.toString()}
          icon="👥"
        />
        <StatCard
          label="Active Students"
          value={activeEnrollments.toString()}
          icon="🎓"
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard
            href="/teacher/group-courses"
            icon="👥"
            title="Group Courses"
            description="View your assigned group courses"
            count={myGroupCourses}
          />
          <ActionCard
            href="/teacher/private-lessons"
            icon="🎯"
            title="Private Lessons"
            description="Manage 1-on-1 sessions"
            badge="Coming Soon"
          />
          <ActionCard
            href="/teacher/schedule"
            icon="📅"
            title="My Schedule"
            description="View your teaching calendar"
            badge="Coming Soon"
          />
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Today's Schedule
        </h3>
        <p className="text-sm text-gray-500">
          {upcomingLessons > 0
            ? `You have ${upcomingLessons} upcoming lesson${upcomingLessons !== 1 ? "s" : ""}`
            : "No lessons scheduled today"}
        </p>
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
  count,
  badge,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  count?: number;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-100"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        {count !== undefined && (
          <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {count}
          </span>
        )}
        {badge && (
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}
