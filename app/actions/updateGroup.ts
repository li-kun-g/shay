// app/actions/updateGroup.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function norm(s: FormDataEntryValue | null) {
  if (typeof s !== "string") return "";
  return s.trim();
}

export async function updateGroup(
  slug: string,
  formData: FormData
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) {
    throw new Error("AUTH_REQUIRED");
  }
  const myId = session.user.id as string;

  const name = norm(formData.get("name"));
  const description = norm(formData.get("description"));
  const image = norm(formData.get("image")); // "logo URL" field

  if (!slug) throw new Error("BAD_REQUEST");
  if (!name) throw new Error("Group name required");

  const group = await prisma.group.findUnique({
    where: { slug },
    select: { id: true, slug: true, presidentId: true },
  });

  if (!group) throw new Error("NOT_FOUND");

  // ✅ Authorization: President OR Admin member
  const isPresident = group.presidentId === myId;

  // If your schema uses GroupMember.role with "ADMIN", this works.
  // If your role name differs, adjust the string.
  const adminRow = await prisma.groupMember.findFirst({
    where: { groupId: group.id, userId: myId, role: "ADMIN" as any },
    select: { id: true },
  });

  const isAdmin = !!adminRow;

  if (!isPresident && !isAdmin) {
    throw new Error("FORBIDDEN");
  }

  await prisma.group.update({
    where: { id: group.id },
    data: {
      name,
      description: description || null,
      image: image || null,
    },
  });

  // Refresh group page
  revalidatePath(`/g/${slug}`);
  revalidatePath(`/g/${slug}?tab=about`);
  redirect(`/g/${slug}?tab=about`);
}
