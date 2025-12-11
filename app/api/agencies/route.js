// app/api/agencies/route.js
import prisma from "@/lib/prisma";

// GET /api/agencies → liste toutes les agences
export async function GET() {
  try {
    const agencies = await prisma.agency.findMany({
      orderBy: { createdAt: "desc" },
    });

    return Response.json(agencies, { status: 200 });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Erreur serveur lors de la récupération des agences" },
      { status: 500 }
    );
  }
}

// POST /api/agencies → créer une nouvelle agence
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, city, country, email, phone } = body;

    if (!name || !city || !country) {
      return Response.json(
        { error: "name, city et country sont obligatoires" },
        { status: 400 }
      );
    }

    const agency = await prisma.agency.create({
      data: {
        name,
        city,
        country,
        email: email || null,
        phone: phone || null,
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
