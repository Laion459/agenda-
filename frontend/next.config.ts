import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Garantir que date-fns e recharts sejam transpilados corretamente
  transpilePackages: ['date-fns', 'recharts'],
  
  // Proxy reverso para API - evita problemas de CORS no Codespace
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/:path*`
          : process.env.NODE_ENV === 'production'
          ? 'http://backend:8000/api/:path*'
          : 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
