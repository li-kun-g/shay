"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Shaipost from "@/components/Shaipost";
import { useI18n } from "@/components/LanguageProvider";

type AnyPost = any;

export default function FeedInfiniteList(props: {
  sort: "latest" | "top";
  cat: string | null;
  anon: "all" | "anon" | "non";
  myUserId: string | null;
}) {
  const { t } = useI18n();

  const { sort, cat, anon, myUserId } = props;

  const [items, setItems] = useState<AnyPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const baseUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set("sort", sort);
    if (cat) p.set("cat", cat);
    if (anon && anon !== "all") p.set("anon", anon);
    return `/api/feed?${p.toString()}`;
  }, [sort, cat, anon]);

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
      const url = `${baseUrl}&cursor=${encodeURIComponent(nextCursor)}`;
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
          {loading ? t("common.loading") : " "}
        </div>
      )}

      {done && items.length > 0 && (
        <div className="py-6 text-center text-xs text-gray-400">
          {t("feed.caughtUp")}
        </div>
      )}

      {done && items.length === 0 && (
        <div className="py-6 text-center text-sm text-gray-500">
          {t("feed.noPosts")}
        </div>
      )}
    </div>
  );
}