"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function SavePrivacyButton({
  saveText,
  savedText = "Changes saved successfully!",
}: {
  saveText: string;
  savedText?: string;
}) {
  const { pending } = useFormStatus();
  const [showSuccess, setShowSuccess] = useState(false);
  const [wasPending, setWasPending] = useState(false);

  useEffect(() => {
    if (pending) {
      setWasPending(true);
    } else if (wasPending && !pending) {
      setWasPending(false);
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [pending, wasPending]);

  return (
    <>
      {/* 🟢 Using a Portal to render the box at the top of the <body> 
          This prevents it from being deleted when the form refreshes! */}
      {showSuccess && typeof document !== "undefined" && createPortal(
        <div className="fixed top-6 left-1/2 z-[9999] -translate-x-1/2 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-center gap-2 rounded-2xl bg-green-500 px-6 py-3 text-white shadow-2xl border border-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-bold tracking-wide">{savedText}</span>
          </div>
        </div>,
        document.body
      )}

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={pending}
          className="
            w-full md:w-auto rounded-xl px-8 py-3 text-sm font-bold shadow-md transition-all active:scale-95 
            disabled:opacity-60 disabled:cursor-not-allowed
            bg-black text-white hover:bg-zinc-800
            dark:bg-white dark:text-black dark:hover:bg-zinc-100
          "
        >
          {pending ? "Saving..." : saveText}
        </button>
      </div>
    </>
  );
}