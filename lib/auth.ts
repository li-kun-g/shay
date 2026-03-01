import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { CampusDuration as PrismaCampusDuration } from "@prisma/client";

type CampusDurationUI = "2h" | "4h" | "eod";

function toUiDuration(d: PrismaCampusDuration | null | undefined): CampusDurationUI {
  if (d === PrismaCampusDuration.H4) return "4h";
  if (d === PrismaCampusDuration.EOD) return "eod";
  return "2h"; // default for H2/null/undefined
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
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

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

        if (!user?.passwordHash) return null;
        if (!user.emailVerified) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

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
          campusStatusDuration: toUiDuration(user.campusStatusDuration),
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

      (session.user as any).id = dbUser.id;
      (session.user as any).email = dbUser.email;
      (session.user as any).username = dbUser.username;
      (session.user as any).name = dbUser.name ?? "Student";

      (session.user as any).image = dbUser.image ?? "";
      (session.user as any).status = dbUser.status ?? "";
      (session.user as any).major = dbUser.major ?? "";
      (session.user as any).yearOfStudy = dbUser.yearOfStudy ?? null;
      (session.user as any).emoji = dbUser.emoji ?? "☕";
      (session.user as any).college = dbUser.college ?? "";
      (session.user as any).kimepId = dbUser.kimepId ?? "";

      (session.user as any).campusStatusVisibility =
        dbUser.campusStatusVisibility ?? "EVERYONE";
      (session.user as any).campusStatusDuration =
        toUiDuration(dbUser.campusStatusDuration);

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
};
