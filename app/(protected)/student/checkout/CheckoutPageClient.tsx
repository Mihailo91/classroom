"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutPageClient({
  userId,
  paypalClientId,
}: {
  userId: string;
  paypalClientId: string;
}) {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sdkReady, setSdkReady] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const buttonsRendered = useRef(false);

  // Load PayPal SDK script
  useEffect(() => {
    if (items.length === 0) return;
    if (document.getElementById("paypal-sdk")) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=EUR`;
    script.async = true;
    script.onload = () => setSdkReady(true);
    document.body.appendChild(script);
  }, [paypalClientId, items.length]);

  // Render PayPal buttons once SDK is ready
  useEffect(() => {
    if (!sdkReady || !paypalContainerRef.current || buttonsRendered.current) return;
    if (items.length === 0) return;

    const win = window as any;
    if (!win.paypal) return;

    buttonsRendered.current = true;

    win.paypal
      .Buttons({
        createOrder: async () => {
          const res = await fetch("/api/cart/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
          });
          if (!res.ok) throw new Error("Failed to create order");
          const data = await res.json();
          return data.paypalOrderId;
        },
        onApprove: async (data: any) => {
          setLoading(true);
          setError("");
          try {
            const res = await fetch("/api/cart/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paypalOrderId: data.orderID }),
            });
            if (!res.ok) throw new Error("Payment capture failed");
            const result = await res.json();
            clearCart();
            router.push(`/student/checkout/success?txn=${result.transactionId}`);
          } catch (err: any) {
            setError(err.message || "Payment failed. Please try again.");
            setLoading(false);
          }
        },
        onError: (err: any) => {
          console.error("PayPal error:", err);
          setError("Payment failed. Please try again.");
        },
        style: { layout: "vertical" },
      })
      .render(paypalContainerRef.current);
  }, [sdkReady, items, clearCart, router]);

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <Link href="/student/courses" className="text-blue-600 text-sm hover:underline">
            Browse courses →
          </Link>
        </div>
      </main>
    );
  }

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
              <div key={item.id} className="flex justify-between pt-3 first:pt-0">
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

        {/* Payment */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Payment</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="text-sm text-gray-600 mt-2">Processing payment...</p>
            </div>
          ) : (
            <div ref={paypalContainerRef} className="min-h-[150px]">
              {!sdkReady && (
                <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                  Loading payment options...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


