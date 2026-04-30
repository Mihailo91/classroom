import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ManualPaymentForm from "./ManualPaymentForm";

export default async function ManualPaymentPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Fetch students
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  // Fetch group courses
  const groupCourses = await prisma.groupCourse.findMany({
    select: {
      id: true,
      title: true,
      price: true,
      teacher: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { title: "asc" },
  });

  // Convert Decimal to number for client component
  const serializedCourses = groupCourses.map(course => ({
    ...course,
    price: Number(course.price),
  }));

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Record Manual Payment
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Record a bank transfer payment for a group course enrollment
          </p>
        </div>

        <ManualPaymentForm students={students} groupCourses={serializedCourses} />
      </div>
    </main>
  );
}
