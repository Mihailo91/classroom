import { prisma } from "./prisma";

/**
 * Check if a student has access to a course
 * @param userId - The user ID to check
 * @param courseId - The course ID to check
 * @returns true if the user owns the course, false otherwise
 */
export async function hasAccess(userId: string, courseId: string): Promise<boolean> {
  const studentCourse = await prisma.studentCourse.findUnique({
    where: {
      studentId_courseId: {
        studentId: userId,
        courseId: courseId,
      },
    },
  });

  if (!studentCourse) {
    return false;
  }

  // Check if course has expired
  if (studentCourse.expiresAt && studentCourse.expiresAt < new Date()) {
    return false;
  }

  return true;
}

/**
 * Check if a lesson is a preview lesson (publicly accessible)
 * @param lessonId - The lesson ID to check
 * @returns true if the lesson is a preview, false otherwise
 */
export async function isPreviewLesson(lessonId: string): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { isPreview: true },
  });

  return lesson?.isPreview || false;
}

/**
 * Get all courses owned by a student
 * @param userId - The user ID
 * @returns Array of courses with ownership details
 */
export async function getStudentCourses(userId: string) {
  const studentCourses = await prisma.studentCourse.findMany({
    where: {
      studentId: userId,
    },
    include: {
      course: {
        include: {
          _count: {
            select: {
              modules: true,
            },
          },
        },
      },
    },
    orderBy: {
      purchasedAt: "desc",
    },
  });

  return studentCourses.map((sc) => ({
    ...sc.course,
    purchasedAt: sc.purchasedAt,
    expiresAt: sc.expiresAt,
    isExpired: sc.expiresAt ? sc.expiresAt < new Date() : false,
  }));
}

/**
 * Grant course ownership to a student
 * @param studentId - The student user ID
 * @param courseId - The course ID
 * @param expiresAt - Optional expiration date (null for lifetime access)
 * @returns The created StudentCourse record
 */
export async function grantCourseAccess(
  studentId: string,
  courseId: string,
  expiresAt: Date | null = null
) {
  // Check if already exists
  const existing = await prisma.studentCourse.findUnique({
    where: {
      studentId_courseId: {
        studentId,
        courseId,
      },
    },
  });

  if (existing) {
    return existing;
  }

  return await prisma.studentCourse.create({
    data: {
      studentId,
      courseId,
      expiresAt,
    },
  });
}

/**
 * Check if a user can access a specific lesson
 * @param userId - The user ID
 * @param lessonId - The lesson ID
 * @returns Object with access status and reason
 */
export async function canAccessLesson(userId: string | null, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!lesson) {
    return { hasAccess: false, reason: "Lesson not found" };
  }

  // Check if lesson is a preview (public access)
  if (lesson.isPreview) {
    return { hasAccess: true, reason: "Preview lesson", lesson };
  }

  // User must be authenticated for non-preview lessons
  if (!userId) {
    return { hasAccess: false, reason: "Authentication required", lesson };
  }

  // Check if user owns the course
  const ownsCourse = await hasAccess(userId, lesson.module.course.id);
  
  if (ownsCourse) {
    return { hasAccess: true, reason: "Course owned", lesson };
  }

  return { hasAccess: false, reason: "Course not owned", lesson };
}
