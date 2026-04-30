"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role, UserStatus } from "@prisma/client";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: Date;
  _count: {
    purchasedCourses: number;
    teachingGroupCourses: number;
    groupEnrollments: number;
  };
};

type Props = {
  users: User[];
  currentSearch: string;
  currentRole?: Role;
  currentStatus?: UserStatus;
  roleCounts: { role: Role; _count: number }[];
  statusCounts: { status: UserStatus; _count: number }[];
};

export default function UserManagementTable({
  users,
  currentSearch,
  currentRole,
  currentStatus,
  roleCounts,
  statusCounts,
}: Props) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput) params.set("search", searchInput);
    if (currentRole) params.set("role", currentRole);
    if (currentStatus) params.set("status", currentStatus);
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleFilterChange = (type: "role" | "status", value: string) => {
    const params = new URLSearchParams();
    if (currentSearch) params.set("search", currentSearch);
    
    if (type === "role") {
      if (value !== "ALL") params.set("role", value);
      if (currentStatus) params.set("status", currentStatus);
    } else {
      if (currentRole) params.set("role", currentRole);
      if (value !== "ALL") params.set("status", value);
    }
    
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    setIsLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update role");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setIsLoading(null);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    const action = newStatus === "ACTIVE" ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    setIsLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update status");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setIsLoading(null);
    }
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "TEACHER":
        return "bg-blue-100 text-blue-800";
      case "STUDENT":
        return "bg-green-100 text-green-800";
    }
  };

  const getStatusBadgeColor = (status: UserStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "IDLE":
        return "bg-yellow-100 text-yellow-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search and Filters */}
      <div className="p-6 border-b border-gray-200">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
            {(currentSearch || currentRole || currentStatus) && (
              <button
                type="button"
                onClick={() => router.push("/admin/users")}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Filter Badges */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Role:</span>
            <select
              value={currentRole || "ALL"}
              onChange={(e) => handleFilterChange("role", e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={currentStatus || "ALL"}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="IDLE">Idle</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No users found matching your criteria.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                      disabled={isLoading === user.id}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                        user.role
                      )} border-0 focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                        user.status
                      )}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.role === "TEACHER" ? (
                      <span>{user._count.teachingGroupCourses} courses</span>
                    ) : user.role === "STUDENT" ? (
                      <span>
                        {user._count.purchasedCourses} video +{" "}
                        {user._count.groupEnrollments} group
                      </span>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user.status === "ACTIVE" ? (
                      <button
                        onClick={() => handleStatusChange(user.id, "INACTIVE")}
                        disabled={isLoading === user.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(user.id, "ACTIVE")}
                        disabled={isLoading === user.id}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
