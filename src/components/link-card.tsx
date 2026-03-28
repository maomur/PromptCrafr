
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Link, Project } from '@/lib/definitions';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Link as LinkIcon, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LinkCardProps {
  link: Link;
  onDelete: (id: string) => void;
}

export default function LinkCard({ link, onDelete }: LinkCardProps) {
  return (
    <Card className="group flex flex-col h-full rounded-xl border-orange-200/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(link.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-orange-100 rounded-lg">
            <LinkIcon className="h-4 w-4 text-orange-600" />
          </div>
          {link.category && (
            <Badge variant="secondary" className="text-[10px] py-0 h-4 font-medium bg-orange-50 text-orange-700 border-orange-100">
              {link.category}
            </Badge>
          )}
        </div>
        <CardTitle className="text-sm font-semibold truncate pr-6">
          {link.title || 'Enlace guardado'}
        </CardTitle>
        {link.description && (
          <CardDescription className="text-xs line-clamp-2 mt-1">
            {link.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-grow pt-0">
        <div className="bg-muted/30 p-2 rounded-md border border-border/40 overflow-hidden">
          <p className="text-xs font-mono text-muted-foreground truncate flex items-center gap-1.5">
            <span className="shrink-0 opacity-50 italic">URL:</span>
            {link.url}
          </p>
        </div>
      </CardContent>

      <CardFooter className="pt-2 flex items-center justify-between border-t border-border/40 bg-muted/10">
        <span className="text-[10px] text-muted-foreground opacity-70">
          {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true, locale: es })}
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-[10px] font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 gap-1.5"
          asChild
        >
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            Abrir
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
