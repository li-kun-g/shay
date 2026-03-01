"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteComment(commentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Not authenticated");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) throw new Error("User not found");

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true },
  });
  if (!comment) return;

  if (comment.authorId !== me.id) throw new Error("Not allowed");

  await prisma.comment.delete({ where: { id: commentId } });

  // refresh feed (counts) and open thread pages (we use "/" only right now)
  revalidatePath("/");
}
