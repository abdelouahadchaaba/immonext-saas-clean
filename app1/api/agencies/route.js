// app/api/agencies/route.js
import prisma from "@/lib/prisma";
import { getCurrentUserServer } from "@/lib/auth";

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const user = await getCurrentUserServer();
  if (!user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    if (user.role === "SUPER_ADMIN") {
      const agencies = await prisma.agency.findMany({
        orderBy: { createdAt: "desc" },
      });
      return Response.json(agencies, { status: 200 });
    }

    // AGENCY_ADMIN / AGENT → uniquement leur agence
    if (!user.agencyId) {
      return Response.json([], { status: 200 });
    }

    const agency = await prisma.agency.findUnique({
      where: { id: user.agencyId },
    });

    return Response.json(agency ? [agency] : [], { status: 200 });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Erreur serveur lors de la récupération des agences" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const user = await getCurrentUserServer();
  if (!user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  // On réserve la création de nouvelles agences au SUPER_ADMIN
  if (user.role !== "SUPER_ADMIN") {
    return Response.json(
      { error: "Seul le SUPER_ADMIN peut créer des agences" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { name, city, country, email, phone } = body;

    if (!name || !city || !country) {
      return Response.json(
        { error: "name, city et country sont obligatoires" },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    const agency = await prisma.agency.create({
      data: {
        name,
        city,
        country,
        email: email || null,
        phone: phone || null,
        slug,
      },
    });

    return Response.json(agency, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Erreur serveur lors de la création de l’agence" },
      { status: 500 }
    );
  }
}
