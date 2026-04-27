import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CartPageClient from "./CartPageClient";

export default async function CartPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <CartPageClient />;
}
