"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type FriendItem = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  emoji: string | null;
  major: string | null;
  college: string;
};

export default function ProfileFriendsInfiniteList({
  username,
}: {
  username: string;
}) {
  const [query, setQuery] = useState("");
  const [inputValue, setInputValue] = useState("");

  const [items, setItems] = useState<FriendItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // small debounce for search
  useEffect(() => {
    const t = setTimeout(() => setQuery(inputValue.trim()), 250);
    return () => clearTimeout(t);
  }, [inputValue]);

  const baseUrl = useMemo(() => {
    const safe = (username || "").trim().toLowerCase();
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    return `/api/u/${encodeURIComponent(safe)}/friends?${sp.toString()}`;
  }, [username, query]);

  async function loadFirst() {
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch(baseUrl, { cache: "no-store" });
      const data = await res.json();

      const nextItems = Array.isArray(data.items) ? data.items : [];
      setItems(nextItems);
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
        const seen = new Set(prev.map((x) => x.id));
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
    <section className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Friends</h2>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search friends..."
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => setInputValue("")}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>

      {items.length === 0 && !loading ? (
        <p className="text-sm text-gray-500">
          {query ? "No friends found for this search." : "No friends yet."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((f) => (
            <Link
              key={f.id}
              href={`/u/${f.username}`}
              className="rounded-xl border p-3 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full border bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                  {f.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.image}
                      alt={f.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">{f.emoji ?? "☕"}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="font-medium break-words">@{f.username}</div>
                  {f.name && (
                    <div className="text-sm text-gray-600 break-words">{f.name}</div>
                  )}
                  <div className="text-xs text-gray-400 truncate">
                    {f.major ?? "Undeclared"} · {f.college}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!done && (
        <div ref={sentinelRef} className="py-4 text-center text-sm text-gray-500">
          {loading ? "Loading…" : " "}
        </div>
      )}

      {done && items.length > 0 && (
        <div className="py-2 text-center text-xs text-gray-400">
          End of friends list.
        </div>
      )}
    </section>
  );
}