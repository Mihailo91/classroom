import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ txn?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { txn } = await searchParams;

  // Fetch the transaction for amount + timestamp
  const transaction = txn
    ? await prisma.transaction.findUnique({
        where: { id: txn, userId: session.user.id, status: "COMPLETED" },
      })
    : null;

  // Find items purchased in this transaction using completedAt as anchor
  const anchor = transaction?.completedAt ?? new Date();
  const windowMs = 60_000; // 1-minute window
  const from = new Date(anchor.getTime() - windowMs);
  const to = new Date(anchor.getTime() + windowMs);

  const [videoCourses, groupCourses] = await Promise.all([
    prisma.studentCourse.findMany({
      where: { studentId: session.user.id, purchasedAt: { gte: from, lte: to } },
      include: { course: { select: { title: true, coverImageUrl: true } } },
      orderBy: { purchasedAt: "desc" },
    }),
    prisma.groupEnrollment.findMany({
      where: { studentId: session.user.id, enrolledAt: { gte: from, lte: to } },
      include: { course: { select: { title: true } } },
      orderBy: { enrolledAt: "desc" },
    }),
  ]);

  const hasPurchases = videoCourses.length > 0 || groupCourses.length > 0;

  return (
    <main className="min-h-screen bg-gray-50 p-6 flex items-start justify-center pt-16">
      <div className="w-full max-w-2xl space-y-6">

        {/* Success header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-500 text-sm">
            {transaction
              ? `€${Number(transaction.netAmount).toFixed(2)} paid on ${transaction.completedAt?.toLocaleDateString("en-GB", { dateStyle: "long" })}`
              : "Your purchase is confirmed."}
          </p>
        </div>

        {/* Purchased items */}
        {hasPurchases && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">What you got</h2>
            <ul className="divide-y divide-gray-100">
              {videoCourses.map(({ course, courseId }) => (
                <li key={courseId} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  {course.coverImageUrl ? (
                    <img
                      src={course.coverImageUrl}
                      alt={course.title}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                      <span className="text-xl">📚</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                    <p className="text-xs text-gray-500">Video Course · Lifetime access</p>
                  </div>
                  <Link
                    href={`/student/courses/${courseId}/watch`}
                    className="text-xs font-medium text-blue-600 hover:underline shrink-0"
                  >
                    Start →
                  </Link>
                </li>
              ))}
              {groupCourses.map(({ course, courseId }) => (
                <li key={courseId} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shrink-0">
                    <span className="text-xl">👥</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                    <p className="text-xs text-gray-500">Group Course · Enrolled</p>
                  </div>
                  <Link
                    href={`/student/group-courses/${courseId}`}
                    className="text-xs font-medium text-blue-600 hover:underline shrink-0"
                  >
                    View →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/student/my-courses"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            My Learning
          </Link>
          <Link
            href="/student/courses"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Browse More Courses
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400">
          Questions?{" "}
          <a href="mailto:support@classroom.com" className="text-blue-500 hover:underline">
            support@classroom.com
          </a>
        </p>
      </div>
    </main>
  );
}
