import type { ReactNode } from 'react';

const Logo = () => (
  <svg
    role="img"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className="h-full w-full"
    preserveAspectRatio="xMidYMid meet"
  >
    <g>
      <path
        fill="hsl(var(--accent))"
        d="M65.4,36.9c-0.6-0.6-1.5-0.6-2.1,0L55,45.2V22.5c0-0.8-0.7-1.5-1.5-1.5h-7c-0.8,0-1.5,0.7-1.5,1.5v22.7L36.6,36.9c-0.6-0.6-1.5-0.6-2.1,0l-5,5c-0.6,0.6-0.6,1.5,0,2.1l19,19c0.6,0.6,1.5,0.6,2.1,0l19-19c0.6-0.6,0.6-1.5,0-2.1L65.4,36.9z"
      />
      <path
        fill="hsl(var(--foreground))"
        d="M21.5,10h57c6.3,0,11.5,5.2,11.5,11.5v36c0,6.3-5.2,11.5-11.5,11.5H62.8l-8.3,8.3c-1.2,1.2-3.1,1.2-4.2,0L42,69H21.5C15.2,69,10,63.8,10,57.5v-36C10,15.2,15.2,10,21.5,10z M68.5,58V21.5c0-0.8-0.7-1.5-1.5-1.5h-44c-0.8,0-1.5,0.7-1.5,1.5V57.5c0,0.8,0.7,1.5,1.5,1.5H45c0.4,0,0.8,0.2,1.1,0.4l5.4,5.4l5.4-5.4c0.3-0.3,0.7-0.4,1.1-0.4h10.8C67.8,59.5,68.5,58.8,68.5,58z"
      />
    </g>
  </svg>
);


export default function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="flex flex-col items-center justify-between gap-4 border-b border-border/60 pb-6 sm:flex-row">
      <div className="flex w-full flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-transparent p-1">
          <Logo />
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
