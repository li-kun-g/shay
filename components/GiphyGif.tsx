"use client";

import { useEffect, useState } from "react";
import {
  getGifDisplayMedia,
  getGiphyGifById,
  type GiphyGif,
} from "@/lib/giphy";

export default function GiphyGif({ gifId }: { gifId: string }) {
  const [gif, setGif] = useState<GiphyGif | null>(null);

  useEffect(() => {
    let cancelled = false;

    getGiphyGifById(gifId)
      .then((data) => {
        if (!cancelled) setGif(data);
      })
      .catch((e) => {
        console.error(e);
      });

    return () => {
      cancelled = true;
    };
  }, [gifId]);

  if (!gif) return null;

  const media = getGifDisplayMedia(gif);

  return (
    <div className="inline-block w-fit max-w-full overflow-hidden rounded-2xl border border-white/10 bg-black/5">
      {media.mp4 ? (
        <video
          src={media.mp4}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="block h-auto max-h-[340px] w-auto max-w-full"
        />
      ) : (
        <img
          src={media.src}
          alt={gif.title || "GIF"}
          loading="lazy"
          className="block h-auto max-h-[340px] w-auto max-w-full"
        />
      )}
    </div>
  );
}