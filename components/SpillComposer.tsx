"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { createPost } from "@/app/actions/createPost";
import { PostCategory } from "@prisma/client";
import PostImageUploader, { type UploadedPostImage } from "@/components/PostImageUploader";
import { useI18n } from "@/components/LanguageProvider";

const MAX_CHARS = 280;

const CATEGORY_OPTIONS: { value: PostCategory; labelKey: string }[] = [
  { value: PostCategory.GOSSIPS, labelKey: "cat.gossips" },
  { value: PostCategory.UNI, labelKey: "cat.uni" },
  { value: PostCategory.CONFESSIONS, labelKey: "cat.confessions" },
  { value: PostCategory.MARKET, labelKey: "cat.market" },
  { value: PostCategory.OTHER, labelKey: "cat.other" },
];

export default function SpillComposer() {
  const { t } = useI18n();

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [category, setCategory] = useState<PostCategory>(PostCategory.GOSSIPS);
  const [image, setImage] = useState<UploadedPostImage | null>(null);

  const [isPending, startTransition] = useTransition();

  const remaining = useMemo(() => MAX_CHARS - content.length, [content.length]);

  const canPost =
    (content.trim().length > 0 || !!image) &&
    content.length <= MAX_CHARS &&
    !isPending &&
    !(anonymous && !!image);

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
    setCategory(PostCategory.GOSSIPS);
    setImage(null);
    setOpen(false);
  }

  function onSubmit() {
    if (!canPost) return;

    startTransition(async () => {
      try {
        await createPost({
          content: content.trim(),
          anonymous,
          category,
          imageUrl: image?.url ?? null,
          imageKey: image?.key ?? null,
        });

        resetAndClose();
      } catch (e) {
        if ((e as Error).message === "AUTH_REQUIRED") {
          signIn(undefined, { callbackUrl: "/" });
          return;
        }
        throw e;
      }
    });
  }

  return (
    <>
      {/* Desktop / tablet inline composer */}
      <div className="hidden sm:block">
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
          canPost={canPost}
          isPending={isPending}
          onSubmit={onSubmit}
          image={image}
          setImage={setImage}
        />
      </div>

      {/* Mobile floating button */}
      <button
        className="sm:hidden fixed bottom-5 right-5 z-[120] rounded-full bg-black text-white px-5 py-3 shadow-lg active:scale-95 transition"
        onClick={() => setOpen(true)}
        aria-label={t("composer.open")}
      >
        {t("composer.spill")} ☕
      </button>

      {/* Mobile modal composer */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-[130] h-[100dvh] overflow-hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label={t("common.close")}
            className="absolute inset-0 h-[100dvh] w-full bg-black/50 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          {/* Centered card */}
          <div className="absolute inset-0 z-[131] flex items-center justify-center px-3 py-6">
            <div className="w-full rounded-[2rem] border bg-white p-4 shadow-2xl max-h-[88dvh] overflow-y-auto dark:bg-[var(--surface)] dark:border-[var(--border-strong)]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">{t("composer.spill")} ☕</h2>
                <button
                  type="button"
                  className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  {t("common.close")}
                </button>
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
                canPost={canPost}
                isPending={isPending}
                onSubmit={onSubmit}
                compact
                image={image}
                setImage={setImage}
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
  } = props;

  const uploadDisabled = anonymous || !!image;

  return (
    <div
      className={
        compact
          ? ""
          : "rounded-2xl border bg-white shadow-sm dark:bg-[var(--surface)] dark:border-[var(--border-strong)]"
      }
    >
      <div className={compact ? "" : "p-4"}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("composer.placeholder")}
          className="w-full resize-none rounded-xl border px-3 py-3 outline-none focus:ring-2 focus:ring-black min-h-[110px] bg-transparent"
          maxLength={MAX_CHARS}
        />

        {image?.url && (
          <div className="mt-3 rounded-2xl border bg-gray-50 overflow-hidden relative dark:bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt="post"
              className="w-full max-h-[520px] object-contain"
              loading="lazy"
            />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="absolute top-3 right-3 rounded-full bg-white/90 border px-3 py-1 text-sm hover:bg-white dark:bg-black/70 dark:hover:bg-black/80"
              aria-label={t("composer.removePhoto")}
            >
              ✕
            </button>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnonymous(!anonymous)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              anonymous ? "bg-black text-white border-black" : "bg-white dark:bg-transparent"
            }`}
            title={t("composer.photoNonAnonOnly")}
          >
            {anonymous ? t("composer.anonymousOn") : t("composer.anonymousOff")}
          </button>

          <select
            value={category}
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
            <div className={uploadDisabled ? "opacity-50" : ""}>
              <PostImageUploader
                disabled={uploadDisabled}
                onUploaded={(f) => setImage(f)}
                onError={(msg) => alert(msg)}
              />
            </div>

            <span
              className={`text-xs ${
                remaining < 20 ? "text-red-600" : "text-gray-500"
              }`}
            >
              {remaining} {t("composer.left")}
            </span>
          </div>
        </div>

        {anonymous && (
          <div className="mt-2 text-xs text-gray-400">
            {t("composer.photoNonAnonOnly")}
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setContent("");
              setImage(null);
            }}
            className="rounded-xl border px-4 py-2 text-sm"
            disabled={isPending}
          >
            {t("common.clear")}
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!canPost}
            className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {isPending ? t("composer.posting") : t("composer.spill")}
          </button>
        </div>
      </div>
    </div>
  );
}