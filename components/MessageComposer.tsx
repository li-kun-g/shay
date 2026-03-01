"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/app/actions/sendMessage";
import { sendDirectMessageByUsername } from "@/app/actions/sendDirectMessageByUsername";
import { useI18n } from "@/components/LanguageProvider";

export default function MessageComposer({
  conversationId,
  initialUsername,
}: {
  conversationId?: string;
  initialUsername?: string;
}) {
  const router = useRouter();
  const { t } = useI18n();

  const [text, setText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSend() {
    const value = text.trim();
    if (!value) return;

    setErrorMsg(null);

    startTransition(async () => {
      try {
        if (conversationId) {
          await sendMessage({ conversationId, text: value });
          setText("");
          router.refresh();
          return;
        }

        if (initialUsername) {
          const res = await sendDirectMessageByUsername({
            username: initialUsername,
            text: value,
          });
          setText("");
          router.push(`/messages/${res.conversationId}`);
          router.refresh();
          return;
        }

        throw new Error("MISSING_TARGET");
      } catch (e: any) {
        const msg = typeof e?.message === "string" ? e.message : "UNKNOWN_ERROR";
        setErrorMsg(msg);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("messages.inputPlaceholder")}
          className="flex-1 rounded-xl border px-3 py-2 text-sm bg-white dark:bg-transparent"
          onKeyDown={(e) => {
            if (e.key === "Enter") onSend();
          }}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={isPending}
          className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isPending ? t("messages.sending") : t("messages.send")}
        </button>
      </div>

      {errorMsg && (
        <div className="text-sm text-red-600">
          {errorMsg === "USER_NOT_FOUND"
            ? t("messages.userNotFound")
            : errorMsg === "CANNOT_DM_SELF"
            ? t("messages.cannotDmSelf")
            : errorMsg === "DM_FRIENDS_ONLY"
            ? t("messages.friendsOnly")
            : errorMsg === "AUTH_REQUIRED"
            ? t("messages.signInAgain")
            : t("messages.tryAgain")}
        </div>
      )}
    </div>
  );
}