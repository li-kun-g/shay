// components/AvatarUploader.tsx
"use client";

import { useRef, useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";

export default function AvatarUploader({
  onUploaded,
  endpoint = "avatarImage",
}: {
  onUploaded?: (url: string) => void;
  endpoint?: "avatarImage" | "groupImage";
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.url;
      if (url) onUploaded?.(url);
      setIsUploading(false);
    },
    onUploadError: (e) => {
      console.error("Upload error:", e);
      setIsUploading(false);
      alert(e?.message ?? "Upload failed");
    },
  });

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      await startUpload([file]);
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPickFile}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={
          "w-full h-12 rounded-2xl bg-black text-white " +
          "text-sm font-medium flex items-center justify-center " +
          "hover:bg-gray-900 transition " +
          "focus:outline-none focus:ring-2 focus:ring-black/30 " +
          (isUploading ? "opacity-70 cursor-not-allowed" : "")
        }
      >
        {isUploading ? "Uploading…" : "Upload"}
      </button>
    </div>
  );
}
