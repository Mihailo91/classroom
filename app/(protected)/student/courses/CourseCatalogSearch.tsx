"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState } from "react";

export default function CourseCatalogSearch({
  defaultSearch,
}: {
  defaultSearch: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultSearch);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      const params = new URLSearchParams();
      if (value) params.set("search", value);
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search courses..."
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Searching..." : "Search"}
      </button>
      {defaultSearch && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            router.push(pathname);
          }}
          className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-100 transition-colors"
        >
          Clear
        </button>
      )}
    </form>
  );
}
