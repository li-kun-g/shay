"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type SelectedUser = { id: string };

export async function createGroupChat(input: {
  name?: string;
  memberIds: string[];
}) {
  const session = await getServerSession(authOptions);
  const myId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  if (!myId) throw new Error("UNAUTHORIZED");

  const requestedIds = Array.isArray(input.memberIds)
    ? input.memberIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  const users: SelectedUser[] =
    requestedIds.length > 0
      ? await prisma.user.findMany({
          where: {
            id: { in: requestedIds },
          },
          select: { id: true },
        })
      : [];

  const memberIds = Array.from(new Set([myId, ...users.map((u: SelectedUser) => u.id)]));

  if (memberIds.length > 150) {
    throw new Error("GROUP_MEMBER_LIMIT");
  }

  const convo = await prisma.conversation.create({
    data: {
      type: "GROUP",
      name: input.name?.trim() || null,
      members: {
        create: memberIds.map((userId) => ({
          userId,
        })),
      },
    },
    select: {
      id: true,
    },
  });

  return { id: convo.id };
}