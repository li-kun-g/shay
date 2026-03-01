"use client";

import { useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";

export default function EventImageUploader(props: {
  value: string | null;
  onChange: (next: { url: string; key?: string }) => void;
}) {
  const { value, onChange } = props;

  const [error, setError] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing("eventImage", {
    onClientUploadComplete: (files) => {
      const f = files?.[0];
      if (!f?.url) return;
      onChange({ url: f.url, key: (f as any).key });
      setError(null);
    },
    onUploadError: (e) => {
      setError(e?.message ?? "Upload failed");
    },
  });

  return (
    <div className="space-y-2">
      {value ? (
        <div className="rounded-2xl border bg-white overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Event" className="w-full h-auto object-cover" />
          <div className="p-3 flex items-center justify-between">
            <div className="text-xs text-gray-500">Cover image attached</div>
            <button
              type="button"
              className="text-sm rounded-xl border px-3 py-1.5 hover:bg-gray-50"
              onClick={() => onChange({ url: "" })}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-3 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-600">Add a cover image (optional)</div>

          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={async (e) => {
                const input = e.currentTarget;
                const file = input.files?.[0];
                if (!file) return;

                setError(null);

                try {
                  await startUpload([file]);
                } finally {
                  if (input) input.value = "";
                }
              }}
            />

            <span className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-sm text-white">
              {isUploading ? "Uploading…" : "Choose"}
            </span>
          </label>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
