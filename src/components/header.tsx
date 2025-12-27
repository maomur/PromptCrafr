import { Bot } from 'lucide-react';
import type { ReactNode } from 'react';

export default function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-start">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
            PromptCraft
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Your personal library of creative prompts.
          </p>
        </div>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </header>
  );
}
