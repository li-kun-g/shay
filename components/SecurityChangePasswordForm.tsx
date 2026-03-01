"use client";

import React, { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { changePassword, type ChangePasswordState } from "@/app/actions/changePassword";

const initialState: ChangePasswordState | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Saving..." : "Change password"}
    </button>
  );
}

export default function SecurityChangePasswordForm() {
  const [state, formAction] = React.useActionState(changePassword, initialState);

  // When success: clear inputs (nice UX)
  useEffect(() => {
    if (state?.ok) {
      const inputs = document.querySelectorAll<HTMLInputElement>(
        'input[name="currentPassword"], input[name="newPassword"], input[name="confirmPassword"]'
      );
      inputs.forEach((i) => (i.value = ""));
    }
  }, [state?.ok]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div>
          <div className="text-sm font-semibold">Change password</div>
          <div className="mt-1 text-sm text-gray-500">
            Choose a strong password (8+ characters). You’ll be asked to sign in again.
          </div>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-gray-500">Current password</span>
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              placeholder="••••••••"
              required
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-gray-500">New password</span>
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              placeholder="••••••••"
              required
              minLength={8}
              maxLength={128}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-gray-500">Confirm new password</span>
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              placeholder="••••••••"
              required
              minLength={8}
              maxLength={128}
            />
          </label>
        </div>

        {state?.message && (
          <div
            className={[
              "rounded-xl border p-3 text-sm",
              state.ok
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800",
            ].join(" ")}
          >
            {state.message}
          </div>
        )}

        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}