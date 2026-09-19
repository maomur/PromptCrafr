import LibraryPage from '@/features/library/components/library-page';

/**
 * Página raíz.
 *
 * Es un Server Component y se limita a coordinar: monta la pantalla principal
 * de la feature de biblioteca. No hace fetching porque no hay nada que traer
 * del servidor: los datos viven en el navegador de quien usa la aplicación.
 */
export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <LibraryPage />
    </main>
  );
}
