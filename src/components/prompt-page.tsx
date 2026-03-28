
'use client';

import { useState, useMemo, useCallback } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Folder, 
  Folders, 
  Trash2, 
  Filter,
  Loader2,
  LogOut
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
  useFirestore, 
  useAuth, 
  useCollection, 
  useMemoFirebase,
  logOut,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

interface PromptPageProps {
  user: User;
}

export default function PromptPage({ user }: PromptPageProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();

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

  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isNewProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<PromptCategory | 'Todos'>('Todos');
  const [activeProjectId, setActiveProjectId] = useState<string | 'all' | 'none'>('all');
  const [dragOverProject, setDragOverProject] = useState<string | null>(null);

  const projects = useMemo(() => rawProjects || [], [rawProjects]);
  const prompts = useMemo(() => rawPrompts || [], [rawPrompts]);

  const handleSave = useCallback((promptData: {
    title: string;
    description: string;
    content: string;
    category: PromptCategory;
    projectId: string | null;
  }, id?: string) => {
    if (!firestore || !user?.uid) return;
    
    const now = new Date().toISOString();
    const userId = user.uid;
    
    if (id) {
      const docRef = doc(firestore, 'users', userId, 'prompts', id);
      updateDocumentNonBlocking(docRef, {
        title: promptData.title,
        description: promptData.description,
        content: promptData.content,
        category: promptData.category,
        projectId: promptData.projectId || null,
        updatedAt: now
      });
    } else {
      const colRef = collection(firestore, 'users', userId, 'prompts');
      const newDocRef = doc(colRef);
      
      const maxOrder = prompts.length > 0 ? Math.max(...prompts.map(p => p.order || 0)) : 0;
      
      const newPrompt: Prompt = {
        id: newDocRef.id,
        ownerId: userId,
        createdAt: now,
        updatedAt: now,
        title: promptData.title,
        description: promptData.description,
        content: promptData.content,
        category: promptData.category,
        projectId: promptData.projectId || null,
        order: maxOrder + 1
      };

      setDocumentNonBlocking(newDocRef, newPrompt);
    }
    
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedPrompt(null);
  }, [user?.uid, firestore, prompts]);

  const handleCreateProject = useCallback(() => {
    const name = newProjectName.trim();
    if (!name || !firestore || !user?.uid) return;
    
    const userId = user.uid;
    const colRef = collection(firestore, 'users', userId, 'projects');
    const newDocRef = doc(colRef);
    
    const newProject: Project = {
      id: newDocRef.id,
      name: name,
      ownerId: userId,
      createdAt: new Date().toISOString(),
    };

    setDocumentNonBlocking(newDocRef, newProject);

    setNewProjectName('');
    setNewProjectDialogOpen(false);
    toast({ title: "Proyecto creado", description: `"${name}" se ha añadido correctamente.` });
  }, [newProjectName, user?.uid, firestore, toast]);

  const handleDeleteProject = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firestore || !user?.uid) return;

    const projectRef = doc(firestore, 'users', user.uid, 'projects', id);
    deleteDocumentNonBlocking(projectRef);

    if (activeProjectId === id) setActiveProjectId('all');
    toast({ title: "Proyecto eliminado", description: "El proyecto ha sido borrado." });
  }, [user?.uid, firestore, activeProjectId, toast]);

  const handleMoveToProject = useCallback((promptId: string, projectId: string | null) => {
    if (!firestore || !user?.uid) return;
    const promptRef = doc(firestore, 'users', user.uid, 'prompts', promptId);
    updateDocumentNonBlocking(promptRef, { 
      projectId: projectId || null, 
      updatedAt: new Date().toISOString() 
    });
    toast({ title: "Prompt organizado", description: "El prompt ha sido movido correctamente." });
  }, [user?.uid, firestore, toast]);

  const handleReorder = useCallback((draggedId: string, targetId: string) => {
    if (!firestore || !user?.uid) return;
    
    const draggedPrompt = prompts.find(p => p.id === draggedId);
    const targetPrompt = prompts.find(p => p.id === targetId);
    
    if (!draggedPrompt || !targetPrompt) return;

    const draggedRef = doc(firestore, 'users', user.uid, 'prompts', draggedId);
    const targetRef = doc(firestore, 'users', user.uid, 'prompts', targetId);
    
    let draggedOrder = draggedPrompt.order ?? 0;
    let targetOrder = targetPrompt.order ?? 0;

    if (draggedOrder === targetOrder) {
      targetOrder = draggedOrder + 1;
    }

    updateDocumentNonBlocking(draggedRef, { order: targetOrder, updatedAt: new Date().toISOString() });
    updateDocumentNonBlocking(targetRef, { order: draggedOrder, updatedAt: new Date().toISOString() });
  }, [prompts, firestore, user?.uid]);

  const handleDragOverProject = (e: React.DragEvent, id: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverProject !== id) setDragOverProject(id);
  };

  const handleDropOnProject = (projectId: string | null, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverProject(null);
    const promptId = e.dataTransfer.getData('text/plain');
    if (promptId) {
      handleMoveToProject(promptId, projectId);
    }
  };

  const confirmDeletePrompt = useCallback(() => {
    if (!promptToDelete || !firestore || !user?.uid) return;
    deleteDocumentNonBlocking(doc(firestore, 'users', user.uid, 'prompts', promptToDelete.id));
    setPromptToDelete(null);
    setDeleteDialogOpen(false);
    toast({ title: "Prompt eliminado", description: "El prompt ha sido borrado." });
  }, [promptToDelete, firestore, user?.uid, toast]);

  const filteredPrompts = useMemo(() => {
    let result = [...prompts];
    
    if (activeProjectId === 'none') {
      result = result.filter(p => !p.projectId || p.projectId === 'none');
    } else if (activeProjectId !== 'all') {
      result = result.filter(p => p.projectId === activeProjectId);
    }

    if (categoryFilter !== 'Todos') {
      result = result.filter(p => p.category === categoryFilter);
    }

    return result.sort((a, b) => (b.order || 0) - (a.order || 0));
  }, [prompts, activeProjectId, categoryFilter]);

  return (
    <div className="relative min-h-[80vh]">
      <Header>
        <div className="flex items-center gap-4">
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value as PromptCategory | 'Todos')}
          >
            <SelectTrigger className="w-[180px] hidden md:flex">
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
          
          <div className="flex items-center gap-2 border-l pl-4 border-border/60">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-xs font-medium truncate max-w-[120px]">{user.email}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">En línea</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => logOut(auth)} title="Cerrar Sesión">
              <LogOut className="h-5 w-5 text-muted-foreground hover:text-destructive transition-colors" />
            </Button>
          </div>
        </div>
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
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary/10">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                  <DialogHeader>
                    <DialogTitle>Nuevo Proyecto</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input 
                      placeholder="Nombre del proyecto..." 
                      value={newProjectName} 
                      onChange={e => setNewProjectName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                      autoFocus
                    />
                    <Button 
                      className="w-full" 
                      onClick={handleCreateProject} 
                      disabled={!newProjectName.trim()}
                    >
                      Crear Proyecto
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveProjectId('all')}
                onDragOver={e => handleDragOverProject(e, 'all')}
                onDrop={e => handleDropOnProject(null, e)}
                onDragLeave={() => setDragOverProject(null)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                  activeProjectId === 'all' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent/50",
                  dragOverProject === 'all' && "ring-2 ring-primary ring-offset-1 bg-accent/30"
                )}
              >
                <div className="flex items-center">
                  <Folders className="mr-2 h-4 w-4" />
                  Todos
                </div>
                <span className={cn("text-xs", activeProjectId === 'all' ? "text-primary-foreground/80" : "opacity-60")}>
                  {prompts.length}
                </span>
              </button>

              <button
                onClick={() => setActiveProjectId('none')}
                onDragOver={e => handleDragOverProject(e, 'none')}
                onDrop={e => handleDropOnProject(null, e)}
                onDragLeave={() => setDragOverProject(null)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                  activeProjectId === 'none' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent/50",
                  dragOverProject === 'none' && "ring-2 ring-primary ring-offset-1 bg-accent/30"
                )}
              >
                <div className="flex items-center">
                  <Folder className="mr-2 h-4 w-4" />
                  Sin Proyecto
                </div>
                <span className={cn("text-xs", activeProjectId === 'none' ? "text-primary-foreground/80" : "opacity-60")}>
                  {prompts.filter(p => !p.projectId || p.projectId === 'none').length}
                </span>
              </button>

              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setActiveProjectId(project.id)}
                  onDragOver={e => handleDragOverProject(e, project.id)}
                  onDrop={e => handleDropOnProject(project.id, e)}
                  onDragLeave={() => setDragOverProject(null)}
                  className={cn(
                    "group w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                    activeProjectId === project.id ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent/50",
                    dragOverProject === project.id && "ring-2 ring-primary ring-offset-1 bg-accent/30"
                  )}
                >
                  <div className="flex items-center truncate">
                    <Folder className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">{project.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs", activeProjectId === project.id ? "text-primary-foreground/80" : "opacity-60")}>
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

        <main className="flex-1 pb-20">
          {projectsLoading || promptsLoading ? (
             <div className="flex flex-col items-center justify-center pt-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Cargando biblioteca...</p>
            </div>
          ) : (
            <PromptList
              prompts={filteredPrompts}
              projects={projects}
              onDeletePrompt={(id) => {
                const prompt = prompts.find(p => p.id === id);
                if (prompt) {
                  setPromptToDelete(prompt);
                  setDeleteDialogOpen(true);
                }
              }}
              onEditPrompt={(prompt) => {
                setSelectedPrompt(prompt);
                setEditDialogOpen(true);
              }}
              onReorder={handleReorder}
              onMoveToProject={handleMoveToProject}
            />
          )}
        </main>
      </div>

      {/* Diálogo Global de Eliminación para evitar bloqueos del DOM */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el prompt "{promptToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPromptToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeletePrompt}
            >
              Eliminar Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl z-50 transition-all hover:scale-110 active:scale-95 bg-primary hover:bg-primary/90"
            size="icon"
          >
            <Plus className="h-8 w-8 text-primary-foreground" />
            <span className="sr-only">Nuevo Prompt</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Prompt</DialogTitle>
          </DialogHeader>
          <PromptForm onSave={handleSave} onClose={() => setCreateDialogOpen(false)} projects={projects} />
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
              onClose={() => {
                setEditDialogOpen(false);
                setSelectedPrompt(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
