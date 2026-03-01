export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import MessageComposer from "@/components/MessageComposer";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

type Params = { id: string };

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

  const convo = await prisma.conversation.findUnique({
    where: { id },
    include: {
      members: {
        select: {
          userId: true,
          user: { select: { username: true, name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
        include: { author: { select: { id: true, username: true } } },
      },
    },
  });

  if (!convo) notFound();

  const isMember = convo.members.some((m) => m.userId === myId);
  if (!isMember) notFound();

  // ✅ mark this conversation as read when opened
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
      : `@${convo.members.find((m) => m.userId !== myId)?.user.username ?? "unknown"}`;

  const hasMessages = convo.messages.length > 0;

  return (
    <main className="mx-auto max-w-md px-3 py-4 md:max-w-2xl md:px-6 space-y-3">
      <div className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-[var(--surface)]">
        <div className="font-semibold">{title}</div>

        {!support && convo.type === "GROUP" && (
          <div className="text-xs text-gray-500 mt-1">
            Members: {convo.members.map((m) => `@${m.user.username}`).join(", ")}
          </div>
        )}

        {support && (
          <div className="text-xs text-gray-500 mt-1">
            Contact KIMEPish administration for reports, suggestions, and complaints.
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
          {convo.messages.map((m) => {
            const mine = m.author?.id === myId;

            const label = support
              ? mine
                ? "You"
                : "Administration"
              : `@${m.author.username}`;

            return (
              <div
                key={m.id}
                className={"text-sm " + (mine ? "text-right" : "text-left")}
              >
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