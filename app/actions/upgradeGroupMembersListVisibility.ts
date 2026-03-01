"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MembersListVisibility } from "@prisma/client";

const VALUES = new Set<MembersListVisibility>(["EVERYONE", "MEMBERS_ONLY"]);

export async function updateGroupMembersListVisibility(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) redirect("/signin");

  const myId = session.user.id as string;

  const groupId = String(formData.get("groupId") ?? "").trim();
  const raw = String(formData.get("membersListVisibility") ?? "").trim();

  if (!groupId) redirect("/settings/groups");

  const membersListVisibility: MembersListVisibility = VALUES.has(raw as MembersListVisibility)
    ? (raw as MembersListVisibility)
    : "EVERYONE";

  // ✅ Must be president or admin of that group
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, slug: true, presidentId: true },
  });

  if (!group) redirect("/settings/groups");

  const isPresident = group.presidentId === myId;

  let isAdminOrPresidentMember = false;
  if (!isPresident) {
    const gm = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: myId,
        role: { in: ["ADMIN", "PRESIDENT"] },
      },
      select: { id: true },
    });
    isAdminOrPresidentMember = !!gm;
  }

  if (!isPresident && !isAdminOrPresidentMember) redirect("/settings/groups");

  await prisma.group.update({
    where: { id: groupId },
    data: { membersListVisibility },
  });

  // ✅ Revalidate pages that read this value
  revalidatePath("/settings/groups");
  if (group.slug) {
    revalidatePath(`/g/${group.slug}`);
    revalidatePath(`/g/${group.slug}/members`);
  }

  // ✅ Force a fresh server render immediately so the <select> shows the new value
  redirect("/settings/groups");
}