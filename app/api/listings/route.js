// app/api/listings/route.js
import prisma from "@/lib/prisma";

// GET /api/listings?agencyId=xxx
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const agencyId = searchParams.get("agencyId");

    const where = agencyId ? { agencyId } : {};

    const listings = await prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        agency: true,
        images: true, // 🔥 on récupère les images
      },
    });

    return Response.json(listings, { status: 200 });
  } catch (e) {
    console.error("GET /api/listings error:", e);
    return Response.json(
      { error: "Erreur serveur lors de la récupération des annonces" },
      { status: 500 }
    );
  }
}

// POST /api/listings
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      city,
      country,
      price,
      currency,
      status,
      type,
      agencyId,
      imageUrls,
    } = body;

    if (!title || !city || !country || !type || !agencyId) {
      return Response.json(
        {
          error:
            "title, city, country, type et agencyId sont obligatoires pour créer une annonce",
        },
        { status: 400 }
      );
    }

    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return Response.json(
        { error: "price doit être un nombre positif" },
        { status: 400 }
      );
    }

    // 🔥 Nettoyer les URLs
    const imagesArray = Array.isArray(imageUrls)
      ? imageUrls
          .map((u) => String(u || "").trim())
          .filter((u) => u.length > 0)
      : [];

    console.log("👉 URLs reçues côté POST /api/listings :", imagesArray);

    const listing = await prisma.listing.create({
      data: {
        title,
        description: description || null,
        city,
        country,
        price: parsedPrice,
        currency: currency || "EUR",
        status: status || "ACTIVE",
        type,
        agencyId,
        ...(imagesArray.length > 0 && {
          images: {
            create: imagesArray.map((url, index) => ({
              url,
              position: index,
            })),
          },
        }),
      },
      include: {
        agency: true,
        images: true,
      },
    });

    return Response.json(listing, { status: 201 });
  } catch (e) {
    console.error("POST /api/listings error:", e);
    return Response.json(
      { error: "Erreur serveur lors de la création de l’annonce" },
      { status: 500 }
    );
  }
}
