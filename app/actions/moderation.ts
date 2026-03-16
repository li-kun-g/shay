"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Security Check: Verifies that the user is logged in 
 * and has 'isOfficial: true' in the database.
 */
async function checkAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error("Unauthorized: No session found");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isOfficial: true },
  });

  if (!dbUser || dbUser.isOfficial !== true) {
    throw new Error("Unauthorized: Official access required");
  }
}

export async function approvePost(postId: string) {
  try {
    await checkAdmin();
    
    await prisma.post.update({
      where: { id: postId },
      data: { status: "APPROVED" },
    });

    revalidatePath("/");
    revalidatePath("/admin/moderation");
    return { ok: true };
  } catch (error) {
    console.error("ApprovePost Error:", error);
    return { error: "FAILED_TO_APPROVE" };
  }
}

export async function rejectPost(postId: string) {
  try {
    await checkAdmin();
    
    // Changing status to REJECTED keeps a record in your DB.
    // If you prefer to hard-delete, use prisma.post.delete instead.
    await prisma.post.update({
      where: { id: postId },
      data: { status: "REJECTED" },
    });

    revalidatePath("/admin/moderation");
    return { ok: true };
  } catch (error) {
    console.error("RejectPost Error:", error);
    return { error: "FAILED_TO_REJECT" };
  }
}