import { NextResponse } from "next/server";
import { createRsvp, findRsvpByPhone, RsvpError } from "@/lib/rsvp";
import { normalizePhone, validateFullName } from "@/lib/phone";

const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const current = hits.get(ip);
  if (!current || now > current.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return false;
  }
  current.count += 1;
  return current.count > 12;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  try {
    const body = (await req.json()) as { fullName?: string; phone?: string };

    const fullName = validateFullName(body.fullName ?? "");
    const phone = normalizePhone(body.phone ?? "");

    if (!fullName) {
      return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 });
    }

    const existing = await findRsvpByPhone(phone);
    if (existing) {
      return NextResponse.json({ ok: true, rsvp: existing, existing: true });
    }

    const rsvp = await createRsvp(fullName, phone);
    return NextResponse.json({ ok: true, rsvp, existing: false });
  } catch (error) {
    if (error instanceof RsvpError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("rsvp submit error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
