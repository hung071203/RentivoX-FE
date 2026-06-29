import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // socket.io-client has Node.js-specific deps (ws, xmlhttprequest-ssl) that
  // Turbopack struggles to resolve when building the SSR bundle.
  // Marking as external prevents server-side bundling — it's browser-only anyway.
  serverExternalPackages: ['socket.io-client', 'engine.io-client'],
};

export default nextConfig;
