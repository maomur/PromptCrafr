'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Prompt, PromptCategory, Project, Link } from '@/lib/definitions';
import { promptCategories } from '@/lib/definitions';
import Header from '@/components/header';
import PromptList from '@/components/prompt-list';
import LinkList from '@/components/link-list';
import EmptyState from '@/components/empty-state';
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
  Link as LinkIcon,
  Sparkles
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

  const projects = useMemo(() => rawProjects || [], [rawProjects]);
  const prompts = useMemo(() => rawPrompts || [], [rawPrompts]);
  const links = useMemo(() => rawLinks || [], [rawLinks]);

  // UI State
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreateLinkDialogOpen, setCreateLinkDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isEditLinkDialogOpen, setEditLinkDialogOpen] = useState(false);
  const [isNewProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLinkDeleteDialogOpen, setLinkDeleteDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<Link | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<PromptCategory | 'Todos'>('Todos');
  const [activeProjectId, setActiveProjectId] = useState<string | 'all' | 'none'>('all');

  // Business Logic
  const handleMoveToProject = useCallback((itemId: string, itemType: string, projectId: string | null) => {
    if (!firestore || !user?.uid) return;
    const collectionName = itemType === 'prompt' ? 'prompts' : 'links';
    const docRef = doc(firestore, 'users', user.uid, collectionName, itemId);
    updateDocumentNonBlocking(docRef, { projectId: projectId || null });
    toast({ title: "Recurso organizado" });
  }, [user?.uid, firestore, toast]);

  const handleSavePrompt = useCallback((promptData: any, id?: string) => {
    if (!firestore || !user?.uid) return;
    const userId = user.uid;
    const now = new Date().toISOString();
    
    if (id) {
      const docRef = doc(firestore, 'users', userId, 'prompts', id);
      updateDocumentNonBlocking(docRef, { ...promptData, updatedAt: now });
      setEditDialogOpen(false);
    } else {
      const colRef = collection(firestore, 'users', userId, 'prompts');
      const newDocRef = doc(colRef);
      const maxOrder = prompts.length > 0 ? Math.max(...prompts.map(p => p.order || 0)) : 0;
      setDocumentNonBlocking(newDocRef, {
        ...promptData,
        id: newDocRef.id,
        ownerId: userId,
        createdAt: now,
        updatedAt: now,
        order: maxOrder + 1
      });
      setCreateDialogOpen(false);
    }
    toast({ title: id ? 'Prompt actualizado' : 'Prompt creado' });
  }, [user?.uid, firestore, prompts, toast]);

  const handleSaveLink = useCallback((linkData: any, id?: string) => {
    if (!firestore || !user?.uid) return;
    const userId = user.uid;
    
    if (id) {
      const docRef = doc(firestore, 'users', userId, 'links', id);
      updateDocumentNonBlocking(docRef, linkData);
      setEditLinkDialogOpen(false);
    } else {
      const colRef = collection(firestore, 'users', userId, 'links');
      const newDocRef = doc(colRef);
      const maxOrder = links.length > 0 ? Math.max(...links.map(l => l.order || 0)) : 0;
      setDocumentNonBlocking(newDocRef, {
        ...linkData,
        id: newDocRef.id,
        ownerId: userId,
        createdAt: new Date().toISOString(),
        order: maxOrder + 1
      });
      setCreateLinkDialogOpen(false);
    }
    toast({ title: id ? 'Enlace actualizado' : 'Enlace guardado' });
  }, [user?.uid, firestore, links, toast]);

  const handleCreateProject = useCallback(() => {
    if (!newProjectName.trim() || !firestore || !user?.uid) return;
    const colRef = collection(firestore, 'users', user.uid, 'projects');
    const newDocRef = doc(colRef);
    setDocumentNonBlocking(newDocRef, {
      id: newDocRef.id,
      name: newProjectName.trim(),
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
    });
    setNewProjectName('');
    setNewProjectDialogOpen(false);
    toast({ title: "Proyecto creado" });
  }, [newProjectName, user?.uid, firestore, toast]);

  const handleDeleteProject = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firestore || !user?.uid) return;
    deleteDocumentNonBlocking(doc(firestore, 'users', user.uid, 'projects', id));
    if (activeProjectId === id) setActiveProjectId('all');
    toast({ title: "Proyecto eliminado" });
  }, [user?.uid, firestore, activeProjectId, toast]);

  // Filters & Sorting
  const filteredPrompts = useMemo(() => {
    let result = prompts.filter(p => {
      const matchesProject = activeProjectId === 'all' || 
                           (activeProjectId === 'none' && (!p.projectId || p.projectId === 'none')) ||
                           p.projectId === activeProjectId;
      const matchesCategory = categoryFilter === 'Todos' || p.category === categoryFilter;
      return matchesProject && matchesCategory;
    });
    return result.sort((a, b) => (b.order || 0) - (a.order || 0));
  }, [prompts, activeProjectId, categoryFilter]);

  const filteredLinks = useMemo(() => {
    let result = links.filter(l => {
      const matchesProject = activeProjectId === 'all' || 
                           (activeProjectId === 'none' && (!l.projectId || l.projectId === 'none')) ||
                           l.projectId === activeProjectId;
      const matchesCategory = categoryFilter === 'Todos' || l.category === categoryFilter;
      return matchesProject && matchesCategory;
    });
    return result.sort((a, b) => (b.order || 0) - (a.order || 0));
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
                <Folders className="mr-2 h-4 w-4" /> Proyectos
              </h2>
              <Dialog open={isNewProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nuevo Proyecto</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input placeholder="Nombre del proyecto..." value={newProjectName} onChange={e => setNewProjectName(e.target.value)} />
                    <Button className="w-full" onClick={handleCreateProject} disabled={!newProjectName.trim()}>Crear</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <nav className="space-y-1">
              <button onClick={() => setActiveProjectId('all')} className={cn("w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all", activeProjectId === 'all' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent/50")}>
                <div className="flex items-center"><Folders className="mr-2 h-4 w-4" />Todos</div>
                <span className="text-xs opacity-60">{prompts.length + links.length}</span>
              </button>
              <button onClick={() => setActiveProjectId('none')} className={cn("w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all", activeProjectId === 'none' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent/50")}>
                <div className="flex items-center"><Folder className="mr-2 h-4 w-4" />Sin Proyecto</div>
                <span className="text-xs opacity-60">{prompts.filter(p => !p.projectId || p.projectId === 'none').length + links.filter(l => !l.projectId || l.projectId === 'none').length}</span>
              </button>
              {projects.map((p) => (
                <button key={p.id} onClick={() => setActiveProjectId(p.id)} className={cn("group w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all", activeProjectId === p.id ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent/50")}>
                  <div className="flex items-center truncate"><Folder className="mr-2 h-4 w-4 shrink-0" /><span className="truncate">{p.name}</span></div>
                  <Trash2 className="h-3 w-3 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDeleteProject(p.id, e)} />
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 pb-20">
          {projectsLoading || promptsLoading || linksLoading ? (
             <div className="flex flex-col items-center justify-center pt-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredLinks.length === 0 && filteredPrompts.length === 0 ? <EmptyState /> : (
                <>
                  {filteredLinks.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-orange-600 flex items-center gap-2 px-1">
                        <LinkIcon className="h-4 w-4" /> Enlaces ({filteredLinks.length})
                      </h3>
                      <LinkList 
                        links={filteredLinks} projects={projects}
                        onDeleteLink={(id) => { const l = links.find(li => li.id === id); if (l) { setLinkToDelete(l); setLinkDeleteDialogOpen(true); } }} 
                        onEditLink={(link) => { setSelectedLink(link); setEditLinkDialogOpen(true); }}
                        onReorder={() => {}} // Reordering disabled for this view for stability
                        onMoveToProject={(linkId, projectId) => handleMoveToProject(linkId, 'link', projectId)}
                      />
                    </div>
                  )}
                  {filteredPrompts.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2 px-1">
                        <Sparkles className="h-4 w-4" /> Prompts ({filteredPrompts.length})
                      </h3>
                      <PromptList
                        prompts={filteredPrompts} projects={projects}
                        onDeletePrompt={(id) => { const p = prompts.find(pr => pr.id === id); if (p) { setPromptToDelete(p); setDeleteDialogOpen(true); } }}
                        onEditPrompt={(prompt) => { setSelectedPrompt(prompt); setEditDialogOpen(true); }}
                        onReorder={() => {}} // Reordering disabled for stability
                        onMoveToProject={(promptId, projectId) => handleMoveToProject(promptId, 'prompt', projectId)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Floating Actions */}
      <div className="fixed bottom-8 right-8 flex items-center gap-3 z-50">
        <Dialog open={isCreateLinkDialogOpen} onOpenChange={setCreateLinkDialogOpen}>
          <DialogTrigger asChild><Button className="h-16 w-16 rounded-full shadow-2xl bg-orange-500 hover:bg-orange-600" size="icon"><LinkIcon className="h-8 w-8 text-white" /></Button></DialogTrigger>
          <DialogContent className="sm:max-w-[525px]"><DialogHeader><DialogTitle>Nuevo Enlace</DialogTitle></DialogHeader><LinkForm projects={projects} onSave={handleSaveLink} onClose={() => setCreateLinkDialogOpen(false)} /></DialogContent>
        </Dialog>
        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild><Button className="h-16 w-16 rounded-full shadow-2xl bg-primary hover:bg-primary/90" size="icon"><Plus className="h-8 w-8 text-primary-foreground" /></Button></DialogTrigger>
          <DialogContent className="sm:max-w-[625px]"><DialogHeader><DialogTitle>Nuevo Prompt</DialogTitle></DialogHeader><PromptForm onSave={handleSavePrompt} onClose={() => setCreateDialogOpen(false)} projects={projects} /></DialogContent>
        </Dialog>
      </div>

      {/* Shared Dialogs */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader><DialogTitle>Editar Prompt</DialogTitle></DialogHeader>
          {selectedPrompt && <PromptForm prompt={selectedPrompt} projects={projects} onSave={handleSavePrompt} onClose={() => setEditDialogOpen(false)} />}
        </DialogContent>
      </Dialog>
      <Dialog open={isEditLinkDialogOpen} onOpenChange={setEditLinkDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader><DialogTitle>Editar Enlace</DialogTitle></DialogHeader>
          {selectedLink && <LinkForm link={selectedLink} projects={projects} onSave={handleSaveLink} onClose={() => setEditLinkDialogOpen(false)} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Eliminar prompt?</AlertDialogTitle><AlertDialogDescription>Se eliminará definitivamente "{promptToDelete?.title}".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive" onClick={() => { if (promptToDelete) deleteDocumentNonBlocking(doc(firestore, 'users', user.uid, 'prompts', promptToDelete.id)); setDeleteDialogOpen(false); }}>Eliminar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isLinkDeleteDialogOpen} onOpenChange={setLinkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Eliminar enlace?</AlertDialogTitle><AlertDialogDescription>Se eliminará definitivamente "{linkToDelete?.title || linkToDelete?.url}".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive" onClick={() => { if (linkToDelete) deleteDocumentNonBlocking(doc(firestore, 'users', user.uid, 'links', linkToDelete.id)); setLinkDeleteDialogOpen(false); }}>Eliminar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}