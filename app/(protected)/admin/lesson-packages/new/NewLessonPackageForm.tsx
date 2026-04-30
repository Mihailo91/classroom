"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createLessonPackage } from "@/lib/actions/lessonPackages";

type Teacher = { id: string; name: string; email: string };

const PACKAGE_OPTIONS = [
  { value: "SINGLE", label: "Single (1 lesson)" },
  { value: "STARTER", label: "Starter (4 lessons)" },
  { value: "STANDARD", label: "Standard (8 lessons)" },
  { value: "PREMIUM", label: "Premium (12 lessons)" },
];

export default function NewLessonPackageForm({
  teachers,
}: {
  teachers: Teacher[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [teacherId, setTeacherId] = useState("");
  const [packageType, setPackageType] = useState("STARTER");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teacherId) {
      setError("Please select a teacher");
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError("Please enter a valid price");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createLessonPackage({
        teacherId,
        packageType: packageType as any,
        price: Number(price),
        description: description || undefined,
      });
      router.push("/admin/lesson-packages");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create package");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teacher <span className="text-red-500">*</span>
        </label>
        <select
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a teacher…</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Package Type <span className="text-red-500">*</span>
        </label>
        <select
          value={packageType}
          onChange={(e) => setPackageType(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PACKAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Price (€) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          placeholder="e.g. 120.00"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description for students…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create Package"}
        </button>
        <Link
          href="/admin/lesson-packages"
          className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 text-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
