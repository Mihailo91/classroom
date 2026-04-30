"use client";

import { useCart } from "@/lib/cart-context";
import { useRouter } from "next/navigation";

type LessonPackage = {
  id: string;
  packageType: string;
  lessonsIncluded: number;
  price: { toString(): string };
  description: string | null;
  teacher: { id: string; name: string; email: string };
};

const PACKAGE_LABELS: Record<string, { name: string; icon: string; validity: string }> = {
  SINGLE: { name: "Single Lesson", icon: "🎯", validity: "No expiry" },
  STARTER: { name: "Starter Pack", icon: "⭐", validity: "2 months" },
  STANDARD: { name: "Standard Pack", icon: "🌟", validity: "4 months" },
  PREMIUM: { name: "Premium Pack", icon: "💎", validity: "6 months" },
};

export default function PackageCatalogClient({
  packages,
}: {
  packages: LessonPackage[];
}) {
  const { addItem, hasItem } = useCart();
  const router = useRouter();

  // Group packages by teacher
  const byTeacher = packages.reduce<Record<string, LessonPackage[]>>(
    (acc, pkg) => {
      const key = pkg.teacher.id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(pkg);
      return acc;
    },
    {}
  );

  function handleAddToCart(pkg: LessonPackage) {
    const meta = PACKAGE_LABELS[pkg.packageType] ?? {
      name: pkg.packageType,
      icon: "📦",
      validity: "",
    };
    addItem({
      id: pkg.id,
      type: "package",
      title: `${meta.name} — ${pkg.teacher.name}`,
      price: Number(pkg.price),
    });
    router.push("/student/cart");
  }

  return (
    <div className="space-y-10">
      {Object.values(byTeacher).map((teacherPackages) => {
        const teacher = teacherPackages[0].teacher;
        return (
          <div key={teacher.id}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {teacher.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {teacherPackages.map((pkg) => {
                const meta = PACKAGE_LABELS[pkg.packageType] ?? {
                  name: pkg.packageType,
                  icon: "📦",
                  validity: "",
                };
                const inCart = hasItem(pkg.id);

                return (
                  <div
                    key={pkg.id}
                    className="bg-white rounded-2xl shadow p-6 flex flex-col"
                  >
                    <div className="text-3xl mb-3">{meta.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-1">{meta.name}</h3>
                    <p className="text-2xl font-bold text-blue-600 mb-1">
                      €{Number(pkg.price).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mb-1">
                      {pkg.lessonsIncluded} {pkg.lessonsIncluded === 1 ? "lesson" : "lessons"}
                    </p>
                    <p className="text-xs text-gray-400 mb-3">Valid for: {meta.validity}</p>
                    {pkg.description && (
                      <p className="text-sm text-gray-600 mb-4 flex-1">{pkg.description}</p>
                    )}
                    <button
                      onClick={() => handleAddToCart(pkg)}
                      disabled={inCart}
                      className={`mt-auto w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                        inCart
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {inCart ? "In Cart ✓" : "Add to Cart"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
