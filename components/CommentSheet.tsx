"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useSession, signIn } from "next-auth/react";
import { createComment } from "@/app/actions/createComment";
import { getComments } from "@/app/actions/getComments";
import { deleteComment } from "@/app/actions/deleteComment";
import { getMyUserId } from "@/app/actions/getMyUserId";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useI18n } from "@/components/LanguageProvider";

type CommentItem = {
  id: string;
  content: string;
  anonymous: boolean;
  createdAt: Date;
  authorId: string;
  author: {
    id?: string;
    username?: string | null;
    name: string | null;
    emoji: string;
    image?: string | null;
  };
};

export default function CommentSheet(props: {
  open: boolean;
  onClose: () => void;
  postId: string;
}) {
  const { open, onClose, postId } = props;
  const { t } = useI18n();
  const { status } = useSession();

  const [mounted, setMounted] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(true);

  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSend = content.trim().length > 0 && !isPending;

  const title = useMemo(
    () => `${t("comments.title")} (${comments.length})`,
    [comments.length, t]
  );

  async function load() {
    setLoading(true);
    try {
      const res = await getComments(postId);
      setComments(res as CommentItem[]);
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      }, 50);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    let ignore = false;

    (async () => {
      setLoading(true);
      try {
        const [res, uid] = await Promise.all([getComments(postId), getMyUserId()]);
        if (!ignore) {
          setComments(res as CommentItem[]);
          setMyUserId(uid as string | null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }

      setTimeout(() => inputRef.current?.focus(), 80);
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      }, 80);
    })();

    return () => {
      ignore = true;
    };
  }, [open, postId]);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  async function onSend() {
    if (status !== "authenticated") {
      await signIn();
      return;
    }
    if (!canSend) return;

    const text = content.trim();
    setContent("");

    const optimistic: CommentItem = {
      id: `temp-${Math.random().toString(36).slice(2)}`,
      content: text,
      anonymous,
      createdAt: new Date(),
      authorId: myUserId ?? "me",
      author: { name: "You", username: null, emoji: "☕" },
    };

    setComments((prev) => [...prev, optimistic]);
    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }, 50);

    startTransition(async () => {
      try {
        await createComment({ postId, content: text, anonymous });
        await load();
      } catch {
        setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
        setContent(text);
      }
    });
  }

  function requestDelete(commentId: string) {
    setPendingDeleteId(commentId);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (status !== "authenticated") {
      setConfirmOpen(false);
      await signIn();
      return;
    }

    const commentId = pendingDeleteId;
    if (!commentId) return;

    setConfirmOpen(false);
    setPendingDeleteId(null);

    const prev = comments;
    setComments((c) => c.filter((x) => x.id !== commentId));

    startDeleteTransition(async () => {
      try {
        await deleteComment(commentId);
        await load();
      } catch {
        setComments(prev);
      }
    });
  }

  function cancelDelete() {
    setConfirmOpen(false);
    setPendingDeleteId(null);
  }

  if (!mounted || !open) return null;

  const mobileHeightClass =
    comments.length <= 1
      ? "h-[44vh]"
      : comments.length <= 3
      ? "h-[54vh]"
      : "h-[78vh]";

  const desktopHeightClass =
    comments.length <= 1
      ? "h-[420px]"
      : comments.length <= 3
      ? "h-[520px]"
      : "h-[88vh] max-h-[880px]";

  return createPortal(
    <>
      <div className="fixed inset-0 z-[220]">
        <button
          type="button"
          aria-label={t("common.close")}
          className="absolute inset-0 bg-black/55 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Mobile */}
        <div className="sm:hidden absolute inset-0 flex items-center justify-center p-3">
          <div
            role="dialog"
            aria-modal="true"
            className={[
              "relative z-[221] w-full max-w-[680px] rounded-3xl border shadow-2xl",
              "bg-white dark:bg-[var(--surface)]",
              "border-gray-200 dark:border-[var(--border-strong)]",
              "overflow-hidden flex flex-col",
              mobileHeightClass,
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            <Header title={title} onClose={onClose} mobile />

            <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 pb-3">
              <List
                loading={loading}
                comments={comments}
                myUserId={myUserId}
                onRequestDelete={requestDelete}
                deleting={isDeleting}
              />
            </div>

            <Composer
              inputRef={inputRef}
              status={status}
              content={content}
              setContent={setContent}
              anonymous={anonymous}
              setAnonymous={setAnonymous}
              canSend={canSend}
              isPending={isPending}
              onSend={onSend}
            />
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden sm:flex absolute inset-0 items-center justify-center p-6">
          <div
            role="dialog"
            aria-modal="true"
            className={[
              "relative z-[221] w-full max-w-2xl rounded-3xl border shadow-2xl",
              "bg-white dark:bg-[var(--surface)]",
              "border-gray-200 dark:border-[var(--border-strong)]",
              "overflow-hidden flex flex-col",
              desktopHeightClass,
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            <Header title={title} onClose={onClose} />

            <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
              <List
                loading={loading}
                comments={comments}
                myUserId={myUserId}
                onRequestDelete={requestDelete}
                deleting={isDeleting}
              />
            </div>

            <div className="px-6 pb-6">
              <Composer
                inputRef={inputRef}
                status={status}
                content={content}
                setContent={setContent}
                anonymous={anonymous}
                setAnonymous={setAnonymous}
                canSend={canSend}
                isPending={isPending}
                onSend={onSend}
              />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={t("comments.deleteTitle")}
        description={t("comments.deleteDescription")}
        confirmText={t("comments.deleteConfirm")}
        cancelText={t("common.no")}
        danger
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>,
    document.body
  );
}

function Header(props: {
  title: string;
  onClose: () => void;
  mobile?: boolean;
}) {
  const { t } = useI18n();
  const { title, onClose, mobile } = props;

  return (
    <div
      className={`relative flex items-center justify-between border-b border-gray-200 dark:border-white/10 ${
        mobile ? "p-4 pb-3" : "p-6 pb-4"
      }`}
    >
      {mobile && (
        <div className="absolute left-1/2 top-2 h-1.5 w-20 -translate-x-1/2 rounded-full bg-gray-200 dark:bg-white/20" />
      )}
      <h2 className="text-base font-semibold">{title}</h2>
      <button
        type="button"
        className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-white/10"
        onClick={onClose}
      >
        {t("common.close")}
      </button>
    </div>
  );
}

function List(props: {
  loading: boolean;
  comments: CommentItem[];
  myUserId: string | null;
  onRequestDelete: (commentId: string) => void;
  deleting: boolean;
}) {
  const { t } = useI18n();
  const { loading, comments, myUserId, onRequestDelete, deleting } = props;

  if (loading) {
    return (
      <div className="py-6 text-sm text-gray-500 dark:text-white/60">
        {t("common.loading")}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="py-6 text-sm text-gray-500 dark:text-white/60">
        {t("comments.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => {
        const canDelete = myUserId && c.authorId === myUserId;
        const username = c.author?.username?.trim();

        return (
          <div
            key={c.id}
            className="rounded-2xl border bg-white p-3 shadow-sm dark:bg-[var(--surface)] dark:border-[var(--border-strong)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span>{c.author?.emoji ?? "☕"}</span>

                  {c.anonymous ? (
                    <span className="font-semibold">{t("common.anonymous")}</span>
                  ) : (
                    <>
                      <span className="font-semibold">
                        {c.author?.name ?? t("profile.student")}
                      </span>
                      {username ? (
                        <Link
                          href={`/u/${username}`}
                          className="text-xs text-gray-500 hover:underline dark:text-white/60"
                        >
                          @{username}
                        </Link>
                      ) : null}
                    </>
                  )}

                  <span className="text-xs text-gray-400 dark:text-white/40">
                    • {new Date(c.createdAt).toLocaleDateString("en-GB")}
                  </span>
                </div>

                <p className="mt-1 break-words text-sm leading-relaxed">{c.content}</p>
              </div>

              {canDelete && (
                <button
                  type="button"
                  onClick={() => onRequestDelete(c.id)}
                  disabled={deleting}
                  className="shrink-0 rounded-full border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60 dark:hover:bg-white/10"
                  title={t("comments.delete")}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Composer(props: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  status: "authenticated" | "unauthenticated" | "loading";
  content: string;
  setContent: (v: string) => void;
  anonymous: boolean;
  setAnonymous: (v: boolean) => void;
  canSend: boolean;
  isPending: boolean;
  onSend: () => void;
}) {
  const { t } = useI18n();
  const {
    inputRef,
    status,
    content,
    setContent,
    anonymous,
    setAnonymous,
    canSend,
    isPending,
    onSend,
  } = props;

  return (
    <div className="border-t border-gray-200 p-3 dark:border-white/10">
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAnonymous(!anonymous)}
          className={`rounded-full border px-3 py-1 text-xs transition ${
            anonymous ? "border-black bg-black text-white" : "bg-white dark:bg-transparent"
          }`}
        >
          {anonymous ? t("composer.anonymousOn") : t("composer.anonymousOff")}
        </button>

        <span className="ml-auto text-xs text-gray-500 dark:text-white/60">
          {status !== "authenticated" ? t("comments.signInToReply") : ""}
        </span>
      </div>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("comments.replyPlaceholder")}
          className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black dark:bg-transparent"
          onKeyDown={(e) => {
            if (e.key === "Enter") onSend();
          }}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isPending ? t("common.sending") : t("common.send")}
        </button>
      </div>
    </div>
  );
}