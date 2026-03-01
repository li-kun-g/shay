"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";

type GroupRole = "PRESIDENT" | "ADMIN" | "MEMBER";
type GroupVisibility = "PUBLIC" | "PRIVATE";
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

/* -------------------------------------------------------------------------- */
/* Auth + role guards                                                         */
/* -------------------------------------------------------------------------- */

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user) || !session.user.id) {
    throw new Error("Not authenticated");
  }
  return session;
}

async function requireOfficial() {
  const session = await requireAuth();
  const meId = session.user.id as string;

  const me = await prisma.user.findUnique({
    where: { id: meId },
    select: { isOfficial: true },
  });

  if (!me?.isOfficial) {
    throw new Error("Not authorized");
  }

  return { meId };
}

async function requireGroupRole(groupId: string, allowed: GroupRole[]) {
  const session = await requireAuth();
  const meId = session.user.id as string;

  const me = await prisma.groupMember.findFirst({
    where: { groupId, userId: meId },
    select: { role: true },
  });

  if (!me || !allowed.includes(me.role as GroupRole)) {
    throw new Error("Not authorized");
  }

  return { meId, role: me.role as GroupRole };
}

async function requirePresident(groupId: string) {
  return requireGroupRole(groupId, ["PRESIDENT"]);
}

async function requirePresidentOrAdmin(groupId: string) {
  return requireGroupRole(groupId, ["PRESIDENT", "ADMIN"]);
}

/* -------------------------------------------------------------------------- */
/* GROUP CREATE                                                               */
/* -------------------------------------------------------------------------- */

function slugifyGroupName(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

async function generateUniqueGroupSlug(name: string) {
  const base = slugifyGroupName(name) || "group";
  let slug = base;
  let i = 2;

  while (true) {
    const existing = await prisma.group.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) return slug;
    slug = `${base}-${i}`;
    i += 1;
  }
}

export async function createGroupAction(formData: FormData) {
  const session = await requireAuth();
  const meId = session.user.id as string;

  const name = String(formData.get("name") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const visibilityRaw = String(formData.get("visibility") ?? "PUBLIC")
    .trim()
    .toUpperCase() as GroupVisibility;

  if (!name) throw new Error("Group name is required");
  if (name.length > 60) throw new Error("Group name is too long");

  const description = descriptionRaw ? descriptionRaw.slice(0, 200) : null;
  const visibility: GroupVisibility =
    visibilityRaw === "PRIVATE" ? "PRIVATE" : "PUBLIC";
  const slug = await generateUniqueGroupSlug(name);

  const group = await prisma.$transaction(async (tx) => {
    const created = await tx.group.create({
      data: {
        name,
        slug,
        description,
        visibility: visibility as any,
        status: "APPROVED" as any,
        presidentId: meId,
      } as any,
      select: {
        id: true,
        slug: true,
      },
    });

    await tx.groupMember.create({
      data: {
        groupId: created.id,
        userId: meId,
        role: "PRESIDENT" as any,
      },
    });

    return created;
  });

  revalidatePath("/groups");
  revalidatePath(`/g/${group.slug}`);

  return { ok: true, slug: group.slug };
}

/* -------------------------------------------------------------------------- */
/* ADMIN GROUP REQUESTS                                                       */
/* -------------------------------------------------------------------------- */

export async function adminApproveGroupRequest(groupId: string) {
  await requireOfficial();

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      members: {
        where: { role: "PRESIDENT" as any },
        select: { userId: true },
        take: 1,
      },
    },
  });

  if (!group) throw new Error("Group not found");

  await prisma.group.update({
    where: { id: group.id },
    data: {
      status: "APPROVED" as any,
      updatedAt: new Date(),
    } as any,
  });

  const presidentUserId = group.members[0]?.userId ?? null;

  if (presidentUserId) {
    await createNotification({
      userId: presidentUserId,
      type: "GROUP_CREATE_APPROVED" as NotificationType,
      title: "Group approved",
      body: `${group.name} was approved`,
      href: `/g/${group.slug}`,
      actorId: null,
    });
  }

  revalidatePath("/admin/groups");
  revalidatePath("/groups");
  revalidatePath(`/g/${group.slug}`);

  return { ok: true };
}

export async function adminRejectGroupRequest(groupId: string, note?: string) {
  await requireOfficial();

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      slug: true,
      name: true,
      members: {
        where: { role: "PRESIDENT" as any },
        select: { userId: true },
        take: 1,
      },
    },
  });

  if (!group) throw new Error("Group not found");

  const cleanNote = (note ?? "").trim();

  await prisma.group.update({
    where: { id: group.id },
    data: {
      status: "REJECTED" as any,
      updatedAt: new Date(),
      ...(cleanNote ? { adminNote: cleanNote } : {}),
    } as any,
  });

  const presidentUserId = group.members[0]?.userId ?? null;

  if (presidentUserId) {
    await createNotification({
      userId: presidentUserId,
      type: "GROUP_CREATE_REJECTED" as NotificationType,
      title: "Group rejected",
      body: cleanNote
        ? `${group.name} was rejected. Reason: ${cleanNote}`
        : `${group.name} was rejected`,
      href: "/groups",
      actorId: null,
    });
  }

  revalidatePath("/admin/groups");
  revalidatePath("/groups");

  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* GROUP EDIT                                                                 */
/* -------------------------------------------------------------------------- */

export async function updateGroup(slug: string, formData: FormData) {
  const safeSlug = (slug ?? "").trim().toLowerCase();
  if (!safeSlug) throw new Error("Invalid slug");

  const group = await prisma.group.findUnique({
    where: { slug: safeSlug },
    select: { id: true, slug: true },
  });
  if (!group) throw new Error("Group not found");

  await requirePresidentOrAdmin(group.id);

  const name = String(formData.get("name") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const imageRaw = String(formData.get("image") ?? "").trim();

  if (!name) throw new Error("Group name is required");
  if (name.length > 60) throw new Error("Group name is too long");

  const description = descriptionRaw ? descriptionRaw.slice(0, 280) : null;

  const image =
    imageRaw &&
    (imageRaw.startsWith("http://") || imageRaw.startsWith("https://"))
      ? imageRaw
      : null;

  await prisma.group.update({
    where: { id: group.id },
    data: {
      name,
      description,
      image,
      updatedAt: new Date(),
    } as any,
  });

  revalidatePath(`/g/${group.slug}`);
  revalidatePath(`/g/${group.slug}/edit`);

  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Member role / removal                                                      */
/* -------------------------------------------------------------------------- */

async function setMemberRoleInternal(input: {
  groupId: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
}) {
  const { groupId, userId, role } = input;
  const { meId } = await requirePresident(groupId);

  if (userId === meId) throw new Error("You cannot change your own role");

  const target = await prisma.groupMember.findFirst({
    where: { groupId, userId },
    select: { role: true },
  });
  if (!target) throw new Error("Member not found");
  if ((target.role as GroupRole) === "PRESIDENT") {
    throw new Error("Cannot change president role");
  }

  await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId } },
    data: { role: role as any },
  });

  return { ok: true };
}

async function removeMemberInternal(input: { groupId: string; userId: string }) {
  const { groupId, userId } = input;
  const { meId } = await requirePresident(groupId);

  if (userId === meId) throw new Error("You cannot remove yourself");

  const target = await prisma.groupMember.findFirst({
    where: { groupId, userId },
    select: { role: true },
  });
  if (!target) return { ok: true };
  if ((target.role as GroupRole) === "PRESIDENT") {
    throw new Error("Cannot remove president");
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });

  return { ok: true };
}

export async function setMemberRoleAction(input: {
  groupId: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
}) {
  return setMemberRoleInternal(input);
}

export async function removeMemberAction(input: { groupId: string; userId: string }) {
  return removeMemberInternal(input);
}

export async function promoteMember(groupId: string, userId: string) {
  return setMemberRoleInternal({ groupId, userId, role: "ADMIN" });
}

export async function demoteMember(groupId: string, userId: string) {
  return setMemberRoleInternal({ groupId, userId, role: "MEMBER" });
}

export async function removeMember(groupId: string, userId: string) {
  return removeMemberInternal({ groupId, userId });
}

/* -------------------------------------------------------------------------- */
/* Follow / unfollow                                                          */
/* -------------------------------------------------------------------------- */

export async function toggleGroupFollow(groupId: string) {
  const session = await requireAuth();
  const meId = session.user.id as string;

  const existing = await prisma.groupFollow.findUnique({
    where: { groupId_userId: { groupId, userId: meId } },
    select: { userId: true },
  });

  if (existing) {
    await prisma.groupFollow.delete({
      where: { groupId_userId: { groupId, userId: meId } },
    });
    return { ok: true, following: false };
  }

  await prisma.groupFollow.create({
    data: { groupId, userId: meId },
  });

  return { ok: true, following: true };
}

/* -------------------------------------------------------------------------- */
/* Join requests                                                              */
/* -------------------------------------------------------------------------- */

export async function requestJoinGroup(groupId: string) {
  const session = await requireAuth();
  const meId = session.user.id as string;

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: meId } },
    select: { role: true },
  });
  if (member) return { ok: true, status: "already_member" as const };

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, slug: true },
  });
  if (!group) throw new Error("Group not found");

  await prisma.groupJoinRequest.upsert({
    where: { groupId_userId: { groupId, userId: meId } },
    update: { status: "PENDING" as any },
    create: { groupId, userId: meId, status: "PENDING" as any },
  });

  revalidatePath(`/g/${group.slug}`);
  return { ok: true, status: "requested" as const };
}

/**
 * accepts:
 * - approveJoinRequest(requestId)
 * - approveJoinRequest(groupId, requestId)
 */
export async function approveJoinRequest(arg1: string, arg2?: string) {
  const requestId = (arg2 ?? arg1 ?? "").trim();
  if (!requestId) throw new Error("Join request not found");

  const req = await prisma.groupJoinRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      groupId: true,
      userId: true,
      status: true,
      group: { select: { slug: true, name: true } },
    },
  });

  if (!req) throw new Error("Join request not found");
  if (req.status !== ("PENDING" as any)) return { ok: true };

  await requirePresidentOrAdmin(req.groupId);

  await prisma.$transaction([
    prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: req.groupId, userId: req.userId } },
      update: {},
      create: { groupId: req.groupId, userId: req.userId, role: "MEMBER" as any },
    }),
    prisma.groupJoinRequest.update({
      where: { id: req.id },
      data: { status: "APPROVED" as any },
    }),
  ]);

  await createNotification({
    userId: req.userId,
    type: "GROUP_JOIN_APPROVED" as NotificationType,
    title: "Group request approved",
    body: `You were approved to join ${req.group.name}`,
    href: `/g/${req.group.slug}?tab=members`,
    actorId: null,
  });

  revalidatePath(`/g/${req.group.slug}`);
  revalidatePath("/notifications");
  return { ok: true };
}

/**
 * accepts:
 * - rejectJoinRequest(requestId)
 * - rejectJoinRequest(groupId, requestId)
 */
export async function rejectJoinRequest(arg1: string, arg2?: string) {
  const requestId = (arg2 ?? arg1 ?? "").trim();
  if (!requestId) throw new Error("Join request not found");

  const req = await prisma.groupJoinRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      groupId: true,
      userId: true,
      status: true,
      group: { select: { slug: true, name: true } },
    },
  });

  if (!req) throw new Error("Join request not found");
  if (req.status !== ("PENDING" as any)) return { ok: true };

  await requirePresidentOrAdmin(req.groupId);

  await prisma.groupJoinRequest.update({
    where: { id: req.id },
    data: { status: "REJECTED" as any },
  });

  await createNotification({
    userId: req.userId,
    type: "GROUP_JOIN_REJECTED" as NotificationType,
    title: "Group request rejected",
    body: `Your request to join ${req.group.name} was rejected`,
    href: `/g/${req.group.slug}`,
    actorId: null,
  });

  revalidatePath(`/g/${req.group.slug}`);
  revalidatePath("/notifications");
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* GROUP EVENTS                                                               */
/* -------------------------------------------------------------------------- */

export async function createGroupEventAction(data: {
  groupId: string;
  title: string;
  description: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  imageUrl?: string;
}) {
  const session = await requireAuth();
  const meId = session.user.id as string;

  const title = data.title.trim();
  const description = data.description.trim();
  if (!title) throw new Error("Title is required");
  if (!description) throw new Error("Description is required");

  const group = await prisma.group.findUnique({
    where: { id: data.groupId },
    select: { id: true, status: true },
  });
  if (!group || group.status !== ("APPROVED" as any)) {
    throw new Error("Group not found");
  }

  const meRole = await prisma.groupMember.findFirst({
    where: { groupId: data.groupId, userId: meId },
    select: { role: true },
  });
  if (!meRole || !["PRESIDENT", "ADMIN"].includes(meRole.role as string)) {
    throw new Error("Not authorized");
  }

  const startsAt = new Date(data.startsAt);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Invalid startsAt");

  const endsAt = data.endsAt ? new Date(data.endsAt) : null;
  if (endsAt && Number.isNaN(endsAt.getTime())) throw new Error("Invalid endsAt");

  await prisma.event.create({
    data: {
      title,
      description,
      location: data.location?.trim() || null,
      startsAt,
      endsAt,
      createdById: meId,
      groupId: data.groupId,
      imageUrl: data.imageUrl?.trim() || null,
    },
  });

  return { ok: true };
}

export async function createGroupEvent(data: {
  groupId: string;
  title: string;
  description: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  imageUrl?: string;
}) {
  const session = await requireAuth();
  const meId = session.user.id as string;

  const title = data.title.trim();
  const description = data.description.trim();
  if (!title) throw new Error("Title is required");
  if (!description) throw new Error("Description is required");
  if (!data.startsAt) throw new Error("Start date/time is required");

  const group = await prisma.group.findUnique({
    where: { id: data.groupId },
    select: { id: true, status: true },
  });
  if (!group || group.status !== ("APPROVED" as any)) {
    throw new Error("Group not found");
  }

  const me = await prisma.groupMember.findFirst({
    where: { groupId: group.id, userId: meId },
    select: { role: true },
  });
  if (!me || !["PRESIDENT", "ADMIN"].includes(me.role as string)) {
    throw new Error("Not authorized");
  }

  const startsAt = new Date(data.startsAt);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Invalid startsAt");

  const endsAt = data.endsAt ? new Date(data.endsAt) : null;
  if (endsAt && Number.isNaN(endsAt.getTime())) throw new Error("Invalid endsAt");

  const event = await prisma.event.create({
    data: {
      title,
      description,
      location: data.location?.trim() || null,
      startsAt,
      endsAt,
      createdById: meId,
      groupId: group.id,
      imageUrl: data.imageUrl?.trim() || null,
    },
    select: { id: true },
  });

  return { ok: true, id: event.id };
}