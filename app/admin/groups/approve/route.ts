import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NotificationType } from "@prisma/client";
import { createNotificationSafe } from "@/lib/notifications";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) redirect("/signin");

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isOfficial: true },
  });

  if (!admin?.isOfficial) redirect("/");

  const form = await req.formData();
  const id = String(form.get("id") ?? "").trim();
  if (!id) redirect("/admin/groups");

  const request = await prisma.groupCreateRequest.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      requestedById: true,
      status: true,
    },
  });

  if (!request) redirect("/admin/groups");

  // Optional guard: avoid double-processing
  if (request.status !== "PENDING") {
    redirect("/admin/groups");
  }

  await prisma.$transaction([
    prisma.group.create({
      data: {
        name: request.name,
        slug: request.slug,
        description: request.description,
        image: request.image,
        status: "APPROVED",
        presidentId: request.requestedById,
        members: {
          create: {
            userId: request.requestedById,
            role: "PRESIDENT",
          },
        },
      },
    }),

    prisma.groupCreateRequest.update({
      where: { id: request.id },
      data: { status: "APPROVED" },
    }),
  ]);

  // Notify requester (safe: won't break admin flow if this fails)
  await createNotificationSafe({
    userId: request.requestedById,
    type: NotificationType.GROUP_CREATE_APPROVED,
    title: "Your group was approved",
    body: `${request.name} is now approved and visible.`,
    href: `/g/${request.slug}`,
    actorId: admin.id,
  });

  redirect("/admin/groups");
}