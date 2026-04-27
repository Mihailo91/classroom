import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CheckoutPageClient from "./CheckoutPageClient";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <CheckoutPageClient userId={session.user.id!} />;
}
