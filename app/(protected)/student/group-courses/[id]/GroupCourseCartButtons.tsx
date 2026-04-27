"use client";

import { useCart, CartItem } from "@/lib/cart-context";
import Link from "next/link";

type GroupCourseCartButtonsProps = {
  course: {
    id: string;
    title: string;
    price: number;
    teacherName: string;
    minStudents: number;
    maxStudents: number;
    isFull: boolean;
    isEnrolled: boolean;
  };
};

export function GroupCourseCartButtons({ course }: GroupCourseCartButtonsProps) {
  const { addItem, hasItem } = useCart();
  const inCart = hasItem(course.id);

  if (course.isFull) {
    return (
      <div className="flex-1 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        This course is full. No spots available.
      </div>
    );
  }

  const cartItem: CartItem = {
    id: course.id,
    type: "group",
    title: course.title,
    price: course.price,
    teacherName: course.teacherName,
    minStudents: course.minStudents,
    maxStudents: course.maxStudents,
  };

  return (
    <div className="flex items-center gap-3">
      {inCart ? (
        <Link
          href="/student/cart"
          className="flex-1 border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors text-center"
        >
          View in Cart →
        </Link>
      ) : (
        <button
          onClick={() => addItem(cartItem)}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Add to Cart
        </button>
      )}
      <Link
        href={`/student/group-courses/${course.id}/checkout`}
        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
      >
        Enroll Now
      </Link>
    </div>
  );
}
