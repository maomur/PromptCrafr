import type { ReactNode } from 'react';
import Image from 'next/image';

export default function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="relative flex items-center justify-between border-b border-border/60 py-4 mb-8 min-h-[72px]">
      {/* Espaciador izquierdo para equilibrar el centrado */}
      <div className="flex-1 hidden md:block" />

      {/* Logotipo centrado */}
      <div className="flex items-center gap-3 md:absolute md:left-1/2 md:-translate-x-1/2 z-10">
        <Image 
          src="https://www.pulseai.ws/logo192.png" 
          alt="Pulse AI Logo" 
          width={40} 
          height={40} 
          className="rounded-lg shadow-sm"
        />
        <h1 className="font-sans text-xl font-bold tracking-tight text-foreground">
          PromptCraft
        </h1>
      </div>

      {/* Contenido a la derecha (Filtro) */}
      <div className="flex-1 flex justify-end z-20">
        {children && (
          <div className="flex items-center gap-3">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
