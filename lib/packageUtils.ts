import { PackageType } from "@prisma/client";

export function getLessonsIncluded(packageType: PackageType): number {
  switch (packageType) {
    case PackageType.SINGLE:
      return 1;
    case PackageType.STARTER:
      return 4;
    case PackageType.STANDARD:
      return 8;
    case PackageType.PREMIUM:
      return 12;
  }
}

export function getExpiresAt(packageType: PackageType): Date | null {
  const now = new Date();
  switch (packageType) {
    case PackageType.SINGLE:
      return null;
    case PackageType.STARTER:
      return new Date(new Date(now).setMonth(now.getMonth() + 2));
    case PackageType.STANDARD:
      return new Date(new Date(now).setMonth(now.getMonth() + 4));
    case PackageType.PREMIUM:
      return new Date(new Date(now).setMonth(now.getMonth() + 6));
  }
}
