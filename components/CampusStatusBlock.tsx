"use client";

import { useMemo, useState, useTransition } from "react";
import { setCampusStatus } from "@/app/actions/setCampusStatus";
import { useI18n } from "@/components/LanguageProvider";

type CampusStatus = "ON" | "OFF" | null;

function minutesAgo(updatedAt?: string | null, t?: (key: any) => string) {
  if (!updatedAt) return null;
  const ms = Date.now() - new Date(updatedAt).getTime();
  const mins = Math.max(0, Math.floor(ms / 60000));
  if (mins <= 0) return t ? t("campus.justNow") : "just now";
  if (mins === 1) return t ? t("campus.oneMinuteAgo") : "1m ago";
  return t ? `${mins}${t("campus.minutesAgoShort")}` : `${mins}m ago`;
}

export default function CampusStatusBlock(props: {
  editable: boolean;
  initialStatus: CampusStatus;
  initialUpdatedAt: string | null;
  showFreshness?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const { editable } = props;

  const [status, setStatus] = useState<CampusStatus>(props.initialStatus);
  const [updatedAt, setUpdatedAt] = useState<string | null>(
    props.initialUpdatedAt
  );
  const [isPending, startTransition] = useTransition();

  const text = useMemo(() => {
    if (!status) return t("campus.noStatus");
    return status === "ON" ? t("campus.on") : t("campus.off");
  }, [status, t]);

  const ago = useMemo(() => minutesAgo(updatedAt, t), [updatedAt, t]);

  function commit(nextStatus: CampusStatus) {
    startTransition(async () => {
      if (nextStatus === null) {
        setStatus(null);
        setUpdatedAt(null);
      } else {
        setStatus(nextStatus);
        setUpdatedAt(new Date().toISOString());
      }

      try {
        await setCampusStatus({ status: nextStatus });
      } catch {
        setStatus(props.initialStatus);
        setUpdatedAt(props.initialUpdatedAt);
      }
    });
  }

  function toggleStatus() {
    if (!editable) return;
    const next: CampusStatus = status === "ON" ? "OFF" : "ON";
    commit(next);
  }

  if (!editable && !status) return null;

  if (editable) {
    return (
      <div
        className={["flex items-center gap-3", props.className ?? ""].join(" ")}
      >
        <button
          type="button"
          disabled={isPending}
          onClick={toggleStatus}
          className={[
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
            "bg-white hover:bg-gray-50 active:scale-[0.99]",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          ].join(" ")}
        >
          <span className="text-base leading-none">
            {status === "ON" ? "🟢" : status === "OFF" ? "🔴" : "⚪"}
          </span>

          <span className="font-medium text-gray-900">{text}</span>
        </button>

        <button
          type="button"
          disabled={isPending || status === null}
          onClick={() => commit(null)}
          className="text-sm text-gray-500 hover:underline disabled:opacity-40"
        >
          {t("common.clear")}
        </button>
      </div>
    );
  }

  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-white text-gray-900",
        props.className ?? "",
      ].join(" ")}
    >
      <span className="text-base leading-none">
        {status === "ON" ? "🟢" : "🔴"}
      </span>

      <span className="font-medium">{text}</span>

      {props.showFreshness !== false && ago && (
        <span className="text-gray-500">· {ago}</span>
      )}
    </div>
  );
}