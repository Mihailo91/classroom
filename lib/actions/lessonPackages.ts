"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PackageType } from "@prisma/client";
import { getLessonsIncluded } from "@/lib/packageUtils";

export async function listLessonPackages() {
  return prisma.lessonPackage.findMany({
    include: { teacher: { select: { id: true, name: true, email: true } } },
    orderBy: [{ teacher: { name: "asc" } }, { packageType: "asc" }],
  });
}

export async function listActiveLessonPackages() {
  return prisma.lessonPackage.findMany({
    where: { isActive: true },
    include: { teacher: { select: { id: true, name: true, email: true } } },
    orderBy: [{ teacher: { name: "asc" } }, { packageType: "asc" }],
  });
}

export async function createLessonPackage(data: {
  teacherId: string;
  packageType: PackageType;
  price: number;
  description?: string;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  const lessonsIncluded = getLessonsIncluded(data.packageType);

  const pkg = await prisma.lessonPackage.create({
    data: {
      teacherId: data.teacherId,
      packageType: data.packageType,
      lessonsIncluded,
      price: data.price,
      description: data.description ?? null,
      isActive: true,
    },
  });

  revalidatePath("/admin/lesson-packages");
  return pkg;
}

export async function updateLessonPackage(
  id: string,
  data: { price?: number; description?: string }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  const pkg = await prisma.lessonPackage.update({
    where: { id },
    data: {
      ...(data.price !== undefined && { price: data.price }),
      ...(data.description !== undefined && { description: data.description }),
    },
  });

  revalidatePath("/admin/lesson-packages");
  return pkg;
}

export async function toggleLessonPackageActive(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  const current = await prisma.lessonPackage.findUniqueOrThrow({ where: { id } });

  const pkg = await prisma.lessonPackage.update({
    where: { id },
    data: { isActive: !current.isActive },
  });

  revalidatePath("/admin/lesson-packages");
  return pkg;
}

export async function getLessonPackageById(id: string) {
  return prisma.lessonPackage.findUnique({
    where: { id },
    include: { teacher: { select: { id: true, name: true, email: true } } },
  });
}
