import { prisma } from "@/lib/prisma";
import { Role, UserStatus } from "@prisma/client";
import UserManagementTable from "./UserManagementTable";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const roleFilter = params.role as Role | undefined;
  const statusFilter = params.status as UserStatus | undefined;

  // Build where clause for filters
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  
  if (roleFilter) {
    where.role = roleFilter;
  }
  
  if (statusFilter) {
    where.status = statusFilter;
  }

  // Fetch users with stats
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatarUrl: true,
      createdAt: true,
      _count: {
        select: {
          purchasedCourses: true,
          teachingGroupCourses: true,
          groupEnrollments: true,
        },
      },
    },
    orderBy: [
      { role: "asc" },
      { name: "asc" },
    ],
  });

  // Get role and status counts for filter badges
  const roleCounts = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
  });

  const statusCounts = await prisma.user.groupBy({
    by: ["status"],
    _count: true,
  });

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 mt-1">
          Manage students, teachers, and admins ({users.length} users)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {roleCounts.map((rc) => (
          <div key={rc.role} className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              {rc.role === "ADMIN" ? "👑 Admins" : rc.role === "TEACHER" ? "🎓 Teachers" : "📚 Students"}
            </div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{rc._count}</div>
          </div>
        ))}
      </div>

      {/* User Management Table */}
      <UserManagementTable
        users={users}
        currentSearch={search}
        currentRole={roleFilter}
        currentStatus={statusFilter}
        roleCounts={roleCounts}
        statusCounts={statusCounts}
      />
    </main>
  );
}
