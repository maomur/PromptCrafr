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
    <Card className="flex h-full flex-col rounded-xl border-transparent bg-card text-card-foreground shadow-md transition-all duration-300 hover:border-primary/10 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="font-semibold tracking-tight text-base">{prompt.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm">{prompt.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="font-mono text-sm text-muted-foreground line-clamp-3">
          {prompt.content}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Creado {formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true, locale: es })}
        </span>
        <PromptCardActions prompt={prompt} onDelete={onDelete} onEdit={() => onEdit(prompt)} />
      </CardFooter>
    </Card>
  );
}
