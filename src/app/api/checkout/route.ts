import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { PRODUCT_BY_ID } from "@/config/products";

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY environment variable" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: "2026-04-22.dahlia",
    });

    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const lineItems = [];
    for (const item of items) {
      const productId: string = item?.productId;
      const quantity: number = Number(item?.quantity ?? 0);
      const selectedSize: string | null = item?.selectedSize ?? null;

      if (!productId || quantity <= 0) {
        return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
      }

      const product = PRODUCT_BY_ID[productId];
      if (!product) {
        return NextResponse.json({ error: `Unknown product: ${productId}` }, { status: 400 });
      }

      if (product.type === "tshirt") {
        if (!selectedSize) {
          return NextResponse.json({ error: "T-shirt size is required" }, { status: 400 });
        }
        const validSize = product.sizes?.some((size) => size.label === selectedSize);
        if (!validSize) {
          return NextResponse.json({ error: "Invalid t-shirt size" }, { status: 400 });
        }
      }

      const lineItemName =
        product.type === "tshirt" && selectedSize
          ? `${product.name} - ${selectedSize}`
          : product.name;

      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: {
            name: lineItemName,
            images: [product.image],
            metadata: {
              productId: product.id,
              productType: product.type,
              ...(selectedSize ? { size: selectedSize } : {}),
            },
          },
          unit_amount: product.price,
        },
        quantity,
      });
    }

    const hasTshirt = items.some((item) => PRODUCT_BY_ID[item?.productId]?.type === "tshirt");
    const hasCd = items.some((item) => item?.productId === "cd-album");

    // Shipping rules:
    // - T-shirts: £4.99 domestic / £10 international
    // - CDs: £2.50 domestic / £7 international
    // - Pendant-only: £2.50 domestic / £10 international
    const domesticShippingAmount = hasTshirt ? 499 : 250;
    const internationalShippingAmount = hasTshirt ? 1000 : hasCd ? 700 : 1000;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "IT", "ES", "NL"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: domesticShippingAmount, currency: "gbp" },
            display_name: "Domestic shipping (UK)",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 5 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: internationalShippingAmount, currency: "gbp" },
            display_name: "International shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 5 },
              maximum: { unit: "business_day", value: 12 },
            },
          },
        },
      ],
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
