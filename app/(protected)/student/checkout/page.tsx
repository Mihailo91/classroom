import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CheckoutPageClient from "./CheckoutPageClient";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const paypalClientId = process.env.PAYPAL_CLIENT_ID;
  if (!paypalClientId) {
    throw new Error("PAYPAL_CLIENT_ID is not configured. Check .env.local");
  }

  return (
    <CheckoutPageClient
      userId={session.user.id!}
      paypalClientId={paypalClientId}
    />
  );
}
