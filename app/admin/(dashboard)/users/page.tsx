import { query } from "@/lib/db";
import { auth } from "@/auth";
import { UserRowInteractive } from "@/components/admin/users/UserRowInteractive";
import { AddUserModal } from "@/components/admin/users/AddUserModal";
import { Users, Shield, ShieldAlert, UserCheck, Search, Filter } from "lucide-react";
import Link from "next/link";

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
  avatar: string | null;
  google_sub: string | null;
  given_name: string | null;
  family_name: string | null;
  locale: string | null;
  hasPassword: boolean;
  createdAt: Date;
  emailVerified: Date | null;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const search = params?.search || "";
  const roleFilter = params?.role || "";

  let users: UserRow[] = [];
  let stats = {
    total: 0,
    googleUsers: 0,
    admins: 0,
    catalogManagers: 0,
    customers: 0,
    verified: 0,
  };

  try {
    const whereClauses: string[] = [];
    const sqlParams: (string | number)[] = [];

    if (search) {
      sqlParams.push(`%${search}%`);
      whereClauses.push(`(name ILIKE $${sqlParams.length} OR email ILIKE $${sqlParams.length})`);
    }

    if (roleFilter) {
      if (roleFilter === "ADMIN") {
        whereClauses.push(`role IN ('ADMIN'::"Role", 'SUPER_ADMIN'::"Role")`);
      } else if (roleFilter === "GOOGLE") {
        whereClauses.push(`"google_sub" IS NOT NULL`);
      } else {
        sqlParams.push(roleFilter);
        whereClauses.push(`role = $${sqlParams.length}::"Role"`);
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const userRes = await query<UserRow>(
      `SELECT 
         id, 
         name, 
         email, 
         role, 
         image, 
         avatar, 
         google_sub, 
         given_name, 
         family_name, 
         locale, 
         (password IS NOT NULL) as "hasPassword", 
         "createdAt", 
         "emailVerified" 
       FROM "User" 
       ${whereSql} 
       ORDER BY "createdAt" DESC`,
      sqlParams
    );
    users = userRes.rows;

    const statsRes = await query<{
      total: number;
      googleUsers: number;
      admins: number;
      catalogManagers: number;
      customers: number;
      verified: number;
    }>(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN "google_sub" IS NOT NULL THEN 1 END)::int as "googleUsers",
        COUNT(CASE WHEN role IN ('ADMIN', 'SUPER_ADMIN') THEN 1 END)::int as admins,
        COUNT(CASE WHEN role = 'CATALOG_MANAGER' THEN 1 END)::int as "catalogManagers",
        COUNT(CASE WHEN role = 'CUSTOMER' THEN 1 END)::int as customers,
        COUNT(CASE WHEN "emailVerified" IS NOT NULL THEN 1 END)::int as verified
      FROM "User"
    `);
    if (statsRes.rows.length > 0) {
      stats = statsRes.rows[0];
    }
  } catch (error) {
    console.error("Failed to load users:", error);
  }

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "ADMIN":
        return "bg-sky-500/10 text-sky-400 border-sky-500/30";
      case "CATALOG_MANAGER":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System & Customer Accounts</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time directory of all registered customers, Google OAuth users, and administrator roles.
          </p>
        </div>

        <AddUserModal />
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">Total Accounts</span>
            <div className="text-2xl font-extrabold text-white font-mono">{stats.total}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">Google Users</span>
            <div className="text-2xl font-extrabold text-white font-mono">{stats.googleUsers}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">System Admins</span>
            <div className="text-2xl font-extrabold text-white font-mono">{stats.admins}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">Managers</span>
            <div className="text-2xl font-extrabold text-white font-mono">{stats.catalogManagers}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">Verified Accounts</span>
            <div className="text-2xl font-extrabold text-white font-mono">{stats.verified}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form method="GET" className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by name or email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto font-mono">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> FILTER:
          </span>
          <Link
            href={`/admin/users${search ? `?search=${search}` : ""}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              !roleFilter ? "bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-sm" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            All ({stats.total})
          </Link>
          <Link
            href={`/admin/users?role=GOOGLE${search ? `&search=${search}` : ""}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
              roleFilter === "GOOGLE" ? "bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-sm" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <span>Google ({stats.googleUsers})</span>
          </Link>
          <Link
            href={`/admin/users?role=ADMIN${search ? `&search=${search}` : ""}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              roleFilter === "ADMIN" ? "bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-sm" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            Admins ({stats.admins})
          </Link>
          <Link
            href={`/admin/users?role=CATALOG_MANAGER${search ? `&search=${search}` : ""}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              roleFilter === "CATALOG_MANAGER" ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            Managers ({stats.catalogManagers})
          </Link>
          <Link
            href={`/admin/users?role=CUSTOMER${search ? `&search=${search}` : ""}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              roleFilter === "CUSTOMER" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            Customers ({stats.customers})
          </Link>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 type-label text-[10px]">
                <th className="p-4 pl-6">User / Account</th>
                <th className="p-4">Email</th>
                <th className="p-4">Auth Method</th>
                <th className="p-4">Role Badge</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4 pr-6 text-right">Role & Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-mono text-xs">
                    No matching user accounts found for the current search filter.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = session?.user?.id === u.id;

                  return (
                    <UserRowInteractive
                      key={u.id}
                      user={{
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        image: u.image || u.avatar || null,
                        avatar: u.avatar || u.image || null,
                        google_sub: u.google_sub || null,
                        given_name: u.given_name || null,
                        family_name: u.family_name || null,
                        locale: u.locale || null,
                        hasPassword: Boolean(u.hasPassword),
                        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : "",
                        emailVerified: u.emailVerified ? new Date(u.emailVerified).toISOString() : null,
                      }}
                      isSelf={isSelf}
                      roleBadgeStyle={getRoleBadgeStyle(u.role)}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
