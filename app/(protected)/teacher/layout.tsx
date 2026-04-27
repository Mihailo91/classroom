import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RoleSidebar } from "@/components/RoleSidebar";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") redirect("/");

  return (
    <RoleSidebar role="teacher" userName={session.user.name || "Teacher"}>
      {children}
    </RoleSidebar>
  );
}
