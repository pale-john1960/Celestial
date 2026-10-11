import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // explicit Turbopack workspace root — /home/z also has a package-lock.json
  // (scaffold leftovers) which breaks module inference when the dev server
  // restarts (task 8-a). Setting the root pins resolution to this project.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
