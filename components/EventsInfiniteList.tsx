"use client";

import { useEffect, useRef, useState } from "react";
import EventCard from "@/components/EventCard";
import { useI18n } from "@/components/LanguageProvider";

type MiniUser = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  emoji: string | null;
};

type Creator = {
  username: string;
  name: string | null;
  image: string | null;
  emoji: string | null;
};

type GroupMini = {
  slug: string;
  name: string;
  image: string | null;
};

type EventItem = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  startsAt: string;
  createdBy: Creator;
  group?: GroupMini | null;
  goingCount: number;
  goingByMe: boolean;
  attendeesPreview?: MiniUser[];
  imageUrl?: string | null;
};

type SortKey = "soon" | "going" | "new";

function formatStartsAtLabel(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function EventsInfiniteList(props: {
  initialItems: EventItem[];
  initialCursor: string | null;
  sort: SortKey;
}) {
  const { t } = useI18n();

  const { initialItems, initialCursor, sort } = props;

  const [items, setItems] = useState<EventItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState<boolean>(!!initialCursor);
  const [loading, setLoading] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setCursor(initialCursor);
    setHasMore(!!initialCursor);
    setLoading(false);
  }, [initialItems, initialCursor]);

  async function loadMore() {
    if (loading || !hasMore || !cursor) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/events?sort=${sort}&cursor=${encodeURIComponent(cursor)}`, {
        cache: "no-store",
      });
      const data = await res.json();

      const next: EventItem[] = data.items ?? [];
      const nextCursor: string | null = data.nextCursor ?? null;

      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        const merged = [...prev];
        for (const it of next) if (!seen.has(it.id)) merged.push(it);
        return merged;
      });

      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) loadMore();
      },
      { root: null, rootMargin: "600px", threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, hasMore, loading, sort]);

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 text-center">{t("events.none")}</p>
      ) : (
        items.map((e) => (
          <EventCard
            key={e.id}
            event={{
              id: e.id,
              title: e.title,
              description: e.description,
              location: e.location,
              startsAtLabel: formatStartsAtLabel(e.startsAt),
              createdBy: e.createdBy,
              group: e.group ?? null,
              goingCount: e.goingCount,
              goingByMe: e.goingByMe,
              attendeesPreview: e.attendeesPreview ?? [],
              imageUrl: e.imageUrl ?? null,
            }}
          />
        ))
      )}

      <div ref={sentinelRef} />

      {items.length > 0 && (
        <div className="py-2 text-center text-xs text-gray-500">
          {loading ? t("common.loading") : hasMore ? "" : t("events.end")}
        </div>
      )}
    </div>
  );
}