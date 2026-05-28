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

export async function POST(req: NextRequest) {
  const secretKey = getStripeSecretKey();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature error:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (await markEventProcessed(session.id, event.type)) {
        return NextResponse.json({ received: true });
      }
      await clearReservation(session.id);
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (await markEventProcessed(session.id, event.type)) {
        return NextResponse.json({ received: true });
      }

      let reservations = await loadReservation(session.id);
      if (!reservations?.length) {
        reservations = decodeReservations(session.metadata?.reservations);
      }
      if (reservations.length > 0) {
        await releaseReservations(reservations);
        await clearReservation(session.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
