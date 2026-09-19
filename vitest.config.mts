import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Mismo alias que tsconfig, para que los tests importen igual que el resto
  // del código en lugar de con rutas relativas.
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // Todo lo que se prueba es lógica pura: no hace falta un DOM.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
