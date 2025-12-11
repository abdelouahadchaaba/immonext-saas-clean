// app/api/listings/route.js
import prisma from "@/lib/prisma";
import { getCurrentUserServer } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUserServer();
  if (!user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    let where = {};
    if (user.role !== "SUPER_ADMIN") {
      if (!user.agencyId) {
        return Response.json([], { status: 200 });
      }
      where = { agencyId: user.agencyId };
    }

    const listings = await prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        agency: true,
        images: true,
      },
    });

    return Response.json(listings, { status: 200 });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Erreur serveur lors de la récupération des annonces" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const user = await getCurrentUserServer();
  if (!user) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!user.agencyId && user.role !== "SUPER_ADMIN") {
    return Response.json(
      { error: "Utilisateur sans agence associée" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      city,
      country,
      price,
      currency,
      type,
      imageUrls = [],
    } = body;

    if (!title || !city || !country || !price || !type) {
      return Response.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    const agencyId =
      user.role === "SUPER_ADMIN" && body.agencyId
        ? body.agencyId
        : user.agencyId;

    const listing = await prisma.listing.create({
      data: {
        title,
        description: description || null,
        city,
        country,
        price: Number(price),
        currency: currency || "EUR",
        type,
        agencyId,
        images: {
          create: (imageUrls || []).map((url, idx) => ({
            url,
            position: idx,
          })),
        },
      },
      include: {
        agency: true,
        images: true,
      },
    });

    return Response.json(listing, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Erreur serveur lors de la création de l’annonce" },
      { status: 500 }
    );
  }
}
