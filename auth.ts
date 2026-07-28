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
        
        const email = credentials.email as string;
        const password = credentials.password as string;

        // DEMO BYPASS: Allow login without a database connection
        if (email === "admin@demo.com" && password === "demo123") {
          return {
            id: "demo-admin-id",
            email: "admin@demo.com",
            name: "Demo Admin",
            role: "SUPER_ADMIN",
          };
        }

        try {
          const res = await query(`SELECT id, email, name, role, password FROM "User" WHERE email = $1 LIMIT 1`, [email]);
          
          if (res.rows.length === 0) return null;
          
          const user = res.rows[0];
          if (!user.password) return null;

          const isValid = await argon2.verify(user.password, password);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
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
