import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/courses
 * List all courses with optional filters
 */
export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const isPublished = searchParams.get("published");
    
    const skip = (page - 1) * limit;

    const where: any = {};
    if (isPublished !== null && isPublished !== undefined) {
      where.isPublished = isPublished === "true";
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              modules: true,
              studentCourses: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/courses
 * Create a new course
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { title, description, coverImageUrl, price, isPublished } = body;

    // Basic validation
    if (!title || !description || price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, price" },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return NextResponse.json(
        { error: "Price must be a positive number" },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        coverImageUrl: coverImageUrl || null,
        price: parseFloat(price),
        isPublished: isPublished || false,
        createdById: user.id!,
      },
      include: {
        createdBy: {
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
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
