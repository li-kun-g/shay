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

export async function togglePostReaction(input: {
  postId: string;
  type: "LAUGH" | "SKULL";
}) {
  const session = await getServerSession(authOptions);
  const userId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  if (!userId) throw new Error("AUTH_REQUIRED");

  const postId = (input.postId ?? "").trim();
  if (!postId) throw new Error("POST_ID_REQUIRED");

  const [me, post] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, name: true },
    }),
    prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    }),
  ]);

  if (!me) throw new Error("AUTH_REQUIRED");
  if (!post) throw new Error("POST_NOT_FOUND");

  const existing = await prisma.postReaction.findUnique({
    where: {
      postId_userId_type: {
        postId,
        userId,
        type: input.type,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.postReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.postReaction.create({
      data: { postId, userId, type: input.type },
    });

    if (post.authorId !== userId) {
      const reactionEmoji = input.type === "LAUGH" ? "😂" : "💀";

      await createNotificationSafe({
        userId: post.authorId,
        type: NotificationType.POST_REACTION,
        title: "New reaction on your post",
        body: `${me.name || me.username} reacted ${reactionEmoji} to your post`,
        href: `/post/${postId}`,
        actorId: me.id,
      });

      revalidatePath("/notifications");
    }
  }

  // ✅ revalidate everywhere this post may be rendered
  revalidatePath("/");
  revalidatePath("/u");
  revalidatePath("/events");
  revalidatePath("/g");
  revalidatePath(`/u/${me.username}`);
  revalidatePath(`/post/${postId}`); // ✅ IMPORTANT
}