import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="rounded-full bg-muted p-3">
        <Compass className="h-8 w-8 text-muted-foreground" />
      </div>

      <h1 className="text-2xl font-semibold">Aquí no hay nada</h1>
      <p className="text-muted-foreground">La página que buscas no existe.</p>

      <Button asChild>
        <Link href="/">Ir a la biblioteca</Link>
      </Button>
    </div>
  );
}
