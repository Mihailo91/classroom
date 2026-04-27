import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RoleSidebar } from "@/components/RoleSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <RoleSidebar role="admin" userName={session.user.name || "Admin"}>
      {children}
    </RoleSidebar>
  );
}
