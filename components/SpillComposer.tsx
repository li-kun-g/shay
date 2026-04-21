"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { createPost } from "@/app/actions/createPost";
import PostImageUploader, { type UploadedPostImage } from "@/components/PostImageUploader";
import { useI18n } from "@/components/LanguageProvider";

const MAX_CHARS = 280;
const MODERATION_TIMER = 60000; // 1 minute

const POST_CATEGORIES = ["GOSSIPS", "UNI", "CONFESSIONS", "MARKET", "OTHER"] as const;
type PostCategory = (typeof POST_CATEGORIES)[number];

const CATEGORY_OPTIONS: { value: PostCategory; labelKey: string }[] = [
  { value: "GOSSIPS", labelKey: "cat.gossips" },
  { value: "UNI", labelKey: "cat.uni" },
  { value: "CONFESSIONS", labelKey: "cat.confessions" },
  { value: "MARKET", labelKey: "cat.market" },
  { value: "OTHER", labelKey: "cat.other" },
];

export default function SpillComposer() {
  const { t } = useI18n();

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [category, setCategory] = useState<PostCategory>("GOSSIPS");
  const [image, setImage] = useState<UploadedPostImage | null>(null);
  const [showModerationMsg, setShowModerationMsg] = useState(false);

  const [isPending, startTransition] = useTransition();

  const remaining = useMemo(() => MAX_CHARS - content.length, [content.length]);

  const canSubmit = (content.trim().length > 0 || !!image) && content.length <= MAX_CHARS && !isPending;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function resetAndClose() {
    setContent("");
    setAnonymous(true);
    setCategory("GOSSIPS");
    setImage(null);
    setShowModerationMsg(false);
    setOpen(false);
  }

  function onSubmit() {
    if (!canSubmit) return;

    startTransition(async () => {
      try {
        const res = await createPost({
          content: content.trim(),
          anonymous,
          category,
          imageUrl: image?.url ?? null,
          imageKey: image?.key ?? null,
        });

        // ✅ Check for auth error returned from server action
        if (res?.error === "AUTH_REQUIRED") {
          signIn(undefined, { callbackUrl: "/" });
          return;
        }

        if (res?.ok) {
          if (res.pending) {
            setShowModerationMsg(true);
            setTimeout(() => {
              resetAndClose();
            }, MODERATION_TIMER);
          } else {
            resetAndClose();
          }
        }
      } catch (e) {
        console.error("Submission error:", e);
      }
    });
  }

  return (
    <>
      <div className="block">
        <ComposerCard
          content={content}
          setContent={setContent}
          anonymous={anonymous}
          setAnonymous={(v) => {
            setAnonymous(v);
            if (v) setImage(null);
          }}
          category={category}
          setCategory={setCategory}
          remaining={remaining}
          canPost={canSubmit}
          isPending={isPending}
          onSubmit={onSubmit}
          image={image}
          setImage={setImage}
          showModerationMsg={showModerationMsg}
          onManualClose={resetAndClose}
        />
      </div>

      <button
        className="hidden fixed bottom-5 right-5 z-[120] rounded-full bg-black text-white px-5 py-3 shadow-lg active:scale-95 transition"
        onClick={() => setOpen(true)}
        aria-label={t("composer.open")}
      >
        {t("composer.spill")} ☕
      </button>

      {open && (
        <div className="sm:hidden fixed inset-0 z-[130] h-[100dvh] overflow-hidden">
          <button
            type="button"
            aria-label={t("common.close")}
            className="absolute inset-0 h-[100dvh] w-full bg-black/50 backdrop-blur-md"
            onClick={() => !showModerationMsg && setOpen(false)}
          />

          <div className="absolute inset-0 z-[131] flex items-center justify-center px-3 py-6">
            <div className="w-full rounded-[2rem] border bg-white p-4 shadow-2xl max-h-[88dvh] overflow-y-auto dark:bg-[var(--surface)] dark:border-[var(--border-strong)]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">{t("composer.spill")} ☕</h2>
                {!showModerationMsg && (
                  <button
                    type="button"
                    className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-white/10"
                    onClick={() => setOpen(false)}
                  >
                    {t("common.close")}
                  </button>
                )}
              </div>

              <ComposerCard
                content={content}
                setContent={setContent}
                anonymous={anonymous}
                setAnonymous={(v) => {
                  setAnonymous(v);
                  if (v) setImage(null);
                }}
                category={category}
                setCategory={setCategory}
                remaining={remaining}
                canPost={canSubmit}
                isPending={isPending}
                onSubmit={onSubmit}
                compact
                image={image}
                setImage={setImage}
                showModerationMsg={showModerationMsg}
                onManualClose={resetAndClose}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ComposerCard(props: {
  content: string;
  setContent: (v: string) => void;
  anonymous: boolean;
  setAnonymous: (v: boolean) => void;
  category: PostCategory;
  setCategory: (v: PostCategory) => void;
  remaining: number;
  canPost: boolean;
  isPending: boolean;
  onSubmit: () => void;
  image: UploadedPostImage | null;
  setImage: (v: UploadedPostImage | null) => void;
  compact?: boolean;
  showModerationMsg?: boolean;
  onManualClose: () => void;
}) {
  const { t } = useI18n();

  const {
    content,
    setContent,
    anonymous,
    setAnonymous,
    category,
    setCategory,
    remaining,
    canPost,
    isPending,
    onSubmit,
    compact,
    image,
    setImage,
    showModerationMsg,
    onManualClose,
  } = props;

  const uploadDisabled = anonymous || !!image;

  if (showModerationMsg) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="text-7xl mb-8">🍥</div>
        <h3 className="text-xl font-bold">
          {t("composer.sentToModeration" as any) || "Your post sent for moderation"}
        </h3>
        <p className="text-sm text-gray-500 mt-2 max-w-[260px]">
          {t("composer.moderationDesc" as any) || "It will appear on the feed once it has been approved by the team!"}
        </p>
        <button
          onClick={onManualClose}
          className="mt-10 h-12 px-16 rounded-full bg-black text-white text-sm font-medium hover:bg-zinc-800 transition shadow-md active:scale-95"
        >
          {t("common.done")}
        </button>
      </div>
    );
  }

  return (
    <div className={compact ? "" : "rounded-2xl border bg-white shadow-sm dark:bg-[var(--surface)] dark:border-[var(--border-strong)]"}>
      <div className={compact ? "" : "p-4"}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("composer.placeholder")}
          className="w-full resize-none rounded-xl border px-3 py-3 outline-none focus:ring-2 focus:ring-black min-h-[110px] bg-transparent"
          maxLength={MAX_CHARS}
          disabled={isPending}
        />

        {image?.url && (
          <div className="mt-3 rounded-2xl border bg-gray-50 overflow-hidden relative dark:bg-white/5">
            <img src={image.url} alt="post" className="w-full max-h-[520px] object-contain" loading="lazy" />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="absolute top-3 right-3 rounded-full bg-white/90 border px-3 py-1 text-sm hover:bg-white dark:bg-black/70 dark:hover:bg-black/80"
              aria-label={t("composer.removePhoto")}
              disabled={isPending}
            >
              ✕
            </button>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => setAnonymous(!anonymous)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              anonymous ? "bg-black text-white border-black" : "bg-white dark:bg-transparent"
            }`}
          >
            {anonymous ? t("composer.anonymousOn") : t("composer.anonymousOff")}
          </button>

          <select
            value={category}
            disabled={isPending}
            onChange={(e) => setCategory(e.target.value as PostCategory)}
            className="rounded-full border px-3 py-1 text-sm bg-white dark:bg-transparent"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey as any)}
              </option>
            ))}
          </select>

          <div className="ml-auto flex flex-col items-end gap-1">
            <div className={uploadDisabled || isPending ? "opacity-50 pointer-events-none" : ""}>
              <PostImageUploader
                disabled={uploadDisabled || isPending}
                onUploaded={(f) => setImage(f)}
                onError={(msg) => alert(msg)}
              />
            </div>
            <span className={`text-xs ${remaining < 20 ? "text-red-600" : "text-gray-500"}`}>
              {remaining} {t("composer.left")}
            </span>
          </div>
        </div>

        {anonymous && <div className="mt-2 text-xs text-gray-400">{t("composer.photoNonAnonOnly")}</div>}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => { setContent(""); setImage(null); }}
            className="w-[80px] rounded-xl border px-4 py-2 text-sm"
            disabled={isPending}
          >
            {t("common.clear")}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canPost}
            className="w-[80px] rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50 transition active:scale-95"
          >
            {isPending ? t("composer.posting") : t("composer.spill")}
          </button>
        </div>
      </div>
    </div>
  );
}