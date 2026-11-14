import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js dev tools badge in the corner during development.
  // (It only ever appears in dev; this keeps the holding page clean.)
  devIndicators: false,
  // Research diary: a static page in public/research-diary, served at /research-diary.
  async rewrites() {
    return [
      { source: "/research-diary", destination: "/research-diary/index.html" },
    ];
  },
};

export default nextConfig;
