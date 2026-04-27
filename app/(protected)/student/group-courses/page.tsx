import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function StudentGroupCoursesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Fetch courses directly from database
  const coursesData = await prisma.groupCourse.findMany({
    where: {
      status: {
        in: ["UPCOMING", "ACTIVE"],
      },
    },
    include: {
      teacher: {
        select: {
          id: true,
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
  });

  // Check enrollment status for current user
  const enrolledCourseIds = (
    await prisma.groupEnrollment.findMany({
      where: {
        studentId: session.user.id,
        status: "ACTIVE",
      },
      select: {
        courseId: true,
      },
    })
  ).map((e) => e.courseId);

  // Calculate available spots and serialize
  const courses = coursesData.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    teacherId: course.teacher.id,
    teacherName: course.teacher.name,
    minStudents: course.minStudents,
    maxStudents: course.maxStudents,
    price: Number(course.price),
    status: course.status,
    enrolledCount: course._count.enrollments,
    lessonsCount: course._count.lessons,
    availableSpots: course.maxStudents - course._count.enrollments,
    isFull: course._count.enrollments >= course.maxStudents,
    isEnrolled: enrolledCourseIds.includes(course.id),
    createdAt: course.createdAt,
  }));

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Group Courses
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Join scheduled group classes with other students
          </p>
        </div>

        {/* Course Grid */}
        {courses.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <p className="text-gray-500">No group courses available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <Link
                key={course.id}
                href={`/student/group-courses/${course.id}`}
                className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      course.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {course.status}
                    </span>
                    {course.isEnrolled && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Enrolled
                      </span>
                    )}
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
                    <span>{course.teacherName}</span>
                  </div>

                  {/* Capacity */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{course.enrolledCount}/{course.maxStudents}</span> students
                    </div>
                    <div className="text-sm text-gray-600">
                      {course.lessonsCount} lessons
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className={`h-2 rounded-full ${
                        course.isFull ? "bg-red-500" : "bg-blue-600"
                      }`}
                      style={{ width: `${(course.enrolledCount / course.maxStudents) * 100}%` }}
                    />
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900">
                      €{course.price.toFixed(2)}
                    </div>
                    {course.isFull ? (
                      <span className="text-sm text-red-600 font-medium">Full</span>
                    ) : course.isEnrolled ? (
                      <span className="text-sm text-blue-600 font-medium">View →</span>
                    ) : (
                      <span className="text-sm text-blue-600 font-medium">Enroll →</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
