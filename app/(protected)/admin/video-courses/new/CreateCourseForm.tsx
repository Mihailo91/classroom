"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateCourseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverImageUrl: "",
    price: "",
    isPublished: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create course");
      }

      // Redirect to edit page to add modules
      router.push(`/admin/video-courses/${data.course.id}/edit`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="mb-6">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Course Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Complete Spanish for Beginners"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description *
          </label>
          <textarea
            id="description"
            required
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe what students will learn in this course..."
          />
        </div>

        {/* Cover Image URL */}
        <div className="mb-6">
          <label
            htmlFor="coverImageUrl"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Cover Image URL
          </label>
          <input
            type="url"
            id="coverImageUrl"
            value={formData.coverImageUrl}
            onChange={(e) =>
              setFormData({ ...formData, coverImageUrl: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/image.jpg"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional: Paste a URL to an image (Vimeo thumbnail or external image)
          </p>
        </div>

        {/* Price */}
        <div className="mb-6">
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Price (€) *
          </label>
          <input
            type="number"
            id="price"
            required
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="49.99"
          />
        </div>

        {/* Publish Toggle */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) =>
                setFormData({ ...formData, isPublished: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Publish immediately
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Published courses are visible to students. Leave unchecked to keep as draft.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Link
          href="/admin/video-courses"
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Creating..." : "Create Course"}
        </button>
      </div>
    </form>
  );
}
