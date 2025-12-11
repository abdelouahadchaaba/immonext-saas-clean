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

    const {
      email,
      password,
      name,
      // ⭐ nouveau champ pour distinguer les comptes
      accountType, // "AGENCY_OWNER" | "USER_ONLY"
      // champs agence (optionnels si USER_ONLY)
      agencyName,
      city,
      country,
      phone,
    } = body;

    // 1) Validation de base
    if (!email || !password) {
      return Response.json(
        { error: "email et password sont obligatoires" },
        { status: 400 }
      );
    }

    // Par défaut, on garde la compatibilité : si pas de accountType -> on considère AGENCY_OWNER
    const isAgencyOwner = accountType !== "USER_ONLY";

    // Si propriétaire d’agence → champs obligatoires
    if (isAgencyOwner) {
      if (!agencyName || !city || !country) {
        return Response.json(
          {
            error:
              "Pour un compte agence, agencyName, city et country sont obligatoires",
          },
          { status: 400 }
        );
      }
    }

    // 2) Verifier si l'email existe déjà
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // 3) Compter les utilisateurs pour savoir si on crée le tout premier (SUPER_ADMIN)
    const usersCount = await prisma.user.count();

    const passwordHash = await bcrypt.hash(password, 10);

    // On choisit un nom par défaut
    const defaultName =
      name || agencyName || email.split("@")[0] || "Utilisateur";

    let createdUser = null;
    let createdAgency = null;

    if (isAgencyOwner) {
      // 🏢 CAS AGENCY_OWNER : on crée agence + user dans une transaction
      const agencySlug = slugify(agencyName);

      const role = usersCount === 0 ? "SUPER_ADMIN" : "AGENCY_ADMIN";

      const result = await prisma.$transaction(async (tx) => {
        const agency = await tx.agency.create({
          data: {
            name: agencyName,
            slug: agencySlug,
            city,
            country,
            email, // email de contact de l’agence
            phone: phone || null,
          },
        });

        const user = await tx.user.create({
          data: {
            email,
            name: defaultName,
            passwordHash,
            role, // SUPER_ADMIN ou AGENCY_ADMIN
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

      createdUser = result.user;
      createdAgency = result.agency;
    } else {
      // 👤 CAS USER_ONLY : simple utilisateur sans agence (agencyId = null)
      // On lui donne un rôle neutre : AGENT
      const role = "AGENT";

      const user = await prisma.user.create({
        data: {
          email,
          name: defaultName,
          passwordHash,
          role,
          agencyId: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          agencyId: true,
        },
      });

      createdUser = user;
      createdAgency = null;
    }

    // 4) Générer le token et le cookie
    const token = signAuthToken(createdUser);
    const cookieStore = cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 jours
    });

    // 5) Réponse
    return Response.json(
      {
        user: createdUser,
        agency: createdAgency,
        accountType: isAgencyOwner ? "AGENCY_OWNER" : "USER_ONLY",
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("Erreur /api/auth/register :", e);
    return Response.json(
      { error: "Erreur serveur lors de l’inscription" },
      { status: 500 }
    );
  }
}
