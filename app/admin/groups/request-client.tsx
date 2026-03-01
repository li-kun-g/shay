"use client";

import { useState, useTransition } from "react";
import {
  adminApproveGroupRequest,
  adminRejectGroupRequest,
} from "@/app/actions/groups";

type Req = {
  id: string;
  createdAt: Date;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  requestedBy: { username: string; name: string | null; email: string };
};

export default function AdminGroupRequestsClient({
  initialRequests,
}: {
  initialRequests: Req[];
}) {
  const [isPending, startTransition] = useTransition();
  const [requests, setRequests] = useState<Req[]>(initialRequests);

  function approve(id: string) {
    startTransition(async () => {
      await adminApproveGroupRequest(id);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" } : r))
      );
    });
  }

  function reject(id: string) {
    const note = prompt("Reason (optional):") ?? "";
    startTransition(async () => {
      await adminRejectGroupRequest(id, note);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "REJECTED", adminNote: note || null } : r
        )
      );
    });
  }

  return (
    <div className="space-y-3">
      {requests.length === 0 ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-gray-600 shadow-sm">
          No requests yet.
        </div>
      ) : (
        requests.map((r) => (
          <div key={r.id} className="rounded-2xl border bg-white p-4 space-y-2 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{r.name}</div>
                <div className="text-xs text-gray-500">@{r.slug}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Requested by @{r.requestedBy.username} ({r.requestedBy.email})
                </div>
              </div>

              <span
                className={
                  "text-xs rounded-full border px-2 py-1 " +
                  (r.status === "PENDING"
                    ? "bg-gray-50"
                    : r.status === "APPROVED"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700")
                }
              >
                {r.status}
              </span>
            </div>

            {r.description && <div className="text-sm text-gray-700">{r.description}</div>}

            {r.adminNote && (
              <div className="text-xs text-gray-500">Note: {r.adminNote}</div>
            )}

            {r.status === "PENDING" && (
              <div className="flex gap-2">
                <button
                  disabled={isPending}
                  onClick={() => approve(r.id)}
                  className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  disabled={isPending}
                  onClick={() => reject(r.id)}
                  className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
