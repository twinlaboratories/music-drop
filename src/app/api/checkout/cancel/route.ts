import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/stripe-keys";
import {
  clearReservation,
  decodeReservations,
  loadReservation,
  markEventProcessed,
  releaseReservations,
} from "@/lib/inventory";

export const runtime = "nodejs";

/**
 * Release stock for an abandoned Checkout session.
 *
 * Called by the store when a customer returns without paying (e.g. pressed
 * "back"). Stripe only emits `checkout.session.expired` ~24h after creation,
 * so this restores reserved stock immediately instead of waiting that out.
 *
 * Idempotent: uses the same `markEventProcessed` guard as the webhook so the
 * later `checkout.session.expired` event won't double-release.
 */
export async function POST(req: NextRequest) {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  let sessionId: string | undefined;
  try {
    ({ sessionId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Paid/complete: keep the stock decremented (it's a real sale).
    if (session.status === "complete" || session.payment_status === "paid") {
      return NextResponse.json({ released: false, reason: "paid" });
    }

    // Claim the expired-release for this session; if the webhook already
    // handled it, skip to avoid restoring stock twice.
    if (await markEventProcessed(sessionId, "checkout.session.expired")) {
      return NextResponse.json({ released: false, reason: "already-processed" });
    }

    let reservations = await loadReservation(sessionId);
    if (!reservations?.length) {
      reservations = decodeReservations(session.metadata?.reservations);
    }
    if (reservations.length > 0) {
      await releaseReservations(reservations);
      await clearReservation(sessionId);
    }

    // Invalidate the session so it can no longer be paid.
    if (session.status === "open") {
      try {
        await stripe.checkout.sessions.expire(sessionId);
      } catch (error) {
        console.error("Failed to expire checkout session:", error);
      }
    }

    return NextResponse.json({ released: reservations.length > 0 });
  } catch (error) {
    console.error("Checkout cancel error:", error);
    return NextResponse.json({ error: "Failed to cancel checkout" }, { status: 500 });
  }
}
