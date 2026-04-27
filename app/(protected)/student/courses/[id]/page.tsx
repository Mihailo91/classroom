import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hasAccess } from "@/lib/course-access";
import { AddToCartButton, CartBadge } from "@/components/CartComponents";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id, isPublished: true },
    include: {
      modules: {
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
        orderBy: { order: "asc" },
      },
      _count: { select: { studentCourses: true } },
    },
  });

  if (!course) notFound();

  const owned = session.user.id
    ? await hasAccess(session.user.id, course.id)
    : false;

  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );
  const previewCount = course.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.isPreview).length,
    0
  );

  const totalDuration = course.modules.reduce(
    (sum, m) =>
      sum +
      m.lessons.reduce((s, l) => s + (l.durationMinutes ?? 0), 0),
    0
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/student/courses" className="hover:text-white transition-colors">
              Courses
            </Link>
            <span>›</span>
            <span className="text-gray-200">{course.title}</span>
            <span className="ml-auto">
              <CartBadge />
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Info */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-gray-300 leading-relaxed mb-6">
                {course.description}
              </p>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span>📚 {course.modules.length} modules</span>
                <span>🎬 {totalLessons} lessons</span>
                {totalDuration > 0 && (
                  <span>⏱️ {Math.round(totalDuration / 60)}h {totalDuration % 60}m total</span>
                )}
                <span>👥 {course._count.studentCourses} students enrolled</span>
                {previewCount > 0 && (
                  <span>👁️ {previewCount} free preview{previewCount !== 1 ? "s" : ""}</span>
                )}
              </div>
            </div>

            {/* Right: Purchase / Access Card */}
            <div className="lg:col-span-1">
              <div className="bg-white text-gray-900 rounded-2xl p-6 shadow-xl">
                {course.coverImageUrl ? (
                  <img
                    src={course.coverImageUrl}
                    alt={course.title}
                    className="w-full h-40 object-cover rounded-xl mb-4"
                  />
                ) : (
                  <div className="w-full h-40 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                    <span className="text-5xl">📚</span>
                  </div>
                )}

                {owned ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-green-600 font-semibold text-sm bg-green-50 px-3 py-1 rounded-full">
                        ✓ You're enrolled
                      </span>
                    </div>
                    <Link
                      href={`/student/courses/${course.id}/watch`}
                      className="block w-full text-center bg-blue-600 text-white font-semibold rounded-xl py-3 hover:bg-blue-700 transition-colors"
                    >
                      Continue Learning →
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold mb-1">€{course.price.toString()}</div>
                    <p className="text-sm text-gray-500 mb-4">Lifetime access</p>
                    <Link
                      href={`/student/courses/${course.id}/checkout`}
                      className="block w-full text-center bg-blue-600 text-white font-semibold rounded-xl py-3 hover:bg-blue-700 transition-colors mb-3"
                    >
                      Buy Now
                    </Link>
                    <AddToCartButton
                      item={{
                        id: course.id,
                        type: "video",
                        title: course.title,
                        price: parseFloat(course.price.toString()),
                        coverImageUrl: course.coverImageUrl,
                      }}
                    />
                    <div className="mb-3" />
                    {previewCount > 0 && (
                      <Link
                        href={`/student/courses/${course.id}/watch?preview=true`}
                        className="block w-full text-center border border-gray-300 text-gray-700 font-medium rounded-xl py-3 hover:bg-gray-50 transition-colors text-sm"
                      >
                        Watch Free Preview
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Course Content</h2>

        <div className="space-y-4">
          {course.modules.map((module, mIdx) => (
            <div
              key={module.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
              {/* Module Header */}
              <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
                <div>
                  <span className="text-xs text-gray-500 font-medium mr-2">
                    Module {mIdx + 1}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {module.title}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {module.lessons.length} lesson{module.lessons.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Lessons */}
              <ul className="divide-y divide-gray-100">
                {module.lessons.map((lesson, lIdx) => (
                  <li
                    key={lesson.id}
                    className="flex items-center gap-4 px-6 py-3"
                  >
                    <span className="text-xs text-gray-400 w-5 shrink-0">
                      {lIdx + 1}
                    </span>
                    <span className="text-sm flex-1 text-gray-700">
                      {lesson.title}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {lesson.isPreview && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                          Preview
                        </span>
                      )}
                      {!owned && !lesson.isPreview && (
                        <span className="text-gray-400 text-sm">🔒</span>
                      )}
                      {lesson.durationMinutes && (
                        <span className="text-xs text-gray-400">
                          {lesson.durationMinutes}m
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
