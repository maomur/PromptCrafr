'use client';

import { useState, useMemo } from 'react';
import type { Prompt, PromptCategory, Project } from '@/lib/definitions';
import { promptCategories } from '@/lib/definitions';
import Header from '@/components/header';
import PromptList from '@/components/prompt-list';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Folder, 
  Folders, 
  Trash2, 
  Filter
} from 'lucide-react';
import PromptForm from '@/components/prompt-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import useLocalStorage from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function PromptPage() {
  const { toast } = useToast();
  const [prompts, setPrompts] = useLocalStorage<Prompt[]>('prompts', []);
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', []);
  
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isNewProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<PromptCategory | 'Todos'>('Todos');
  const [activeProjectId, setActiveProjectId] = useState<string | 'all' | 'none'>('all');

  const handleDeletePrompt = (id: string) => {
    setPrompts((currentPrompts) => currentPrompts.filter((p) => p.id !== id));
  };

  const handleSave = (promptData: Omit<Prompt, 'id' | 'createdAt'>, id?: string) => {
    if (id) {
      setPrompts(prompts.map(p => p.id === id ? { ...p, ...promptData } : p));
    } else {
      const newPrompt: Prompt = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...promptData,
      };
      setPrompts([newPrompt, ...prompts]);
    }
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: newProjectName,
      createdAt: new Date().toISOString(),
    };
    setProjects([...projects, newProject]);
    setNewProjectName('');
    setNewProjectDialogOpen(false);
    toast({
      title: "Proyecto creado",
      description: `Se ha creado el proyecto "${newProject.name}"`,
    });
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(projects.filter(p => p.id !== id));
    setPrompts(prompts.map(p => p.projectId === id ? { ...p, projectId: undefined } : p));
    if (activeProjectId === id) setActiveProjectId('all');
    toast({
      title: "Proyecto eliminado",
      description: "Los prompts han sido movidos a la sección general.",
    });
  };

  const handleMoveToProject = (promptId: string, projectId: string | undefined) => {
    setPrompts(prompts.map(p => p.id === promptId ? { ...p, projectId } : p));
    toast({
      title: "Prompt movido",
      description: projectId 
        ? `Prompt movido a ${projects.find(p => p.id === projectId)?.name}`
        : "Prompt movido a General",
    });
  };

  const handleDropOnProject = (projectId: string | undefined, e: React.DragEvent) => {
    e.preventDefault();
    const promptId = e.dataTransfer.getData('promptId');
    if (!promptId) return;
    handleMoveToProject(promptId, projectId);
  };

  const handleReorderPrompts = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    setPrompts((prev) => {
      const result = [...prev];
      const draggedIndex = result.findIndex(p => p.id === draggedId);
      const targetIndex = result.findIndex(p => p.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const [removed] = result.splice(draggedIndex, 1);
      result.splice(targetIndex, 0, removed);
      return result;
    });
  };

  const closeAllDialogs = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedPrompt(null);
  };

  const filteredPrompts = useMemo(() => {
    let result = [...prompts];
    
    if (activeProjectId === 'none') {
      result = result.filter(p => !p.projectId);
    } else if (activeProjectId !== 'all') {
      result = result.filter(p => p.projectId === activeProjectId);
    }

    if (categoryFilter !== 'Todos') {
      result = result.filter(p => p.category === categoryFilter);
    }

    return result;
  }, [prompts, activeProjectId, categoryFilter]);

  return (
    <div className="relative min-h-[80vh]">
      <Header>
        <Select
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(value as PromptCategory | 'Todos')}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4 opacity-70" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todas las categorías</SelectItem>
            {promptCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Header>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-border/40">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                <Folders className="mr-2 h-4 w-4" />
                Proyectos
              </h2>
              <Dialog open={isNewProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo Proyecto</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input 
                      placeholder="Nombre del proyecto..." 
                      value={newProjectName} 
                      onChange={e => setNewProjectName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                    />
                    <Button className="w-full" onClick={handleCreateProject}>Crear Proyecto</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveProjectId('all')}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDropOnProject(undefined, e)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  activeProjectId === 'all' ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                )}
              >
                <div className="flex items-center">
                  <Folders className="mr-2 h-4 w-4" />
                  Todos
                </div>
                <span className="text-xs opacity-60">{prompts.length}</span>
              </button>

              <button
                onClick={() => setActiveProjectId('none')}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDropOnProject(undefined, e)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  activeProjectId === 'none' ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                )}
              >
                <div className="flex items-center">
                  <Folder className="mr-2 h-4 w-4" />
                  Sin Proyecto
                </div>
                <span className="text-xs opacity-60">{prompts.filter(p => !p.projectId).length}</span>
              </button>

              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setActiveProjectId(project.id)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDropOnProject(project.id, e)}
                  className={cn(
                    "group w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    activeProjectId === project.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                  )}
                >
                  <div className="flex items-center truncate">
                    <Folder className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">{project.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-60">
                      {prompts.filter(p => p.projectId === project.id).length}
                    </span>
                    <Trash2 
                      className="h-3 w-3 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110" 
                      onClick={(e) => handleDeleteProject(project.id, e)}
                    />
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex-1 pb-20">
          <PromptList
            prompts={filteredPrompts}
            projects={projects}
            onDeletePrompt={handleDeletePrompt}
            onEditPrompt={(prompt) => {
              setSelectedPrompt(prompt);
              setEditDialogOpen(true);
            }}
            onReorder={handleReorderPrompts}
            onMoveToProject={handleMoveToProject}
          />
        </div>
      </div>

      {/* Floating Action Button */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl z-50 transition-transform hover:scale-110 active:scale-95"
            size="icon"
          >
            <Plus className="h-8 w-8" />
            <span className="sr-only">Nuevo</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Crear un Nuevo Prompt</DialogTitle>
          </DialogHeader>
          <PromptForm onSave={handleSave} onClose={closeAllDialogs} projects={projects} />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-[625px] shadow-3xl"
        >
          <DialogHeader>
            <DialogTitle>Editar Prompt</DialogTitle>
          </DialogHeader>
          {selectedPrompt && (
            <PromptForm
              prompt={selectedPrompt}
              projects={projects}
              onSave={handleSave}
              onClose={closeAllDialogs}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}