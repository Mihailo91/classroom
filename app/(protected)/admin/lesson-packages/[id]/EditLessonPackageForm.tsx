"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateLessonPackage } from "@/lib/actions/lessonPackages";

type Package = {
  id: string;
  packageType: string;
  lessonsIncluded: number;
  price: { toString(): string };
  description: string | null;
  isActive: boolean;
  teacher: { name: string };
};

const PACKAGE_LABELS: Record<string, string> = {
  SINGLE: "Single (1 lesson)",
  STARTER: "Starter (4 lessons)",
  STANDARD: "Standard (8 lessons)",
  PREMIUM: "Premium (12 lessons)",
};

export default function EditLessonPackageForm({ pkg }: { pkg: Package }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [price, setPrice] = useState(Number(pkg.price).toFixed(2));
  const [description, setDescription] = useState(pkg.description ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError("Please enter a valid price");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await updateLessonPackage(pkg.id, {
        price: Number(price),
        description: description || undefined,
      });
      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update package");
    } finally {
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
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Package updated successfully.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
        <div>
          <span className="text-gray-500">Teacher</span>
          <p className="font-medium text-gray-900">{pkg.teacher.name}</p>
        </div>
        <div>
          <span className="text-gray-500">Package</span>
          <p className="font-medium text-gray-900">
            {PACKAGE_LABELS[pkg.packageType] ?? pkg.packageType}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Lessons</span>
          <p className="font-medium text-gray-900">{pkg.lessonsIncluded}</p>
        </div>
        <div>
          <span className="text-gray-500">Status</span>
          <p className={`font-medium ${pkg.isActive ? "text-green-700" : "text-gray-500"}`}>
            {pkg.isActive ? "Active" : "Inactive"}
          </p>
        </div>
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
          {loading ? "Saving…" : "Save Changes"}
        </button>
        <Link
          href="/admin/lesson-packages"
          className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 text-center"
        >
          Back
        </Link>
      </div>
    </form>
  );
}
