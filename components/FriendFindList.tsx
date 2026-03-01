"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sendFriendRequest } from "@/app/actions/friends";
import { useI18n } from "@/components/LanguageProvider";

type Item = {
  id: string;
  username: string;
  status: "FRIENDS" | "PENDING_OUT" | "PENDING_IN" | "NONE";
};

function useDebouncedValue<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function normalizeQuery(raw: string) {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

export default function FriendFindList() {
  const { t } = useI18n();

  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, 250);
  const qNorm = normalizeQuery(qDebounced);

  const [items, setItems] = useState<Item[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);

  async function fetchPage(opts: { q: string; cursor: string | null }) {
    const params = new URLSearchParams();
    if (opts.q) params.set("q", opts.q);
    if (opts.cursor) params.set("cursor", opts.cursor);
    const url = `/api/users?${params.toString()}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
    return res.json() as Promise<{ items: Item[]; nextCursor: string | null }>;
  }

  async function loadFirst() {
    const reqId = ++requestIdRef.current;

    setLoading(true);
    setDone(false);
    setCursor(null);

    try {
      const json = await fetchPage({ q: qNorm, cursor: null });
      if (requestIdRef.current !== reqId) return;

      setItems(json.items ?? []);
      setCursor(json.nextCursor ?? null);
      setDone(!json.nextCursor || (json.items?.length ?? 0) === 0);
    } catch {
      if (requestIdRef.current !== reqId) return;
      setItems([]);
      setCursor(null);
      setDone(true);
    } finally {
      if (requestIdRef.current === reqId) setLoading(false);
    }
  }

  async function loadMore() {
    if (loading || done || !cursor) return;

    const reqId = requestIdRef.current;
    setLoading(true);

    try {
      const json = await fetchPage({ q: qNorm, cursor });
      if (requestIdRef.current !== reqId) return;

      const nextItems: Item[] = json.items ?? [];

      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        const merged = [...prev];
        for (const it of nextItems) if (!seen.has(it.id)) merged.push(it);
        return merged;
      });

      setCursor(json.nextCursor ?? null);
      if (!json.nextCursor || nextItems.length === 0) setDone(true);
    } catch {
      if (requestIdRef.current !== reqId) return;
      setDone(true);
    } finally {
      if (requestIdRef.current === reqId) setLoading(false);
    }
  }

  useEffect(() => {
    void loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qNorm]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) void loadMore();
      },
      { root: null, rootMargin: "600px", threshold: 0 }
    );

    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, done, loading]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border bg-white p-3 shadow-sm">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("friends.searchUsersPlaceholder")}
          className="w-full rounded-xl border px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        {items.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3 shadow-sm"
          >
            <Link href={`/u/${u.username}`} className="font-medium hover:underline">
              @{u.username}
            </Link>

            {u.status === "FRIENDS" ? (
              <span className="rounded-xl border px-4 py-2 text-sm text-gray-600">
                {t("friends.friends")} ✓
              </span>
            ) : u.status === "PENDING_OUT" ? (
              <span className="rounded-xl border px-4 py-2 text-sm text-gray-600">
                {t("friends.requested")}
              </span>
            ) : u.status === "PENDING_IN" ? (
              <span className="rounded-xl border px-4 py-2 text-sm text-gray-600">
                {t("friends.requestedYou")}
              </span>
            ) : (
              <form
                action={async () => {
                  await sendFriendRequest(u.id);
                  setItems((prev) =>
                    prev.map((x) =>
                      x.id === u.id ? { ...x, status: "PENDING_OUT" } : x
                    )
                  );
                }}
              >
                <button className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
                  {t("friends.add")}
                </button>
              </form>
            )}
          </div>
        ))}

        {items.length === 0 && !loading && (
          <div className="text-sm text-gray-500 text-center py-4">
            {t("friends.noUsersFound")}
          </div>
        )}

        <div ref={sentinelRef} />

        {loading && (
          <div className="text-sm text-gray-500 text-center py-2">
            {t("common.loading")}
          </div>
        )}
      </div>
    </div>
  );
}