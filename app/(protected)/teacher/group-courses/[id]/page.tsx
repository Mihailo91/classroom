import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TeacherGroupCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  const { id } = await params;

  const course = await prisma.groupCourse.findUnique({
    where: {
      id,
      teacherId: session.user.id,
    },
    include: {
      lessons: {
        orderBy: {
          scheduledAt: "asc",
        },
      },
      enrollments: {
        where: {
          status: "ACTIVE",
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          enrolledAt: "asc",
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  // Separate past and upcoming lessons
  const now = new Date();
  const upcomingLessons = course.lessons.filter((l) => l.scheduledAt >= now);
  const pastLessons = course.lessons.filter((l) => l.scheduledAt < now);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          href="/teacher/group-courses"
          className="text-sm text-blue-600 hover:text-blue-700 mb-6 inline-block"
        >
          ← Back to My Courses
        </Link>

        {/* Course Header */}
        <div className="bg-white shadow rounded-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  course.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                  course.status === "UPCOMING" ? "bg-yellow-100 text-yellow-800" :
                  course.status === "COMPLETED" ? "bg-gray-100 text-gray-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {course.status}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-gray-600 mb-4">
                  {course.description}
                </p>
              )}
            </div>
          </div>

          {/* Course Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Enrolled Students</div>
              <div className="text-2xl font-bold text-gray-900">
                {course.enrollments.length}/{course.maxStudents}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Lessons</div>
              <div className="text-2xl font-bold text-gray-900">
                {course.lessons.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Price</div>
              <div className="text-2xl font-bold text-gray-900">
                €{Number(course.price).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Min Students</div>
              <div className="text-2xl font-bold text-gray-900">
                {course.minStudents}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrolled Students */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Enrolled Students ({course.enrollments.length})
            </h2>
            
            {course.enrollments.length === 0 ? (
              <p className="text-gray-500 text-sm">No students enrolled yet.</p>
            ) : (
              <div className="space-y-3">
                {course.enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {enrollment.student.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {enrollment.student.email}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Lessons */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Upcoming Lessons ({upcomingLessons.length})
            </h2>
            
            {upcomingLessons.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming lessons scheduled.</p>
            ) : (
              <div className="space-y-3">
                {upcomingLessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-gray-900">
                        Lesson {index + 1}
                      </div>
                      {lesson.isHeld && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Held
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(lesson.scheduledAt).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })} at {new Date(lesson.scheduledAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Duration: {lesson.durationMin} minutes
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Past Lessons */}
        {pastLessons.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Past Lessons ({pastLessons.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pastLessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-gray-900">
                      Lesson {index + 1}
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      lesson.isHeld ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                    }`}>
                      {lesson.isHeld ? "Held" : "Missed"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(lesson.scheduledAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {lesson.presentStudents.length}/{course.enrollments.length} attended
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
