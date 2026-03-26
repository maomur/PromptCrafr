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
        src: 'https://picsum.photos/seed/promptcraft/192/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: 'https://picsum.photos/seed/promptcraft/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
