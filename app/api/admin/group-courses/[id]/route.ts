import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";

/**
 * GET /api/admin/group-courses/[id]
 * Get single group course with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const course = await prisma.groupCourse.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lessons: {
          orderBy: { scheduledAt: "asc" },
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Group course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Error fetching group course:", error);
    return NextResponse.json(
      { error: "Failed to fetch group course" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/group-courses/[id]
 * Update group course details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { title, description, teacherId, minStudents, maxStudents, price, status } = body;

    // Check if course exists
    const existingCourse = await prisma.groupCourse.findUnique({
      where: { id },
      select: { id: true, minStudents: true, maxStudents: true },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Group course not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (status !== undefined) updateData.status = status;

    // Validate and update teacher
    if (teacherId !== undefined) {
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

      updateData.teacherId = teacherId;
    }

    // Validate min/max students
    if (minStudents !== undefined || maxStudents !== undefined) {
      const currentMin = minStudents !== undefined ? minStudents : existingCourse.minStudents;
      const currentMax = maxStudents !== undefined ? maxStudents : existingCourse.maxStudents;

      if (typeof currentMin !== "number" || typeof currentMax !== "number") {
        return NextResponse.json(
          { error: "Min and max students must be numbers" },
          { status: 400 }
        );
      }

      if (currentMin < 1 || currentMax < 1) {
        return NextResponse.json(
          { error: "Min and max students must be at least 1" },
          { status: 400 }
        );
      }

      if (currentMax < currentMin) {
        return NextResponse.json(
          { error: "Max students must be greater than or equal to min students" },
          { status: 400 }
        );
      }

      if (minStudents !== undefined) updateData.minStudents = minStudents;
      if (maxStudents !== undefined) updateData.maxStudents = maxStudents;
    }

    // Validate price
    if (price !== undefined) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || !isFinite(priceNum) || priceNum < 0 || priceNum > 99999999.99) {
        return NextResponse.json(
          { error: "Price must be a valid number between 0 and 99,999,999.99" },
          { status: 400 }
        );
      }
      updateData.price = priceNum;
    }

    // Update course
    const course = await prisma.groupCourse.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Error updating group course:", error);
    return NextResponse.json(
      { error: "Failed to update group course" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/group-courses/[id]
 * Delete a group course
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    // Check if course exists
    const course = await prisma.groupCourse.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Group course not found" },
        { status: 404 }
      );
    }

    // Delete course (cascade will delete lessons and enrollments)
    await prisma.groupCourse.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Group course deleted successfully" });
  } catch (error) {
    console.error("Error deleting group course:", error);
    return NextResponse.json(
      { error: "Failed to delete group course" },
      { status: 500 }
    );
  }
}
