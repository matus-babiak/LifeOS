import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (lokálna dev databáza) si načítava wasm sám — nesmie ísť cez bundler
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
