import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { logoutAction } from "../actions";
import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <AdminThemeProvider
      userEmail={session.user?.email}
      userName={session.user?.name}
      logoutAction={logoutAction}
    >
      {children}
    </AdminThemeProvider>
  );
}
