import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

import { headers } from "next/headers";
import { ipLimiter, emailLimiter } from "@/lib/rateLimit";

type CampusDurationDb = "H2" | "H4" | "EOD";
type CampusDurationUI = "2h" | "4h" | "eod";

function toUiDuration(d: CampusDurationDb | null | undefined): CampusDurationUI {
  if (d === "H4") return "4h";
  if (d === "EOD") return "eod";
  return "2h";
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const h = await headers();

        const ip =
          h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          h.get("x-real-ip") ||
          "unknown";

        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        if (!email || !password) {
          throw new Error("INVALID_CREDENTIALS");
        }

        // 🔐 IP LIMIT
        const ipCheck = await ipLimiter.limit(ip);
        if (!ipCheck.success) {
          throw new Error("TOO_MANY_REQUESTS");
        }

        // 🔐 EMAIL LIMIT
        const emailCheck = await emailLimiter.limit(email);
        if (!emailCheck.success) {
          throw new Error("TOO_MANY_REQUESTS");
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            passwordHash: true,
            emailVerified: true,

            image: true,
            status: true,
            major: true,
            yearOfStudy: true,
            emoji: true,
            college: true,
            kimepId: true,

            campusStatusVisibility: true,
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
          campusStatusDuration: toUiDuration(
            (user.campusStatusDuration ?? null) as CampusDurationDb | null
          ),
        } as any;
      },
    }),
  ],

  pages: { signIn: "/signin" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.username = (user as any).username;
      }
      return token;
    },

    async session({ session, token }) {
      if (!session.user || !token?.id) return session;

      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,

          image: true,
          status: true,
          major: true,
          yearOfStudy: true,
          emoji: true,
          college: true,
          kimepId: true,

          campusStatusVisibility: true,
          campusStatusDuration: true,
        },
      });

      if (!dbUser) return session;

      Object.assign(session.user, {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username,
        name: dbUser.name ?? "Student",
        image: dbUser.image ?? "",
        status: dbUser.status ?? "",
        major: dbUser.major ?? "",
        yearOfStudy: dbUser.yearOfStudy ?? null,
        emoji: dbUser.emoji ?? "☕",
        college: dbUser.college ?? "",
        kimepId: dbUser.kimepId ?? "",
        campusStatusVisibility:
          dbUser.campusStatusVisibility ?? "EVERYONE",
        campusStatusDuration: toUiDuration(
          (dbUser.campusStatusDuration ?? null) as CampusDurationDb | null
        ),
      });

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
};