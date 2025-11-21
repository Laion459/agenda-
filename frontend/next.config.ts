import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Garantir que date-fns seja transpilado corretamente
  transpilePackages: ['date-fns'],
};

export default nextConfig;
