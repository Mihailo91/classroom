import { PrismaClient, Role, GroupCourseStatus, PackageType, PackageSource } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Fix user roles ─────────────────────────────────────────────────────────
  const [admin, teacher, student] = await Promise.all([
    prisma.user.update({
      where: { email: "admin@gmail.com" },
      data: { role: Role.ADMIN, name: "Admin User" },
    }),
    prisma.user.update({
      where: { email: "teacher@gmail.com" },
      data: { role: Role.TEACHER, name: "James Carter" },
    }),
    prisma.user.update({
      where: { email: "student@gmail.com" },
      data: { role: Role.STUDENT, name: "Marko Nikolić" },
    }),
  ]);

  console.log("✔ Roles updated:", admin.role, teacher.role, student.role);

  // ── Video Course ───────────────────────────────────────────────────────────
  const course = await prisma.course.create({
    data: {
      title: "English for Beginners A1–A2",
      description:
        "A comprehensive video course covering foundational English grammar, vocabulary, and everyday conversations for complete beginners.",
      price: 49.99,
      isPublished: true,
      createdById: teacher.id,
      modules: {
        create: [
          {
            title: "Greetings & Introductions",
            order: 1,
            lessons: {
              create: [
                {
                  title: "Hello & Goodbye",
                  vimeoId: "111111001",
                  durationMinutes: 8,
                  isPreview: true,
                  order: 1,
                },
                {
                  title: "Introducing Yourself",
                  vimeoId: "111111002",
                  durationMinutes: 10,
                  order: 2,
                },
                {
                  title: "Asking Someone's Name",
                  vimeoId: "111111003",
                  durationMinutes: 9,
                  order: 3,
                },
              ],
            },
          },
          {
            title: "Numbers & Dates",
            order: 2,
            lessons: {
              create: [
                {
                  title: "Counting 1–100",
                  vimeoId: "111111004",
                  durationMinutes: 12,
                  isPreview: true,
                  order: 1,
                },
                {
                  title: "Days of the Week",
                  vimeoId: "111111005",
                  durationMinutes: 8,
                  order: 2,
                },
                {
                  title: "Months & Seasons",
                  vimeoId: "111111006",
                  durationMinutes: 10,
                  order: 3,
                },
              ],
            },
          },
          {
            title: "Everyday Conversations",
            order: 3,
            lessons: {
              create: [
                {
                  title: "At the Coffee Shop",
                  vimeoId: "111111007",
                  durationMinutes: 14,
                  order: 1,
                },
                {
                  title: "Asking for Directions",
                  vimeoId: "111111008",
                  durationMinutes: 11,
                  order: 2,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("✔ Course created:", course.title);

  // Student purchases the course
  await prisma.studentCourse.create({
    data: { studentId: student.id, courseId: course.id },
  });

  console.log("✔ Student enrolled in video course");

  // ── Group Course ───────────────────────────────────────────────────────────
  const now = new Date();
  const groupCourse = await prisma.groupCourse.create({
    data: {
      title: "Conversational English B1 — Morning Group",
      description: "Live group sessions focused on fluency, speaking confidence, and real-life English scenarios.",
      teacherId: teacher.id,
      minStudents: 3,
      maxStudents: 8,
      price: 120.0,
      status: GroupCourseStatus.ACTIVE,
      lessons: {
        create: [
          {
            teacherId: teacher.id,
            scheduledAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
            durationMin: 50,
            isHeld: true,
            notes: "Reviewed past simple tense. Students practiced storytelling.",
            presentStudents: [student.id],
          },
          {
            teacherId: teacher.id,
            scheduledAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
            durationMin: 50,
            isHeld: true,
            notes: "Focused on question formation and active listening exercises.",
            presentStudents: [student.id],
          },
          {
            teacherId: teacher.id,
            scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // next week
            durationMin: 50,
            isHeld: false,
          },
          {
            teacherId: teacher.id,
            scheduledAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
            durationMin: 50,
            isHeld: false,
          },
        ],
      },
    },
  });

  console.log("✔ Group course created:", groupCourse.title);

  // Enroll student in group course
  await prisma.groupEnrollment.create({
    data: {
      studentId: student.id,
      courseId: groupCourse.id,
      paymentMethod: "paypal",
      amountPaid: 120.0,
      paymentDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      payerName: "Marko Nikolić",
    },
  });

  console.log("✔ Student enrolled in group course");

  // ── Lesson Packages (catalog) ──────────────────────────────────────────────
  const [pkgSingle, pkgStarter, pkgStandard, pkgPremium] = await Promise.all([
    prisma.lessonPackage.create({
      data: {
        teacherId: teacher.id,
        packageType: PackageType.SINGLE,
        lessonsIncluded: 1,
        price: 18.0,
        description: "One-off 1-on-1 lesson with Ana. Great for a trial session.",
        isActive: true,
      },
    }),
    prisma.lessonPackage.create({
      data: {
        teacherId: teacher.id,
        packageType: PackageType.STARTER,
        lessonsIncluded: 4,
        price: 64.0,
        description: "4 private lessons — perfect for short-term goals.",
        isActive: true,
      },
    }),
    prisma.lessonPackage.create({
      data: {
        teacherId: teacher.id,
        packageType: PackageType.STANDARD,
        lessonsIncluded: 8,
        price: 120.0,
        description: "8 private lessons — our most popular package.",
        isActive: true,
      },
    }),
    prisma.lessonPackage.create({
      data: {
        teacherId: teacher.id,
        packageType: PackageType.PREMIUM,
        lessonsIncluded: 12,
        price: 168.0,
        description: "12 private lessons — best value for committed learners.",
        isActive: true,
      },
    }),
  ]);

  console.log("✔ Lesson packages created");

  // ── Transaction + Student Package ─────────────────────────────────────────
  const transaction = await prisma.transaction.create({
    data: {
      userId: student.id,
      paypalOrderId: "PAYPAL-MOCK-ORDER-001",
      grossAmount: 120.0,
      discountAmount: 0,
      netAmount: 120.0,
      status: "COMPLETED",
      completedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      studentPackages: {
        create: {
          studentId: student.id,
          teacherId: teacher.id,
          sourceLessonPackageId: pkgStandard.id,
          packageType: PackageType.STANDARD,
          lessonsTotal: 8,
          lessonsUsed: 2,
          status: "ACTIVE",
          source: PackageSource.PAYPAL,
          purchasedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  console.log("✔ Transaction + StudentPackage created");

  // ── Coupon ────────────────────────────────────────────────────────────────
  await prisma.coupon.create({
    data: {
      code: "WELCOME20",
      discountType: "PERCENTAGE",
      discountValue: 20,
      applicableTo: ["LESSON_PACKAGE", "VIDEO_COURSE", "GROUP_COURSE"],
      validFrom: new Date("2026-01-01"),
      validUntil: new Date("2026-12-31"),
      maxUses: 100,
      maxUsesPerUser: 1,
      isActive: true,
    },
  });

  console.log("✔ Coupon WELCOME20 created");

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
