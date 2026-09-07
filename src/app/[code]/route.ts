import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const { data, error } = await supabase
    .from("links")
    .select("target_url")
    .ilike("code", code)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.redirect(new URL("/?notfound=1", request.url));
  }

  return NextResponse.redirect(data.target_url, { status: 307 });
}
