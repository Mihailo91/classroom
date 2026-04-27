"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteLessonButtonProps = {
  lessonId: string;
};

export function DeleteLessonButton({ lessonId }: DeleteLessonButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to cancel this lesson?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/group-lessons/${lessonId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete lesson");
      }

      router.refresh();
    } catch (error) {
      alert("Failed to cancel lesson");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {loading ? "Canceling..." : "Cancel"}
    </button>
  );
}
