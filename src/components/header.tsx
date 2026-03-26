import type { ReactNode } from 'react';
import { BotMessageSquare } from 'lucide-react';

export default function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="flex flex-col items-center justify-center gap-6 border-b border-border/60 pb-8 pt-2">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-lg shadow-accent/20">
          <BotMessageSquare className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            PromptCraft
          </h1>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">
            Tu biblioteca personal de prompts creativos.
          </p>
        </div>
      </div>
      {children && (
        <div className="flex w-full items-center justify-center gap-3">
          {children}
        </div>
      )}
    </header>
  );
}
