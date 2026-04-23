export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

type ConversationUser = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  emoji: string | null;
};

type ConversationMember = {
  id: string;
  userId: string;
  lastReadAt?: Date | null;
  user: ConversationUser;
};

type ConversationMessage = {
  id: string;
  text: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
  };
};

type ConversationItem = {
  id: string;
  type: "DIRECT" | "GROUP" | string;
  name: string | null;
  dmKey: string | null;
  createdAt: Date;
  members: ConversationMember[];
  messages: ConversationMessage[];
};

function isSupportConversation(c: { dmKey: string | null }) {
  return typeof c.dmKey === "string" && c.dmKey.startsWith("support:");
}

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) redirect("/signin");

  const myId = session.user.id as string;

  const me = await prisma.user.findUnique({
    where: { id: myId },
    select: { username: true, isOfficial: true },
  });

  const myUsername = me?.username ?? undefined;
  const isAdmin = me?.isOfficial === true;

  const conversations: ConversationItem[] = await prisma.conversation.findMany({
    where: { members: { some: { userId: myId } } },
    take: 100,
    include: {
      members: {
        include: {
          user: {
            select: { id: true, username: true, name: true, image: true, emoji: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { author: { select: { id: true, username: true } } },
      },
    },
  });

  const visibleConversations = conversations
    .filter((c: ConversationItem) => {
      const support = isSupportConversation(c);
      if (support) return true;
      if (c.type === "GROUP") return true; // show even with 0 messages
      return c.messages.length > 0; // hide empty direct chats
    })
    .sort((a: ConversationItem, b: ConversationItem) => {
      const aActivity =
        a.messages[0]?.createdAt?.getTime?.() ??
        (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);

      const bActivity =
        b.messages[0]?.createdAt?.getTime?.() ??
        (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);

      return bActivity - aActivity;
    });

  const unreadCounts = await Promise.all(
    visibleConversations.map(async (c: ConversationItem) => {
      const myMember = c.members.find((m: ConversationMember) => m.user.id === myId);
      const lastReadAt = myMember?.lastReadAt ?? null;

      const unread = await prisma.message.count({
        where: {
          conversationId: c.id,
          authorId: { not: myId },
          ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
        },
      });

      return [c.id, unread] as const;
    })
  );

  const unreadMap = new Map(unreadCounts);

  return (
    <main className="flex flex-col items-center gap-2">

        <h1 className="text-xl font-semibold">Messages</h1>
        <div className="flex gap-2">
          <Link href="/messages/new" className="rounded-xl border px-3 py-2 text-sm">
            New DM
          </Link>
          <Link
            href="/messages/new-group"
            className="rounded-xl bg-black text-white px-3 py-2 text-sm"
          >
            New Group
          </Link>
        </div>


      <div className="space-y-2">
        {visibleConversations.map((c: ConversationItem) => {
          const last = c.messages[0];
          const support = isSupportConversation(c);
          const unreadCount = unreadMap.get(c.id) ?? 0;

          const otherMember = c.members.find((m: ConversationMember) => m.user.id !== myId);
          const otherUsername =
            otherMember?.user?.username ??
            c.members.find((m: ConversationMember) => m.user.username !== myUsername)?.user
              .username ??
            "unknown";

          const otherHandle = `@${otherUsername}`;

          const title = (() => {
            if (support) {
              return isAdmin ? `Administration — ${otherHandle}` : "Administration";
            }

            if (c.type === "GROUP") return c.name ?? "Group";

            return otherHandle;
          })();

          const lastLine = (() => {
            if (!last) {
              return c.type === "GROUP" ? "Group created" : "No messages yet";
            }

            if (support) {
              const isMe = last.author?.id === myId;

              if (isAdmin) {
                const who = isMe ? "You" : otherHandle;
                return `${who}: ${last.text}`;
              }

              const who = isMe ? "You" : "Administration";
              return `${who}: ${last.text}`;
            }

            return `@${last.author.username}: ${last.text}`;
          })();

          return (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="block rounded-2xl border bg-white p-4 hover:bg-gray-50 dark:bg-[var(--surface)] dark:hover:bg-white/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{title}</div>
                  <div className="text-xs text-gray-500 mt-1 truncate">{lastLine}</div>
                </div>

                {unreadCount > 0 && (
                  <div className="shrink-0 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-black text-white text-[11px] px-1.5">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}