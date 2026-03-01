"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";

const COOKIE_KEY = "kimepish-lang";

export async function setLanguage(lang: Lang) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) throw new Error("UNAUTHORIZED");

  const userId = session.user.id as string;

  await prisma.user.update({
    where: { id: userId },
    data: { language: lang as any },
  });

  // ✅ also store in cookie (fast reads for UI / layout if needed)
  (await cookies()).set(COOKIE_KEY, lang, { path: "/", sameSite: "lax" });

  return { ok: true as const };
}