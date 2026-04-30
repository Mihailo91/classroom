import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getStudentCourses } from "@/lib/course-access";

export default async function MyCoursesPage() {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    redirect("/");
  }

  const courses = await getStudentCourses(session.user.id!);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              My Courses
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View and access your purchased courses
            </p>
          </div>
          <Link
            href="/student/dashboard"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No courses yet
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              You haven't purchased any courses yet. Browse the catalog to get started.
            </p>
            <Link
              href="/student/courses"
              className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Cover Image */}
                {course.coverImageUrl ? (
                  <img
                    src={course.coverImageUrl}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-6xl">📚</span>
                  </div>
                )}

                {/* Course Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>{course._count.modules} modules</span>
                    {course.expiresAt && (
                      <span className={course.isExpired ? "text-red-600" : ""}>
                        {course.isExpired
                          ? "Expired"
                          : `Expires ${new Date(course.expiresAt).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  {course.isExpired ? (
                    <button
                      disabled
                      className="w-full rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
                    >
                      Access Expired
                    </button>
                  ) : (
                    <Link
                      href={`/student/courses/${course.id}/watch`}
                      className="block w-full text-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      Continue Learning →
                    </Link>
                  )}

                  {/* Purchase Date */}
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    Purchased on {new Date(course.purchasedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
