"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { openSupportChat } from "@/app/actions/openSupportChat";

export default function SupportOpenCard() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold">Chat with administration</div>
          <p className="mt-1 text-sm text-gray-500">
            One chat per user. The admin/owner can read and reply to everything here.
          </p>
        </div>

        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await openSupportChat();
              if (res?.ok && res.url) router.push(res.url);
            })
          }
          className="shrink-0 rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Opening..." : "Open chat"}
        </button>
      </div>

      <div className="mt-4 rounded-xl border bg-gray-50 p-3 text-sm text-gray-600">
        Tip: Start the chat with a short title like <b>“Bug:”</b>, <b>“Suggestion:”</b>, or{" "}
        <b>“Complaint:”</b>.
      </div>
    </section>
  );
}