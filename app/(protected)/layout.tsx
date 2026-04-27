import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CartProvider } from "@/lib/cart-context";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  return <CartProvider>{children}</CartProvider>;
}
