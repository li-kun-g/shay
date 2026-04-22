"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getDmSuggestions } from "@/app/actions/getDMSuggestions";
import { sendDirectMessageByUsername } from "@/app/actions/sendDirectMessageByUsername";

type Friend = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
};

function copyText(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => execFallback(text));
  } else {
    execFallback(text);
  }
}

function execFallback(text: string) {
  const el = document.createElement("input");
  el.value = text;
  el.style.cssText = "position:fixed;opacity:0;top:0;left:0;";
  document.body.appendChild(el);
  el.focus();
  el.select();
  try { document.execCommand("copy"); } catch {}
  document.body.removeChild(el);
}

export default function ShareSheet({
  postId,
  open,
  onClose,
}: {
  postId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    setSent(new Set());
    getDmSuggestions()
      .then((res: Friend[]) => setFriends(res.slice(0, 8)))
      .catch(() => {});
  }, [open]);

  if (!mounted || !open) return null;

  const url = `${window.location.origin}/post/${postId}`;

  function handleCopy() {
    copyText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSend(username: string) {
    if (sent.has(username) || sending) return;
    setSending(username);
    try {
      await sendDirectMessageByUsername({ username, text: url });
      setSent((prev) => new Set([...prev, username]));
    } catch {
      // ignore
    } finally {
      setSending(null);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-end justify-center sm:items-center">
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      <div
        className="relative z-[401] w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] border p-5 shadow-2xl k-surface k-border-strong"
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle (mobile) */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-white/10 sm:hidden" />

        <h3 className="text-base font-semibold mb-4">Share</h3>

        {/* Copy link row */}
        <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 mb-5 k-border-strong">
          <span className="flex-1 text-sm text-[color:var(--text-muted)] truncate">{url}</span>
          <button
            type="button"
            onClick={handleCopy}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium transition active:scale-95 ${
              copied ? "bg-green-500 text-white" : "bg-black text-white"
            }`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Friends */}
        {friends.length > 0 && (
          <>
            <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)] mb-3">
              Send to friend
            </p>
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {friends.map((f) => (
                <div key={f.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-gray-100 dark:bg-white/10">
                    {f.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.image} alt={f.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg leading-none">☕</span>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium truncate">
                    {f.name || f.username}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSend(f.username)}
                    disabled={!!sending || sent.has(f.username)}
                    className={`rounded-xl border px-4 py-1.5 text-sm transition active:scale-95 ${
                      sent.has(f.username)
                        ? "border-green-300 bg-green-50 text-green-600 dark:bg-green-900/20 dark:border-green-700"
                        : "k-border-strong hover:bg-[var(--muted)]"
                    }`}
                  >
                    {sending === f.username ? "…" : sent.has(f.username) ? "Sent ✓" : "Send"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
