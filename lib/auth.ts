import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { AdapterUser } from "next-auth/adapters";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

import { headers } from "next/headers";
import { ipLimiter, emailLimiter } from "@/lib/rateLimit";
import { getMaxListeners } from "events";

type CampusDurationDb = "H2" | "H4" | "EOD";
type CampusDurationUI = "2h" | "4h" | "eod";

function toUiDuration(d: CampusDurationDb | null | undefined): CampusDurationUI {
  if (d === "H4") return "4h";
  if (d === "EOD") return "eod";
  return "2h";
}

export const authOptions: NextAuthOptions = {
  adapter: {
    ...PrismaAdapter(prisma),
    createUser: (data: AdapterUser) => {
      const generatedUsername = 
        data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_') + 
        '_' + Math.random().toString(36).substring(2, 5);
      
      return prisma.user.create({
        data: {
          ...data,
          // 🔥 Сбрасываем гугловскую аватарку и ставим эмодзи по умолчанию
          image: null, 
          emoji: "☕",
          username: generatedUsername,
          termsAcceptedAt: new Date(), 
        },
      });
    },
  },
  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const h = await headers();
        const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        if (!email || !password) throw new Error("INVALID_CREDENTIALS");

        const ipCheck = await ipLimiter.limit(ip);
        if (!ipCheck.success) throw new Error("TOO_MANY_REQUESTS");

        const emailCheck = await emailLimiter.limit(email);
        if (!emailCheck.success) throw new Error("TOO_MANY_REQUESTS");

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true, email: true, username: true, name: true,
            passwordHash: true, emailVerified: true, image: true,
            status: true, major: true, yearOfStudy: true, emoji: true,
            college: true, kimepId: true, campusStatusVisibility: true,
            campusStatusDuration: true,
          },
        });

        if (!user?.passwordHash || !user.emailVerified) {
          await new Promise((res) => setTimeout(res, 800));
          throw new Error("INVALID_CREDENTIALS");
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          await new Promise((res) => setTimeout(res, 800));
          throw new Error("INVALID_CREDENTIALS");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? "Student",
          username: user.username,
          image: user.image,
          status: user.status,
          major: user.major,
          yearOfStudy: user.yearOfStudy,
          emoji: user.emoji,
          college: user.college,
          kimepId: user.kimepId,
          campusStatusVisibility: user.campusStatusVisibility,
          campusStatusDuration: toUiDuration(user.campusStatusDuration as CampusDurationDb),
        } as any;
      },
    }),
  ],

  events: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await prisma.user.update({
          where: { email: user.email },
          data: { termsAcceptedAt: new Date() },
        });
      }
    },
  },

  pages: { 
    signIn: "/signin",
    error: "/auth/error" 
  },

  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        if (!profile?.email) return false;
        const email = profile.email.toLowerCase();
        const isKimep = email.endsWith("@kimep.kz");
        const admins = process.env.KIMEPISH_ADMIN_EMAILS?.split(",") || [];
       const testAccounts = [
  "alikhan.tuganbayevda@gmail.com",
  "crazyapefix@gmail.com",
  "gingercccat@gmail.com",
  "shabulovarsen0@getMaxListeners.com",
  "ayorair@gmail.com",
];

return isKimep || admins.includes(email) || testAccounts.includes(email);
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
      }
      return token;
    },

    async session({ session, token }) {
      if (!session.user || !token?.id) return session;

      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: {
          id: true, email: true, username: true, name: true, image: true,
          role: true, termsAcceptedAt: true, status: true, major: true,
          yearOfStudy: true, emoji: true, college: true, kimepId: true,
          campusStatusVisibility: true, campusStatusDuration: true,
        },
      });

      if (!dbUser) return session;

      Object.assign(session.user, {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username,
        name: dbUser.name ?? "Student",
        image: dbUser.image ?? "",
        role: dbUser.role,
        termsAcceptedAt: dbUser.termsAcceptedAt,
        status: dbUser.status ?? "",
        major: dbUser.major ?? "",
        yearOfStudy: dbUser.yearOfStudy ?? null,
        emoji: dbUser.emoji ?? "☕",
        college: dbUser.college ?? "",
        kimepId: dbUser.kimepId ?? "",
        campusStatusVisibility: dbUser.campusStatusVisibility ?? "EVERYONE",
        campusStatusDuration: toUiDuration(dbUser.campusStatusDuration as CampusDurationDb),
      });

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
};