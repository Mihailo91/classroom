"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Teacher = {
  id: string;
  name: string;
  email?: string;
};

type Lesson = {
  id: string;
  scheduledAt: Date;
  durationMin: number;
  isHeld: boolean;
  notes: string | null;
  teacher: Teacher;
  presentStudents: string[];
};

type Enrollment = {
  id: string;
  status: string;
  enrolledAt: Date;
  paymentMethod?: string | null;
  transactionRef?: string | null;
  paymentDate?: Date | null;
  amountPaid?: number | null;
  payerName?: string | null;
  paymentNotes?: string | null;
  student: {
    id: string;
    name: string;
    email: string;
  };
};

type Course = {
  id: string;
  title: string;
  description: string | null;
  teacherId: string;
  minStudents: number;
  maxStudents: number;
  price: number;
  status: string;
  teacher: Teacher;
  lessons: Lesson[];
  enrollments: Enrollment[];
};

type Student = {
  id: string;
  name: string;
  email: string;
};

export default function GroupCourseEditor({
  course,
  teachers,
  students,
}: {
  course: Course;
  teachers: Teacher[];
  students: Student[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "lessons" | "enrollments">("details");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Course details
  const [courseData, setCourseData] = useState({
    title: course.title,
    description: course.description || "",
    teacherId: course.teacherId,
    minStudents: course.minStudents,
    maxStudents: course.maxStudents,
    price: course.price.toString(),
    status: course.status,
  });

  // Lesson form
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [lessonData, setLessonData] = useState({
    teacherId: course.teacherId,
    scheduledAt: "",
    durationMin: 50,
    notes: "",
  });

  // Enrollment form
  const [showAddEnrollment, setShowAddEnrollment] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState({
    studentId: "",
    paymentMethod: "bank_transfer",
    transactionRef: "",
    paymentDate: "",
    amountPaid: course.price.toString(),
    payerName: "",
    paymentNotes: "",
  });

  const availableStudents = students.filter(
    (student) => !course.enrollments.some((e) => e.student.id === student.id)
  );

  const handleSaveCourseDetails = async () => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/group-courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...courseData,
          price: parseFloat(courseData.price),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update course");
      }

      setSuccess("Course details updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`/api/admin/group-courses/${course.id}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lessonData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add lesson");
      }

      setSuccess("Lesson added successfully!");
      setTimeout(() => setSuccess(""), 3000);
      setShowAddLesson(false);
      setLessonData({
        teacherId: course.teacherId,
        scheduledAt: "",
        durationMin: 50,
        notes: "",
      });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    try {
      const response = await fetch(`/api/admin/group-lessons/${lessonId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete lesson");
      }

      setSuccess("Lesson deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
      router.refresh();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to delete lesson");
    }
  };

  const handleAddEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!enrollmentData.studentId) {
      setError("Please select a student");
      return;
    }

    try {
      const response = await fetch(`/api/admin/group-courses/${course.id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: enrollmentData.studentId,
          paymentMethod: enrollmentData.paymentMethod,
          transactionRef: enrollmentData.transactionRef || null,
          paymentDate: enrollmentData.paymentDate || null,
          amountPaid: enrollmentData.amountPaid || null,
          payerName: enrollmentData.payerName || null,
          paymentNotes: enrollmentData.paymentNotes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to enroll student");
      }

      setSuccess("Student enrolled successfully!");
      setTimeout(() => setSuccess(""), 3000);
      setShowAddEnrollment(false);
      setEnrollmentData({
        studentId: "",
        paymentMethod: "bank_transfer",
        transactionRef: "",
        paymentDate: "",
        amountPaid: course.price.toString(),
        payerName: "",
        paymentNotes: "",
      });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirm("Are you sure you want to delete this course? This will delete all lessons and enrollments.")) return;

    try {
      const response = await fetch(`/api/admin/group-courses/${course.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete course");
      }

      router.push("/admin/group-courses");
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to delete course");
    }
  };

  const statusColors: Record<string, string> = {
    UPCOMING: "bg-yellow-100 text-yellow-800",
    ACTIVE: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Edit Group Course: {course.title}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[course.status]}`}>
              {course.status}
            </span>
            <span className="text-sm text-gray-500">
              {course.enrollments.length}/{course.maxStudents} enrolled
            </span>
          </div>
        </div>
        <Link
          href="/admin/group-courses"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          ← Back to Courses
        </Link>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("details")}
            className={`${
              activeTab === "details"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Course Details
          </button>
          <button
            onClick={() => setActiveTab("lessons")}
            className={`${
              activeTab === "lessons"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Lessons ({course.lessons.length})
          </button>
          <button
            onClick={() => setActiveTab("enrollments")}
            className={`${
              activeTab === "enrollments"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Enrollments ({course.enrollments.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "details" && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                value={courseData.title}
                onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={courseData.description}
                onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Teacher *</label>
              <select
                value={courseData.teacherId}
                onChange={(e) => setCourseData({ ...courseData, teacherId: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} {teacher.email && `(${teacher.email})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Students</label>
                <input
                  type="number"
                  value={courseData.minStudents}
                  onChange={(e) => setCourseData({ ...courseData, minStudents: parseInt(e.target.value) })}
                  min="1"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max Students</label>
                <input
                  type="number"
                  value={courseData.maxStudents}
                  onChange={(e) => setCourseData({ ...courseData, maxStudents: parseInt(e.target.value) })}
                  min={courseData.minStudents}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Price (€)</label>
                <input
                  type="number"
                  value={courseData.price}
                  onChange={(e) => setCourseData({ ...courseData, price: e.target.value })}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={courseData.status}
                onChange={(e) => setCourseData({ ...courseData, status: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="UPCOMING">UPCOMING</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <button
                type="button"
                onClick={handleDeleteCourse}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Delete Course
              </button>
              <button
                onClick={handleSaveCourseDetails}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "lessons" && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Scheduled Lessons</h2>
            <button
              onClick={() => setShowAddLesson(!showAddLesson)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Lesson
            </button>
          </div>

          {showAddLesson && (
            <form onSubmit={handleAddLesson} className="bg-green-50 rounded-lg border border-green-200 p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Add New Lesson</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teacher</label>
                  <select
                    value={lessonData.teacherId}
                    onChange={(e) => setLessonData({ ...lessonData, teacherId: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  >
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Scheduled Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={lessonData.scheduledAt}
                      onChange={(e) => setLessonData({ ...lessonData, scheduledAt: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                    <input
                      type="number"
                      value={lessonData.durationMin}
                      onChange={(e) => setLessonData({ ...lessonData, durationMin: parseInt(e.target.value) })}
                      min="1"
                      max="300"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={lessonData.notes}
                    onChange={(e) => setLessonData({ ...lessonData, notes: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLesson(false)}
                    className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Add Lesson
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="bg-white shadow rounded-lg overflow-hidden">
            {course.lessons.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">No lessons scheduled yet.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {course.lessons.map((lesson) => (
                    <tr key={lesson.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(lesson.scheduledAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lesson.teacher.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lesson.durationMin} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          lesson.isHeld ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {lesson.isHeld ? "Held" : "Scheduled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === "enrollments" && (
        <div className="space-y-6">
          {/* Add Enrollment Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Enrolled Students ({course.enrollments.length}/{course.maxStudents})
            </h3>
            {course.enrollments.length < course.maxStudents && (
              <button
                onClick={() => setShowAddEnrollment(!showAddEnrollment)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showAddEnrollment ? "Cancel" : "+ Enroll Student"}
              </button>
            )}
          </div>

          {/* Add Enrollment Form */}
          {showAddEnrollment && (
            <form onSubmit={handleAddEnrollment} className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-gray-900">Manual Enrollment with Payment Details</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Student *</label>
                  <select
                    value={enrollmentData.studentId}
                    onChange={(e) => setEnrollmentData({ ...enrollmentData, studentId: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  >
                    <option value="">Select a student</option>
                    {availableStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.email})
                      </option>
                    ))}
                  </select>
                  {availableStudents.length === 0 && (
                    <p className="mt-1 text-xs text-gray-500">All students are already enrolled or course is full</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    value={enrollmentData.paymentMethod}
                    onChange={(e) => setEnrollmentData({ ...enrollmentData, paymentMethod: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="paypal">PayPal</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount Paid (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={enrollmentData.amountPaid}
                    onChange={(e) => setEnrollmentData({ ...enrollmentData, amountPaid: e.target.value })}
                    placeholder="Course price"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction Reference</label>
                  <input
                    type="text"
                    value={enrollmentData.transactionRef}
                    onChange={(e) => setEnrollmentData({ ...enrollmentData, transactionRef: e.target.value })}
                    placeholder="Bank ref, receipt #, etc."
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                  <input
                    type="date"
                    value={enrollmentData.paymentDate}
                    onChange={(e) => setEnrollmentData({ ...enrollmentData, paymentDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payer Name</label>
                  <input
                    type="text"
                    value={enrollmentData.payerName}
                    onChange={(e) => setEnrollmentData({ ...enrollmentData, payerName: e.target.value })}
                    placeholder="Who made the payment"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Payment Notes</label>
                  <textarea
                    value={enrollmentData.paymentNotes}
                    onChange={(e) => setEnrollmentData({ ...enrollmentData, paymentNotes: e.target.value })}
                    rows={2}
                    placeholder="Additional payment details..."
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEnrollment(false)}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={availableStudents.length === 0}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enroll Student
                </button>
              </div>
            </form>
          )}

          {/* Enrollments Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {course.enrollments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">No enrollments yet.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Enrolled At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {course.enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {enrollment.student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {enrollment.student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {enrollment.paymentMethod ? (
                          <div className="space-y-1">
                            <div className="font-medium">
                              {enrollment.amountPaid ? `€${enrollment.amountPaid}` : "N/A"} via {enrollment.paymentMethod}
                            </div>
                            {enrollment.transactionRef && (
                              <div className="text-xs text-gray-500">Ref: {enrollment.transactionRef}</div>
                            )}
                            {enrollment.paymentDate && (
                              <div className="text-xs text-gray-500">
                                Paid: {new Date(enrollment.paymentDate).toLocaleDateString()}
                              </div>
                            )}
                            {enrollment.payerName && (
                              <div className="text-xs text-gray-500">By: {enrollment.payerName}</div>
                            )}
                            {enrollment.paymentNotes && (
                              <div className="text-xs text-gray-500 italic">{enrollment.paymentNotes}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No payment info</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
