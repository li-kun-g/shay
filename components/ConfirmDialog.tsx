"use client";

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      {/* Mobile: bottom sheet */}
      <div className="sm:hidden absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white border-t shadow-2xl p-4">
        <div className="w-12 h-1.5 rounded-full bg-gray-200 mx-auto mb-3" />

        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{description}</p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border px-4 py-2 text-sm disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-2 text-sm text-white disabled:opacity-60 ${
              danger ? "bg-red-600" : "bg-black"
            }`}
          >
            {loading ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>

      {/* Desktop: centered dialog */}
      <div className="hidden sm:flex absolute inset-0 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white border shadow-2xl p-5">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-xl border px-4 py-2 text-sm disabled:opacity-60"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`rounded-xl px-4 py-2 text-sm text-white disabled:opacity-60 ${
                danger ? "bg-red-600" : "bg-black"
              }`}
            >
              {loading ? "Deleting..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}