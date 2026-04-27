import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RoleSidebar } from "@/components/RoleSidebar";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <RoleSidebar role="student" userName={session.user.name || "Student"}>
      {children}
    </RoleSidebar>
  );
}
