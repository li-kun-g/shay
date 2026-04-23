export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import MessageComposer from "@/components/MessageComposer";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

type Params = { id: string };

type ConversationMemberItem = {
  userId: string;
  user: {
    username: string;
    name: string | null;
    image: string | null;
  };
};

type ConversationMessageItem = {
  id: string;
  text: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    image: string | null;
  };
};

type ConversationPageData = {
  id: string;
  type: "DIRECT" | "GROUP";
  name: string | null;
  dmKey: string | null;
  members: ConversationMemberItem[];
  messages: ConversationMessageItem[];
};

function isSupportConversation(convo: { dmKey: string | null }) {
  return typeof convo?.dmKey === "string" && convo.dmKey.startsWith("support:");
}

export default async function ThreadPage(props: {
  params: Params | Promise<Params>;
}) {
  const p = await Promise.resolve(props.params);
  const id = (p?.id ?? "").trim();
  if (!id) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user || !("id" in session.user)) redirect("/signin");

  const myId = session.user.id as string;

  const convo = (await prisma.conversation.findUnique({
    where: { id },
    include: {
      members: {
        select: {
          userId: true,
          user: { select: { username: true, name: true, image: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
        include: { author: { select: { id: true, username: true, image: true } } },
      },
    },
  })) as ConversationPageData | null;

  if (!convo) notFound();

  const isMember = convo.members.some((m: ConversationMemberItem) => m.userId === myId);
  if (!isMember) notFound();

  await prisma.conversationMember.updateMany({
    where: {
      conversationId: convo.id,
      userId: myId,
    },
    data: {
      lastReadAt: new Date(),
    },
  });

  const support = isSupportConversation(convo);

  const title = support
    ? "Administration"
    : convo.type === "GROUP"
      ? convo.name ?? "Group"
      : `@${convo.members.find((m: ConversationMemberItem) => m.userId !== myId)?.user.username ?? "unknown"}`;

  const hasMessages = convo.messages.length > 0;

  return (
    <main className="mx-auto max-w-md px-3 py-4 md:max-w-2xl md:px-6 space-y-3">
      <div className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-[var(--surface)]">
        <div className="font-semibold">{title}</div>

        {!support && convo.type === "GROUP" && (
          <div className="text-xs text-gray-500 mt-1">
            Members: {convo.members.map((m: ConversationMemberItem) => `@${m.user.username}`).join(", ")}
          </div>
        )}

        {support && (
          <div className="text-xs text-gray-500 mt-1">
            Contact Shay administration for reports, suggestions, and complaints.
          </div>
        )}
      </div>

      {!hasMessages ? (
        <div className="text-sm text-gray-500 px-1">
          {support
            ? "Describe your issue or suggestion — we’ll respond soon."
            : "No messages yet."}
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-4 space-y-2 shadow-sm dark:bg-[var(--surface)]">
          {convo.messages.map((m: ConversationMessageItem) => {
            const mine = m.author?.id === myId;

            const label = support
              ? mine
                ? "You"
                : "Administration"
              : `@${m.author.username}`;

            const avatarSrc = m.author?.image ?? null;
            const avatarFallback = support
              ? mine
                ? "Y"
                : "A"
              : (m.author.username?.[0] ?? "?").toUpperCase();

            return (
              <div
                key={m.id}
                className={"flex items-end gap-2 text-sm " + (mine ? "justify-end" : "justify-start")}
              >
                {!mine && (
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border bg-gray-100">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={label} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-gray-600">
                        {avatarFallback}
                      </div>
                    )}
                  </div>
                )}

                <div className={mine ? "text-right" : "text-left"}>
                  <div className="text-xs text-gray-500">{label}</div>
                  <div
                    className={
                      "inline-block rounded-2xl px-3 py-2 border " +
                      (mine ? "bg-black text-white" : "bg-white dark:bg-transparent")
                    }
                  >
                    {m.text}
                  </div>
                </div>

                {mine && (
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border bg-gray-100">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={label} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-gray-600">
                        {avatarFallback}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-[var(--surface)]">
        <MessageComposer conversationId={convo.id} />
      </div>
    </main>
  );
}
