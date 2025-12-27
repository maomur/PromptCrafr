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
    <Card className="flex flex-col h-full transition-shadow duration-300 hover:shadow-xl dark:hover:shadow-primary/10">
      <CardHeader>
        <CardTitle className="font-headline tracking-tight">{prompt.title}</CardTitle>
        <CardDescription>{prompt.description}</CardDescription>
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
