import type { ReactNode } from 'react';
import Logo from '@/components/logo';
import { APP_NAME } from '@/lib/constants';

export default function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="relative mb-8 flex min-h-[72px] items-center justify-between border-b border-border/60 py-4">
      {/* Espaciador izquierdo para que el logotipo quede centrado de verdad. */}
      <div className="hidden flex-1 md:block" />

      <div className="z-10 flex items-center gap-3 md:absolute md:left-1/2 md:-translate-x-1/2">
        <Logo size={40} className="rounded-[9px] shadow-sm" />
        <h1 className="font-sans text-xl font-bold tracking-tight text-foreground">{APP_NAME}</h1>
      </div>

      <div className="z-20 flex flex-1 justify-end">
        {children && <div className="flex items-center gap-3">{children}</div>}
      </div>
    </header>
  );
}
