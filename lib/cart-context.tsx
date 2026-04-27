"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

export type CartItem = {
  courseId: string;
  title: string;
  price: number;
  coverImageUrl: string | null;
};

type CartContextType = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (courseId: string) => void;
  hasItem: (courseId: string) => boolean;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "classroom_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) =>
      prev.find((i) => i.courseId === item.courseId) ? prev : [...prev, item]
    );
  }, []);

  const removeItem = useCallback((courseId: string) => {
    setItems((prev) => prev.filter((i) => i.courseId !== courseId));
  }, []);

  const hasItem = useCallback(
    (courseId: string) => items.some((i) => i.courseId === courseId),
    [items]
  );

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.price, 0);

  return (
    <CartContext.Provider
      value={{ items, count: items.length, total, addItem, removeItem, hasItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
