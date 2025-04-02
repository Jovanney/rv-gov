import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Init Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase.from("obras").select("*");

    if (error) {
      console.error("❌ Erro de Fetch Supabase:", error);
      return NextResponse.json(
        { error: "Erro de fetch", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ obras: data });
  } catch (error) {
    console.error("❌ Erro não especificado:", error);
    return NextResponse.json(
      { error: "Erro interno do server" },
      { status: 500 }
    );
  }
}
