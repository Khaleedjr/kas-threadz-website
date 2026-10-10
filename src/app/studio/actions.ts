"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { visitor, withinLimit } from "@/lib/rate-limit";
import { STUDIO_COOKIE, STUDIO_SESSION, newSession, passwordMatches } from "@/lib/studio-auth";

export async function signIn(form: FormData) {
  // ten tries in a quarter of an hour from one address, then it waits
  if (!(await withinLimit("sign-in", await visitor(), 10, 15 * 60))) redirect("/studio/sign-in?wait=1");
  const attempt = String(form.get("password") ?? "").slice(0, 200);
  if (!passwordMatches(attempt)) {
    // a pause on every wrong guess, so guessing is slow
    await new Promise((r) => setTimeout(r, 1200));
    redirect("/studio/sign-in?wrong=1");
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
  redirect("/studio/sign-in");
}
