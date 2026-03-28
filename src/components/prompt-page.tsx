'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
  Filter,
  Loader2
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
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  useUser, 
  useFirestore, 
  useAuth, 
  useCollection, 
  useMemoFirebase,
  initiateAnonymousSignIn,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';

export default function PromptPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirestore();
  const auth = useAuth();

  // Iniciar sesión anónima si no hay usuario
  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  // Consultas de Firestore memoizadas
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'projects');
  }, [firestore, user?.uid]);

  const promptsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'prompts');
  }, [firestore, user?.uid]);

  const { data: rawProjects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);
  const { data: rawPrompts, isLoading: promptsLoading } = useCollection<Prompt>(promptsQuery);

  // Estados locales para diálogos
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isNewProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<PromptCategory | 'Todos'>('Todos');
  const [activeProjectId, setActiveProjectId] = useState<string | 'all' | 'none'>('all');

  const projects = useMemo(() => rawProjects || [], [rawProjects]);
  const prompts = useMemo(() => rawPrompts || [], [rawPrompts]);

  const handleSave = useCallback((promptData: {
    title: string;
    description: string;
    content: string;
    category: PromptCategory;
    projectId: string | null;
  }, id?: string) => {
    if (!user?.uid || !firestore) return;
    
    const now = new Date().toISOString();
    
    if (id) {
      const docRef = doc(firestore, 'users', user.uid, 'prompts', id);
      updateDocumentNonBlocking(docRef, { 
        ...promptData, 
        updatedAt: now 
      });
    } else {
      const colRef = collection(firestore, 'users', user.uid, 'prompts');
      const newDocRef = doc(colRef);
      
      const newPrompt: Prompt = {
        id: newDocRef.id,
        ownerId: user.uid,
        createdAt: now,
        updatedAt: now,
        title: promptData.title || '',
        description: promptData.description || '',
        content: promptData.content || '',
        category: promptData.category,
        projectId: promptData.projectId || null,
      };

      setDocumentNonBlocking(newDocRef, newPrompt, { merge: true });
    }
  }, [user?.uid, firestore]);

  const handleCreateProject = useCallback(() => {
    if (!newProjectName.trim() || !user?.uid || !firestore) return;
    
    const colRef = collection(firestore, 'users', user.uid, 'projects');
    const newDocRef = doc(colRef);
    
    const newProject: Project = {
      id: newDocRef.id,
      name: newProjectName.trim(),
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
    };

    setDocumentNonBlocking(newDocRef, newProject, { merge: true });

    setNewProjectName('');
    setNewProjectDialogOpen(false);
    toast({
      title: "Proyecto creado",
      description: `Se ha creado el proyecto "${newProjectName}"`,
    });
  }, [newProjectName, user?.uid, firestore, toast]);

  const handleDeleteProject = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.uid || !firestore) return;

    const projectRef = doc(firestore, 'users', user.uid, 'projects', id);
    deleteDocumentNonBlocking(projectRef);

    // Desasociar prompts de este proyecto
    prompts.forEach(p => {
      if (p.projectId === id) {
        const promptRef = doc(firestore, 'users', user.uid, 'prompts', p.id);
        updateDocumentNonBlocking(promptRef, { projectId: null });
      }
    });

    if (activeProjectId === id) setActiveProjectId('all');
    toast({
      title: "Proyecto eliminado",
      description: "Los prompts han sido movidos a la sección general.",
    });
  }, [user?.uid, firestore, prompts, activeProjectId, toast]);

  const handleMoveToProject = useCallback((promptId: string, projectId: string | null) => {
    if (!user?.uid || !firestore) return;
    const promptRef = doc(firestore, 'users', user.uid, 'prompts', promptId);
    updateDocumentNonBlocking(promptRef, { projectId });
    
    toast({
      title: "Prompt movido",
      description: projectId 
        ? `Prompt movido a ${projects.find(p => p.id === projectId)?.name}`
        : "Prompt movido a General",
    });
  }, [user?.uid, firestore, projects, toast]);

  const handleDropOnProject = useCallback((projectId: string | null, e: React.DragEvent) => {
    e.preventDefault();
    const promptId = e.dataTransfer.getData('promptId');
    if (promptId) handleMoveToProject(promptId, projectId);
  }, [handleMoveToProject]);

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

    return result.sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt || '';
      const dateB = b.updatedAt || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });
  }, [prompts, activeProjectId, categoryFilter]);

  const closeAllDialogs = useCallback(() => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedPrompt(null);
  }, []);

  if (isUserLoading || (user && (projectsLoading || promptsLoading))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Sincronizando con la nube...</p>
      </div>
    );
  }

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
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={!user}>
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
                    <Button className="w-full" onClick={handleCreateProject} disabled={!newProjectName.trim()}>Crear Proyecto</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveProjectId('all')}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDropOnProject(null, e)}
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
                onDrop={e => handleDropOnProject(null, e)}
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
            onDeletePrompt={(id) => {
              if (!user?.uid || !firestore) return;
              deleteDocumentNonBlocking(doc(firestore, 'users', user.uid, 'prompts', id));
            }}
            onEditPrompt={(prompt) => {
              setSelectedPrompt(prompt);
              setEditDialogOpen(true);
            }}
            onReorder={() => toast({ title: "Reordenar", description: "Orden actualizado visualmente." })}
            onMoveToProject={handleMoveToProject}
          />
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            disabled={!user}
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
