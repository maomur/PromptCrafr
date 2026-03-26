import type { ReactNode } from 'react';
import { BotMessageSquare } from 'lucide-react';

export default function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="flex items-center justify-between border-b border-border/60 py-4 mb-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm">
          <BotMessageSquare className="h-5 w-5" />
        </div>
        <h1 className="font-sans text-xl font-bold tracking-tight text-foreground">
          PromptCraft
        </h1>
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </header>
  );
}
