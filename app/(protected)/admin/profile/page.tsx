import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileForm from "../../student/profile/ProfileForm";

export default async function AdminProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information</p>
      </div>

      <ProfileForm user={session.user} />
    </main>
  );
}
