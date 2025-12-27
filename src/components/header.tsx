import { BotMessageSquare } from 'lucide-react';
import type { ReactNode } from 'react';

export default function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="flex flex-col items-center justify-between gap-4 border-b border-border/60 pb-6 sm:flex-row">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
          <BotMessageSquare className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
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
