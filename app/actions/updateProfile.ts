"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const ALLOWED_COLLEGES = new Set([
  "Bang College of Business",
  "College of Social Sciences",
  "School of Law",
  "School of Humanities and Education",
  "School of Mathematics and Computer Science",
  "Other",
]);

export async function updateProfile(input: {
  image?: string;
  status?: string;
  major?: string;
  yearOfStudy?: number | null;
  emoji?: string;
  college?: string; // ✅ NEW
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) throw new Error("User not found");

  const collegeRaw = input.college?.trim();
  const college =
    collegeRaw && ALLOWED_COLLEGES.has(collegeRaw) ? collegeRaw : undefined;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      image: input.image?.trim() || null,
      status: input.status?.trim() || null,
      major: input.major?.trim() || null,
      yearOfStudy: input.yearOfStudy ?? null,
      emoji: input.emoji?.trim() || "☕",

      // ✅ only update college if it’s valid
      ...(college !== undefined ? { college } : {}),
    },
  });

  revalidatePath("/u");
  revalidatePath("/settings");
}
