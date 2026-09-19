import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Los errores de tipos y de lint rompen el build a propósito: antes estaban
  // silenciados y el despliegue no protegía de nada.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },
  images: {
    // El logotipo vive en /public; no queda ninguna imagen remota.
    remotePatterns: [],
  },
};

export default nextConfig;
