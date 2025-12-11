// app/api/auth/me/route.js
import { getCurrentUserServer } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUserServer();
  if (!user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }
  return Response.json(user, { status: 200 });
}
