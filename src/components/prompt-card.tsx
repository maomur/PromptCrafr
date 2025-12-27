
'use client';

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
import { Badge } from '@/components/ui/badge';
import { Video, Image, FileText, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PromptCardProps {
  prompt: Prompt;
  onDelete: (id: string) => void;
  onEdit: (prompt: Prompt) => void;
}

const categoryIcons = {
  Video: <Video className="mr-1.5 h-3.5 w-3.5" />,
  Imagen: <Image className="mr-1.5 h-3.5 w-3.5" />,
  Textos: <FileText className="mr-1.5 h-3.5 w-3.5" />,
  Otros: <Sparkles className="mr-1.5 h-3.5 w-3.5" />,
};

const categoryColors = {
  Video: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  Imagen: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  Textos: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  Otros: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300',
}


export default function PromptCard({ prompt, onDelete, onEdit }: PromptCardProps) {
  const { toast } = useToast();

  const handleCardClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }

    navigator.clipboard.writeText(prompt.content);
    toast({
      title: 'Prompt Copiado',
      description: 'El contenido se ha copiado a tu portapapeles.',
    });
  };

  return (
    <Card 
      onClick={handleCardClick}
      className="flex h-full cursor-pointer flex-col rounded-xl border-border/20 bg-card text-card-foreground shadow-md transition-all duration-300 hover:shadow-lg"
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-semibold tracking-tight text-base">{prompt.title}</CardTitle>
          <Badge 
            variant="outline"
            className={`flex items-center border-0 text-xs font-medium ${categoryColors[prompt.category]}`}
          >
            {categoryIcons[prompt.category]}
            {prompt.category}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 text-sm pt-1">{prompt.description}</CardDescription>
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
