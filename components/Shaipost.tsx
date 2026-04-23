"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import LikeButton from "@/components/LikeButton";
import CommentSheet from "@/components/CommentSheet";
import Link from "next/link";
import { togglePostReaction } from "@/app/actions/togglePostReaction";
import { useI18n } from "@/components/LanguageProvider";

type Reaction = { userId: string; type: "LAUGH" | "SKULL" };

type PostAuthor = {
  id: string;
  username: string;
  name?: string | null;
  image?: string | null;
  emoji?: string | null;
};

type PostWithExtras = {
  id: string;
  content: string;
  anonymous: boolean;
  createdAt: Date | string;
  imageUrl?: string | null;
  author: PostAuthor;
  likes?: { userId: string }[];
  reactions?: Reaction[];
  postReactions?: Reaction[];
  _count?: { likes: number; comments: number };
  reactionCounts?: { LAUGH?: number; SKULL?: number };
  laughCount?: number;
  skullCount?: number;
};

function formatDateStable(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ReactionButton(props: {
  emoji: string;
  active: boolean;
  count: number;
  disabled?: boolean;
  onClick: () => void;
}) {
  const { emoji, active, count, disabled, onClick } = props;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition",
        "active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed",
        active
          ? "bg-black text-white border-black shadow-sm"
          : "k-surface k-border-strong hover:bg-[var(--muted)] text-[color:var(--foreground)]",
      ].join(" ")}
      aria-pressed={active}
    >
      <span className="text-base leading-none">{emoji}</span>
      <span className={["tabular-nums", active ? "text-white" : ""].join(" ")}>
        {count}
      </span>
    </button>
  );
}

export default function Shaipost(props: {
  post: PostWithExtras;
  myUserId: string | null;
}) {
  const { t } = useI18n();
  const { post, myUserId } = props;

  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const myInitialReactions = (post.reactions ?? post.postReactions ?? []) as Reaction[];

  const initialLaughedByMe =
    !!myUserId && myInitialReactions.some((r) => r.userId === myUserId && r.type === "LAUGH");
  const initialSkullByMe =
    !!myUserId && myInitialReactions.some((r) => r.userId === myUserId && r.type === "SKULL");

  const initialLaughCount = post.reactionCounts?.LAUGH ?? post.laughCount ?? 0;
  const initialSkullCount = post.reactionCounts?.SKULL ?? post.skullCount ?? 0;

  const [laughedByMe, setLaughedByMe] = useState<boolean>(initialLaughedByMe);
  const [skullByMe, setSkullByMe] = useState<boolean>(initialSkullByMe);
  const [laughCount, setLaughCount] = useState<number>(initialLaughCount);
  const [skullCount, setSkullCount] = useState<number>(initialSkullCount);

  useEffect(() => {
    setLaughedByMe(initialLaughedByMe);
    setSkullByMe(initialSkullByMe);
    setLaughCount(initialLaughCount);
    setSkullCount(initialSkullCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    post.id,
    myUserId,
    post.reactionCounts?.LAUGH,
    post.reactionCounts?.SKULL,
    post.laughCount,
    post.skullCount,
    (post.postReactions ?? post.reactions ?? []).length,
  ]);

  const likeCount = post._count?.likes ?? 0;
  const commentCount = post._count?.comments ?? 0;

  const avatarUrl = post.author?.image ?? "";
  const emoji = post.author?.emoji ?? "☕";

  const likedByMe = useMemo(
    () => (!!myUserId ? (post.likes ?? []).some((l) => l.userId === myUserId) : false),
    [myUserId, post.likes]
  );

  function toggle(type: "LAUGH" | "SKULL") {
    if (!myUserId) return;

    const prev = { laughedByMe, skullByMe, laughCount, skullCount };

    if (type === "LAUGH") {
      if (laughedByMe) {
        setLaughedByMe(false);
        setLaughCount((c) => Math.max(0, c - 1));
      } else {
        setLaughedByMe(true);
        setLaughCount((c) => c + 1);
      }
    } else {
      if (skullByMe) {
        setSkullByMe(false);
        setSkullCount((c) => Math.max(0, c - 1));
      } else {
        setSkullByMe(true);
        setSkullCount((c) => c + 1);
      }
    }

    startTransition(async () => {
      try {
        await togglePostReaction({ postId: post.id, type });
      } catch {
        setLaughedByMe(prev.laughedByMe);
        setSkullByMe(prev.skullByMe);
        setLaughCount(prev.laughCount);
        setSkullCount(prev.skullCount);
      }
    });
  }

  return (
    <div className="rounded-3xl p-4 shadow-sm border k-surface k-border-strong redesign-post-card">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-[1.25em] h-[1.25em] rounded-full overflow-hidden flex items-center justify-center shrink-0 align-middle">
          {post.anonymous ? (
            <span className="text-lg leading-none">☕</span>
          ) : avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-lg leading-none">{emoji}</span>
          )}
        </div>

        <span className="font-semibold text-sm">
          {post.anonymous ? (
            <span>{t("common.anonymous")}</span>
          ) : (
            <Link href={`/u/${post.author.username}`} className="hover:underline">
              {post.author.username}
            </Link>
          )}
        </span>

        <span className="text-xs text-[color:var(--text-muted)]">
          • {formatDateStable(post.createdAt)}
        </span>
      </div>

      {post.content?.trim() ? (
        <p className="text-base leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      ) : null}

      {post.imageUrl ? (
        <div className="mt-3 rounded-3xl border overflow-hidden k-muted k-border-strong">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt="post"
            className="w-full max-h-[520px] object-contain"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="flex items-center justify-between mt-4 gap-3">
        <div className="flex items-center gap-2">
          <LikeButton postId={post.id} likedByMe={likedByMe} likeCount={likeCount} />

          <ReactionButton
            emoji="😂"
            active={laughedByMe}
            count={laughCount}
            disabled={isPending}
            onClick={() => toggle("LAUGH")}
          />

          <ReactionButton
            emoji="💀"
            active={skullByMe}
            count={skullCount}
            disabled={isPending}
            onClick={() => toggle("SKULL")}
          />
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border px-3 py-1 text-sm k-surface k-border-strong hover:bg-[var(--muted)] active:scale-95 transition"
        >
          💬 {t("comments.title")} ({commentCount})
        </button>
      </div>

      <CommentSheet open={open} onClose={() => setOpen(false)} postId={post.id} />
    </div>
  );
}