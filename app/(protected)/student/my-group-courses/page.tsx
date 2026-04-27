import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function MyGroupCoursesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const enrollments = await prisma.groupEnrollment.findMany({
    where: {
      studentId: session.user.id,
      status: "ACTIVE",
    },
    include: {
      course: {
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
            },
          },
          lessons: {
            where: {
              scheduledAt: {
                gte: new Date(),
              },
            },
            orderBy: {
              scheduledAt: "asc",
            },
            take: 1,
          },
          _count: {
            select: {
              enrollments: true,
              lessons: true,
            },
          },
        },
      },
    },
    orderBy: {
      enrolledAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            My Group Courses
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Your enrolled group courses and schedules
          </p>
        </div>

        {/* Course Grid */}
        {enrollments.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No group courses yet
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Browse available group courses and join a class
            </p>
            <Link
              href="/student/group-courses"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Browse Group Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => {
              const course = enrollment.course;
              const nextLesson = course.lessons[0];

              return (
                <div
                  key={enrollment.id}
                  className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        course.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                        course.status === "UPCOMING" ? "bg-yellow-100 text-yellow-800" :
                        course.status === "COMPLETED" ? "bg-gray-100 text-gray-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {course.status}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {course.title}
                    </h3>

                    {/* Description */}
                    {course.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {course.description}
                      </p>
                    )}

                    {/* Teacher */}
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <span className="mr-1">👤</span>
                      <span>{course.teacher.name}</span>
                    </div>

                    {/* Next Lesson */}
                    {nextLesson ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1">
                          Next Lesson
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(nextLesson.scheduledAt).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(nextLesson.scheduledAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })} • {nextLesson.durationMin} min
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                        <div className="text-xs text-gray-500">
                          No upcoming lessons scheduled
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                      <div>
                        {course._count.enrollments}/{course.maxStudents} students
                      </div>
                      <div>
                        {course._count.lessons} lessons
                      </div>
                    </div>

                    {/* Action */}
                    <Link
                      href={`/student/group-courses/${course.id}`}
                      className="block w-full text-center bg-blue-600 text-white font-medium rounded-lg py-2 hover:bg-blue-700 transition-colors text-sm"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
