"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutPageClient({ userId }: { userId: string }) {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <Link
            href="/student/courses"
            className="text-blue-600 text-sm hover:underline"
          >
            Browse courses →
          </Link>
        </div>
      </main>
    );
  }

  // Test purchase handler — will be replaced with PayPal in Phase 5
  const handleTestPurchase = async () => {
    setLoading(true);
    setError("");

    try {
      await Promise.all(
        items.map((item) =>
          fetch("/api/test/purchase-course", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId: item.courseId }),
          }).then((r) => {
            if (!r.ok) throw new Error(`Failed to purchase ${item.title}`);
          })
        )
      );

      clearCart();
      router.push("/student/my-courses?purchased=true");
    } catch (err: any) {
      setError(err.message || "Purchase failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>
            <p className="text-sm text-gray-500 mt-1">Review your order</p>
          </div>
          <Link
            href="/student/cart"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ← Edit Cart
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3 divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.courseId} className="flex justify-between pt-3 first:pt-0">
                <span className="text-sm text-gray-700">{item.title}</span>
                <span className="text-sm font-medium text-gray-900">
                  €{item.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>€{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment — placeholder for Phase 5 PayPal integration */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-2">Payment</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            💳 PayPal integration coming in Phase 5.
            Use the test button below to simulate a purchase during development.
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleTestPurchase}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold rounded-xl py-4 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
        >
          {loading ? "Processing..." : `Complete Purchase — €${total.toFixed(2)}`}
        </button>
        <p className="text-xs text-gray-400 text-center mt-3">
          🔒 Test mode — no real payment processed
        </p>
      </div>
    </main>
  );
}
