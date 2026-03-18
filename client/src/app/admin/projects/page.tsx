'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { ProjectInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { ProjectForm } from '@/components/projects/project-form';
import { TableSkeleton } from '@/components/ui/table-skeleton';

interface Project extends ProjectInput {
    id: number;
    createdAt: string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const res = await api.get('/projects?limit=100');
            if (res.data.success) {
                setProjects(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to load portfolio projects', { description: (error as Error).message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you absolutely sure you want to delete this project?')) return;

        try {
            setDeletingId(id);
            const res = await api.delete(`/projects/${id}`);
            if (res.data.success) {
                toast.success('Project deleted successfully.');
                fetchProjects();
            } else {
                toast.error('Delete failed', { description: res.data.message });
            }
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unknown error';
            toast.error('Delete failed', { description: message });
        } finally {
            setDeletingId(null);
        }
    };

    const handleOpenForm = (proj?: Project) => {
        setSelectedProject(proj);
        setIsSheetOpen(true);
    };

    const handleFormSuccess = () => {
        setIsSheetOpen(false);
        fetchProjects();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Portfolio</h1>
                    <p className="text-muted-foreground font-medium">Showcase agency projects, tech stacks, and case studies.</p>
                </div>
                <Button
                    onClick={() => handleOpenForm()}
                    className="rounded-none font-bold uppercase tracking-widest border-2 border-transparent hover:border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Project
                </Button>
            </div>

            <div className="border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <Table>
                    <TableHeader className="bg-muted/30 border-b-2 border-foreground">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-bold text-black uppercase tracking-wider w-16">Cover</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Project Title</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Category</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Tech Stack</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableSkeleton columns={5} rows={5} />
                        ) : projects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 font-bold text-muted-foreground">NO PROJECTS FOUND IN PORTFOLIO</TableCell>
                            </TableRow>
                        ) : (
                            projects.map((proj) => (
                                <TableRow key={proj.id} className="border-b-2 border-foreground/10 hover:bg-muted/30 transition-none">
                                    <TableCell>
                                        <div className="w-12 h-12 bg-muted/50 border-2 border-foreground overflow-hidden flex items-center justify-center text-center">
                                            {proj.thumbnailUrl ? (
                                                <img src={proj.thumbnailUrl} alt={proj.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[8px] font-black uppercase leading-tight">No</span>
                                                    <span className="text-[8px] font-black uppercase leading-tight">Img</span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold">{proj.title}</div>
                                        <div className="text-xs text-muted-foreground">{proj.slug}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase border-2 border-foreground bg-muted/30">
                                            {proj.category}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                            {(proj.techStack as string[] || []).slice(0, 3).map((tech, idx) => (
                                                <span key={idx} className="px-1.5 py-0.5 text-[10px] bg-foreground text-background font-mono">
                                                    {tech}
                                                </span>
                                            ))}
                                            {(proj.techStack as string[] || []).length > 3 && (
                                                <span className="px-1.5 py-0.5 text-[10px] border border-foreground font-mono">
                                                    +{(proj.techStack as string[] || []).length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {(proj as any).link && (
                                                <Button variant="outline" size="icon" asChild className="rounded-none border-2 border-foreground hover:bg-foreground hover:text-background transition-none h-8 w-8">
                                                    <a href={(proj as any).link} target="_blank" rel="noreferrer">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            )}
                                            <Button variant="outline" size="icon" onClick={() => handleOpenForm(proj)} className="rounded-none border-2 border-foreground hover:bg-foreground hover:text-background transition-none h-8 w-8">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                onClick={() => handleDelete(proj.id)} 
                                                disabled={deletingId === proj.id}
                                                className="rounded-none border-2 border-foreground hover:bg-red-600 hover:text-white transition-none h-8 w-8 disabled:opacity-50"
                                            >
                                                {deletingId === proj.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Form Side Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] md:w-[600px] border-l-2 border-foreground p-0 overflow-y-auto bg-background">
                    <div className="p-6 border-b-2 border-foreground bg-muted/30">
                        <SheetHeader>
                            <SheetTitle className="text-2xl font-black uppercase tracking-tight">
                                {selectedProject ? 'Edit Case Study' : 'Publish Project'}
                            </SheetTitle>
                            <SheetDescription className="font-medium text-foreground/70">
                                Detailed case study for public portfolio views.
                            </SheetDescription>
                        </SheetHeader>
                    </div>
                    <div className="p-6">
                        {isSheetOpen && (
                            <ProjectForm
                                initialData={selectedProject}
                                onSuccess={handleFormSuccess}
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
