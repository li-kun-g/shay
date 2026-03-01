"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function dmKey(a: string, b: string) {
  return [a, b].sort().join(":");
}

async function areFriends(a: string, b: string) {
  const f = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: a, userBId: b },
        { userAId: b, userBId: a },
      ],
    },
    select: { id: true },
  });
  return !!f;
}

export async function createDirectChat(username: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) {
    return { ok: false as const, error: "UNAUTHORIZED" as const };
  }

  const myId = session.user.id as string;
  const uname = username.trim().toLowerCase();
  if (!uname) return { ok: false as const, error: "EMPTY_USERNAME" as const };

  const other = await prisma.user.findUnique({
    where: { username: uname },
    select: { id: true, dmPrivacy: true },
  });

  if (!other) return { ok: false as const, error: "USER_NOT_FOUND" as const };
  if (other.id === myId) return { ok: false as const, error: "CANT_MESSAGE_SELF" as const };

  // ✅ DM privacy enforcement
  if (other.dmPrivacy === "FRIENDS_ONLY") {
    const ok = await areFriends(myId, other.id);
    if (!ok) {
      return { ok: false as const, error: "DM_FRIENDS_ONLY" as const };
    }
  }

  const key = dmKey(myId, other.id);

  const convo = await prisma.conversation.upsert({
    where: { dmKey: key },
    update: {},
    create: {
      type: "DIRECT",
      dmKey: key,
      members: { create: [{ userId: myId }, { userId: other.id }] },
    },
    select: { id: true },
  });

  return { ok: true as const, conversationId: convo.id, url: `/messages/${convo.id}` };
}