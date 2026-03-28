'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Prompt, PromptCategory, Project, Link } from '@/lib/definitions';
import { promptCategories } from '@/lib/definitions';
import Header from '@/components/header';
import PromptList from '@/components/prompt-list';
import LinkCard from '@/components/link-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  LogOut,
  Link as LinkIcon
} from 'lucide-react';
import PromptForm from '@/components/prompt-form';
import LinkForm from '@/components/link-form';
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

  // Queries
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'projects');
  }, [firestore, user?.uid]);

  const promptsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'prompts');
  }, [firestore, user?.uid]);

  const linksQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, 'users', user.uid, 'links');
  }, [firestore, user?.uid]);

  const { data: rawProjects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);
  const { data: rawPrompts, isLoading: promptsLoading } = useCollection<Prompt>(promptsQuery);
  const { data: rawLinks, isLoading: linksLoading } = useCollection<Link>(linksQuery);

  // States
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreateLinkDialogOpen, setCreateLinkDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isNewProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<PromptCategory | 'Todos'>('Todos');
  const [activeProjectId, setActiveProjectId] = useState<string | 'all' | 'none'>('all');
  const [dragOverProject, setDragOverProject] = useState<string | null>(null);

  // Reset de interactividad forzado para evitar congelamientos
  useEffect(() => {
    const isAnyOpen = isCreateDialogOpen || isCreateLinkDialogOpen || isEditDialogOpen || isNewProjectDialogOpen || isDeleteDialogOpen;
    if (!isAnyOpen) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = '';
        document.body.style.overflow = '';
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isCreateDialogOpen, isCreateLinkDialogOpen, isEditDialogOpen, isNewProjectDialogOpen, isDeleteDialogOpen]);

  const projects = useMemo(() => rawProjects || [], [rawProjects]);
  const prompts = useMemo(() => rawPrompts || [], [rawPrompts]);
  const links = useMemo(() => rawLinks || [], [rawLinks]);

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
      toast({ title: 'Prompt actualizado' });
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
      toast({ title: 'Prompt creado' });
    }
    
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedPrompt(null);
  }, [user?.uid, firestore, prompts, toast]);

  const handleSaveLink = useCallback((linkData: {
    url: string;
    projectId: string;
    title?: string;
    description?: string;
    category?: PromptCategory;
  }) => {
    if (!firestore || !user?.uid) return;
    
    const userId = user.uid;
    const colRef = collection(firestore, 'users', userId, 'links');
    const newDocRef = doc(colRef);
    
    const newLink: Link = {
      id: newDocRef.id,
      ownerId: userId,
      createdAt: new Date().toISOString(),
      url: linkData.url,
      projectId: linkData.projectId,
      title: linkData.title || null,
      description: linkData.description || null,
      category: linkData.category || null,
    };

    setDocumentNonBlocking(newDocRef, newLink);
    toast({ title: 'Enlace guardado' });
    setCreateLinkDialogOpen(false);
  }, [user?.uid, firestore, toast]);

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
    toast({ title: "Proyecto creado" });
  }, [newProjectName, user?.uid, firestore, toast]);

  const handleDeleteProject = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firestore || !user?.uid) return;
    const projectRef = doc(firestore, 'users', user.uid, 'projects', id);
    deleteDocumentNonBlocking(projectRef);
    if (activeProjectId === id) setActiveProjectId('all');
    toast({ title: "Proyecto eliminado" });
  }, [user?.uid, firestore, activeProjectId, toast]);

  const handleDeleteLink = useCallback((id: string) => {
    if (!firestore || !user?.uid) return;
    const linkRef = doc(firestore, 'users', user.uid, 'links', id);
    deleteDocumentNonBlocking(linkRef);
    toast({ title: "Enlace eliminado" });
  }, [user?.uid, firestore, toast]);

  const handleMoveToProject = useCallback((promptId: string, projectId: string | null) => {
    if (!firestore || !user?.uid) return;
    const promptRef = doc(firestore, 'users', user.uid, 'prompts', promptId);
    updateDocumentNonBlocking(promptRef, { 
      projectId: projectId || null, 
      updatedAt: new Date().toISOString() 
    });
    toast({ title: "Prompt organizado" });
  }, [user?.uid, firestore, toast]);

  const handleReorder = useCallback((draggedId: string, targetId: string) => {
    if (!firestore || !user?.uid) return;
    
    const draggedPrompt = prompts.find(p => p.id === draggedId);
    const targetPrompt = prompts.find(p => p.id === targetId);
    
    if (!draggedPrompt || !targetPrompt) return;

    const draggedRef = doc(firestore, 'users', user.uid, 'prompts', draggedId);
    const targetRef = doc(firestore, 'users', user.uid, 'prompts', targetId);
    
    const tempOrder = targetPrompt.order || 0;
    updateDocumentNonBlocking(draggedRef, { order: tempOrder, updatedAt: new Date().toISOString() });
    updateDocumentNonBlocking(targetRef, { order: draggedPrompt.order || 0, updatedAt: new Date().toISOString() });
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

  const filteredLinks = useMemo(() => {
    let result = [...links];
    if (activeProjectId === 'none') {
      result = result.filter(l => !l.projectId || l.projectId === 'none');
    } else if (activeProjectId !== 'all') {
      result = result.filter(l => l.projectId === activeProjectId);
    }
    if (categoryFilter !== 'Todos') {
      result = result.filter(l => l.category === categoryFilter);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [links, activeProjectId, categoryFilter]);

  return (
    <div className="relative min-h-[80vh]">
      <Header>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <Filter className="h-4 w-4 opacity-70" />
            <select
              className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer font-medium"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as PromptCategory | 'Todos')}
            >
              <option value="Todos">Todas las categorías</option>
              {promptCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2 border-l pl-4 border-border/60">
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
                    />
                    <Button className="w-full" onClick={handleCreateProject} disabled={!newProjectName.trim()}>
                      Crear Proyecto
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveProjectId('all')}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all",
                  activeProjectId === 'all' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent/50"
                )}
              >
                <div className="flex items-center"><Folders className="mr-2 h-4 w-4" />Todos</div>
                <span className="text-xs opacity-60">{prompts.length + links.length}</span>
              </button>

              <button
                onClick={() => setActiveProjectId('none')}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all",
                  activeProjectId === 'none' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent/50"
                )}
              >
                <div className="flex items-center"><Folder className="mr-2 h-4 w-4" />Sin Proyecto</div>
                <span className="text-xs opacity-60">{prompts.filter(p => !p.projectId || p.projectId === 'none').length + links.filter(l => !l.projectId || l.projectId === 'none').length}</span>
              </button>

              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setActiveProjectId(project.id)}
                  onDragOver={e => handleDragOverProject(e, project.id)}
                  onDrop={e => handleDropOnProject(project.id, e)}
                  onDragLeave={() => setDragOverProject(null)}
                  className={cn(
                    "group w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all",
                    activeProjectId === project.id ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent/50",
                    dragOverProject === project.id && "ring-2 ring-primary bg-accent/30"
                  )}
                >
                  <div className="flex items-center truncate">
                    <Folder className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">{project.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-3 w-3 text-destructive opacity-0 group-hover:opacity-100" onClick={(e) => handleDeleteProject(project.id, e)} />
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 pb-20">
          {projectsLoading || promptsLoading || linksLoading ? (
             <div className="flex flex-col items-center justify-center pt-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Cargando biblioteca...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredLinks.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-orange-600 flex items-center gap-2 px-1">
                    <LinkIcon className="h-4 w-4" /> Enlaces ({filteredLinks.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredLinks.map((link) => (
                      <LinkCard key={link.id} link={link} onDelete={handleDeleteLink} />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <PromptList
                  prompts={filteredPrompts}
                  projects={projects}
                  onDeletePrompt={(id) => {
                    const p = prompts.find(pr => pr.id === id);
                    if (p) {
                      setPromptToDelete(p);
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
              </div>
            </div>
          )}
        </main>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar prompt?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará definitivamente "{promptToDelete?.title}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (promptToDelete) {
                  deleteDocumentNonBlocking(doc(firestore, 'users', user.uid, 'prompts', promptToDelete.id));
                  setDeleteDialogOpen(false);
                  setPromptToDelete(null);
                  toast({ title: "Prompt eliminado" });
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed bottom-8 right-8 flex items-center gap-3 z-50">
        <Dialog open={isCreateLinkDialogOpen} onOpenChange={setCreateLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-16 w-16 rounded-full shadow-2xl bg-orange-500 hover:bg-orange-600" size="icon">
              <LinkIcon className="h-8 w-8 text-white" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader><DialogTitle>Nuevo Enlace</DialogTitle></DialogHeader>
            <LinkForm projects={projects} onSave={handleSaveLink} onClose={() => setCreateLinkDialogOpen(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-16 w-16 rounded-full shadow-2xl bg-primary hover:bg-primary/90" size="icon">
              <Plus className="h-8 w-8 text-primary-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader><DialogTitle>Nuevo Prompt</DialogTitle></DialogHeader>
            <PromptForm onSave={handleSave} onClose={() => setCreateDialogOpen(false)} projects={projects} />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader><DialogTitle>Editar Prompt</DialogTitle></DialogHeader>
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