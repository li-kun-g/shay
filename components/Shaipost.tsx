"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import LikeButton from "@/components/LikeButton";
import CommentSheet from "@/components/CommentSheet";
import ShareSheet from "@/components/ShareSheet";
import ConfirmDialog from "@/components/ConfirmDialog";
import Link from "next/link";
import { togglePostReaction } from "@/app/actions/togglePostReaction";
import { deletePost } from "@/app/actions/deletePost";
import { editPost } from "@/app/actions/editPost";
import { reportPost } from "@/app/actions/reportPost";
import { useI18n } from "@/components/LanguageProvider";

const MAX_CHARS = 280;

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

  const [commentOpen, setCommentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  // Dropdown
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  // Edit
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [displayContent, setDisplayContent] = useState(post.content);
  const [saving, setSaving] = useState(false);

  // Soft delete
  const [deleted, setDeleted] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Feedback
  const [reported, setReported] = useState(false);

  const isOwner = !!myUserId && myUserId === post.author.id;

  useEffect(() => { setMounted(true); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !menuBtnRef.current?.contains(target)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  function openMenu() {
    if (menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setMenuOpen(true);
  }

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
      if (laughedByMe) { setLaughedByMe(false); setLaughCount((c) => Math.max(0, c - 1)); }
      else { setLaughedByMe(true); setLaughCount((c) => c + 1); }
    } else {
      if (skullByMe) { setSkullByMe(false); setSkullCount((c) => Math.max(0, c - 1)); }
      else { setSkullByMe(true); setSkullCount((c) => c + 1); }
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

  async function handleDelete() {
    setMenuOpen(false);
    setConfirmDeleteOpen(true);
  }

  async function confirmDelete() {
    setDeleting(true);
    const res = await deletePost(post.id);
    setDeleting(false);
    setConfirmDeleteOpen(false);
    if (res?.ok) setDeleted(true);
  }

  async function handleSave() {
    if (!editContent.trim() || editContent.length > MAX_CHARS) return;
    setSaving(true);
    const res = await editPost(post.id, editContent);
    setSaving(false);
    if (res?.ok) {
      setDisplayContent(editContent.trim());
      setEditing(false);
    }
  }

  async function handleReport() {
    setMenuOpen(false);
    const res = await reportPost(post.id);
    if (res?.ok) {
      setReported(true);
      setTimeout(() => setReported(false), 3000);
    }
  }

  if (deleted) return null;

  return (
    <div className="rounded-3xl p-4 shadow-sm border k-surface k-border-strong">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-[1.25em] h-[1.25em] rounded-full overflow-hidden flex items-center justify-center shrink-0">
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

        {/* Three-dot menu button */}
        <button
          ref={menuBtnRef}
          type="button"
          onClick={openMenu}
          className="ml-auto w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--muted)] transition text-[color:var(--text-muted)]"
          aria-label="More options"
        >
          <svg width="16" height="4" viewBox="0 0 16 4" fill="currentColor">
            <circle cx="2" cy="2" r="1.5" />
            <circle cx="8" cy="2" r="1.5" />
            <circle cx="14" cy="2" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Report feedback */}
      {reported && (
        <p className="text-xs text-red-500 mb-2">Reported successfully.</p>
      )}

      {/* Content or edit mode */}
      {editing ? (
        <div className="mb-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full resize-none rounded-xl border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-black min-h-[80px] bg-transparent"
            maxLength={MAX_CHARS}
            disabled={saving}
            autoFocus
          />
          <div className="flex items-center justify-between mt-1">
            <span className={`text-xs ${editContent.length > MAX_CHARS - 20 ? "text-red-500" : "text-[color:var(--text-muted)]"}`}>
              {MAX_CHARS - editContent.length} left
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border px-3 py-1.5 text-sm"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !editContent.trim() || editContent.length > MAX_CHARS}
                className="rounded-lg bg-black text-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : displayContent?.trim() ? (
        <p className="text-base leading-relaxed whitespace-pre-wrap">{displayContent}</p>
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

      {/* Action bar */}
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

          {/* Share quick-access button */}
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center justify-center rounded-full border w-8 h-8 k-surface k-border-strong hover:bg-[var(--muted)] active:scale-95 transition"
            aria-label="Share"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCommentOpen(true)}
          className="rounded-full border px-3 py-1 text-sm k-surface k-border-strong hover:bg-[var(--muted)] active:scale-95 transition"
        >
          💬 {t("comments.title")} ({commentCount})
        </button>
      </div>

      {/* Portaled dropdown menu */}
      {mounted && menuOpen && menuPos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[500] min-w-[160px] rounded-xl border shadow-xl overflow-hidden k-surface k-border-strong"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          {!isOwner && (
            <button
              type="button"
              onClick={handleReport}
              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-[var(--muted)] transition"
            >
              Report
            </button>
          )}
          <button
            type="button"
            onClick={() => { setMenuOpen(false); setShareOpen(true); }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--muted)] transition"
          >
            Share
          </button>
          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => { setEditing(true); setEditContent(displayContent); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--muted)] transition"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-[var(--muted)] transition"
              >
                Delete
              </button>
            </>
          )}
        </div>,
        document.body
      )}

      <CommentSheet
        open={commentOpen}
        onClose={() => setCommentOpen(false)}
        postId={post.id}
        postPreview={{
          content: displayContent,
          anonymous: post.anonymous,
          authorUsername: post.author.username,
          authorImage: post.author.image ?? null,
          authorEmoji: post.author.emoji ?? "☕",
          imageUrl: post.imageUrl ?? null,
        }}
      />

      <ShareSheet
        postId={post.id}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete post?"
        description="This post will be removed from the feed. This cannot be undone."
        confirmText="Delete"
        cancelText="No, keep it"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
