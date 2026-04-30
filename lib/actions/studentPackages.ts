"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { StudentPackageStatus } from "@prisma/client";

export async function getMyPackages() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.studentPackage.findMany({
    where: { studentId: session.user.id },
    include: {
      teacher: { select: { id: true, name: true } },
      sourceLessonPackage: true,
    },
    orderBy: { purchasedAt: "desc" },
  });
}

export async function getActivePackages(studentId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const targetId = studentId ?? session.user.id;

  // Only admin can query other students
  if (targetId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const now = new Date();

  return prisma.studentPackage.findMany({
    where: {
      studentId: targetId,
      status: StudentPackageStatus.ACTIVE,
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
    include: {
      teacher: { select: { id: true, name: true } },
    },
    orderBy: [{ expiresAt: "asc" }, { purchasedAt: "asc" }],
  });
}

export async function getPackageSummary(studentId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const targetId = studentId ?? session.user.id;

  if (targetId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const now = new Date();

  const activePackages = await prisma.studentPackage.findMany({
    where: {
      studentId: targetId,
      status: StudentPackageStatus.ACTIVE,
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
    select: { lessonsTotal: true, lessonsUsed: true },
  });

  const totalActive = activePackages.length;
  const totalRemaining = activePackages.reduce(
    (sum, pkg) => sum + (pkg.lessonsTotal - pkg.lessonsUsed),
    0
  );

  return { totalActive, totalRemaining };
}
