"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function reportPost(postId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) return { error: "AUTH_REQUIRED" };
  const myId = session.user.id as string;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) return { error: "NOT_FOUND" };
  if (post.authorId === myId) return { error: "CANNOT_REPORT_OWN" };

  try {
    await prisma.postReport.upsert({
      where: { postId_userId: { postId, userId: myId } },
      create: { postId, userId: myId },
      update: {},
    });
    return { ok: true };
  } catch {
    return { error: "FAILED" };
  }
}
