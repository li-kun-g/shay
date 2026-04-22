"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useSession, signIn } from "next-auth/react";
import { createComment } from "@/app/actions/createComment";
import { getComments } from "@/app/actions/getComments";
import { deleteComment } from "@/app/actions/deleteComment";
import { getMyUserId } from "@/app/actions/getMyUserId";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useI18n } from "@/components/LanguageProvider";
import GifPicker, { type SelectedGif } from "@/components/GifPicker";
import GiphyGif from "@/components/GiphyGif";

type CommentItem = {
  id: string;
  content: string;
  anonymous: boolean;
  createdAt: Date;
  authorId: string;
  giphyId?: string | null;
  giphyTitle?: string | null;
  author: {
    id?: string;
    username?: string | null;
    name: string | null;
    emoji: string;
    image?: string | null;
  };
};

const MODERATION_TIMER = 60000; // 1 minute

type PostPreview = {
  content: string;
  anonymous: boolean;
  authorUsername: string;
  authorImage?: string | null;
  authorEmoji?: string | null;
  imageUrl?: string | null;
};

export default function CommentSheet(props: {
  open: boolean;
  onClose: () => void;
  postId: string;
  postPreview?: PostPreview;
}) {
  const { open, onClose, postId, postPreview } = props;
  const { t } = useI18n();
  const { status } = useSession();

  const [mounted, setMounted] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
  const [showModerationMsg, setShowModerationMsg] = useState(false);
  const [selectedGif, setSelectedGif] = useState<SelectedGif | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSend = (content.trim().length > 0 || !!selectedGif?.id) && !isPending;

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
      if (e.key === "Escape" && !showModerationMsg) onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, showModerationMsg]);

  async function onSend() {
    if (status !== "authenticated") {
      await signIn();
      return;
    }
    if (!canSend) return;

    const text = content.trim();
    const isAnon = anonymous;
    const gif = selectedGif;

    const optimisticId = `temp-${Math.random().toString(36).slice(2)}`;

    if (!isAnon) {
      setContent("");
      setSelectedGif(null);

      const optimistic: CommentItem = {
        id: optimisticId,
        content: text,
        anonymous: false,
        createdAt: new Date(),
        authorId: myUserId ?? "me",
        giphyId: gif?.id ?? null,
        giphyTitle: gif?.title ?? null,
        author: { name: "You", username: null, emoji: "☕" },
      };

      setComments((prev) => [...prev, optimistic]);
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      }, 50);
    }

    startTransition(async () => {
      try {
        const res = await createComment({
          postId,
          content: text,
          anonymous: isAnon,
          giphyId: gif?.id ?? null,
          giphyTitle: gif?.title ?? null,
        });

        if (res?.ok && res.pending) {
          setContent("");
          setSelectedGif(null);
          setShowModerationMsg(true);

          setTimeout(() => {
            setShowModerationMsg(false);
            setContent("");
            setSelectedGif(null);
          }, MODERATION_TIMER);
        } else {
          setContent("");
          setSelectedGif(null);
          await load();
        }
      } catch {
        if (!isAnon) {
          setComments((prev) => prev.filter((c) => c.id !== optimisticId));
        }
        setContent(text);
        setSelectedGif(gif ?? null);
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

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[220] flex items-end justify-center">
        <button
          type="button"
          aria-label={t("common.close")}
          className="absolute inset-0 bg-black/55 backdrop-blur-md"
          onClick={() => !showModerationMsg && onClose()}
        />

        <div
          role="dialog"
          aria-modal="true"
          className={[
            "relative z-[221] w-full max-w-2xl rounded-t-[2rem] border-t border-x shadow-2xl",
            "bg-white dark:bg-[var(--surface)]",
            "border-gray-200 dark:border-[var(--border-strong)]",
            "flex flex-col",
            showModerationMsg
              ? "h-[400px]"
              : comments.length === 0 && !loading
              ? "max-h-[85dvh] h-auto"
              : "h-[85dvh]",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          {/* drag handle */}
          <div className="shrink-0 flex justify-center pt-3 pb-1">
            <div className="h-1.5 w-12 rounded-full bg-gray-200 dark:bg-white/10" />
          </div>
          {/* Post preview */}
          {postPreview && !showModerationMsg && (
            <div className="shrink-0 px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-white/10 max-h-[45vh] overflow-y-auto">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-gray-100 dark:bg-white/10">
                  {postPreview.anonymous ? (
                    <span className="text-sm leading-none">☕</span>
                  ) : postPreview.authorImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={postPreview.authorImage} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm leading-none">{postPreview.authorEmoji ?? "☕"}</span>
                  )}
                </div>
                <span className="text-xs font-semibold text-[color:var(--text-muted)]">
                  {postPreview.anonymous ? "Anonymous" : postPreview.authorUsername}
                </span>
              </div>
              {postPreview.content && (
                <p className="text-sm leading-relaxed text-[color:var(--foreground)]">
                  {postPreview.content}
                </p>
              )}
              {postPreview.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={postPreview.imageUrl}
                  alt="post"
                  className="mt-2 rounded-xl w-full object-contain cursor-zoom-in"
                  onClick={() => setFullImageUrl(postPreview.imageUrl!)}
                />
              )}
            </div>
          )}

          {showModerationMsg ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
              <div className="text-7xl mb-8">🍥</div>
              <h3 className="text-xl font-bold">
                {t("composer.sentToModeration" as any) ||
                  "Your reply sent for moderation"}
              </h3>
              <p className="text-sm text-gray-500 mt-2 max-w-[280px]">
                {t("composer.moderationDesc" as any) ||
                  "It will appear in the thread once it has been approved by the team!"}
              </p>
              <button
                onClick={() => {
                  setShowModerationMsg(false);
                  setContent("");
                  setSelectedGif(null);
                }}
                className="mt-10 h-12 px-16 rounded-full bg-black text-white text-sm font-medium hover:bg-zinc-800 transition shadow-md active:scale-95"
              >
                {t("common.done")}
              </button>
            </div>
          ) : (
            <>
              <Header title={title} onClose={onClose} />

              <div
                ref={listRef}
                className={`overflow-y-auto px-4 sm:px-6 pb-3 ${comments.length > 0 || loading ? "flex-1 min-h-0" : ""}`}
              >
                <List
                  loading={loading}
                  comments={comments}
                  myUserId={myUserId}
                  onRequestDelete={requestDelete}
                  deleting={isDeleting}
                />
              </div>

              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <Composer
                  inputRef={inputRef}
                  status={status}
                  content={content}
                  setContent={setContent}
                  anonymous={anonymous}
                  setAnonymous={setAnonymous}
                  selectedGif={selectedGif}
                  setSelectedGif={setSelectedGif}
                  canSend={canSend}
                  isPending={isPending}
                  onSend={onSend}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen image viewer */}
      {fullImageUrl && createPortal(
        <div
          className="fixed inset-0 z-[600] flex items-center justify-center bg-black/90"
          onClick={() => setFullImageUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullImageUrl}
            alt="full"
            className="max-w-full max-h-full object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition"
            onClick={() => setFullImageUrl(null)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>,
        document.body
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={t("comments.deleteTitle")}
        description={t("comments.deleteDescription")}
        confirmText={t("comments.deleteConfirm")}
        cancelText={t("common.no")}
        danger
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingDeleteId(null);
        }}
      />
    </>,
    document.body
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 px-4 sm:px-6 py-3">
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

function List({
  loading,
  comments,
  myUserId,
  onRequestDelete,
  deleting,
}: {
  loading: boolean;
  comments: CommentItem[];
  myUserId: string | null;
  onRequestDelete: (id: string) => void;
  deleting: boolean;
}) {
  const { t } = useI18n();

  if (loading) {
    return <div className="py-6 text-sm text-gray-500">{t("common.loading")}</div>;
  }

  if (comments.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-gray-400">
        ☕ {t("comments.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-4">
      {comments.map((c) => {
        const canDelete = myUserId && c.authorId === myUserId;

        return (
          <div
            key={c.id}
            className="rounded-2xl border bg-white p-3 shadow-sm dark:bg-[var(--surface)] dark:border-[var(--border-strong)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span>{c.author?.emoji ?? "☕"}</span>
                  <span className="font-semibold">
                    {c.anonymous
                      ? t("common.anonymous")
                      : c.author?.name || "Student"}
                  </span>

                  {!c.anonymous && c.author?.username && (
                    <Link
                      href={`/u/${c.author.username}`}
                      className="text-xs text-gray-400 hover:underline"
                    >
                      @{c.author.username}
                    </Link>
                  )}
                </div>

                {c.content ? (
                  <p className="mt-1 break-words text-sm leading-relaxed">
                    {c.content}
                  </p>
                ) : null}

              {c.giphyId ? (
  <div className="mt-2 w-fit max-w-[320px] sm:max-w-[420px]">
    <GiphyGif gifId={c.giphyId} />
  </div>
) : null}
              </div>

              {canDelete && (
                <button
                  onClick={() => onRequestDelete(c.id)}
                  disabled={deleting}
                  className="shrink-0 rounded-full p-2 hover:bg-gray-50 opacity-60"
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
  inputRef: RefObject<HTMLInputElement | null>;
  status: string;
  content: string;
  setContent: (v: string) => void;
  anonymous: boolean;
  setAnonymous: (v: boolean) => void;
  selectedGif: SelectedGif | null;
  setSelectedGif: (gif: SelectedGif | null) => void;
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
    selectedGif,
    setSelectedGif,
    canSend,
    isPending,
    onSend,
  } = props;

  const [gifPickerOpen, setGifPickerOpen] = useState(false);

  return (
    <div className="border-t border-gray-100 dark:border-white/5 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setAnonymous(!anonymous)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
              anonymous
                ? "bg-black border-black"
                : "border-gray-300 dark:border-white/30"
            }`}
          >
            {anonymous && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-xs text-[color:var(--text-muted)]">
            Anonymous
          </span>
        </label>

        {status !== "authenticated" && (
          <span className="text-xs text-gray-400">
            {t("comments.signInToReply")}
          </span>
        )}
      </div>

      {selectedGif ? (
        <div className="mb-3 rounded-2xl border bg-gray-50 p-3 dark:bg-white/5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500">
              {t("comments.replyPlaceholder")} + GIF
            </span>
            <button
              type="button"
              onClick={() => setSelectedGif(null)}
              className="rounded-full border px-3 py-1 text-xs hover:bg-gray-100 dark:hover:bg-white/10"
            >
              Remove GIF
            </button>
          </div>

       <div className="w-fit max-w-[260px] sm:max-w-[320px]">
  <GiphyGif gifId={selectedGif.id} />
</div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("comments.replyPlaceholder")}
          className="flex-1 rounded-2xl border bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black dark:bg-white/5"
          onKeyDown={(e) => e.key === "Enter" && onSend()}
        />

        <button
          type="button"
          onClick={() => setGifPickerOpen(true)}
          className="rounded-2xl border px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/10"
        >
          GIF
        </button>

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="rounded-2xl bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 active:scale-95 transition"
        >
          {isPending ? t("common.sending") : t("common.send")}
        </button>
      </div>

      <GifPicker
        open={gifPickerOpen}
        onClose={() => setGifPickerOpen(false)}
        onSelect={setSelectedGif}
      />
    </div>
  );
}