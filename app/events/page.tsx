export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EventsInfiniteList from "@/components/EventsInfiniteList";

import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n";

type SortKey = "soon" | "going" | "new";

type EventRow = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  startsAt: Date;
  createdAt: Date;
  imageUrl?: string | null;
  createdBy: {
    username: string;
    name: string | null;
    image: string | null;
    emoji: string;
  };
  group: {
    slug: string;
    image: string | null;
    name: string;
  } | null;
  _count: {
    attendees: number;
  };
};

type AttendancePreviewRow = {
  eventId: string;
  user: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
    emoji: string | null;
  };
};

type MyAttendanceRow = {
  eventId: string;
};

const LANG_COOKIE = "kimepish-lang";

function getSort(sp: Record<string, string | string[] | undefined>): SortKey {
  const raw = Array.isArray(sp.sort) ? sp.sort[0] : sp.sort;
  return raw === "soon" || raw === "going" || raw === "new" ? raw : "soon";
}

export default async function EventsPage(props: {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const sp = (await Promise.resolve(
    props.searchParams ?? {}
  )) as Record<string, string | string[] | undefined>;

  const sort = getSort(sp);

  const session = await getServerSession(authOptions);
  const myId =
    session?.user && "id" in session.user ? (session.user.id as string) : null;

  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LANG_COOKIE)?.value as Lang | undefined;

  let lang: Lang =
    cookieLang && ["EN", "RU", "KK"].includes(cookieLang) ? cookieLang : "EN";

  const me = myId
    ? await prisma.user.findUnique({
        where: { id: myId },
        select: { isOfficial: true, isGroupAccount: true, language: true },
      })
    : null;

  if (me?.language) lang = me.language as Lang;

  const dict = getDict(lang);
  const canPublish = !!me && (me.isOfficial || me.isGroupAccount);

  const sortLabel = (k: SortKey) => {
    if (k === "soon") return dict["events.sort.soon"];
    if (k === "going") return dict["events.sort.going"];
    return dict["events.sort.new"];
  };

  const orderBy: Array<Record<string, unknown>> =
    sort === "new"
      ? [{ createdAt: "desc" }]
      : sort === "going"
      ? [{ attendees: { _count: "desc" } }, { startsAt: "asc" }]
      : [{ startsAt: "asc" }];

  const events: EventRow[] = await prisma.event.findMany({
    orderBy,
    take: 15,
    include: {
      createdBy: {
        select: { username: true, name: true, image: true, emoji: true },
      },
      _count: { select: { attendees: true } },
      group: { select: { slug: true, image: true, name: true } },
    },
  });

  const eventIds = events.map((e: EventRow) => e.id);

  const attendanceRows: AttendancePreviewRow[] =
    eventIds.length === 0
      ? []
      : await prisma.eventAttendance.findMany({
          where: { eventId: { in: eventIds } },
          orderBy: { createdAt: "desc" },
          select: {
            eventId: true,
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
                emoji: true,
              },
            },
          },
        });

  const previewMap = new Map<
    string,
    {
      id: string;
      username: string;
      name: string | null;
      image: string | null;
      emoji: string | null;
    }[]
  >();

  for (const row of attendanceRows) {
    const arr = previewMap.get(row.eventId) ?? [];
    if (arr.length < 3) {
      arr.push(row.user);
      previewMap.set(row.eventId, arr);
    }
  }

  const myGoingSet = new Set<string>();
  if (myId && eventIds.length > 0) {
    const mine: MyAttendanceRow[] = await prisma.eventAttendance.findMany({
      where: { userId: myId, eventId: { in: eventIds } },
      select: { eventId: true },
    });

    for (const r of mine) myGoingSet.add(r.eventId);
  }

  const initialCursor = events.length === 15 ? events[events.length - 1].id : null;

  const btn = (k: SortKey) =>
    "inline-flex items-center rounded-xl border px-3 py-1.5 text-sm " +
    (sort === k ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50");

  const initialItems = events.map((e: EventRow) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startsAt: e.startsAt.toISOString(),
    createdBy: e.createdBy,
    group: e.group,
    goingCount: e._count.attendees,
    goingByMe: myGoingSet.has(e.id),
    attendeesPreview: previewMap.get(e.id) ?? [],
    imageUrl: e.imageUrl ?? null,
  }));

  return (
    <main className="mx-auto max-w-md px-3 py-4 md:max-w-2xl md:px-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{dict["events.title"]}</h1>

        <Link
          href={canPublish ? "/events/new" : "/events/request"}
          className="rounded-xl bg-black px-4 py-2 text-sm text-white"
        >
          {canPublish ? dict["events.create"] : dict["events.request"]}
        </Link>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/events?sort=soon" className={btn("soon")}>
          {sortLabel("soon")}
        </Link>
        <Link href="/events?sort=going" className={btn("going")}>
          {sortLabel("going")}
        </Link>
        <Link href="/events?sort=new" className={btn("new")}>
          {sortLabel("new")}
        </Link>
      </div>

      <EventsInfiniteList
        initialItems={initialItems}
        initialCursor={initialCursor}
        sort={sort}
      />
    </main>
  );
}