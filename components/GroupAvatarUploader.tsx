"use client";

import Image from "next/image";
import { useState } from "react";
import AvatarUploader from "@/components/AvatarUploader";

export default function GroupAvatarUploader(props: {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}) {
  const { value, onChange, label = "Group avatar" } = props;
  const [preview, setPreview] = useState<string | null>(value);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm font-medium mb-3">{label}</div>

      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border bg-gray-50 shrink-0">
          {preview ? (
            <Image
              src={preview}
              alt="Group avatar"
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
              No image
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <AvatarUploader
            onUploaded={(url) => {
              setPreview(url);
              onChange(url);
            }}
          />

          {preview && (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                onChange(null);
              }}
              className="w-full h-10 rounded-2xl border text-sm hover:bg-gray-50 transition"
            >
              Remove
            </button>
          )}

          <div className="text-xs text-gray-400">
            Tip: square image looks best.
          </div>
        </div>
      </div>
    </div>
  );
}
