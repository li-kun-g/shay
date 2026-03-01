"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { NotificationType } from "@prisma/client";

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
        type: input.type,
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

  await prisma.comment.create({
    data: {
      postId,
      content,
      anonymous: input.anonymous,
      authorId: me.id,
    },
  });

  if (post.authorId !== me.id) {
    await createNotificationSafe({
      userId: post.authorId,
      type: NotificationType.POST_REPLY,
      title: "New reply to your post",
      body: input.anonymous
        ? "Someone replied to your post"
        : `${me.name || me.username} replied to your post`,
      href: `/post/${postId}`, // ✅ exact post
      actorId: input.anonymous ? null : me.id,
    });

    revalidatePath("/notifications");
  }

  revalidatePath("/");
  revalidatePath("/u");
  revalidatePath(`/u/${me.username}`);
}