"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type NavItem = {
  label: string;
  icon: string;
  href: string;
  badge?: number;
};

type RoleSidebarProps = {
  role: "admin" | "teacher" | "student";
  userName: string;
  children: ReactNode;
};

export function RoleSidebar({ role, userName, children }: RoleSidebarProps) {
  const pathname = usePathname();

  // Define navigation items per role
  const navItems: Record<string, NavItem[]> = {
    admin: [
      { label: "Dashboard", icon: "📊", href: "/admin/dashboard" },
      { label: "Video Courses", icon: "📚", href: "/admin/video-courses" },
      { label: "Group Courses", icon: "👥", href: "/admin/group-courses" },
      { label: "Lesson Packages", icon: "📦", href: "/admin/lesson-packages" },
      { label: "Private Lessons", icon: "🎯", href: "/admin/private-lessons" },
      { label: "Users", icon: "👤", href: "/admin/users" },
      { label: "Transactions", icon: "💳", href: "/admin/transactions" },
      { label: "Analytics", icon: "📈", href: "/admin/analytics" },
      { label: "Profile", icon: "⚙️", href: "/admin/profile" },
    ],
    teacher: [
      { label: "Dashboard", icon: "📊", href: "/teacher/dashboard" },
      { label: "Group Courses", icon: "👥", href: "/teacher/group-courses" },
      { label: "Private Lessons", icon: "🎯", href: "/teacher/private-lessons" },
      { label: "My Schedule", icon: "📅", href: "/teacher/schedule" },
      { label: "Profile", icon: "⚙️", href: "/teacher/profile" },
    ],
    student: [
      { label: "Dashboard", icon: "📊", href: "/student/dashboard" },
      { label: "Video Courses", icon: "📚", href: "/student/courses" },
      { label: "Group Courses", icon: "👥", href: "/student/group-courses" },
      { label: "Private Lessons", icon: "🎯", href: "/student/private-lessons" },
      { label: "Lesson Packages", icon: "📦", href: "/student/private-lessons/packages" },
      { label: "My Learning", icon: "🎓", href: "/student/my-courses" },
      { label: "Transactions", icon: "💳", href: "/student/transactions" },
      { label: "Cart", icon: "🛒", href: "/student/cart" },
      { label: "Profile", icon: "⚙️", href: "/student/profile" },
    ],
  };

  const items = navItems[role] || [];

  const isActive = (href: string) => {
    if (href === `/${role}/dashboard`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200">
          <Link href={`/${role}/dashboard`} className="block">
            <h1 className="text-xl font-bold text-gray-900">🎓 Classroom</h1>
            <p className="text-xs text-gray-500 mt-1 capitalize">{role} Portal</p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          </div>
          <Link
            href="/api/auth/signout"
            className="block w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-center"
          >
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {children}
      </div>
    </div>
  );
}
