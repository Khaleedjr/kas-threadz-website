"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { STUDIO_COOKIE, STUDIO_SESSION, newSession, passwordMatches } from "@/lib/studio-auth";

export async function signIn(form: FormData) {
  const attempt = String(form.get("password") ?? "").slice(0, 200);
  if (!passwordMatches(attempt)) {
    // a pause on every wrong guess, so guessing is slow
    await new Promise((r) => setTimeout(r, 1200));
    redirect("/studio?wrong=1");
  }
  (await cookies()).set(STUDIO_COOKIE, newSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/studio",
    maxAge: STUDIO_SESSION,
  });
  redirect("/studio");
}

export async function signOut() {
  (await cookies()).delete({ name: STUDIO_COOKIE, path: "/studio" });
  redirect("/studio");
}
