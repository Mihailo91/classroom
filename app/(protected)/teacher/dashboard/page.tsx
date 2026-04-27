import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
