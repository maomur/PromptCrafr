import type { MetadataRoute } from 'next';
import { APP_DESCRIPTION, APP_ICONS, APP_NAME, BRAND_COLOR } from '@/lib/constants';

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
      { src: APP_ICONS.any192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: APP_ICONS.any512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      // El maskable lleva el fondo a sangre y el glifo encogido, porque el
      // lanzador de Android recorta el icono a su propia forma.
      { src: APP_ICONS.maskable512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
