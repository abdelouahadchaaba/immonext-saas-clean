// app/api/agencies/[id]/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// ✅ Force le mode dynamique (pas de pré-rendu / pas d'optimisation statique)
export const dynamic = "force-dynamic";

function safeId(params) {
  if (!params || !params.id || typeof params.id !== "string") return null;
  return params.id;
}

/**
 * GET /api/agencies/:id
 * → Récupère une agence par id
 */
export async function GET(req, { params }) {
  const id = safeId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Paramètre id manquant" },
      { status: 400 }
    );
  }

  try {
    const agency = await prisma.agency.findUnique({
      where: { id },
    });

    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(agency, { status: 200 });
  } catch (e) {
    console.error("❌ Erreur GET /api/agencies/[id] :", e);
    return NextResponse.json(
      {
        error: "Erreur serveur lors de la récupération de l’agence",
        details: e?.message || null,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/agencies/:id
 * → Met à jour une agence
 */
export async function PUT(req, { params }) {
  const id = safeId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Paramètre id manquant" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { name, city, country, email, phone } = body || {};

    const updated = await prisma.agency.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(city && { city }),
        ...(country && { country }),
        email: email ?? undefined,
        phone: phone ?? undefined,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    console.error("❌ Erreur PUT /api/agencies/[id] :", e);
    return NextResponse.json(
      {
        error: "Erreur serveur lors de la mise à jour de l’agence",
        details: e?.message || null,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agencies/:id
 * → Supprime une agence
 */
export async function DELETE(req, { params }) {
  const id = safeId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Paramètre id manquant" },
      { status: 400 }
    );
  }

  try {
    await prisma.agency.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (e) {
    console.error("❌ Erreur DELETE /api/agencies/[id] :", e);
    return NextResponse.json(
      {
        error: "Erreur serveur lors de la suppression de l’agence",
        details: e?.message || null,
      },
      { status: 500 }
    );
  }
}
