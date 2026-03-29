import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
      termsAcceptedAt?: Date | null;
      status?: string;
      major?: string;
      yearOfStudy?: number | null;
      emoji?: string;
      college?: string;
      kimepId?: number | null;
      campusStatusVisibility?: string;
      campusStatusDuration?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    role: string;
    // добавь другие поля, если нужно
  }
}