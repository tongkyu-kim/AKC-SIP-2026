"use client";

import { useActionState } from "react";
import { login } from "@/app/login/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-100 px-4 dark:bg-zinc-950">
      <form action={formAction} className="w-full max-w-xs space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <h1 className="text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">ASEAN-Korea Sustainable Innovation Program</h1>
        <input
          type="password"
          name="password"
          autoFocus
          placeholder="Password"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-center text-sm text-zinc-900 outline-none focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        {state?.error && <p className="text-center text-sm text-red-600 dark:text-red-400">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {pending ? "Checking..." : "Enter"}
        </button>
      </form>
    </div>
  );
}
