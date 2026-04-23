"use client";

import { useState, useTransition } from "react";
import { useSession, signIn } from "next-auth/react";
import { createPost } from "@/app/actions/createPost";
import { useI18n } from "@/components/LanguageProvider";

const MAX_CHARS = 280;

type PostTag = { id: string; name: string; slug: string; emoji: string; order: number };

export default function AnonLinkComposer({ tags }: { tags: PostTag[] }) {
  const { status } = useSession();
  const { t } = useI18n();

  const defaultSlug = tags[0]?.slug ?? "OTHER";

  const [content, setContent] = useState("");
  const [category, setCategory] = useState(defaultSlug);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isAuthed = status === "authenticated";
  const isLoading = status === "loading";
  const remaining = MAX_CHARS - content.length;
  const canSubmit = content.trim().length > 0 && content.length <= MAX_CHARS && !isPending && isAuthed;

  function requireAuth(): boolean {
    if (!isAuthed) {
      setShowAuthGate(true);
      return false;
    }
    return true;
  }

  function onSubmit() {
    if (!requireAuth() || !canSubmit) return;

    startTransition(async () => {
      const res = await createPost({
        content: content.trim(),
        anonymous: true,
        category,
        imageUrl: null,
        imageKey: null,
      });

      if (res?.error === "AUTH_REQUIRED") {
        setShowAuthGate(true);
        return;
      }

      if (res?.ok) {
        setContent("");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 4000);
      }
    });
  }

  if (showSuccess) {
    return (
      <div className="rounded-2xl border bg-white dark:bg-[var(--surface)] p-10 text-center shadow-sm animate-in fade-in zoom-in duration-500">
        <div className="text-6xl mb-4">🍥</div>
        <h3 className="text-lg font-semibold">Sent for moderation</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-[240px] mx-auto">
          It will appear on the feed once approved by the team
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border bg-white dark:bg-[var(--surface)] dark:border-[var(--border-strong)] shadow-sm p-4 space-y-3">
        {/* Textarea with clickable overlay for unauthenticated users */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("composer.placeholder")}
            className="w-full resize-none rounded-xl border px-3 py-3 outline-none focus:ring-2 focus:ring-black min-h-[120px] bg-transparent"
            maxLength={MAX_CHARS}
            disabled={isPending || !isAuthed}
          />
          {/* Invisible overlay to capture clicks when not logged in */}
          {!isAuthed && !isLoading && (
            <button
              type="button"
              onClick={() => setShowAuthGate(true)}
              className="absolute inset-0 rounded-xl cursor-text"
              aria-label="Sign in to write"
            />
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Anonymous badge — locked */}
          <span className="rounded-full bg-black text-white border-black border px-3 py-1 text-sm select-none">
            {t("composer.anonymousOn")}
          </span>

          <select
            value={category}
            disabled={isPending || !isAuthed}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-full border px-3 py-1 text-sm bg-white dark:bg-transparent"
          >
            {tags.map((tag) => (
              <option key={tag.slug} value={tag.slug}>
                {tag.emoji ? `${tag.emoji} ${tag.name}` : tag.name}
              </option>
            ))}
          </select>

          <span className={`ml-auto text-xs ${remaining < 20 ? "text-red-600" : "text-gray-500"}`}>
            {remaining} {t("composer.left")}
          </span>
        </div>

        <button
          type="button"
          onClick={isAuthed ? onSubmit : () => setShowAuthGate(true)}
          disabled={isAuthed && !canSubmit}
          className="w-full rounded-xl bg-black px-4 py-2.5 text-sm text-white disabled:opacity-50 transition active:scale-95 font-medium"
        >
          {isPending ? t("composer.posting") : `${t("composer.spill")} ☕`}
        </button>

        {!isAuthed && !isLoading && (
          <p className="text-center text-xs text-gray-400">
            <button
              type="button"
              onClick={() => setShowAuthGate(true)}
              className="underline hover:text-gray-600 transition"
            >
              Sign in
            </button>
            {" "}to post anonymously
          </p>
        )}
      </div>

      {/* Auth Gate Modal */}
      {showAuthGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAuthGate(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-[var(--surface)] p-6 shadow-2xl text-center">
            <div className="text-5xl mb-4">☕</div>
            <h3 className="text-lg font-semibold mb-1">Sign in to spill</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-[260px] mx-auto">
              You need a KIMEP account to post. Your identity stays completely anonymous.
            </p>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/spill" })}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => setShowAuthGate(false)}
              className="mt-3 w-full rounded-xl border px-6 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
