"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PostStatus } from "@prisma/client";

type NotificationType =
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "POST_REPLY"
  | "POST_REACTION"
  | "EVENT_JOINED"
  | "EVENT_APPROVED"
  | "EVENT_REJECTED"
  | "GROUP_JOIN_APPROVED"
  | "GROUP_JOIN_REJECTED"
  | "GROUP_CREATE_APPROVED"
  | "GROUP_CREATE_REJECTED"
  | "SYSTEM";

async function createNotificationSafe(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  actorId?: string | null;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type as any,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
        actorId: input.actorId ?? null,
      },
    });
  } catch (e) {
    console.error("Failed to create notification:", e);
  }
}

export async function createComment(input: {
  postId: string;
  content: string;
  anonymous: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Not authenticated");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, username: true, name: true },
  });
  if (!me) throw new Error("User not found");

  const postId = (input.postId ?? "").trim();
  if (!postId) throw new Error("POST_ID_REQUIRED");

  const content = input.content.trim();
  if (!content) return;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  });
  if (!post) throw new Error("Post not found");

  // Устанавливаем статус в зависимости от анонимности
  const status = input.anonymous ? PostStatus.PENDING : PostStatus.APPROVED;

  await prisma.comment.create({
    data: {
      postId,
      content,
      anonymous: input.anonymous,
      authorId: me.id,
      status,
    },
  });

  // Уведомление отправляем только если комментарий НЕ анонимный (сразу одобрен)
  // Анонимные уведомления лучше отправлять в экшене админки при апруве
  if (post.authorId !== me.id && status === PostStatus.APPROVED) {
    await createNotificationSafe({
      userId: post.authorId,
      type: "POST_REPLY",
      title: "New reply to your post",
      body: input.anonymous
        ? "Someone replied to your post"
        : `${me.name || me.username} replied to your post`,
      href: `/post/${postId}`,
      actorId: input.anonymous ? null : me.id,
    });

    revalidatePath("/notifications");
  }

  revalidatePath("/");
  revalidatePath("/u");
  revalidatePath(`/u/${me.username}`);
  revalidatePath(`/post/${postId}`);

  return { ok: true, pending: input.anonymous };
}