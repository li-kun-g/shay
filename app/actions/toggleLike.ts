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

export async function toggleLike(postIdRaw: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Not authenticated");

  const postId = (postIdRaw ?? "").trim();
  if (!postId) throw new Error("POST_ID_REQUIRED");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, username: true, name: true },
  });
  if (!user) throw new Error("User not found");

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  });
  if (!post) throw new Error("Post not found");

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId: user.id, postId } },
    select: { userId: true },
  });

  if (existing) {
    await prisma.like.delete({
      where: { userId_postId: { userId: user.id, postId } },
    });
  } else {
    await prisma.like.create({
      data: { userId: user.id, postId },
    });

    if (post.authorId !== user.id) {
      await createNotificationSafe({
        userId: post.authorId,
        type: NotificationType.POST_REACTION,
        title: "New like on your post",
        body: `${user.name || user.username} liked your post ☕`,
        href: `/post/${postId}`, // ✅ exact post
        actorId: user.id,
      });

      revalidatePath("/notifications");
    }
  }

  revalidatePath("/");
  revalidatePath("/u");
  revalidatePath(`/u/${user.username}`);
}