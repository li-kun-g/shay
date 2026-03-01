"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { NotificationType } from "@prisma/client";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) {
    throw new Error("Unauthorized");
  }
  return session.user.id as string;
}

export type FriendRelation =
  | "self"
  | "friends"
  | "outgoing_pending"
  | "incoming_pending"
  | "none";

/**
 * Safe notification creator (doesn't break main friend flow if notification fails)
 */
async function createNotificationSafe(input: {
  userId: string; // recipient
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

/**
 * VK-style relation resolver for profile page buttons.
 * Returns which button should be shown, and requestId when applicable.
 */
export async function getFriendRelation(profileUserId: string) {
  const myId = await requireUser();
  const otherId = (profileUserId ?? "").trim();

  if (!otherId) return { ok: false as const, error: "EMPTY_USER_ID" as const };
  if (otherId === myId) {
    return { ok: true as const, relation: "self" as FriendRelation };
  }

  // Friends in either direction
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: myId, userBId: otherId },
        { userAId: otherId, userBId: myId },
      ],
    },
    select: { id: true },
  });

  if (friendship) {
    return { ok: true as const, relation: "friends" as FriendRelation };
  }

  // Pending requests both directions
  const [outgoing, incoming] = await Promise.all([
    prisma.friendRequest.findFirst({
      where: { fromId: myId, toId: otherId, status: "PENDING" },
      select: { id: true },
    }),
    prisma.friendRequest.findFirst({
      where: { fromId: otherId, toId: myId, status: "PENDING" },
      select: { id: true },
    }),
  ]);

  if (incoming) {
    return {
      ok: true as const,
      relation: "incoming_pending" as FriendRelation,
      requestId: incoming.id,
    };
  }

  if (outgoing) {
    return {
      ok: true as const,
      relation: "outgoing_pending" as FriendRelation,
      requestId: outgoing.id,
    };
  }

  return { ok: true as const, relation: "none" as FriendRelation };
}

/**
 * Send friend request (VK-like):
 * - If there is an incoming pending request from that user, auto-accept.
 * - If already friends, do nothing.
 * - Otherwise create/update outgoing PENDING request.
 */
export async function sendFriendRequest(toUserId: string) {
  const myId = await requireUser();
  const otherId = (toUserId ?? "").trim();

  if (!otherId || myId === otherId) return;

  const [me, other] = await Promise.all([
    prisma.user.findUnique({
      where: { id: myId },
      select: { id: true, username: true, name: true },
    }),
    prisma.user.findUnique({
      where: { id: otherId },
      select: { id: true, username: true, name: true },
    }),
  ]);

  if (!me || !other) return;

  // already friends?
  const already = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: myId, userBId: otherId },
        { userAId: otherId, userBId: myId },
      ],
    },
    select: { id: true },
  });
  if (already) return;

  // if they already requested you -> accept it (smooth VK feel)
  const incoming = await prisma.friendRequest.findFirst({
    where: { fromId: otherId, toId: myId, status: "PENDING" },
    select: { id: true, fromId: true, toId: true },
  });

  if (incoming) {
    const [a, b] = [incoming.fromId, incoming.toId].sort();

    await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: incoming.id },
        data: { status: "ACCEPTED" },
      }),
      prisma.friendship.upsert({
        where: { userAId_userBId: { userAId: a, userBId: b } },
        update: {},
        create: { userAId: a, userBId: b },
      }),
    ]);

    // notify original sender that their request was accepted (auto-accept case)
    await createNotificationSafe({
      userId: otherId,
      type: NotificationType.FRIEND_ACCEPTED,
      title: "Friend request accepted",
      body: `${me.name || me.username} accepted your friend request`,
      href: `/u/${me.username}`,
      actorId: me.id,
    });

    revalidatePath("/friends");
    revalidatePath("/notifications");
    revalidatePath(`/u/${me.username}`);
    revalidatePath(`/u/${other.username}`);
    return;
  }

  await prisma.friendRequest.upsert({
    where: {
      fromId_toId: { fromId: myId, toId: otherId },
    },
    update: { status: "PENDING" }, // allow re-send if previously DECLINED
    create: { fromId: myId, toId: otherId, status: "PENDING" },
  });

  // notify receiver about new friend request
  await createNotificationSafe({
    userId: otherId,
    type: NotificationType.FRIEND_REQUEST,
    title: "New friend request",
    body: `${me.name || me.username} sent you a friend request`,
    href: `/u/${me.username}`,
    actorId: me.id,
  });

  revalidatePath("/friends");
  revalidatePath("/notifications");
  revalidatePath(`/u/${me.username}`);
  revalidatePath(`/u/${other.username}`);
}

/**
 * Accept an incoming request.
 * Creates friendship with sorted ids to prevent duplicates regardless of direction.
 */
export async function acceptFriendRequest(requestId: string) {
  const myId = await requireUser();
  const id = (requestId ?? "").trim();
  if (!id) return;

  const req = await prisma.friendRequest.findUnique({
    where: { id },
    select: { id: true, fromId: true, toId: true, status: true },
  });

  if (!req || req.toId !== myId) return;
  if (req.status !== "PENDING") return;

  const [me, sender] = await Promise.all([
    prisma.user.findUnique({
      where: { id: myId },
      select: { id: true, username: true, name: true },
    }),
    prisma.user.findUnique({
      where: { id: req.fromId },
      select: { id: true, username: true, name: true },
    }),
  ]);

  if (!me || !sender) return;

  const [a, b] = [req.fromId, req.toId].sort();

  await prisma.$transaction([
    prisma.friendRequest.update({
      where: { id },
      data: { status: "ACCEPTED" },
    }),
    prisma.friendship.upsert({
      where: { userAId_userBId: { userAId: a, userBId: b } },
      update: {},
      create: { userAId: a, userBId: b },
    }),
  ]);

  // notify original sender
  await createNotificationSafe({
    userId: req.fromId,
    type: NotificationType.FRIEND_ACCEPTED,
    title: "Friend request accepted",
    body: `${me.name || me.username} accepted your friend request`,
    href: `/u/${me.username}`,
    actorId: me.id,
  });

  revalidatePath("/friends");
  revalidatePath("/notifications");
  revalidatePath(`/u/${me.username}`);
  revalidatePath(`/u/${sender.username}`);
}

/**
 * Decline an incoming request.
 */
export async function declineFriendRequest(requestId: string) {
  const myId = await requireUser();
  const id = (requestId ?? "").trim();
  if (!id) return;

  const req = await prisma.friendRequest.findUnique({
    where: { id },
    select: { id: true, toId: true, status: true },
  });

  if (!req || req.toId !== myId) return;
  if (req.status !== "PENDING") return;

  await prisma.friendRequest.update({
    where: { id },
    data: { status: "DECLINED" },
  });

  revalidatePath("/friends");
}

/**
 * Cancel my outgoing pending request to a user (used for "Request sent" -> "Cancel").
 * We reuse DECLINED status for now. If you want, later add a CANCELED enum.
 */
export async function cancelFriendRequest(toUserId: string) {
  const myId = await requireUser();
  const otherId = (toUserId ?? "").trim();

  if (!otherId || otherId === myId) return;

  await prisma.friendRequest.updateMany({
    where: { fromId: myId, toId: otherId, status: "PENDING" },
    data: { status: "DECLINED" },
  });

  revalidatePath("/friends");
}

/**
 * Remove friendship (either direction).
 */
export async function removeFriend(friendId: string) {
  const myId = await requireUser();
  const otherId = (friendId ?? "").trim();
  if (!otherId || otherId === myId) return;

  const [a, b] = [myId, otherId].sort();

  await prisma.friendship.deleteMany({
    where: { userAId: a, userBId: b },
  });

  revalidatePath("/friends");
}