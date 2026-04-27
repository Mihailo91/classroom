"use client";

import { useCart, CartItem } from "@/lib/cart-context";
import Link from "next/link";

export function AddToCartButton({ item }: { item: CartItem }) {
  const { addItem, hasItem } = useCart();
  const inCart = hasItem(item.id);

  if (inCart) {
    return (
      <Link
        href="/student/cart"
        className="block w-full text-center border-2 border-blue-600 text-blue-600 font-semibold rounded-xl py-3 hover:bg-blue-50 transition-colors"
      >
        View in Cart →
      </Link>
    );
  }

  return (
    <button
      onClick={() => addItem(item)}
      className="w-full bg-gray-900 text-white font-semibold rounded-xl py-3 hover:bg-gray-700 transition-colors"
    >
      Add to Cart 🛒
    </button>
  );
}

export function CartBadge() {
  const { count } = useCart();

  return (
    <Link
      href="/student/cart"
      className="relative inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
    >
      <span className="text-xl">🛒</span>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full">
          {count}
        </span>
      )}
    </Link>
  );
}
