import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { Role, UserStatus } from "@prisma/client";

/**
 * PUT /api/admin/users/[id]
 * Update user role or status (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: currentUser, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const { role, status } = body;

    // Validate inputs
    if (role && !Object.values(Role).includes(role)) {
      return NextResponse.json(
        { error: "Invalid role specified" },
        { status: 400 }
      );
    }

    if (status && !Object.values(UserStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status specified" },
        { status: 400 }
      );
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, status: true, name: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admin from demoting themselves
    if (id === currentUser.id && role && role !== "ADMIN") {
      return NextResponse.json(
        { error: "You cannot change your own admin role" },
        { status: 403 }
      );
    }

    // Prevent admin from deactivating themselves
    if (id === currentUser.id && status && status !== "ACTIVE") {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user (Admin only) - soft delete by setting status to INACTIVE
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: currentUser, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    // Prevent admin from deleting themselves
    if (id === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Soft delete: set status to INACTIVE
    await prisma.user.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
