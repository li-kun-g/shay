"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type DmPrivacy = "EVERYONE" | "FRIENDS_ONLY";
type ProfileVisibility = "EVERYONE" | "FRIENDS_ONLY";

const PROFILE_VIS_VALUES = new Set<ProfileVisibility>(["EVERYONE", "FRIENDS_ONLY"]);
const DM_VALUES = new Set<DmPrivacy>(["EVERYONE", "FRIENDS_ONLY"]);

export async function updateAccountPrivacy(formData: FormData) {
  const session = await getServerSession(authOptions);

  // 1. Fixed TypeScript error: explicit return prevents "possibly null" warning
  if (!session?.user) {
    redirect("/signin");
    return; 
  }

  // 2. Safe access to the user ID from your session callback
  const myId = (session.user as any).id as string;

  const friendsListVisibilityRaw = String(formData.get("friendsListVisibility") ?? "");
  const groupsVisibilityRaw = String(formData.get("groupsVisibility") ?? "");
  const dmPrivacyRaw = String(formData.get("dmPrivacy") ?? "");

  const friendsListVisibility = PROFILE_VIS_VALUES.has(
    friendsListVisibilityRaw as ProfileVisibility
  )
    ? (friendsListVisibilityRaw as ProfileVisibility)
    : "EVERYONE";

  const groupsVisibility = PROFILE_VIS_VALUES.has(groupsVisibilityRaw as ProfileVisibility)
    ? (groupsVisibilityRaw as ProfileVisibility)
    : "EVERYONE";

  const dmPrivacy = DM_VALUES.has(dmPrivacyRaw as DmPrivacy)
    ? (dmPrivacyRaw as DmPrivacy)
    : "EVERYONE";

  const updated = await prisma.user.update({
    where: { id: myId },
    data: {
      friendsListVisibility: friendsListVisibility as any,
      groupsVisibility: groupsVisibility as any,
      dmPrivacy: dmPrivacy as any,
    },
    select: { username: true },
  });

  // 3. Revalidate tells Next.js to refresh the data cache
  revalidatePath("/settings/privacy");
  revalidatePath("/u");
  if (updated.username) {
    revalidatePath(`/u/${updated.username}`);
  }

  // 4. Removed final redirect. 
  // This allows the Client Component state to stay alive and show the success box!
}