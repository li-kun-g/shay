"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";

export async function setLanguage(lang: Lang) {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();

  // Всегда сохраняем в куки (для неавторизованных)
  cookieStore.set("kimepish-lang", lang, { 
    path: "/", 
    maxAge: 31536000 // 1 год
  });

  // Если юзер залогинен, сохраняем еще и в базу
  if (session?.user && "id" in session.user) {
    const userId = session.user.id as string;
    await prisma.user.update({
      where: { id: userId },
      data: { language: lang },
    });
  }

  return { success: true };
}