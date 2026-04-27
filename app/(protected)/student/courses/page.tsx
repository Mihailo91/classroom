import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStudentCourses } from "@/lib/course-access";
import CourseCatalogSearch from "./CourseCatalogSearch";

export default async function CourseCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { search = "", page = "1" } = await searchParams;
  const currentPage = parseInt(page);
  const limit = 12;
  const skip = (currentPage - 1) * limit;

  const where: any = { isPublished: true };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // Fetch published courses + student's owned course IDs in parallel
  const [{ courses, total }, ownedCourses] = await Promise.all([
    prisma.course
      .findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          coverImageUrl: true,
          price: true,
          _count: { select: { modules: true, studentCourses: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      })
      .then(async (courses) => ({
        courses,
        total: await prisma.course.count({ where }),
      })),
    session.user.role === "STUDENT"
      ? getStudentCourses(session.user.id!).then((c) => new Set(c.map((x) => x.id)))
      : Promise.resolve(new Set<string>()),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Video Courses</h1>
            <p className="text-sm text-gray-500 mt-1">
              {total} course{total !== 1 ? "s" : ""} available
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/student/dashboard"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              ← Dashboard
            </Link>
            <Link
              href="/student/my-courses"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              My Courses
            </Link>
          </div>
        </div>

        {/* Search */}
        <CourseCatalogSearch defaultSearch={search} />

        {/* Grid */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center mt-6">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search ? "No courses match your search" : "No courses available yet"}
            </h3>
            {search && (
              <Link
                href="/student/courses"
                className="text-blue-600 text-sm hover:underline"
              >
                Clear search
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
              {courses.map((course) => {
                const owned = ownedCourses.has(course.id);
                return (
                  <CourseCard key={course.id} course={course} owned={owned} />
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {currentPage > 1 && (
                  <Link
                    href={`/student/courses?search=${search}&page=${currentPage - 1}`}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100"
                  >
                    ← Prev
                  </Link>
                )}
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                {currentPage < totalPages && (
                  <Link
                    href={`/student/courses?search=${search}&page=${currentPage + 1}`}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100"
                  >
                    Next →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function CourseCard({
  course,
  owned,
}: {
  course: {
    id: string;
    title: string;
    description: string;
    coverImageUrl: string | null;
    price: any;
    _count: { modules: number; studentCourses: number };
  };
  owned: boolean;
}) {
  return (
    <Link
      href={`/student/courses/${course.id}`}
      className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all"
    >
      {/* Thumbnail */}
      {course.coverImageUrl ? (
        <img
          src={course.coverImageUrl}
          alt={course.title}
          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-44 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-5xl">📚</span>
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {course.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {course.description}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{course._count.modules} modules</span>
          <span>{course._count.studentCourses} students</span>
        </div>

        <div className="flex items-center justify-between">
          {owned ? (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              ✓ Enrolled
            </span>
          ) : (
            <span className="text-sm font-bold text-gray-900">
              €{course.price.toString()}
            </span>
          )}
          <span className="text-xs text-blue-600 font-medium group-hover:underline">
            {owned ? "Continue →" : "View details →"}
          </span>
        </div>
      </div>
    </Link>
  );
}
