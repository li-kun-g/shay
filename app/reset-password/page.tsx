"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/app/actions/password-reset";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!token) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-red-500 font-medium">Missing token. Please check your email link.</p>
      </div>
    );
  }

  async function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await resetPassword(formData, token as string);
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Password updated! Redirecting to login..." });
        setTimeout(() => router.push("/signin"), 2000);
      }
    });
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full p-8 rounded-3xl border k-border-strong bg-white dark:bg-[#111]">
        <h1 className="text-2xl font-bold mb-2">Create new password</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
          Enter a strong password you haven't used before.
        </p>

        <form action={handleSubmit} className="space-y-4">
          <input
            name="password"
            type="password"
            required
            placeholder="New password"
            className="w-full px-4 py-3 rounded-xl border k-border-strong bg-transparent outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
          />
          <input
            name="confirmPassword"
            type="password"
            required
            placeholder="Confirm new password"
            className="w-full px-4 py-3 rounded-xl border k-border-strong bg-transparent outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
          />

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-black text-white dark:bg-white dark:text-black py-3 rounded-xl font-medium disabled:opacity-50 transition active:scale-[0.98]"
          >
            {isPending ? "Updating..." : "Reset Password"}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-xl text-sm text-center ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}