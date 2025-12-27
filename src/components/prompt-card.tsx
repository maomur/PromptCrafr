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
    <Card className="flex h-full flex-col border-transparent shadow-none hover:border-border hover:shadow-sm transition-all duration-300">
      <CardHeader>
        <CardTitle className="font-semibold text-base tracking-tight">{prompt.title}</CardTitle>
        <CardDescription className="mt-1 line-clamp-2 text-sm">{prompt.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3 font-mono">
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
