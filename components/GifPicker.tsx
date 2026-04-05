"use client"

import { useEffect, useState } from "react"
import {
  getGifPreviewMedia,
  getTrendingGiphyGifs,
  searchGiphyGifs,
  type GiphyGif,
} from "@/lib/giphy"

export type SelectedGif = {
  id: string
  title: string
}

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (gif: SelectedGif) => void
}

export default function GifPicker({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<GiphyGif[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    let cancelled = false

    const run = async () => {
      try {
        setLoading(true)
        const data = query.trim()
          ? await searchGiphyGifs(query.trim())
          : await getTrendingGiphyGifs()

        if (!cancelled) setItems(data)
      } catch (e) {
        console.error(e)
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const t = setTimeout(run, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [open, query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 p-4">
      <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-neutral-950 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Choose a GIF</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1 text-sm"
          >
            Close
          </button>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GIFs..."
          className="mb-3 w-full rounded-xl border border-white/10 bg-black px-3 py-2 outline-none"
        />

        <div className="grid max-h-[60vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-8 text-center text-sm text-white/60">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="col-span-full py-8 text-center text-sm text-white/60">
              No GIFs found
            </div>
          ) : (
            items.map((gif) => {
              const media = getGifPreviewMedia(gif)

              return (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => {
                    onSelect({ id: gif.id, title: gif.title || "GIF" })
                    onClose()
                  }}
                  className="overflow-hidden rounded-xl border border-white/10 bg-black"
                >
                  {media.mp4 ? (
                    <video
                      src={media.mp4}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      className="h-auto w-full"
                    />
                  ) : (
                    <img
                      src={media.src}
                      alt={gif.title || "GIF"}
                      loading="lazy"
                      className="h-auto w-full"
                    />
                  )}
                </button>
              )
            })
          )}
        </div>

        <div className="mt-3 text-center text-xs text-white/50">
          Powered by GIPHY
        </div>
      </div>
    </div>
  )
}