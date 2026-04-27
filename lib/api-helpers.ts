import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Get the current session and verify the user is authenticated
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null };
  }
  return { user: session.user as typeof session.user & { id: string }, error: null };
}

/**
 * Get the current session and verify the user is an admin
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null };
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 }), user: null };
  }
  return { user: session.user as typeof session.user & { id: string }, error: null };
}

/**
 * Get the current session and verify the user is a teacher or admin
 */
export async function requireTeacherOrAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null };
  }
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden: Teacher or Admin access required" }, { status: 403 }), user: null };
  }
  return { user: session.user as typeof session.user & { id: string }, error: null };
}
