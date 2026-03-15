"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type PostCategory = "GOSSIPS" | "UNI" | "CONFESSIONS" | "MARKET" | "OTHER";

export async function createPost(input: {
  content: string;
  anonymous: boolean;
  category: PostCategory;
  imageUrl?: string | null;
  imageKey?: string | null;
}) {
  const session = await getServerSession(authOptions);

  // Return an object instead of throwing an Error to prevent 500 crashes
  if (!session?.user?.email) {
    return { error: "AUTH_REQUIRED" };
  }

  try {
    const content = (input.content ?? "").trim();
    const imageUrl = input.imageUrl ? String(input.imageUrl).trim() : null;
    const imageKey = input.imageKey ? String(input.imageKey).trim() : null;

    if (!content && !imageUrl) return { ok: true };
    if (content.length > 280) return { error: "CONTENT_TOO_LONG" };

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!me) return { error: "AUTH_REQUIRED" };

    await prisma.post.create({
      data: {
        content,
        anonymous: input.anonymous,
        category: input.category as any,
        authorId: me.id,
        imageUrl,
        imageKey,
      },
    });

    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    console.error("CreatePost Error:", e);
    return { error: "SERVER_ERROR" };
  }
}