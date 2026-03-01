"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDmSuggestions } from "@/app/actions/getDMSuggestions";
import { findExistingDm } from "@/app/actions/findExistingDm";
import MessageComposer from "@/components/MessageComposer";
import { useI18n } from "@/components/LanguageProvider";

type SuggestedUser = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  isFriend: boolean;
};

function debounceMs(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function NewDmPage() {
  const { t } = useI18n();

  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTo = searchParams.get("to") ?? "";

  const [q, setQ] = useState(initialTo);
  const [focused, setFocused] = useState(false);

  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [existingConversationId, setExistingConversationId] = useState<string | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);

  const selectedUsername = q.trim().replace(/^@+/, "");
  const showSuggestions = focused;

  useEffect(() => {
    setQ(initialTo);
  }, [initialTo]);

  useEffect(() => {
    if (!showSuggestions) return;

    let cancelled = false;

    (async () => {
      setLoading(true);

      if (q.trim().length > 0) await debounceMs(200);

      try {
        const res = await getDmSuggestions({ q });
        if (!cancelled) setSuggestions(res);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [q, showSuggestions]);

  useEffect(() => {
    let cancelled = false;

    if (!selectedUsername) {
      setExistingConversationId(null);
      setCheckingExisting(false);
      return;
    }

    (async () => {
      setCheckingExisting(true);
      setErrorMsg(null);

      try {
        const res = await findExistingDm(selectedUsername);
        if (cancelled) return;
        setExistingConversationId(res.exists ? res.conversationId : null);
      } catch (e: any) {
        if (cancelled) return;
        setExistingConversationId(null);

        const msg =
          typeof e?.message === "string"
            ? e.message
            : t("messages.tryAgain");
        setErrorMsg(msg);
      } finally {
        if (!cancelled) setCheckingExisting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedUsername, t]);

  const header = useMemo(() => {
    if (q.trim().length > 0) return t("messages.suggested");
    const hasFriends = suggestions.some((s) => s.isFriend);
    return hasFriends ? t("friends.title") : t("messages.suggested");
  }, [q, suggestions, t]);

  function pickUser(u: SuggestedUser) {
    setQ(u.username);
    setErrorMsg(null);
  }

  function onOpenExistingChat() {
    if (!existingConversationId) return;
    router.push(`/messages/${existingConversationId}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <h1 className="text-2xl font-semibold mb-6">{t("messages.newDm")}</h1>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setTimeout(() => setFocused(false), 120);
        }}
        placeholder={t("messages.searchUser")}
        className="w-full rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-black/10 bg-white dark:bg-transparent"
      />

      {selectedUsername ? (
        <div className="rounded-2xl border bg-white dark:bg-[var(--surface)] p-4 shadow-sm space-y-3">
          <div className="text-sm text-gray-500 dark:text-[color:var(--text-muted)]">
            @{selectedUsername}
          </div>

          {checkingExisting ? (
            <div className="text-sm text-gray-500">{t("common.loading")}</div>
          ) : existingConversationId ? (
            <button
              type="button"
              onClick={onOpenExistingChat}
              disabled={isPending}
              className="w-full rounded-2xl bg-black px-4 py-3 text-base text-white disabled:opacity-50"
            >
              {t("messages.openChat")}
            </button>
          ) : (
            <MessageComposer initialUsername={selectedUsername} />
          )}
        </div>
      ) : null}

      {errorMsg && (
        <p className="text-sm text-red-600">
          {errorMsg === "USER_NOT_FOUND"
            ? t("messages.userNotFound")
            : errorMsg === "CANNOT_DM_SELF"
            ? t("messages.cannotDmSelf")
            : errorMsg === "AUTH_REQUIRED"
            ? t("messages.signInAgain")
            : errorMsg}
        </p>
      )}

      {showSuggestions && (
        <div className="rounded-2xl border bg-white dark:bg-[var(--surface)] shadow-sm">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{header}</p>
              {loading && (
                <p className="text-xs text-gray-500">{t("common.loading")}</p>
              )}
            </div>
          </div>

          <div className="max-h-[320px] overflow-auto">
            {suggestions.length === 0 && !loading ? (
              <div className="px-4 py-4 text-sm text-gray-500">
                {t("common.noResults")}
              </div>
            ) : (
              <ul className="divide-y">
                {suggestions.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickUser(u)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-left"
                    >
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 border shrink-0 flex items-center justify-center">
                        {u.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm text-gray-500">
                            {u.username.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {u.name || u.username}
                          </p>
                          {u.isFriend && (
                            <span className="text-xs rounded-full border px-2 py-[2px] text-gray-700 dark:text-white/80">
                              {t("friends.friend")}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          @{u.username}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </main>
  );
}