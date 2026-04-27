"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function CartPageClient() {
  const { items, total, removeItem, clearCart } = useCart();

  const videoCourses = items.filter((i) => i.type === "video");
  const groupCourses = items.filter((i) => i.type === "group");

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Your Cart</h1>
            <p className="text-sm text-gray-500 mt-1">
              {items.length} item{items.length !== 1 ? "s" : ""}
              {videoCourses.length > 0 && groupCourses.length > 0 && 
                ` (${videoCourses.length} video, ${groupCourses.length} group)`
              }
            </p>
          </div>
          <Link
            href="/student/courses"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ← Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">🛒</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Your cart is empty
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Browse available courses and add them to your cart
            </p>
            <Link
              href="/student/courses"
              className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Video Courses */}
            {videoCourses.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Video Courses
                </h2>
                {videoCourses.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4"
                  >
                    {item.coverImageUrl ? (
                      <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        className="h-16 w-24 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-24 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                        <span className="text-2xl">📚</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Lifetime access</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-base font-bold text-gray-900">
                        €{item.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-sm text-red-500 hover:text-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Group Courses */}
            {groupCourses.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Group Courses
                </h2>
                {groupCourses.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4"
                  >
                    <div className="h-16 w-24 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shrink-0">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.teacherName && `Teacher: ${item.teacherName}`}
                        {item.minStudents && item.maxStudents && 
                          ` • ${item.minStudents}-${item.maxStudents} students`
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-base font-bold text-gray-900">
                        €{item.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-sm text-red-500 hover:text-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}</div>
            )}

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span>
                <span>€{total.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-gray-900 mb-6">
                <span>Total</span>
                <span>€{total.toFixed(2)}</span>
              </div>

              <Link
                href="/student/checkout"
                className="block w-full text-center bg-blue-600 text-white font-semibold rounded-xl py-3 hover:bg-blue-700 transition-colors"
              >
                Proceed to Checkout →
              </Link>
              <button
                onClick={clearCart}
                className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear cart
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
