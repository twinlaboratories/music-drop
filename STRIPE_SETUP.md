# Stripe Setup Guide

## Quick Start

1. **Create a Stripe account** at https://stripe.com
2. **Get your API keys** from https://dashboard.stripe.com/developers
3. **Copy `.env.example` to `.env.local`** and add your keys
4. **Add product images** to `/public/merch/`
5. **Update product data** in `/src/config/products.ts`
6. **Deploy to Vercel** and add environment variables there

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `STRIPE_SECRET_KEY` | Backend (required) | Starts with `sk_test_` or `sk_live_` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Only needed for Stripe.js embeds; hosted Checkout uses the secret key + redirect URL |

**Vercel:** Set `STRIPE_SECRET_KEY` to your `sk_live_...` value (or use `TNB_MERCH` with the same value). Redeploy after changing env vars.

## Test Mode

Use test keys to simulate purchases without real money:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC
- Any ZIP code

## Going Live

1. Activate your Stripe account
2. Switch to live keys (`pk_live_` and `sk_live_`)
3. Update environment variables in Vercel
4. Test with a real small purchase

## T-shirt inventory (recommended for production)

Stock is stored in **Vercel KV / Upstash Redis** (not in the browser). This gives atomic, cross-instance protection against overselling after real payments.

1. In Vercel → your project → **Storage** → create a **Redis** (Upstash) database and connect it to the project.
2. Vercel will add `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
3. Redeploy after linking storage.

**Without Redis, the store still works.** Checkout falls back to a best-effort in-memory stock count seeded from `src/config/products.ts`, so t-shirts remain buyable. The caveat: this count is per serverless instance and resets on redeploy/scale, so it offers only soft oversell protection. Connect Redis for durable, accurate stock.

Local dev without Redis uses `data/tshirt-inventory.json` (created automatically).

To reset live stock to match `src/config/products.ts` after testing:

```bash
curl -X POST https://YOUR-DOMAIN/api/inventory/sync \
  -H "x-inventory-secret: YOUR_INVENTORY_SYNC_SECRET"
```

Set `INVENTORY_SYNC_SECRET` in Vercel first. A new deploy also seeds Redis automatically if no inventory blob exists yet.

## Webhooks (required for inventory)

When a customer abandons Checkout, reserved stock is put back:

1. Stripe Dashboard → **Developers → Webhooks** → Add endpoint  
   `https://YOUR-DOMAIN.vercel.app/api/webhooks/stripe`
2. Events: `checkout.session.completed`, `checkout.session.expired`
3. Copy the signing secret into Vercel as `STRIPE_WEBHOOK_SECRET`
4. Redeploy

Stock is **reserved** when Checkout starts and **released** if the session expires without payment.
