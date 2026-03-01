"use client";

import { useRef, useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";

export type UploadedPostImage = { url: string; key: string };

export default function PostImageUploader(props: {
  disabled?: boolean;
  onUploaded: (file: UploadedPostImage) => void;
  onError?: (msg: string) => void;
}) {
  const { disabled, onUploaded, onError } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing("postImage", {
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      const f = res?.[0] as any;
      if (!f?.url || !f?.key) return;
      onUploaded({ url: String(f.url), key: String(f.key) });
    },
    onUploadError: (e) => {
      setIsUploading(false);
      onError?.(e?.message ?? "Upload failed");
    },
  });

  const actuallyDisabled = !!disabled || isUploading;

  async function onPickFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await startUpload([file]);
    } catch (e: any) {
      setIsUploading(false);
      onError?.(e?.message ?? "Upload failed");
    } finally {
      // allow re-uploading the same file again
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPickFile(e.target.files)}
        disabled={actuallyDisabled}
      />

      <button
        type="button"
        disabled={actuallyDisabled}
        onClick={() => inputRef.current?.click()}
        className={[
          "h-9 w-9 rounded-full bg-black text-white flex items-center justify-center",
          "hover:bg-gray-900 active:scale-95 transition shadow-sm",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        ].join(" ")}
        aria-label="Upload photo"
        title="Upload photo"
      >
        {isUploading ? "…" : "📸"}
      </button>
    </>
  );
}