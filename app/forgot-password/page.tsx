"use client";

import { useState, useTransition } from "react";
import { requestPasswordReset } from "@/app/actions/password-reset";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await requestPasswordReset(formData);
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Check your email for a reset link!" });
      }
    });
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full p-8 rounded-3xl border k-border-strong bg-white dark:bg-[#111]">
        <h1 className="text-2xl font-bold mb-2">Forgot password?</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
          Enter your email and we'll send you a link to get back into your account.
        </p>

        <form action={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            required
            placeholder="Email address"
            className="w-full px-4 py-3 rounded-xl border k-border-strong bg-transparent outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
          />

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-black text-white dark:bg-white dark:text-black py-3 rounded-xl font-medium disabled:opacity-50 transition active:scale-[0.98]"
          >
            {isPending ? "Sending..." : "Send Login Link"}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-xl text-sm text-center ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {message.text}
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/signin" className="text-sm font-medium hover:underline">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}