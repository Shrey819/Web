import { requireAdmin, AuthError } from "@/lib/auth-checks";
import { redirect } from "next/navigation";
import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (err: any) {
    if (err instanceof AuthError && err.statusCode === 403) {
      redirect("/admin/login?error=AccessDenied");
    }
    redirect("/admin/login");
  }

  return (
    <AdminThemeProvider
      userEmail={admin.email}
      userName={admin.name}
    >
      {children}
    </AdminThemeProvider>
  );
}
