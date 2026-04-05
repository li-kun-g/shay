"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import GiphyGif from "@/components/GiphyGif";

type CommentItem = {
  id: string;
  content: string;
  anonymous: boolean;
  createdAt: string;
  authorId: string;
  giphyId?: string | null;
  giphyTitle?: string | null;
  author: {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
    emoji: string | null;
  };
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function PostCommentsInfiniteList(props: {
  postId: string;
  totalCount: number;
}) {
  const { postId, totalCount } = props;

  const [items, setItems] = useState<CommentItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const baseUrl = useMemo(
    () => `/api/posts/${encodeURIComponent(postId)}/comments`,
    [postId]
  );

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
        for (const it of list) {
          if (!seen.has(it.id)) merged.push(it);
        }
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
  }, [nextCursor, done, loading]);

  if (loading && items.length === 0) {
    return <div className="text-sm text-gray-500">Loading comments…</div>;
  }

  if (!loading && items.length === 0) {
    return <div className="text-sm text-gray-500">No comments yet.</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((c) => {
        const isAnon = c.anonymous;
        const username = c.author?.username?.trim();

        return (
          <div key={c.id} className="rounded-xl border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {isAnon ? (
                  <div className="text-sm font-medium">Anonymous</div>
                ) : username ? (
                  <Link
                    href={`/u/${username}`}
                    className="text-sm font-medium hover:underline"
                  >
                    @{username}
                  </Link>
                ) : (
                  <div className="text-sm font-medium">
                    {c.author.name ?? "Student"}
                  </div>
                )}

                {!isAnon && c.author.name && (
                  <div className="text-xs text-gray-500 break-words">
                    {c.author.name}
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-400 shrink-0">
                {formatDate(c.createdAt)}
              </div>
            </div>

            {c.content ? (
              <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap break-words">
                {c.content}
              </p>
            ) : null}

          {c.giphyId ? (
  <div className="mt-2 w-fit max-w-[320px] sm:max-w-[420px]">
    <GiphyGif gifId={c.giphyId} />
  </div>
) : null}
          </div>
        );
      })}

      {!done && (
        <div ref={sentinelRef} className="py-4 text-center text-sm text-gray-500">
          {loading ? "Loading more…" : " "}
        </div>
      )}

      {done && totalCount > 0 && (
        <div className="py-2 text-center text-xs text-gray-400">
          {items.length >= totalCount
            ? "All comments loaded."
            : "End of loaded comments."}
        </div>
      )}
    </div>
  );
}