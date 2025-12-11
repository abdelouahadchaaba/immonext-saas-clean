// app/api/listings/[id]/route.js
import prisma from "@/lib/prisma";

// GET /api/listings/:id
export async function GET(_req, { params }) {
  const { id } = params;

  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        agency: true,
        images: true,
      },
    });

    if (!listing) {
      return Response.json(
        { error: "Annonce introuvable" },
        { status: 404 }
      );
    }

    return Response.json(listing, { status: 200 });
  } catch (e) {
    console.error("GET /api/listings/[id] error:", e);
    return Response.json(
      { error: "Erreur serveur lors de la récupération de l’annonce" },
      { status: 500 }
    );
  }
}

// PUT /api/listings/:id
export async function PUT(req, { params }) {
  const { id } = params;

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
            "title, city, country, type et agencyId sont obligatoires pour mettre à jour l’annonce",
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

    const imagesArray = Array.isArray(imageUrls)
      ? imageUrls
          .map((u) => String(u || "").trim())
          .filter((u) => u.length > 0)
      : [];

    console.log("👉 URLs reçues côté PUT /api/listings :", imagesArray);

    // On supprime d’abord les anciennes images puis on met à jour l’annonce
    const [, updatedListing] = await prisma.$transaction([
      prisma.listingImage.deleteMany({
        where: { listingId: id },
      }),
      prisma.listing.update({
        where: { id },
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
      }),
    ]);

    return Response.json(updatedListing, { status: 200 });
  } catch (e) {
    console.error("PUT /api/listings/[id] error:", e);
    return Response.json(
      { error: "Erreur serveur lors de la mise à jour de l’annonce" },
      { status: 500 }
    );
  }
}

// DELETE /api/listings/:id
export async function DELETE(_req, { params }) {
  const { id } = params;

  try {
    // 🔥 Supprimer d'abord les images associées
    await prisma.$transaction([
      prisma.listingImage.deleteMany({
        where: { listingId: id },
      }),
      prisma.listing.delete({
        where: { id },
      }),
    ]);

    return Response.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error("DELETE /api/listings/[id] error:", e);
    return Response.json(
      { error: "Erreur serveur lors de la suppression de l’annonce" },
      { status: 500 }
    );
  }
}
