import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Prompt } from '@/lib/definitions';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import PromptCardActions from './prompt-card-actions';

interface PromptCardProps {
  prompt: Prompt;
  onDelete: (id: string) => void;
  onEdit: (prompt: Prompt) => void;
}

export default function PromptCard({ prompt, onDelete, onEdit }: PromptCardProps) {
  return (
    <Card className="flex h-full flex-col transition-all duration-300 hover:shadow-lg dark:hover:border-primary/50">
      <CardHeader className="flex-row items-start gap-4 space-y-0">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-pen text-primary"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 18l5-5a2.828 2.828 0 1 0-4-4l-5 5V18h4Z"/></svg>
        </div>
        <div className='w-full'>
          <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-lg tracking-tight">{prompt.title}</CardTitle>
          </div>
          <CardDescription className="mt-1 line-clamp-2">{prompt.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {prompt.content}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
        <span>
          Creado {formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true, locale: es })}
        </span>
        <PromptCardActions prompt={prompt} onDelete={onDelete} onEdit={() => onEdit(prompt)} />
      </CardFooter>
    </Card>
  );
}
