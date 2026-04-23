"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deletePost(postId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) return { error: "AUTH_REQUIRED" };
  const myId = session.user.id as string;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) return { error: "NOT_FOUND" };
  if (post.authorId !== myId) return { error: "FORBIDDEN" };

  // Soft delete — пост остаётся в БД, видят только admins
  await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/");
  return { ok: true };
}
