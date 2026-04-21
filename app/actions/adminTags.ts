"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("UNAUTHORIZED");
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { isOfficial: true },
  });
  if (!user?.isOfficial) throw new Error("UNAUTHORIZED");
}

export async function createTag(formData: FormData) {
  await requireAdmin();

  const name = (formData.get("name") as string ?? "").trim();
  const slug = (formData.get("slug") as string ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
  const emoji = (formData.get("emoji") as string ?? "").trim();
  const order = parseInt(formData.get("order") as string ?? "99", 10);

  if (!name || !slug) return { error: "Name and slug are required" };

  const existing = await prisma.postTag.findUnique({ where: { slug } });
  if (existing) return { error: "A tag with this slug already exists" };

  await prisma.postTag.create({ data: { name, slug, emoji, order } });

  revalidatePath("/admin/tags");
  revalidatePath("/");
}

export async function deleteTag(id: string) {
  await requireAdmin();

  const tag = await prisma.postTag.findUnique({ where: { id } });
  if (!tag) return { error: "Tag not found" };
  if (tag.slug === "OTHER") return { error: "Cannot delete the default tag" };

  // Move all posts with this tag to OTHER
  await prisma.post.updateMany({
    where: { category: tag.slug },
    data: { category: "OTHER" },
  });

  await prisma.postTag.delete({ where: { id } });

  revalidatePath("/admin/tags");
  revalidatePath("/");
}
