import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js dev tools badge in the corner during development.
  // (It only ever appears in dev; this keeps the holding page clean.)
  devIndicators: false,
};

export default nextConfig;
