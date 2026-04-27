import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function GroupCoursesAnalyticsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  // Aggregate metrics
  const [totalCourses, activeCourses, totalEnrollments, totalRevenue, courses] = await Promise.all([
    prisma.groupCourse.count(),
    prisma.groupCourse.count({ where: { status: "ACTIVE" } }),
    prisma.groupEnrollment.count({ where: { status: "ACTIVE" } }),
    prisma.groupCourse.aggregate({
      _sum: { price: true },
      where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    }),
    prisma.groupCourse.findMany({
      include: {
        teacher: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            lessons: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const avgClassSize = totalEnrollments > 0 && totalCourses > 0 
    ? (totalEnrollments / totalCourses).toFixed(1) 
    : "0";

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Group Courses Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Overview of group courses performance
            </p>
          </div>
          <Link
            href="/admin/group-courses"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            ← Back to Courses
          </Link>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm text-gray-500 mb-1">Total Courses</div>
            <div className="text-3xl font-bold text-gray-900">{totalCourses}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm text-gray-500 mb-1">Active Courses</div>
            <div className="text-3xl font-bold text-green-600">{activeCourses}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm text-gray-500 mb-1">Total Enrollments</div>
            <div className="text-3xl font-bold text-blue-600">{totalEnrollments}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm text-gray-500 mb-1">Avg. Class Size</div>
            <div className="text-3xl font-bold text-purple-600">{avgClassSize}</div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Revenue</h2>
          <div className="text-4xl font-bold text-gray-900">
            €{Number(totalRevenue._sum.price || 0).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Total potential revenue from active and completed courses
          </div>
        </div>

        {/* Per-Course Breakdown */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Course Breakdown
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lessons
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/group-courses/${course.id}/edit`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {course.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {course.teacher.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        course.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                        course.status === "UPCOMING" ? "bg-yellow-100 text-yellow-800" :
                        course.status === "COMPLETED" ? "bg-gray-100 text-gray-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {course._count.enrollments}/{course.maxStudents}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {course._count.lessons}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      €{(Number(course.price) * course._count.enrollments).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
