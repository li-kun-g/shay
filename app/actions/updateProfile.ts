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
  name?: string;     // ✅ NEW
  username?: string; // ✅ NEW
  image?: string;
  status?: string;
  major?: string;
  yearOfStudy?: number | null;
  emoji?: string;
  college?: string;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, username: true },
  });

  if (!user) return { error: "User not found" };

  // ✅ Проверяем и валидируем юзернейм
  let newUsername = input.username?.trim().toLowerCase();
  if (newUsername) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(newUsername)) {
      return { error: "Username must be 3-20 characters long and contain only letters, numbers, and underscores." };
    }

    if (newUsername !== user.username) {
      const existing = await prisma.user.findUnique({
        where: { username: newUsername },
        select: { id: true },
      });
      if (existing) {
        return { error: "This username is already taken. Please choose another one." };
      }
    }
  } else {
    newUsername = undefined; // Если прислали пустую строку, не трогаем юзернейм
  }

  const collegeRaw = input.college?.trim();
  const college =
    collegeRaw && ALLOWED_COLLEGES.has(collegeRaw) ? collegeRaw : undefined;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: input.name?.trim() || null,
      ...(newUsername ? { username: newUsername } : {}),
      image: input.image?.trim() || null,
      status: input.status?.trim() || null,
      major: input.major?.trim() || null,
      yearOfStudy: input.yearOfStudy ?? null,
      emoji: input.emoji?.trim() || "☕",
      ...(college !== undefined ? { college } : {}),
    },
  });

  revalidatePath("/u");
  revalidatePath("/settings");
  
  return { success: true, username: newUsername || user.username };
}