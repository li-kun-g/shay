"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const MAX_CHARS = 280;

export async function editPost(postId: string, content: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) return { error: "AUTH_REQUIRED" };
  const myId = session.user.id as string;

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > MAX_CHARS) return { error: "INVALID" };

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) return { error: "NOT_FOUND" };
  if (post.authorId !== myId) return { error: "FORBIDDEN" };

  await prisma.post.update({
    where: { id: postId },
    data: { content: trimmed },
  });

  revalidatePath("/");
  return { ok: true };
}
