# Deployment Guide

## What You Need Before Deploying

### 1. Stripe Account (Required)
- Sign up at https://stripe.com
- Get your API keys from https://dashboard.stripe.com/developers
- You'll need:
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_` for testing, `pk_live_` for real)
  - `STRIPE_SECRET_KEY` (starts with `sk_test_` for testing, `sk_live_` for real)

### 2. Product Images (When You're Ready)
Place your images in `/public/merch/`:
```
/public/merch/
├── tshirt-01.jpg
├── tshirt-02.jpg
├── tshirt-03.jpg
├── tshirt-04.jpg
├── tshirt-05.jpg
├── tshirt-06.jpg
├── cd.jpg
└── necklace.jpg
```

Then update `/src/config/products.ts` with your real prices and sizes.

### 3. Environment Variables
Create a `.env.local` file (copy from `.env.example`):
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
```

## Deploy to Vercel

### Option A: Vercel Dashboard (Easiest)
1. Push this code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Add environment variables in the dashboard:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
5. Deploy!

### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (will prompt for env variables)
vercel --prod
```

## After Deployment

### Test Mode
Use these test card details:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

### Going Live
1. Activate your Stripe account
2. Replace test keys with live keys in Vercel dashboard:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
   - `STRIPE_SECRET_KEY=sk_live_...`
3. Redeploy
4. Make a small test purchase with real card

## Updating Products Later

Just edit `/src/config/products.ts`:
```typescript
{
  id: "tshirt-01",
  name: "Your Tee Name",
  price: 5000, // $50.00
  type: "tshirt",
  image: "/merch/tshirt-01.jpg",
  frameColor: "pink",
  size: "M",
}
```

Then push to GitHub — Vercel will auto-deploy!

## Current Status

✅ Floating product cards with drag interaction
✅ Unique t-shirts (disappear when added to cart)
✅ CD & necklace with quantity selectors (2x size)
✅ Cart with Stripe checkout integration
✅ Success page after purchase
✅ Alternating pink/lime green frames
✅ Gradient background

❌ Need: Your Stripe API keys
❌ Need: Your product images
❌ Need: Your actual prices
