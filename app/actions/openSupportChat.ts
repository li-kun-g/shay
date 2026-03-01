"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * One permanent support chat per user.
 * Implemented as a DIRECT conversation with deterministic dmKey: "support:<userId>"
 * Members still include: user + support operator (official user).
 *
 * Support operator resolved by:
 *  1) env KIMEPISH_SUPPORT_USERNAME (recommended)
 *  2) else: first user with isOfficial=true (oldest)
 */

async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user) || !session.user.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session.user.id as string;
}

async function resolveSupportUserId() {
  const uname = (process.env.KIMEPISH_SUPPORT_USERNAME ?? "")
    .trim()
    .toLowerCase();

  if (uname) {
    const u = await prisma.user.findUnique({
      where: { username: uname },
      select: { id: true },
    });
    if (u) return u.id;
  }

  const official = await prisma.user.findFirst({
    where: { isOfficial: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!official) throw new Error("SUPPORT_USER_NOT_FOUND");
  return official.id;
}

export async function openSupportChat() {
  const myId = await requireUserId();
  const supportId = await resolveSupportUserId();

  // If owner opens support, don't create weird self-support
  if (supportId === myId) {
    return { ok: true as const, conversationId: "", url: "/messages" };
  }

  // ✅ Special deterministic dmKey so UI can treat it as "Administration"
  const key = `support:${myId}`;

  const convo = await prisma.conversation.upsert({
    where: { dmKey: key },
    update: {},
    create: {
      type: "DIRECT",
      dmKey: key,
      members: { create: [{ userId: myId }, { userId: supportId }] },
    },
    select: { id: true },
  });

  return {
    ok: true as const,
    conversationId: convo.id,
    url: `/messages/${convo.id}`,
  };
}