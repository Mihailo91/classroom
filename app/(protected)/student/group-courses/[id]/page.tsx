import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function GroupCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  // Fetch course details
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/group-courses/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    notFound();
  }

  const { course } = await response.json();

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/student/group-courses"
          className="text-sm text-blue-600 hover:text-blue-700 mb-6 inline-block"
        >
          ← Back to Group Courses
        </Link>

        {/* Course Header */}
        <div className="bg-white shadow rounded-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  course.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}>
                  {course.status}
                </span>
                {course.isEnrolled && (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                    You're Enrolled
                  </span>
                )}
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

          {/* Course Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <div className="text-sm text-gray-500">Teacher</div>
              <div className="text-lg font-semibold text-gray-900">{course.teacherName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Enrolled</div>
              <div className="text-lg font-semibold text-gray-900">
                {course.enrolledCount}/{course.maxStudents}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Spots Left</div>
              <div className={`text-lg font-semibold ${course.availableSpots === 0 ? "text-red-600" : "text-gray-900"}`}>
                {course.availableSpots}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Price</div>
              <div className="text-lg font-semibold text-gray-900">€{course.price.toFixed(2)}</div>
            </div>
          </div>

          {/* Enrollment CTA */}
          {!course.isEnrolled && (
            <div className="flex items-center gap-3">
              {course.isFull ? (
                <div className="flex-1 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  This course is full. No spots available.
                </div>
              ) : (
                <>
                  <button
                    disabled
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add to Cart
                  </button>
                  <button
                    disabled
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Enroll Now
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Lesson Schedule */}
        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Lesson Schedule</h2>
          
          {course.lessons.length === 0 ? (
            <p className="text-gray-500 text-sm">No upcoming lessons scheduled yet.</p>
          ) : (
            <div className="space-y-3">
              {course.lessons.map((lesson: any, index: number) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {new Date(lesson.scheduledAt).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(lesson.scheduledAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })} • {lesson.durationMin} minutes
                      </div>
                    </div>
                  </div>
                  {lesson.isHeld && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                      Completed
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
