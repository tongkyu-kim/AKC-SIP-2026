"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SITE_AUTH_COOKIE } from "@/lib/auth";

export async function login(_prevState: { error: string } | undefined, formData: FormData) {
  const password = formData.get("password");
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword || password !== sitePassword) {
    return { error: "Incorrect password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SITE_AUTH_COOKIE, sitePassword, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}
