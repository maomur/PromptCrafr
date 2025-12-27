import { BotMessageSquare } from 'lucide-react';
import type { ReactNode } from 'react';

export default function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-start">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-foreground">
          <BotMessageSquare className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-headline">
            PromptCraft
          </h1>
          <p className="mt-1 text-muted-foreground">
            Tu biblioteca personal de prompts creativos.
          </p>
        </div>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </header>
  );
}
