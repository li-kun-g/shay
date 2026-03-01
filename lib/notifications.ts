import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

export async function createNotification(input: {
  userId: string;
  type?: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  actorId?: string | null;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type ?? "SYSTEM",
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
      actorId: input.actorId ?? null,
    },
  });
}

export async function createNotificationsBulk(
  items: Array<{
    userId: string;
    type?: NotificationType;
    title: string;
    body?: string | null;
    href?: string | null;
    actorId?: string | null;
  }>
) {
  if (items.length === 0) return { count: 0 };

  return prisma.notification.createMany({
    data: items.map((x) => ({
      userId: x.userId,
      type: x.type ?? "SYSTEM",
      title: x.title,
      body: x.body ?? null,
      href: x.href ?? null,
      actorId: x.actorId ?? null,
    })),
  });
}

/**
 * Safe helper: notification failure should not break the main flow
 * (e.g. admin approving/rejecting group creation request).
 */
export async function createNotificationSafe(input: {
  userId: string;
  type?: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  actorId?: string | null;
}) {
  try {
    return await createNotification(input);
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}