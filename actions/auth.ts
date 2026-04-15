"use server";

import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import bcrypt from "bcryptjs";

export async function register(data: {
  name: string;
  email: string;
  password: string;
}) {
  const passwordHash = await bcrypt.hash(data.password, 12);
  try {
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
    });
  } catch (error) {
    // P2002 = unique constraint violation (email already taken)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      throw new Error("Email already registered");
    }
    throw error;
  }
}

export async function loginAction(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
    return null;
  } catch (error) {
    if (isRedirectError(error)) throw error; // Let Next.js handle navigation
    if (error instanceof AuthError) return "Invalid email or password";
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
