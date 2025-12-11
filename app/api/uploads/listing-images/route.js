// app/api/uploads/listing-images/route.js
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

// POST /api/uploads/listing-images
export async function POST(req) {
  try {
    const supabase = getSupabaseServerClient();

    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return Response.json(
        { error: "Aucun fichier reçu" },
        { status: 400 }
      );
    }

    const urls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!(file instanceof File)) continue;

      const safeName = file.name.replace(/\s+/g, "-").toLowerCase();
      // chemin interne dans le bucket (dossier virtuel "listings/")
      const path = `listings/${Date.now()}-${i}-${safeName}`;

      // ⚠️ ICI : on utilise TON bucket "immonext"
      const { data, error } = await supabase.storage
        .from("immonext")
        .upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        return Response.json(
          {
            error:
              "Erreur lors de l’upload vers Supabase Storage : " +
              (error.message || "erreur inconnue"),
          },
          { status: 500 }
        );
      }

      // ⚠️ ICI AUSSI : utiliser "immonext"
      const { data: publicData } = supabase.storage
        .from("immonext")
        .getPublicUrl(data.path);

      urls.push(publicData.publicUrl);
    }

    console.log("👉 URLs uploadées vers Supabase :", urls);

    return Response.json({ urls }, { status: 200 });
  } catch (e) {
    console.error("Upload route error:", e);
    return Response.json(
      {
        error:
          e.message ||
          "Erreur interne lors de l’upload des images (vérifie la config Supabase)",
      },
      { status: 500 }
    );
  }
}
