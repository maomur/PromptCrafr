import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PromptCraft',
    short_name: 'PromptCraft',
    description: 'Gestiona tus prompts creativos con facilidad.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#007AFF',
    icons: [
      {
        src: 'https://www.pulseai.ws/logo194.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: 'https://www.pulseai.ws/logo194.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
