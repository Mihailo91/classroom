import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function GroupCoursesPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const courses = await prisma.groupCourse.findMany({
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          lessons: true,
          enrollments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate total stats
  const totalRevenue = courses.reduce((sum, c) => {
    return sum + (Number(c.price) * c._count.enrollments);
  }, 0);

  const totalEnrollments = courses.reduce((sum, c) => sum + c._count.enrollments, 0);
  const activeCourses = courses.filter(c => c.status === "ACTIVE").length;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Group Courses
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage group courses, lessons, and enrollments
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              ← Back to Dashboard
            </Link>
            <Link
              href="/admin/group-courses/analytics"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              📊 Analytics
            </Link>
            <Link
              href="/admin/group-courses/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              + New Group Course
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Revenue
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                €{totalRevenue.toFixed(2)}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Enrollments
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {totalEnrollments}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Active Courses
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {activeCourses}
              </dd>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No group courses yet.</p>
              <Link
                href="/admin/group-courses/new"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Your First Group Course
              </Link>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lessons
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => {
                  const statusColors = {
                    UPCOMING: "bg-yellow-100 text-yellow-800",
                    ACTIVE: "bg-green-100 text-green-800",
                    COMPLETED: "bg-gray-100 text-gray-800",
                    CANCELLED: "bg-red-100 text-red-800",
                  };

                  const spotsLeft = course.maxStudents - course._count.enrollments;

                  return (
                    <tr key={course.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {course.title}
                          </div>
                          {course.description && (
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {course.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.teacher.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[course.status]}`}>
                          {course.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course._count.enrollments}/{course.maxStudents}
                        <span className="text-xs text-gray-500 ml-1">
                          ({spotsLeft} left)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{Number(course.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course._count.lessons}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/group-courses/${course.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
