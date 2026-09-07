import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { supabase } from "@/lib/supabase";

// Lowercase + digits only: mixed case (s/S, z/Z, c/C, o/O, ...) reads
// identically in many fonts, so photos/screenshots and OCR text
// extraction (e.g. iOS Live Text) frequently mangle the case.
// Also drop 0/o and 1/l/i to avoid shape confusion.
const generateCode = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 6);

const RESERVED_CODES = new Set(["api", "favicon.ico"]);

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const targetUrl = body?.url?.trim();

  if (!targetUrl || !isValidUrl(targetUrl)) {
    return NextResponse.json(
      { error: "유효한 URL이 아닙니다." },
      { status: 400 }
    );
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    if (RESERVED_CODES.has(code)) continue;

    const { error } = await supabase
      .from("links")
      .insert({ code, target_url: targetUrl });

    if (!error) {
      return NextResponse.json({ code, target_url: targetUrl });
    }

    if (error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "코드 생성에 실패했습니다. 다시 시도해주세요." },
    { status: 500 }
  );
}
