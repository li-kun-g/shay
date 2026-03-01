"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <button className="text-sm px-3 py-2 rounded-full border">
        Loading...
      </button>
    );
  }

  if (status === "authenticated") {
    return (
      <button
        onClick={() => signOut()}
        className="text-sm px-3 py-2 rounded-full border"
      >
        Sign out
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="text-sm px-3 py-2 rounded-full bg-black text-white"
    >
      Sign in
    </button>
  );
}
