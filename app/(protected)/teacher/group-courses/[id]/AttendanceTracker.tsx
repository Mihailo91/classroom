"use client";

import { useState } from "react";

type Lesson = {
  id: string;
  scheduledAt: Date;
  durationMin: number;
  isHeld: boolean;
  presentStudents: string[];
};

type Student = {
  id: string;
  name: string;
  email: string;
};

type AttendanceTrackerProps = {
  lesson: Lesson;
  students: Student[];
  courseId: string;
};

export function AttendanceTracker({ lesson, students, courseId }: AttendanceTrackerProps) {
  const [presentIds, setPresentIds] = useState<string[]>(lesson.presentStudents);
  const [isHeld, setIsHeld] = useState(lesson.isHeld);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleToggle = (studentId: string) => {
    setPresentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/teacher/group-lessons/${lesson.id}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentStudents: presentIds,
          isHeld: isHeld,
        }),
      });

      if (response.ok) {
        setMessage("Attendance saved successfully");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || "Failed to save attendance");
      }
    } catch (error) {
      setMessage("Error saving attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Lesson {new Date(lesson.scheduledAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isHeld}
            onChange={(e) => setIsHeld(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-gray-700">Lesson held</span>
        </label>
      </div>

      <div className="space-y-2 mb-4">
        {students.map((student) => (
          <label
            key={student.id}
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={presentIds.includes(student.id)}
              onChange={() => handleToggle(student.id)}
              className="rounded border-gray-300"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{student.name}</div>
              <div className="text-sm text-gray-500">{student.email}</div>
            </div>
          </label>
        ))}
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes("success") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
        }`}>
          {message}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 text-white font-medium rounded-lg py-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save Attendance"}
      </button>
    </div>
  );
}
