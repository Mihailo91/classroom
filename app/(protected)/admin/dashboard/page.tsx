import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();

  // Calculate date for "this month"
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch comprehensive stats
  const [
    totalUsers,
    activeUsers,
    totalStudents,
    totalTeachers,
    totalAdmins,
    newUsersThisMonth,
    totalVideoCourses,
    publishedVideoCourses,
    totalGroupCourses,
    activeGroupCourses,
    totalEnrollments,
    revenueData,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({
      where: { createdAt: { gte: firstDayOfMonth } },
    }),
    prisma.course.count(),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.groupCourse.count(),
    prisma.groupCourse.count({ where: { status: "ACTIVE" } }),
    prisma.groupEnrollment.count({ where: { status: "ACTIVE" } }),
    prisma.studentCourse.aggregate({
      _count: true,
    }),
  ]);

  const inactiveUsers = totalUsers - activeUsers;

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user.name} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening in your school</p>
      </div>

      {/* User Stats Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">User Statistics</h2>
          <Link
            href="/admin/users"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Manage Users →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Users"
            value={totalUsers.toString()}
            icon="👥"
            subtitle={`${activeUsers} active, ${inactiveUsers} inactive`}
          />
          <StatCard
            label="Students"
            value={totalStudents.toString()}
            icon="📚"
            trend={newUsersThisMonth > 0 ? `+${newUsersThisMonth} this month` : undefined}
          />
          <StatCard
            label="Teachers"
            value={totalTeachers.toString()}
            icon="👨‍🏫"
          />
          <StatCard label="Admins" value={totalAdmins.toString()} icon="👑" />
        </div>
      </div>

      {/* Course Stats Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Video Courses"
            value={totalVideoCourses.toString()}
            icon="🎬"
            subtitle={`${publishedVideoCourses} published`}
          />
          <StatCard
            label="Group Courses"
            value={totalGroupCourses.toString()}
            icon="🎓"
            subtitle={`${activeGroupCourses} active`}
          />
          <StatCard
            label="Video Purchases"
            value={revenueData._count.toString()}
            icon="💰"
          />
          <StatCard
            label="Group Enrollments"
            value={totalEnrollments.toString()}
            icon="✅"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickLinkCard
          title="User Management"
          description="Manage user accounts, roles, and permissions"
          icon="👤"
          href="/admin/users"
          stats={`${totalUsers} users`}
        />
        <QuickLinkCard
          title="Video Courses"
          description="Create and manage video course content"
          icon="📚"
          href="/admin/video-courses"
          stats={`${publishedVideoCourses} published`}
        />
        <QuickLinkCard
          title="Group Courses"
          description="Manage group classes and schedules"
          icon="👥"
          href="/admin/group-courses"
          stats={`${activeGroupCourses} active`}
        />
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  trend,
  subtitle,
}: {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  subtitle?: string;
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
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function QuickLinkCard({
  title,
  description,
  icon,
  href,
  stats,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
  stats: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 mb-2">{description}</p>
          <p className="text-xs font-medium text-blue-600">{stats}</p>
        </div>
      </div>
    </Link>
  );
}
