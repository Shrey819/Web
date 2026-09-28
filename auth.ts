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
          const envMasterPassword = process.env.MASTER_PASSWORD || process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;

          if (!envMasterPassword) {
            console.error("ADMIN_PASSWORD or MASTER_PASSWORD is not set in environment.");
            return null;
          }

          // 1. Password MUST strictly match the master password configured in .env
          if (password !== envMasterPassword) {
            return null;
          }

          // 2. The email MUST be a registered user in the database
          const res = await query(`SELECT id, email, name, role, password FROM "User" WHERE LOWER(email) = $1 LIMIT 1`, [cleanEmail]);

          if (res.rows.length === 0) {
            return null;
          }

          const user = res.rows[0];

          // 3. Admin portal credentials authentication is strictly restricted to ADMIN role
          if (user.role !== "ADMIN") {
            return null;
          }

          // 4. Ensure DB hash is synchronized with the master password
          const isCurrentHashValid = user.password ? await argon2.verify(user.password, password).catch(() => false) : false;
          if (!isCurrentHashValid) {
            const newHash = await argon2.hash(password);
            await query(
              `UPDATE "User" SET "password" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
              [newHash, user.id]
            );
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || "Admin",
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
