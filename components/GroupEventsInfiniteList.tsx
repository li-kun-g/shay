"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import EventCard from "@/components/EventCard";

type SortKey = "soon" | "going" | "new";

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

type MiniUser = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  emoji: string | null;
};

type Item = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  startsAtLabel: string;
  createdBy: Creator;
  group?: GroupMini | null;
  goingCount: number;
  goingByMe: boolean;
  attendeesPreview?: MiniUser[];
  imageUrl?: string | null;
};

export default function GroupEventsInfiniteList(props: {
  groupId: string;
  sort: SortKey;
}) {
  const { groupId, sort } = props;

  const [items, setItems] = useState<Item[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialDone, setInitialDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const baseUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set("groupId", groupId);
    p.set("sort", sort);
    return `/api/group-events?${p.toString()}`;
  }, [groupId, sort]);

  async function loadMore(mode: "reset" | "append") {
    if (loading) return;
    if (mode === "append" && nextCursor === null && initialDone) return;

    setLoading(true);
    setError(null);

    try {
      const url =
        mode === "append" && nextCursor
          ? `${baseUrl}&cursor=${encodeURIComponent(nextCursor)}`
          : baseUrl;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load events");

      const data = await res.json();

      setItems((prev) => (mode === "reset" ? data.items : [...prev, ...data.items]));
      setNextCursor(data.nextCursor ?? null);
      setInitialDone(true);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
      setInitialDone(true);
    } finally {
      setLoading(false);
    }
  }

  // reset when sort/group changes
  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    setInitialDone(false);
    void loadMore("reset");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl]);

  // infinite observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (loading) return;
        if (nextCursor === null && initialDone) return;
        void loadMore("append");
      },
      { rootMargin: "600px" } // start loading earlier
    );

    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, nextCursor, initialDone, baseUrl]);

  if (error) {
    return (
      <div className="rounded-2xl border bg-white p-4 text-sm text-red-700 shadow-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!initialDone && (
        <div className="rounded-2xl border bg-white p-4 text-sm text-gray-500 shadow-sm">
          Loading…
        </div>
      )}

      {initialDone && items.length === 0 ? (
        <div className="text-sm text-gray-500">No events yet.</div>
      ) : (
        items.map((e) => (
          <EventCard
            key={e.id}
            event={{
              id: e.id,
              title: e.title,
              description: e.description,
              location: e.location,
              startsAtLabel: e.startsAtLabel,
              createdBy: e.createdBy,
              group: e.group,
              goingCount: e.goingCount,
              goingByMe: e.goingByMe,
              attendeesPreview: e.attendeesPreview ?? [],
              imageUrl: e.imageUrl ?? null,
            }}
          />
        ))
      )}

      {/* sentinel */}
      <div ref={sentinelRef} />

      {initialDone && loading && (
        <div className="text-center text-sm text-gray-500 py-2">Loading more…</div>
      )}

      {initialDone && !loading && nextCursor === null && items.length > 0 && (
        <div className="text-center text-xs text-gray-400 py-2">End.</div>
      )}
    </div>
  );
}
