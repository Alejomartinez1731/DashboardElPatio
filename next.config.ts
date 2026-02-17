import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para Vercel
  output: 'standalone', // Esto permite deployments más eficientes en Vercel
  // Habilitar optimizaciones para producción
  swcMinify: true,
  // Configurar headers para cache en API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
