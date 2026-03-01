"use client";

import { useRef, useState } from "react";

export default function TapToLike({
  likeButtonId,
  children,
}: {
  likeButtonId: string;
  children: React.ReactNode;
}) {
  const lastTapRef = useRef<number>(0);
  const [flash, setFlash] = useState(false);

  function triggerLike() {
    const btn = document.getElementById(likeButtonId) as HTMLButtonElement | null;
    if (!btn) return;

    // visual flash (once)
    setFlash(true);
    setTimeout(() => setFlash(false), 180);

    // trigger LikeButton logic (optimistic + auth + refresh on top)
    btn.click();
  }

  function isInteractiveTarget(target: EventTarget | null) {
    const el = target as HTMLElement | null;
    if (!el) return false;
    return !!el.closest("button, a, input, textarea, select, label");
  }

  // Mobile: detect double tap
  function onTouchEnd(e: React.TouchEvent) {
    if (isInteractiveTarget(e.target)) return;

    const now = Date.now();
    const dt = now - lastTapRef.current;

    // 2 taps within 280ms = double tap
    if (dt > 0 && dt < 280) {
      triggerLike();
      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;
  }

  // Desktop: double click
  function onDoubleClick(e: React.MouseEvent) {
    if (isInteractiveTarget(e.target)) return;
    triggerLike();
  }

  return (
    <div onTouchEnd={onTouchEnd} onDoubleClick={onDoubleClick} className="relative">
      {/* One-shot flash overlay */}
      {flash && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="rounded-full bg-black/70 px-4 py-2 text-white text-lg animate-like-pulse">
            ☕
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
