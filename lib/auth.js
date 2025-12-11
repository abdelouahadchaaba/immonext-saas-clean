// lib/auth.js
import jwt from "jsonwebtoken";
import prisma from "./prisma";
import { cookies } from "next/headers";

const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  throw new Error("AUTH_SECRET manquant dans .env");
}

// Signature du token
export function signAuthToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      agencyId: user.agencyId || null,
    },
    AUTH_SECRET,
    { expiresIn: "7d" }
  );
}

// Récupération de l'utilisateur courant côté serveur (API routes)
export async function getCurrentUserServer() {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, AUTH_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        agencyId: true,
        agency: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
          },
        },
      },
    });

    return user;
  } catch (e) {
    return null;
  }
}
