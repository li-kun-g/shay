// app/actions/setCampusStatus.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type CampusStatus = "ON" | "OFF" | null;
export type CampusVisibility = "ONLY_ME" | "FRIENDS" | "EVERYONE";
export type CampusDuration = "2h" | "4h" | "eod";

function computeExpiresAt(duration: CampusDuration) {
  const now = new Date();

  if (duration === "2h") return new Date(now.getTime() + 2 * 60 * 60 * 1000);
  if (duration === "4h") return new Date(now.getTime() + 4 * 60 * 60 * 1000);

  // eod = end of local day
  const eod = new Date(now);
  eod.setHours(23, 59, 59, 999);
  return eod;
}

// If your DB enum for duration is h2/h4/eod (recommended), map it here.
// If your DB stores "2h"/"4h"/"eod" directly, this still works because we accept both.
function normalizeDurationFromDb(v: any): CampusDuration {
  if (v === "h4" || v === "4h") return "4h";
  if (v === "eod") return "eod";
  return "2h"; // default for h2 / 2h / null / unknown
}

function normalizeVisibilityFromDb(v: any): CampusVisibility {
  if (v === "ONLY_ME" || v === "FRIENDS" || v === "EVERYONE") return v;
  return "EVERYONE";
}

export async function setCampusStatus(input: {
  status: CampusStatus; // ON | OFF | null

  // ✅ optional now: if not provided, we use saved prefs from DB
  visibility?: CampusVisibility;
  duration?: CampusDuration;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !("id" in session.user) || !session.user.id) {
    throw new Error("AUTH_REQUIRED");
  }

  const myId = session.user.id as string;

  // ✅ pull username + saved prefs from DB
  const me = await prisma.user.findUnique({
    where: { id: myId },
    select: {
      id: true,
      username: true,
      campusStatusVisibility: true,
      // ✅ this field must exist in your schema for duration prefs to persist
      campusStatusDuration: true as any,
    },
  });

  if (!me) throw new Error("AUTH_REQUIRED");

  const effectiveVisibility: CampusVisibility =
    input.visibility ?? normalizeVisibilityFromDb((me as any).campusStatusVisibility);

  const effectiveDuration: CampusDuration =
    input.duration ?? normalizeDurationFromDb((me as any).campusStatusDuration);

  const now = new Date();
  const expiresAt = input.status ? computeExpiresAt(effectiveDuration) : null;

  await prisma.user.update({
    where: { id: myId },
    data: {
      campusStatus: input.status,

      // ✅ status visibility should be the effective visibility (saved pref if not passed)
      campusStatusVisibility: effectiveVisibility,

      campusStatusUpdatedAt: input.status ? now : null,
      campusStatusExpiresAt: expiresAt,
    },
  });

  revalidatePath(`/u/${me.username}`);
  revalidatePath(`/`);
}

export async function clearCampusStatus() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !("id" in session.user) || !session.user.id) {
    throw new Error("AUTH_REQUIRED");
  }

  const myId = session.user.id as string;

  const me = await prisma.user.findUnique({
    where: { id: myId },
    select: { username: true },
  });

  // ✅ IMPORTANT: do NOT overwrite campusStatusVisibility here (prefs!)
  await prisma.user.update({
    where: { id: myId },
    data: {
      campusStatus: null,
      campusStatusUpdatedAt: null,
      campusStatusExpiresAt: null,
    },
  });

  if (me?.username) revalidatePath(`/u/${me.username}`);
  revalidatePath(`/`);
}
