import { NextResponse } from "next/server";
import {
  getRsvpSettings,
  getRsvpStatus,
  getRsvpStorageSource,
  listRsvps,
  setRsvpCheckedIn,
  updateRsvpSettings,
  verifyAdminSecret,
} from "@/lib/rsvp";
import { maskPhone } from "@/lib/phone";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function getSecret(req: Request): string | null {
  const header = req.headers.get("x-admin-secret");
  if (header) return header;
  const url = new URL(req.url);
  return url.searchParams.get("key");
}

export async function GET(req: Request) {
  const secret = getSecret(req);
  if (!verifyAdminSecret(secret)) return unauthorized();

  const [status, rsvps, settings, storage] = await Promise.all([
    getRsvpStatus(),
    listRsvps(),
    getRsvpSettings(),
    getRsvpStorageSource(),
  ]);

  return NextResponse.json({
    status,
    settings,
    storage,
    rsvps: rsvps.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      phone: maskPhone(r.phone),
      createdAt: r.createdAt,
      checkedIn: r.checkedIn,
      checkedInAt: r.checkedInAt,
    })),
  });
}

export async function POST(req: Request) {
  const secret = getSecret(req);
  if (!verifyAdminSecret(secret)) return unauthorized();

  const body = (await req.json()) as {
    open?: boolean;
    capacity?: number;
    checkIn?: { id?: string; checkedIn?: boolean };
  };

  if (body.checkIn?.id) {
    const record = await setRsvpCheckedIn(body.checkIn.id, Boolean(body.checkIn.checkedIn));
    if (!record) {
      return NextResponse.json({ error: "Guest not found." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      rsvp: {
        id: record.id,
        checkedIn: record.checkedIn,
        checkedInAt: record.checkedInAt,
      },
    });
  }

  const partial: { open?: boolean; capacity?: number } = {};

  if (typeof body.open === "boolean") partial.open = body.open;
  if (typeof body.capacity === "number" && body.capacity > 0) {
    partial.capacity = Math.floor(body.capacity);
  }

  const settings = await updateRsvpSettings(partial);
  const status = await getRsvpStatus();

  return NextResponse.json({ settings, status });
}
