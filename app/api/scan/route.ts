import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    console.log("🚀 Fetching all obras from Supabase...");
    
    const { data, error } = await supabase.from("obras").select("*");

    if (error) {
      console.error("❌ Supabase Fetch Error:", error);
      return NextResponse.json({ error: "Failed to fetch data", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ obras: data });
  } catch (error) {
    console.error("❌ Unexpected Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}