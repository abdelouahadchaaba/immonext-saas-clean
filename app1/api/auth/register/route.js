// app/api/auth/register/route.js
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, name, agencyName, city, country, phone } = body;

    if (!email || !password || !agencyName || !city || !country) {
      return Response.json(
        { error: "email, password, agencyName, city et country sont obligatoires" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      );
    }

    const usersCount = await prisma.user.count();
    const role = usersCount === 0 ? "SUPER_ADMIN" : "AGENCY_ADMIN";

    const passwordHash = await bcrypt.hash(password, 10);

    const agencySlug = slugify(agencyName);

    const result = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: {
          name: agencyName,
          slug: agencySlug,
          city,
          country,
          email,
          phone: phone || null,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          name: name || agencyName,
          passwordHash,
          role,
          agencyId: agency.id,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          agencyId: true,
        },
      });

      return { user, agency };
    });

    const token = signAuthToken(result.user);
    const cookieStore = cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return Response.json(result, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Erreur serveur lors de l’inscription" },
      { status: 500 }
    );
  }
}
