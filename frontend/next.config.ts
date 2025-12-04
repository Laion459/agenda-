import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Garantir que date-fns e recharts sejam transpilados corretamente
  transpilePackages: ['date-fns', 'recharts'],
  
  // Proxy reverso para API - evita problemas de CORS no Codespace
  // O Next.js server faz proxy de /api/* para o backend
  async rewrites() {
    // Se BACKEND_URL estiver definido (Docker), usa ele
    // Caso contrário, usa localhost (desenvolvimento local)
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    // Remove barra final se houver para evitar duplicação
    const cleanBackendUrl = backendUrl.replace(/\/$/, '');
    
    return [
      {
        source: '/api/:path*',
        destination: `${cleanBackendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
