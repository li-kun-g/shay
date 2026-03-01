"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { CampusDuration as PrismaCampusDuration } from "@prisma/client";

type CampusVisibility = "ONLY_ME" | "FRIENDS" | "EVERYONE";
type CampusDurationUI = "2h" | "4h" | "eod";

// UI ("2h") -> Prisma enum ("H2")
function toPrismaDuration(d: CampusDurationUI): PrismaCampusDuration {
  if (d === "2h") return PrismaCampusDuration.H2;
  if (d === "4h") return PrismaCampusDuration.H4;
  return PrismaCampusDuration.EOD;
}

export async function setCampusPrefs(input: {
  visibility: CampusVisibility;
  duration: CampusDurationUI;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !("id" in session.user) || !session.user.id) {
    throw new Error("Unauthorized");
  }

  const myId = session.user.id as string;

  const me = await prisma.user.update({
    where: { id: myId },
    data: {
      campusStatusVisibility: input.visibility,
      campusStatusDuration: toPrismaDuration(input.duration),
    },
    select: { username: true },
  });

  revalidatePath("/settings/profile");
  if (me.username) revalidatePath(`/u/${me.username}`);
}
