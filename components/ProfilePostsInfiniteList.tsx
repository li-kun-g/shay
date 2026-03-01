"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Shaipost from "@/components/Shaipost";

export default function ProfilePostsInfiniteList(props: {
  username: string;
  myUserId: string | null;
}) {
  const { username, myUserId } = props;

  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const baseUrl = useMemo(() => {
    const safe = (username || "").trim().toLowerCase();
    return `/api/u/${encodeURIComponent(safe)}/posts`;
  }, [username]);

  async function loadFirst() {
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch(baseUrl, { cache: "no-store" });
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setNextCursor(data.nextCursor ?? null);
      setDone(!data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (loading || done || !nextCursor) return;
    setLoading(true);
    try {
      const url = `${baseUrl}?cursor=${encodeURIComponent(nextCursor)}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      const newItems = Array.isArray(data.items) ? data.items : [];
      setItems((prev) => {
        const seen = new Set(prev.map((x: any) => x.id));
        const merged = [...prev];
        for (const it of newItems) if (!seen.has(it.id)) merged.push(it);
        return merged;
      });

      setNextCursor(data.nextCursor ?? null);
      setDone(!data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { root: null, rootMargin: "600px", threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextCursor, done, loading, baseUrl]);

  return (
    <div className="space-y-3">
      {items.map((post: any) => (
        <Shaipost key={post.id} post={post} myUserId={myUserId} />
      ))}

      {!done && (
        <div ref={sentinelRef} className="py-6 text-center text-sm text-gray-500">
          {loading ? "Loading…" : " "}
        </div>
      )}

      {done && items.length > 0 && (
        <div className="py-6 text-center text-xs text-gray-400">End of posts.</div>
      )}

      {done && items.length === 0 && (
        <div className="py-6 text-center text-sm text-gray-500">No posts yet.</div>
      )}
    </div>
  );
}
