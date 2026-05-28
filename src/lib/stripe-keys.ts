/**
 * Resolve Stripe keys from standard names or project-specific Vercel env names.
 * Values must start with sk_ (secret) or pk_ (publishable).
 */

function firstMatchingKey(
  candidates: Array<string | undefined>,
  prefix: "sk" | "pk"
): string | undefined {
  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed?.startsWith(`${prefix}_`)) return trimmed;
  }
  return undefined;
}

/** Server-side secret key (API routes, Node only) */
export function getStripeSecretKey(): string | undefined {
  return firstMatchingKey(
    [
      process.env.STRIPE_SECRET_KEY,
      process.env.TNB_MERCH,
      process.env.TNB_MERCH_SECRET_KEY,
      process.env["TNB MERCH"],
    ],
    "sk"
  );
}

/** Client publishable key (must be NEXT_PUBLIC_* in Next.js) */
export function getStripePublishableKey(): string | undefined {
  return firstMatchingKey(
    [
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      process.env.NEXT_PUBLIC_TNB_MERCH,
      process.env.NEXT_PUBLIC_TNB_MERCH_PUBLISHABLE_KEY,
    ],
    "pk"
  );
}
