"use client";

import { useState, useTransition } from "react";
import { createTag, deleteTag } from "@/app/actions/adminTags";

type PostTag = { id: string; name: string; slug: string; emoji: string; order: number };

export default function TagsClient({
  tags,
  postCounts,
}: {
  tags: PostTag[];
  postCounts: Record<string, number>;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteTag(id);
      if (res?.error) setError(res.error);
      else setConfirmDelete(null);
    });
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await createTag(fd);
      if (res?.error) setError(res.error);
      else form.reset();
    });
  }

  return (
    <div className="space-y-8">
      {/* Error banner */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Existing tags */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Active tags ({tags.length})
        </h2>

        <div className="grid gap-2 sm:grid-cols-2">
          {tags.map((tag) => {
            const count = postCounts[tag.slug] ?? 0;
            const isDefault = tag.slug === "OTHER";

            return (
              <div
                key={tag.id}
                className="flex items-center justify-between gap-3 rounded-2xl border bg-white dark:bg-[var(--surface)] dark:border-[var(--border-strong)] px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl w-7 text-center shrink-0">{tag.emoji || "🏷️"}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{tag.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{tag.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                    {count} posts
                  </span>

                  {isDefault ? (
                    <span className="text-xs text-gray-400 px-2 py-1">default</span>
                  ) : confirmDelete === tag.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 mr-1">
                        {count > 0 ? `${count} posts → OTHER` : "Sure?"}
                      </span>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        disabled={isPending}
                        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs text-white font-medium hover:bg-red-700 transition disabled:opacity-50"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-lg border px-2.5 py-1 text-xs hover:bg-gray-50 dark:hover:bg-white/10 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(tag.id)}
                      className="rounded-lg border px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Create new tag */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Create new tag
        </h2>

        <form
          onSubmit={handleCreate}
          className="rounded-2xl border bg-white dark:bg-[var(--surface)] dark:border-[var(--border-strong)] p-5 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Display name</label>
              <input
                name="name"
                required
                placeholder="e.g. Campus life"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black bg-transparent"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Slug (filter key)</label>
              <input
                name="slug"
                required
                placeholder="e.g. CAMPUS_LIFE"
                className="w-full rounded-xl border px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-black bg-transparent uppercase"
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
                }}
              />
              <p className="text-xs text-gray-400">Uppercase letters, numbers and _ only</p>
            </div>

            {/* Emoji */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Emoji</label>
              <input
                name="emoji"
                placeholder="e.g. 🎓"
                maxLength={4}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black bg-transparent"
              />
            </div>

            {/* Order */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Sort order</label>
              <input
                name="order"
                type="number"
                defaultValue={tags.length}
                min={0}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black bg-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition disabled:opacity-50 active:scale-95"
          >
            {isPending ? "Creating…" : "Create tag"}
          </button>
        </form>
      </section>
    </div>
  );
}
