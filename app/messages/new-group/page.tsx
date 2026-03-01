"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { getDmSuggestions } from "@/app/actions/getDMSuggestions";
import { createGroupChat } from "@/app/actions/createGroupChat";
import { useI18n } from "@/components/LanguageProvider";

type SuggestedUser = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  isFriend: boolean;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function SubmitButton({
  labelCreating,
  labelCreate,
}: {
  labelCreating: string;
  labelCreate: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-black px-4 py-3 text-base text-white disabled:opacity-50"
    >
      {pending ? labelCreating : labelCreate}
    </button>
  );
}

export default function NewGroupPage() {
  const { t } = useI18n();

  const [groupName, setGroupName] = useState("");
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);

  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [selected, setSelected] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(false);

  const showSuggestions = focused;

  useEffect(() => {
    if (!showSuggestions) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      const term = q.trim();
      if (term.length > 0) await sleep(200);

      try {
        const res = await getDmSuggestions({ q: term });
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

  const header = useMemo(() => {
    if (q.trim().length > 0) return t("messages.suggested");
    const hasFriends = suggestions.some((s) => s.isFriend);
    return hasFriends ? t("friends.title") : t("messages.suggested");
  }, [q, suggestions, t]);

  const selectedSet = useMemo(
    () => new Set(selected.map((u) => u.username.toLowerCase())),
    [selected]
  );

  const list = useMemo(
    () => suggestions.filter((u) => !selectedSet.has(u.username.toLowerCase())),
    [suggestions, selectedSet]
  );

  function addUser(u: SuggestedUser) {
    if (selected.length >= 149) return; // creator + 149 others = 150 total
    setSelected((prev) => [...prev, u]);
    setQ("");
  }

  function removeUser(username: string) {
    setSelected((prev) => prev.filter((x) => x.username !== username));
  }

  const usernamesCsv = selected.map((u) => u.username).join(",");
  const memberCountLabel = `${selected.length + 1}/150`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">{t("messages.newGroup")}</h1>

      <form
        action={async () => {
          await createGroupChat({
            name: groupName,
            usernames: usernamesCsv,
          });
        }}
        className="space-y-3"
      >
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder={t("messages.groupName")}
          className="w-full rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-black/10 bg-white dark:bg-transparent"
        />

        <div className="text-sm text-gray-500 dark:text-[color:var(--text-muted)]">
          {t("messages.groupMembersLimit")} {memberCountLabel}
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => removeUser(u.username)}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/5"
                title={t("common.remove")}
              >
                <span className="font-medium">{u.name || u.username}</span>
                <span className="text-gray-500">@{u.username}</span>
                <span className="text-gray-400">×</span>
              </button>
            ))}
          </div>
        )}

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          placeholder={t("messages.addPeople")}
          className="w-full rounded-2xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-black/10 bg-white dark:bg-transparent"
        />

        <SubmitButton
          labelCreating={t("messages.creating")}
          labelCreate={t("messages.createGroup")}
        />

        {showSuggestions && (
          <div className="rounded-2xl border bg-white dark:bg-[var(--surface)] shadow-sm">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <p className="text-sm font-medium">{header}</p>
              {loading && (
                <p className="text-xs text-gray-500">{t("common.loading")}</p>
              )}
            </div>

            <div className="max-h-[320px] overflow-auto">
              {list.length === 0 && !loading ? (
                <div className="px-4 py-4 text-sm text-gray-500">
                  {t("common.noResults")}
                </div>
              ) : (
                <ul className="divide-y">
                  {list.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addUser(u)}
                        disabled={selected.length >= 149}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-left disabled:opacity-50"
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
      </form>
    </main>
  );
}