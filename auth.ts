import NextAuth, { type DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { query } from "@/lib/db"
import * as argon2 from "argon2"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"]
  }
  interface User {
    role?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const email = credentials.email;
        const password = credentials.password;

        if (typeof email !== "string" || typeof password !== "string") return null;
        // Bounded inputs protect Argon2 from excessive CPU/memory consumption DoS attacks
        if (email.length > 255 || password.length === 0 || password.length > 128) return null;

        try {
          const cleanEmail = email.trim().toLowerCase();
          const envAdminEmail = (process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || "try.shrey@gmail.com").trim().toLowerCase();
          const envAdminPassword = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;

          const res = await query(`SELECT id, email, name, role, password FROM "User" WHERE LOWER(email) = $1 LIMIT 1`, [cleanEmail]);

          // If this matches the configured env admin email and password
          if (cleanEmail === envAdminEmail && envAdminPassword && password === envAdminPassword) {
            if (res.rows.length === 0) {
              const newHash = await argon2.hash(password);
              const newId = `usr_admin_${Date.now()}`;
              await query(
                `INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt") 
                 VALUES ($1, $2, 'Admin', $3, 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [newId, cleanEmail, newHash]
              );
              return { id: newId, email: cleanEmail, name: "Admin", role: "ADMIN" };
            }

            const user = res.rows[0];
            const isCurrentHashValid = user.password ? await argon2.verify(user.password, password) : false;
            if (!isCurrentHashValid || user.role !== "ADMIN") {
              const newHash = await argon2.hash(password);
              await query(
                `UPDATE "User" SET "password" = $1, "role" = 'ADMIN', "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
                [newHash, user.id]
              );
            }
            return { id: user.id, email: user.email, name: user.name || "Admin", role: "ADMIN" };
          }

          if (res.rows.length === 0) return null;
          
          const user = res.rows[0];
          if (!user.password) return null;

          const isValid = await argon2.verify(user.password, password);
          if (!isValid) return null;

          // Admin portal credentials authentication is strictly restricted to ADMIN role.
          // Customers and any non-ADMIN roles must be rejected.
          if (user.role !== "ADMIN") {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: "ADMIN",
          };
        } catch (error) {
          console.error("Database auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/admin/login",
  }
})
