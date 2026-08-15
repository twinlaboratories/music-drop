import { NextResponse } from "next/server";
import { getRsvpStatus } from "@/lib/rsvp";

export async function GET() {
  const status = await getRsvpStatus();
  return NextResponse.json({
    open: status.open,
    full: status.full,
  });
}
