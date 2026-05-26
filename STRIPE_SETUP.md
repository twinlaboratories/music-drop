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
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Frontend | Starts with `pk_test_` (test) or `pk_live_` (production) |
| `STRIPE_SECRET_KEY` | Backend | Starts with `sk_test_` (test) or `sk_live_` (production) |

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

## Webhooks (Optional)

For order confirmation emails or inventory tracking, set up webhooks:
- Endpoint: `https://yoursite.com/api/webhook`
- Events: `checkout.session.completed`
