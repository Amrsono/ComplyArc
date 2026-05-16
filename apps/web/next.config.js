/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // NEXT_PUBLIC_API_URL is handled by relative paths in lib/api.ts
  },
  // Suppress hydration warnings if necessary or add other production configs
};

module.exports = nextConfig;
