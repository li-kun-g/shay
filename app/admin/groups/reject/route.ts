import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createNotificationSafe } from "@/lib/notifications";

type NotificationType =
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "POST_REPLY"
  | "POST_REACTION"
  | "EVENT_JOINED"
  | "EVENT_APPROVED"
  | "EVENT_REJECTED"
  | "GROUP_JOIN_APPROVED"
  | "GROUP_JOIN_REJECTED"
  | "GROUP_CREATE_APPROVED"
  | "GROUP_CREATE_REJECTED"
  | "SYSTEM";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) redirect("/signin");

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id as string },
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
      requestedById: true,
      status: true,
    },
  });

  if (!request) redirect("/admin/groups");

  if (request.status !== "PENDING") {
    redirect("/admin/groups");
  }

  await prisma.groupCreateRequest.update({
    where: { id: request.id },
    data: { status: "REJECTED" as any },
  });

  await createNotificationSafe({
    userId: request.requestedById,
    type: "GROUP_CREATE_REJECTED" as NotificationType,
    title: "Your group request was rejected",
    body: `${request.name} was not approved.`,
    href: "/groups/request",
    actorId: admin.id,
  });

  redirect("/admin/groups");
}