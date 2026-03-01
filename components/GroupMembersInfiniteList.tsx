"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Item = {
  id: string;
  role: string;
  position: string | null;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
    emoji: string | null;
    major: string | null;
    college: string;
  };
};

export default function GroupMembersInfiniteList({ slug }: { slug: string }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const baseUrl = useMemo(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    const qs = sp.toString();
    return qs
      ? `/api/g/${encodeURIComponent(slug)}/members?${qs}`
      : `/api/g/${encodeURIComponent(slug)}/members`;
  }, [slug, q]);

  function withCursor(url: string, cursor: string) {
    // Works whether url already has ? or not
    const u = new URL(url, window.location.origin);
    u.searchParams.set("cursor", cursor);
    return u.pathname + "?" + u.searchParams.toString();
  }

  async function loadFirst() {
    setLoading(true);
    setForbidden(false);
    setDone(false);

    try {
      const res = await fetch(baseUrl, { cache: "no-store" });

      if (res.status === 403) {
        setForbidden(true);
        setItems([]);
        setNextCursor(null);
        setDone(true);
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data?.items) ? data.items : [];
      setItems(list);
      setNextCursor(data?.nextCursor ?? null);
      setDone(!data?.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (loading || done || !nextCursor) return;

    setLoading(true);
    try {
      const url = withCursor(baseUrl, nextCursor);
      const res = await fetch(url, { cache: "no-store" });

      const data = await res.json();
      const list = Array.isArray(data?.items) ? data.items : [];

      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        const merged = [...prev];
        for (const it of list) if (!seen.has(it.id)) merged.push(it);
        return merged;
      });

      setNextCursor(data?.nextCursor ?? null);
      setDone(!data?.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFirst();
  }, [baseUrl]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { root: null, rootMargin: "500px", threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [nextCursor, done, loading, baseUrl]);

  if (forbidden) {
    return (
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-base font-semibold">Members list is private</div>
        <div className="mt-1 text-sm text-gray-500">
          Only group members can view this list.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search members…"
        className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
      />

      {loading && items.length === 0 ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">No members found.</div>
      ) : (
        <div className="space-y-2">
          {items.map((m) => (
            <Link
              key={m.id}
              href={`/u/${m.user.username}`}
              className="block rounded-xl border p-3 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                  {m.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.user.image}
                      alt={m.user.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{m.user.emoji ?? "☕"}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-medium break-words">@{m.user.username}</div>
                  {m.user.name && (
                    <div className="text-xs text-gray-500 break-words">{m.user.name}</div>
                  )}
                  <div className="text-xs text-gray-400 truncate">
                    {m.role}
                    {m.position ? ` · ${m.position}` : ""}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!done && (
        <div ref={sentinelRef} className="py-3 text-center text-sm text-gray-500">
          {loading ? "Loading more…" : " "}
        </div>
      )}

      {done && items.length > 0 && (
        <div className="py-2 text-center text-xs text-gray-400">End of members.</div>
      )}
    </section>
  );
}