"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGroupEvent } from "@/app/actions/groups";
import EventImageUploader from "@/components/EventImageUploader";

export default function GroupEventForm(props: {
  groupId: string;
  groupSlug: string;
}) {
  const { groupId, groupSlug } = props;
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  // ✅ NEW
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createGroupEvent({
        groupId,
        title,
        description,
        location: location || undefined,
        startsAt,
        endsAt: endsAt || undefined,

        // ✅ NEW
        imageUrl: imageUrl || undefined,
      });

      if (!res?.ok) throw new Error("Failed to create event");

      const url = `/g/${groupSlug}?tab=events&created=1`;

      router.replace(url);
      router.refresh();

      setTimeout(() => {
        window.location.assign(url);
      }, 150);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="text-lg font-semibold">Create event</div>
      <div className="text-sm text-gray-600">
        This event will be published from the group page.
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ✅ NEW: image upload */}
      <div className="rounded-2xl border bg-white p-3">
        <div className="text-sm font-medium">Event image (optional)</div>
        <div className="text-xs text-gray-500 mt-1">
          One image, used as the event cover.
        </div>

        <div className="mt-3">
          <EventImageUploader
            value={imageUrl}
            onChange={(next) => setImageUrl(next.url)}
          />
        </div>
      </div>

      <input
        className="w-full rounded-xl border px-4 py-3 text-sm"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <textarea
        className="w-full rounded-xl border px-4 py-3 text-sm min-h-[140px]"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />

      <input
        className="w-full rounded-xl border px-4 py-3 text-sm"
        placeholder="Location (optional)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      <input
        className="w-full rounded-xl border px-4 py-3 text-sm"
        type="datetime-local"
        value={startsAt}
        onChange={(e) => setStartsAt(e.target.value)}
        required
      />

      <input
        className="w-full rounded-xl border px-4 py-3 text-sm"
        type="datetime-local"
        value={endsAt}
        onChange={(e) => setEndsAt(e.target.value)}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-black px-4 py-3 text-sm text-white transition disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Create event"}
      </button>
    </form>
  );
}
