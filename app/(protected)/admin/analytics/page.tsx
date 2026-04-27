import Link from "next/link";

export default function AdminAnalyticsPage() {
  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">View comprehensive analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/video-courses/analytics"
          className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow border border-gray-100"
        >
          <div className="text-4xl mb-3">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Video Courses Analytics
          </h3>
          <p className="text-gray-500 text-sm">
            Revenue, enrollments, and engagement metrics for video courses
          </p>
        </Link>

        <Link
          href="/admin/group-courses/analytics"
          className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow border border-gray-100"
        >
          <div className="text-4xl mb-3">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Group Courses Analytics
          </h3>
          <p className="text-gray-500 text-sm">
            Course performance, attendance, and student metrics
          </p>
        </Link>
      </div>
    </main>
  );
}
