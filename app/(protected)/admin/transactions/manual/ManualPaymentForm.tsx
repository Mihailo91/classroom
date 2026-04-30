"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Student = {
  id: string;
  name: string;
  email: string;
};

type GroupCourse = {
  id: string;
  title: string;
  price: number;
  teacher: {
    name: string;
  };
};

export default function ManualPaymentForm({
  students,
  groupCourses,
}: {
  students: Student[];
  groupCourses: GroupCourse[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    studentId: "",
    courseId: "",
    amountPaid: "",
    payerName: "",
    transactionRef: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentNotes: "",
  });

  const [searchStudent, setSearchStudent] = useState("");
  const [searchCourse, setSearchCourse] = useState("");

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.email.toLowerCase().includes(searchStudent.toLowerCase())
  );

  const filteredCourses = groupCourses.filter((c) =>
    c.title.toLowerCase().includes(searchCourse.toLowerCase())
  );

  const selectedCourse = groupCourses.find((c) => c.id === formData.courseId);

  // Pre-fill amount when course is selected
  useEffect(() => {
    if (selectedCourse && !formData.amountPaid) {
      setFormData((prev) => ({
        ...prev,
        amountPaid: selectedCourse.price.toString(),
      }));
    }
  }, [selectedCourse, formData.amountPaid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/transactions/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amountPaid: parseFloat(formData.amountPaid),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to record payment");
      }

      setSuccess(true);
      setFormData({
        studentId: "",
        courseId: "",
        amountPaid: "",
        payerName: "",
        transactionRef: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentNotes: "",
      });
      setSearchStudent("");
      setSearchCourse("");

      // Redirect to transactions page after 2 seconds
      setTimeout(() => {
        router.push("/admin/transactions");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Payment Recorded Successfully
        </h2>
        <p className="text-gray-600 mb-6">
          Redirecting to transactions page...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Record Bank Transfer Payment
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Student Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Student *
          </label>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a student</option>
            {filteredStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.email})
              </option>
            ))}
          </select>
        </div>

        {/* Course Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Course *
          </label>
          <input
            type="text"
            placeholder="Search courses..."
            value={searchCourse}
            onChange={(e) => setSearchCourse(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={formData.courseId}
            onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a course</option>
            {filteredCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} (€{course.price} - {course.teacher.name})
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount Paid (€) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.amountPaid}
            onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Payer Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payer Name *
          </label>
          <input
            type="text"
            value={formData.payerName}
            onChange={(e) => setFormData({ ...formData, payerName: e.target.value })}
            required
            placeholder="Name on bank transfer"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Transaction Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Reference
          </label>
          <input
            type="text"
            value={formData.transactionRef}
            onChange={(e) =>
              setFormData({ ...formData, transactionRef: e.target.value })
            }
            placeholder="Bank transfer ID or reference"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Date
          </label>
          <input
            type="date"
            value={formData.paymentDate}
            onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.paymentNotes}
            onChange={(e) =>
              setFormData({ ...formData, paymentNotes: e.target.value })
            }
            rows={3}
            placeholder="Additional payment notes..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mt-8">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Recording..." : "Record Payment"}
        </button>
        <Link
          href="/admin/transactions"
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
