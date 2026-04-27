import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CourseAnalyticsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Aggregate course stats
  const courses = await prisma.course.findMany({
    include: {
      _count: { select: { modules: true, studentCourses: true } },
      studentCourses: {
        where: { purchasedAt: { gte: startOfMonth } },
        select: { purchasedAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = courses.reduce(
    (sum, c) => sum + Number(c.price) * c._count.studentCourses,
    0
  );
  const monthRevenue = courses.reduce(
    (sum, c) => sum + Number(c.price) * c.studentCourses.length,
    0
  );
  const totalSales = courses.reduce((sum, c) => sum + c._count.studentCourses, 0);
  const totalPublished = courses.filter((c) => c.isPublished).length;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Course Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">
              Revenue and enrollment overview
            </p>
          </div>
          <Link
            href="/admin/video-courses"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ← Back to Courses
          </Link>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Revenue" value={`€${totalRevenue.toFixed(2)}`} />
          <StatCard label="This Month" value={`€${monthRevenue.toFixed(2)}`} sub="revenue" />
          <StatCard label="Total Sales" value={totalSales.toString()} sub="enrollments" />
          <StatCard label="Published" value={`${totalPublished} / ${courses.length}`} sub="courses" />
        </div>

        {/* Per-course Table */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No courses yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Course", "Status", "Price", "Modules", "Total Sales", "This Month", "Total Revenue", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.map((course) => {
                  const courseRevenue = Number(course.price) * course._count.studentCourses;
                  const monthSales = course.studentCourses.length;

                  return (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {course.coverImageUrl ? (
                            <img
                              src={course.coverImageUrl}
                              alt={course.title}
                              className="h-9 w-14 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="h-9 w-14 rounded bg-gray-200 shrink-0" />
                          )}
                          <span className="text-sm font-medium text-gray-900 line-clamp-1">
                            {course.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {course.isPublished ? (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
                            Published
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        €{Number(course.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course._count.modules}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {course._count.studentCourses}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {monthSales > 0 ? (
                          <span className="text-green-600 font-medium">+{monthSales}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        €{courseRevenue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/admin/video-courses/${course.id}/edit`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
