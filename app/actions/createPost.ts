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

  if (!session?.user?.email) {
    throw new Error("AUTH_REQUIRED");
  }

  const content = (input.content ?? "").trim();
  const imageUrl = (input.imageUrl ?? null) ? String(input.imageUrl).trim() : null;
  const imageKey = (input.imageKey ?? null) ? String(input.imageKey).trim() : null;

  if (!content && !imageUrl) return { ok: true };

  if (content.length > 280) throw new Error("CONTENT_TOO_LONG");

  if (input.anonymous && imageUrl) {
    throw new Error("ANON_CANNOT_HAVE_IMAGE");
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!me) throw new Error("AUTH_REQUIRED");

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
}