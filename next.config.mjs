/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow larger payloads on server actions / route handlers (base64 images).
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  // Lint is run separately; don't block a build on <img> warnings etc.
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
