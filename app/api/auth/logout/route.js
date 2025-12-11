// app/api/auth/logout/route.js
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = cookies();
  cookieStore.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return Response.json({ ok: true }, { status: 200 });
}
