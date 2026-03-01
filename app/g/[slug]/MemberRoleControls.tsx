"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { GroupRole } from "@prisma/client";

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) throw new Error("Not authenticated");
  return session;
}

async function requirePresident(groupId: string) {
  const session = await requireAuth();
  const meId = (session.user as any).id as string;

  const me = await prisma.groupMember.findFirst({
    where: { groupId, userId: meId },
    select: { role: true },
  });

  if (!me || me.role !== "PRESIDENT") {
    throw new Error("Only the president can manage roles");
  }

  return { meId };
}

/** PRESIDENT: promote/demote (ADMIN <-> MEMBER). PRESIDENT role cannot be assigned. */
export async function setMemberRoleAction(input: {
  groupId: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
}) {
  const { groupId, userId, role } = input;
  const { meId } = await requirePresident(groupId);

  // cannot change yourself
  if (userId === meId) throw new Error("You cannot change your own role");

  const target = await prisma.groupMember.findFirst({
    where: { groupId, userId },
    select: { role: true },
  });
  if (!target) throw new Error("Member not found");

  // cannot change president
  if (target.role === "PRESIDENT") throw new Error("Cannot change president role");

  await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId } },
    data: { role: role as GroupRole },
  });

  return { ok: true };
}

/** PRESIDENT: remove member (kick). */
export async function removeMemberAction(input: { groupId: string; userId: string }) {
  const { groupId, userId } = input;
  const { meId } = await requirePresident(groupId);

  if (userId === meId) throw new Error("You cannot remove yourself");

  const target = await prisma.groupMember.findFirst({
    where: { groupId, userId },
    select: { role: true },
  });
  if (!target) return { ok: true };

  if (target.role === "PRESIDENT") throw new Error("Cannot remove president");

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });

  return { ok: true };
}
