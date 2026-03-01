"use client";

import { useState, useTransition } from "react";
import { setCampusPrefs } from "@/app/actions/setCampusPrefs";

type CampusVisibility = "ONLY_ME" | "FRIENDS" | "EVERYONE";
type CampusDuration = "2h" | "4h" | "eod";

export default function CampusPrefsForm(props: {
  initialVisibility: CampusVisibility;
  initialDuration: CampusDuration;
}) {
  const [visibility, setVisibility] = useState<CampusVisibility>(
    props.initialVisibility
  );
  const [duration, setDuration] = useState<CampusDuration>(
    props.initialDuration
  );
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await setCampusPrefs({ visibility, duration });
    });
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
      <div className="font-semibold">Campus status settings</div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-gray-500">Visible to:</span>
          <select
            value={visibility}
            disabled={isPending}
            onChange={(e) => setVisibility(e.target.value as CampusVisibility)}
            className="rounded-full border px-3 py-1 bg-white"
          >
            <option value="ONLY_ME">Only me</option>
            <option value="FRIENDS">Friends</option>
            <option value="EVERYONE">Everyone</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-gray-500">Expires in:</span>
          <select
            value={duration}
            disabled={isPending}
            onChange={(e) => setDuration(e.target.value as CampusDuration)}
            className="rounded-full border px-3 py-1 bg-white"
          >
            <option value="2h">2 hours</option>
            <option value="4h">4 hours</option>
            <option value="eod">Until end of day</option>
          </select>
        </label>

        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="ml-auto rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          Save
        </button>
      </div>

      <div className="text-xs text-gray-400">
        These settings will be used when you toggle your campus status.
      </div>
    </div>
  );
}
