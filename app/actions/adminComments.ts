"use server";

import { prisma } from "@/lib/prisma";
import { PostStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function updateCommentStatus(commentId: string, status: "APPROVED" | "REJECTED") {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error("Not authenticated");
  }

  // Проверяем флаг isOfficial в базе данных
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isOfficial: true }
  });

  if (!user?.isOfficial) {
    throw new Error("Unauthorized");
  }

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { status: status as PostStatus },
    include: { post: true, author: true }
  });

  // Уведомление автору поста после апрува
  if (status === "APPROVED" && comment.post.authorId !== comment.authorId) {
    try {
      await prisma.notification.create({
        data: {
          userId: comment.post.authorId,
          type: "POST_REPLY" as any, // Используем as any если типы капризничают
          title: "New reply to your post",
          body: "Someone replied to your post",
          href: `/post/${comment.postId}`,
          actorId: comment.anonymous ? null : comment.authorId,
        },
      });
    } catch (e) {
      console.error("Notification failed:", e);
    }
  }

  // Обновляем кэш страниц
  revalidatePath("/admin/comments"); 
  revalidatePath(`/post/${comment.postId}`);
  revalidatePath("/");
  
  return { ok: true };
}

export async function getPendingComments() {
  const session = await getServerSession(authOptions);
  
  // Добавим проверку и сюда для безопасности
  if (!session?.user?.email) return [];
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isOfficial: true }
  });

  if (!user?.isOfficial) return [];

  return await prisma.comment.findMany({
    where: { status: "PENDING" },
    include: {
      author: { select: { name: true, username: true } },
      post: { select: { content: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}