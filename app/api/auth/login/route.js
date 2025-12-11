// app/api/auth/login/route.js
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signAuthToken } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { error: "Email et mot de passe sont obligatoires" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { agency: true },
    });

    if (!user) {
      return Response.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    if (!user.isActive) {
      return Response.json(
        { error: "Compte désactivé. Contacte l’administrateur." },
        { status: 403 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return Response.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signAuthToken(user);

    const cookieStore = cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return Response.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          agencyId: user.agencyId,
          agency: user.agency
            ? {
                id: user.agency.id,
                name: user.agency.name,
                city: user.agency.city,
                country: user.agency.country,
              }
            : null,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Erreur serveur lors du login" },
      { status: 500 }
    );
  }
}
