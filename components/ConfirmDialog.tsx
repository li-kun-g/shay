"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ConfirmDialog(props: {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const {
    open,
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmText = "Delete",
    cancelText = "Cancel",
    danger = true,
    onConfirm,
    onCancel,
    loading,
  } = props;

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-5" role="dialog" aria-modal="true">
      {/* Backdrop — blurs the entire page */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onCancel} />

      {/* Centered dialog */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border shadow-2xl p-5 bg-white dark:bg-[var(--surface)] dark:border-[var(--border-strong)]">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border px-4 py-2 text-sm disabled:opacity-60 hover:bg-gray-50 dark:hover:bg-white/10 transition k-border-strong"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-4 py-2 text-sm text-white disabled:opacity-60 active:scale-95 transition ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-zinc-800"
            }`}
          >
            {loading ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
