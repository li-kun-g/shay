"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/LanguageProvider";

type Item = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
    emoji: string | null;
  } | null;
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function shouldHideActor(n: Item) {
  return n.type === "GROUP_CREATE_APPROVED" || n.type === "GROUP_CREATE_REJECTED";
}

export default function NotificationsList() {
  const { t } = useI18n();
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const baseUrl = useMemo(() => "/api/notifications", []);

  async function loadFirst() {
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch(baseUrl, { cache: "no-store" });
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
      const res = await fetch(`${baseUrl}?cursor=${encodeURIComponent(nextCursor)}`, {
        cache: "no-store",
      });
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

  async function markAllAsRead() {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  }

  async function markOneAsRead(id: string) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, isRead: true } : x)));

    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // keep optimistic
    }
  }

  async function openNotification(n: Item) {
    await markOneAsRead(n.id);
    if (n.href) router.push(n.href);
  }

  useEffect(() => {
    void loadFirst();
  }, []);

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
  }, [nextCursor, done, loading]);

  const unreadCount = items.filter((x) => !x.isRead).length;

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {unreadCount > 0
            ? `${unreadCount} ${t("notifications.unread")}`
            : t("notifications.allCaughtUp")}
        </div>

        <button
          type="button"
          onClick={markAllAsRead}
          disabled={markingAll || unreadCount === 0}
          className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {markingAll ? t("notifications.marking") : t("notifications.markAllRead")}
        </button>
      </div>

      {items.length === 0 && done && (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
          {t("notifications.none")}
        </div>
      )}

      <div className="space-y-2">
        {items.map((n) => {
          const hideActor = shouldHideActor(n);
          const showActorLink = !!n.actor && !hideActor;

          const cardClass = [
            "w-full rounded-xl border p-3 transition text-left",
            n.isRead ? "bg-white" : "bg-black/[0.02] border-black/10",
            "hover:bg-gray-50",
          ].join(" ");

          const cardInner = (
            <div className="flex items-start gap-3">
              {showActorLink ? (
                <Link
                  href={`/u/${n.actor!.username}`}
                  onClick={(e) => e.stopPropagation()}
                  className="h-10 w-10 rounded-full border bg-gray-100 overflow-hidden flex items-center justify-center shrink-0"
                  aria-label={`Open @${n.actor!.username} profile`}
                  title={`@${n.actor!.username}`}
                >
                  {n.actor!.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={n.actor!.image}
                      alt={n.actor!.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{n.actor!.emoji ?? "🔔"}</span>
                  )}
                </Link>
              ) : (
                <div className="h-10 w-10 rounded-full border bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                  <span>{hideActor ? "🛡️" : "🔔"}</span>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium break-words">{n.title}</div>

                    {n.body && (
                      <div className="text-sm text-gray-600 break-words mt-0.5">{n.body}</div>
                    )}

                    {showActorLink && (
                      <div className="mt-1">
                        <Link
                          href={`/u/${n.actor!.username}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          @{n.actor!.username}
                        </Link>
                      </div>
                    )}

                    <div className="text-xs text-gray-400 mt-1">{formatWhen(n.createdAt)}</div>
                  </div>

                  {!n.isRead && (
                    <span
                      className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-black shrink-0"
                      title={t("notifications.unreadDot")}
                    />
                  )}
                </div>
              </div>
            </div>
          );

          if (n.href) {
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => void openNotification(n)}
                className={cardClass}
              >
                {cardInner}
              </button>
            );
          }

          return (
            <button
              key={n.id}
              type="button"
              onClick={() => void markOneAsRead(n.id)}
              className={cardClass}
            >
              {cardInner}
            </button>
          );
        })}
      </div>

      {!done && (
        <div ref={sentinelRef} className="py-4 text-center text-sm text-gray-500">
          {loading ? t("common.loading") : " "}
        </div>
      )}

      {done && items.length > 0 && (
        <div className="py-2 text-center text-xs text-gray-400">
          {t("notifications.end")}
        </div>
      )}
    </section>
  );
}