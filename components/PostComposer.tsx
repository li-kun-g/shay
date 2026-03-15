"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/app/actions/createPost";
import PostImageUploader, {
  type UploadedPostImage,
} from "@/components/PostImageUploader";
import { useSession, signIn } from "next-auth/react";

type PostCategory = "GOSSIPS" | "UNI" | "CONFESSIONS" | "MARKET" | "OTHER";

const CATS: { label: string; value: PostCategory }[] = [
  { label: "Shai gossips", value: "GOSSIPS" },
  { label: "Uni stuff", value: "UNI" },
  { label: "Confessions", value: "CONFESSIONS" },
  { label: "Market", value: "MARKET" },
  { label: "Other", value: "OTHER" },
];

export default function PostComposer() {
  const router = useRouter();
  const { status } = useSession();

  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [category, setCategory] = useState<PostCategory>("GOSSIPS");
  const [image, setImage] = useState<UploadedPostImage | null>(null);

  const [isPending, startTransition] = useTransition();

  const max = 280;
  const left = max - text.length;

  const canPost = useMemo(() => {
    const t = text.trim();
    if (t.length > max) return false;
    if (!t && !image) return false;
    if (anonymous && !!image) return false;
    return true;
  }, [text, image, anonymous]);

  // 1. THIS IS THE CRITICAL CHANGE:
  // We handle the "Guest" click with a completely separate, simple function.
  const handleGuestClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Guest clicked Spill - Redirecting...");
    signIn(undefined, { callbackUrl: "/" });
  };

  async function handlePost() {
    if (!canPost || isPending) return;

    startTransition(async () => {
      try {
        const res = await createPost({
          content: text.trim(),
          anonymous,
          category,
          imageUrl: image?.url ?? null,
          imageKey: image?.key ?? null,
        });

        if (res?.error === "AUTH_REQUIRED") {
          signIn();
          return;
        }

        if (res?.ok) {
          setText("");
          setImage(null);
          setCategory("GOSSIPS");
          setAnonymous(true);
          router.refresh();
        }
      } catch (e) {
        console.error("Post failed", e);
      }
    });
  }

  function toggleAnonymous() {
    setAnonymous((a) => {
      const next = !a;
      if (next) setImage(null);
      return next;
    });
  }

  return (
    <div className="rounded-3xl border shadow-sm overflow-hidden k-surface k-border-strong bg-white dark:bg-[#111] transition-colors">
      <div className="p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What’s the tea at KIMEP today? ☕"
          className="w-full resize-none outline-none text-base bg-transparent dark:text-white"
          rows={3}
          maxLength={max + 50}
        />

        {image?.url && (
          <div className="mt-3 rounded-3xl border overflow-hidden relative k-muted k-border-strong">
            <img src={image.url} alt="post" className="w-full max-h-[520px] object-contain" />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="absolute top-3 right-3 rounded-full border px-3 py-1 text-sm k-surface k-border-strong dark:text-white"
            >✕</button>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleAnonymous}
            className={[
              "rounded-full border px-3 py-2 text-sm transition active:scale-95 k-border-strong",
              anonymous ? "bg-black text-white border-black dark:bg-white dark:text-black" : "k-surface dark:text-white",
            ].join(" ")}
          >
            {anonymous ? "Anonymous ✕" : "Non-anon"}
          </button>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PostCategory)}
            className="rounded-full border px-3 py-2 text-sm k-surface k-border-strong dark:bg-transparent dark:text-white"
          >
            {CATS.map((c) => (
              <option key={c.value} value={c.value} className="dark:bg-black">{c.label}</option>
            ))}
          </select>
          
          <div className={(anonymous || !!image) ? "opacity-50" : ""}>
            <PostImageUploader
              disabled={anonymous || !!image}
              onUploaded={(f: UploadedPostImage) => setImage(f)}
              onError={(msg: string) => alert(msg)}
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t flex items-center justify-between k-border-strong">
        <span className={"text-xs " + (left < 0 ? "text-red-500" : "text-gray-500 dark:text-gray-400")}>
          {left} left
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setText(""); setImage(null); }}
            className="rounded-full border px-4 py-2 text-sm k-surface k-border-strong dark:text-white"
          >Clear</button>

          {/* 2. LOGIC SPLIT: If unauthenticated, show a button that ONLY triggers signIn */}
          {status !== "authenticated" ? (
            <button
              type="button"
              onClick={handleGuestClick}
              className="rounded-full bg-black text-white dark:bg-white dark:text-black px-5 py-2 text-sm font-medium active:scale-95 transition"
            >
              Spill
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePost}
              disabled={!canPost || isPending}
              className="rounded-full bg-black text-white dark:bg-white dark:text-black px-5 py-2 text-sm font-medium disabled:opacity-50 active:scale-95 transition"
            >
              {isPending ? "Posting…" : "Spill"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}