import { AdminApp } from "@/components/admin/AdminApp";
import { LoginForm } from "@/components/admin/LoginForm";
import { adminConfigured, getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) return <LoginForm configured={adminConfigured()} />;
  return <AdminApp />;
}
