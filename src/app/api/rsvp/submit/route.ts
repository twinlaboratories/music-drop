import { NextResponse } from "next/server";
import { createRsvp, findRsvpByPhone, RsvpError } from "@/lib/rsvp";
import { normalizePhone, validateFullName } from "@/lib/phone";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { fullName?: string; phone?: string };

    const fullName = validateFullName(body.fullName ?? "");
    const phone = normalizePhone(body.phone ?? "");

    if (!fullName) {
      return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
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
