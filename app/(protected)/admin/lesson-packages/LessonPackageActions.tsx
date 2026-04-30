"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toggleLessonPackageActive } from "@/lib/actions/lessonPackages";

export function LessonPackageActions({
  packageId,
  isActive,
}: {
  packageId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleLessonPackageActive(packageId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`text-sm font-medium disabled:opacity-50 ${
        isActive
          ? "text-red-600 hover:underline"
          : "text-green-600 hover:underline"
      }`}
    >
      {isPending ? "..." : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
