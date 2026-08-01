import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, LayoutDashboard, FolderTree, Users, LogOut, Settings } from "lucide-react";
import { logoutAction } from "../actions";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans text-slate-300">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed inset-y-0 z-50">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-950 font-mono shadow-lg shadow-amber-500/20">
            OM
          </div>
          <span className="font-bold text-white tracking-wide type-label font-mono">OM AUTOMATION</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 mt-2 px-3">Catalog Management</div>
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            <LayoutDashboard className="w-4 h-4 text-sky-400" />
            Overview
          </Link>
          <Link href="/admin/products" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            <Package className="w-4 h-4 text-emerald-400" />
            Products
          </Link>
          <Link href="/admin/categories" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            <FolderTree className="w-4 h-4 text-amber-400" />
            Categories
          </Link>
          
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 mt-8 px-3">System</div>
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            <Users className="w-4 h-4 text-indigo-400" />
            Users
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            <Settings className="w-4 h-4 text-slate-400" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">
              {session.user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session.user?.name || "Admin User"}</p>
              <p className="text-xs text-slate-500 truncate">{session.user?.email}</p>
            </div>
          </div>
          
          <form action={logoutAction}>
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors border border-rose-500/0 hover:border-rose-500/20">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen relative">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
