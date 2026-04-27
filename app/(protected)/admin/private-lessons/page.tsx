export default function AdminPrivateLessonsPage() {
  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Private Lessons</h1>
        <p className="text-gray-500 mt-1">Manage 1-on-1 lesson bookings</p>
      </div>

      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Private Lessons Coming Soon
        </h2>
        <p className="text-gray-500 max-w-md mx-auto">
          This feature will allow students to book 1-on-1 sessions with teachers.
          Stay tuned for updates!
        </p>
      </div>
    </main>
  );
}
