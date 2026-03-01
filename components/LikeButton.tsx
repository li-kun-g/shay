"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleLike } from "@/app/actions/toggleLike";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LikeButton(props: {
  postId: string;
  likedByMe: boolean;
  likeCount: number;
  buttonId?: string; // ✅ NEW
}) {
  const { postId, buttonId } = props;

  const [liked, setLiked] = useState(props.likedByMe);
  const [count, setCount] = useState(props.likeCount);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setLiked(props.likedByMe);
    setCount(props.likeCount);
  }, [props.likedByMe, props.likeCount]);

  const [isPending, startTransition] = useTransition();
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  function optimisticToggle() {
    setLiked((prev) => !prev);
    setCount((prev) => (liked ? Math.max(0, prev - 1) : prev + 1));

    setPulse(true);
    setTimeout(() => setPulse(false), 180);
  }

  async function onClick() {
    if (status !== "authenticated") {
      await signIn();
      return;
    }

    const prevLiked = liked;
    const prevCount = count;

    optimisticToggle();

    startTransition(async () => {
      try {
        await toggleLike(postId);

        // Refresh only when Top Tea is active (re-sorts)
        if (searchParams.get("sort") === "top") {
          router.refresh();
        }
      } catch {
        setLiked(prevLiked);
        setCount(prevCount);
      }
    });
  }

  return (
    <button
      id={buttonId} // ✅ NEW
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={`relative inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm
        transition active:scale-95
        ${liked ? "bg-black text-white border-black" : "bg-white"}
        ${isPending ? "opacity-70" : ""}
      `}
      aria-label={liked ? "Unlike" : "Like"}
    >
      {pulse && (
        <span className="absolute inset-0 rounded-full ring-2 ring-black/40 animate-like-pulse" />
      )}

      <span
        className={`relative transition-transform ${
          pulse ? "scale-125 rotate-[-6deg]" : ""
        }`}
      >
        ☕
      </span>

      <span className="relative">{count}</span>
    </button>
  );
}
