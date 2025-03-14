import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import wkx from "wkx";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Convert WKB (hex) to a list of coordinates
function wkbToCoordinates(wkbHex: string) {
  if (!wkbHex) return null;

  try {
    const buffer = Buffer.from(wkbHex, "hex");
    const geometry = wkx.Geometry.parse(buffer);
    const geoJSON = geometry.toGeoJSON() as {
      type: string;
      coordinates: any;
    };

    if (geoJSON.type === "Point") {
      return `${geoJSON.coordinates[1]},${geoJSON.coordinates[0]}`; // lat,lon
    } else if (geoJSON.type === "LineString" || geoJSON.type === "MultiPoint") {
      const coordinates = geoJSON.coordinates as [number, number][]; // Ensures it's an array of [lon, lat]
      return coordinates.map(([lon, lat]) => `${lat},${lon}`).join("/"); // lat,lon/lat,lon
    } else if (geoJSON.type === "Polygon" || geoJSON.type === "MultiLineString") {
      const coordinates = geoJSON.coordinates as [number, number][][]; // Array of arrays of [lon, lat]
      return coordinates
        .map((ring) => ring.map(([lon, lat]) => `${lat},${lon}`).join("/"))
        .join(" | "); // Separate different rings with "|"
    }

    return null;
  } catch (error) {
    console.error("Error parsing WKB:", error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const minPages = parseInt(searchParams.get("minPages") || "1", 10);
  const maxPages = parseInt(searchParams.get("maxPages") || "5", 10);

  console.log(`🚀 Fetching from page 1 to ${maxPages}`);

  let allObras: any[] = [];

  for (let page = minPages; page <= maxPages; page++) {
    try {
      const apiUrl = `https://api.obrasgov.gestao.gov.br/obrasgov/api/projeto-investimento?uf=PE&page=${page}`;
      console.log(`🔹 Fetching: ${apiUrl}`);

      const response = await fetch(apiUrl, { cache: "no-store" });

      if (!response.ok) {
        console.warn(`⚠️ Skipping page ${page}: API responded with status ${response.status}`);
        continue;
      }

      const data = await response.json();
      if (!data.content || !Array.isArray(data.content)) {
        console.warn(`⚠️ Skipping page ${page}: 'content' is missing or not an array.`);
        continue;
      }

      // Transform data
      const obrasToInsert = data.content.map((item: any) => {
        const wkbHex = item.geometrias?.[0]?.geometria || null;
        const geometria = wkbHex ? wkbToCoordinates(wkbHex) : null;

        return {
          idunico: item.idUnico,
          nome: item.nome,
          uf: item.uf,
          endereco: item.endereco,
          descricao: item.descricao,
          funcaosocial: item.funcaoSocial,
          metaglobal: item.metaGlobal,
          datainicialprevista: item.dataInicialPrevista,
          datainicialefetiva: item.dataInicialEfetiva,
          datafinalprevista: item.dataFinalPrevista,
          datafinalefetiva: item.dataFinalEfetiva,
          especie: item.especie,
          natureza: item.natureza,
          situacao: item.situacao,
          datasituacao: item.dataSituacao,
          geometria, // Now stores multiple points as "lat1,lon1/lat2,lon2/lat3,lon3"
          cep: item.cep,
          enderecoareaexecutora: item.geometrias?.[0]?.enderecoAreaExecutora || null,
          recursosorigem: item.fontesDeRecurso?.[0]?.origem || null,
          recursosvalorinvestimento: item.fontesDeRecurso?.[0]?.valorInvestimentoPrevisto || 0
        };
      });

      allObras.push(...obrasToInsert);
    } catch (error) {
      console.error(`❌ Error processing page ${page}:`, error);
      continue;
    }
  }

  if (allObras.length > 0) {
    console.log(`✅ Inserting ${allObras.length} records into Supabase...`);

    const uniqueObras = Array.from(
      new Map(allObras.map((obra) => [obra.idunico, obra])).values()
    );

    const { error } = await supabase.from("obras").upsert(uniqueObras, { onConflict: "idunico" });

    if (error) {
      console.error("❌ Supabase Insert Error:", error);
      return NextResponse.json({ error: "Failed to insert data", details: error.message }, { status: 500 });
    }
  } else {
    console.log("⚠️ No new data to insert.");
  }

  return NextResponse.json({ message: `Fetched & inserted up to page ${maxPages} successfully!` });
}