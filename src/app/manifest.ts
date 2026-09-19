import type { MetadataRoute } from 'next';
import { APP_DESCRIPTION, APP_NAME, BRAND_COLOR } from '@/lib/constants';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: BRAND_COLOR,
    lang: 'es',
    icons: [
      { src: '/icons/logo-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
