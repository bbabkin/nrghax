import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Discord from "next-auth/providers/discord"
import Nodemailer from "next-auth/providers/nodemailer"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Discord({
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
    }),

    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],

  callbacks: {
    async session({ session, user }) {
      // Add custom fields to session
      if (session.user) {
        session.user.id = user.id;
        session.user.isAdmin = user.isAdmin;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      // You can add custom logic here
      // For example, auto-assign admin role based on email
      if (user.email === "admin@test.com") {
        await prisma.user.update({
          where: { id: user.id },
          data: { isAdmin: true }
        });
      }
      return true;
    },
  },

  pages: {
    signIn: "/auth",
    signOut: "/auth",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
  },

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  debug: process.env.NODE_ENV === "development",
})

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      isAdmin: boolean;
    }
  }

  interface User {
    isAdmin: boolean;
  }
}