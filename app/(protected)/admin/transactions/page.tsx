import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TransactionsClient from "./TransactionsClient";

export default async function AdminTransactionsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Fetch all transactions with user info
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Calculate summary stats
  const completedTransactions = transactions.filter((t) => t.status === "COMPLETED");
  const totalRevenue = completedTransactions.reduce(
    (sum, t) => sum + Number(t.netAmount),
    0
  );

  const statusCounts = {
    COMPLETED: transactions.filter((t) => t.status === "COMPLETED").length,
    PENDING: transactions.filter((t) => t.status === "PENDING").length,
    FAILED: transactions.filter((t) => t.status === "FAILED").length,
    REFUNDED: transactions.filter((t) => t.status === "REFUNDED").length,
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            All Transactions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and monitor payment transactions
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              €{totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {statusCounts.COMPLETED}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {statusCounts.PENDING}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Failed</p>
            <p className="text-2xl font-bold text-red-600">
              {statusCounts.FAILED}
            </p>
          </div>
        </div>

        <TransactionsClient initialTransactions={transactions} />
      </div>
    </main>
  );
}
