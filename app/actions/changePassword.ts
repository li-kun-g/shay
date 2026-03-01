"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export type ChangePasswordState =
  | { ok: true; message: string }
  | { ok: false; message: string };

function safeStr(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v : "";
}

export async function changePassword(
  _prevState: ChangePasswordState | null,
  formData: FormData
): Promise<ChangePasswordState> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !("id" in session.user)) {
      return { ok: false, message: "Please sign in again." };
    }

    const myId = session.user.id as string;

    const currentPassword = safeStr(formData.get("currentPassword")).trim();
    const newPassword = safeStr(formData.get("newPassword")).trim();
    const confirmPassword = safeStr(formData.get("confirmPassword")).trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { ok: false, message: "Please fill in all fields." };
    }

    if (newPassword !== confirmPassword) {
      return { ok: false, message: "New passwords do not match." };
    }

    if (newPassword.length < 8) {
      return { ok: false, message: "New password must be at least 8 characters." };
    }

    // optional: prevent super long passwords (DoS-ish)
    if (newPassword.length > 128) {
      return { ok: false, message: "New password is too long." };
    }

    const me = await prisma.user.findUnique({
      where: { id: myId },
      select: { id: true, passwordHash: true },
    });

    if (!me) return { ok: false, message: "User not found." };

    // If user signed up with OAuth only and has no passwordHash
    if (!me.passwordHash) {
      return {
        ok: false,
        message:
          "This account doesn’t have a password yet (it was created via Google/SSO).",
      };
    }

    const valid = await bcrypt.compare(currentPassword, me.passwordHash);
    if (!valid) {
      return { ok: false, message: "Current password is incorrect." };
    }

    // Prevent “change to the same password”
    const same = await bcrypt.compare(newPassword, me.passwordHash);
    if (same) {
      return { ok: false, message: "New password must be different." };
    }

    const nextHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: myId },
      data: { passwordHash: nextHash },
    });

    // Optional: kick all sessions (forces re-login everywhere).
    // If you DON'T want that behavior, delete this block.
    await prisma.session.deleteMany({ where: { userId: myId } });

    revalidatePath("/settings/security");

    return { ok: true, message: "Password updated. Please sign in again." };
  } catch (e) {
    console.error("changePassword error:", e);
    return { ok: false, message: "Something went wrong. Try again." };
  }
}