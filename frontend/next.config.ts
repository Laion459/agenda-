import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Garantir que date-fns e recharts sejam transpilados corretamente
  transpilePackages: ['date-fns', 'recharts'],
  
  // Configuração do Turbopack (Next.js 16 usa Turbopack por padrão)
  turbopack: {},
};

export default nextConfig;
