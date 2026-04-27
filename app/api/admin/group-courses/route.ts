import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

/**
 * GET /api/admin/group-courses
 * List all group courses with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const teacherId = searchParams.get("teacherId");

    const where: any = {};
    if (status) where.status = status;
    if (teacherId) where.teacherId = teacherId;

    const courses = await prisma.groupCourse.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            lessons: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error fetching group courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch group courses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/group-courses
 * Create a new group course
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { title, description, teacherId, minStudents, maxStudents, price } = body;

    // Validation
    if (!title || !teacherId || !minStudents || !maxStudents || price == null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate min/max students
    if (typeof minStudents !== "number" || typeof maxStudents !== "number") {
      return NextResponse.json(
        { error: "Min and max students must be numbers" },
        { status: 400 }
      );
    }

    if (minStudents < 1 || maxStudents < 1) {
      return NextResponse.json(
        { error: "Min and max students must be at least 1" },
        { status: 400 }
      );
    }

    if (maxStudents < minStudents) {
      return NextResponse.json(
        { error: "Max students must be greater than or equal to min students" },
        { status: 400 }
      );
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || !isFinite(priceNum) || priceNum < 0 || priceNum > 99999999.99) {
      return NextResponse.json(
        { error: "Price must be a valid number between 0 and 99,999,999.99" },
        { status: 400 }
      );
    }

    // Verify teacher exists and has TEACHER or ADMIN role
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { role: true },
    });

    if (!teacher || (teacher.role !== "TEACHER" && teacher.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Invalid teacher ID or user is not a teacher" },
        { status: 400 }
      );
    }

    // Create course
    const course = await prisma.groupCourse.create({
      data: {
        title,
        description: description || null,
        teacherId,
        minStudents,
        maxStudents,
        price: priceNum,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("Error creating group course:", error);
    return NextResponse.json(
      { error: "Failed to create group course" },
      { status: 500 }
    );
  }
}
