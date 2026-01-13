'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { Loader2, Plus, Folder, Trash2, X, LayoutGrid, Calendar, ChevronRight, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LeadsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '', assignedAgentId: '' });
    const [agents, setAgents] = useState<any[]>([]);

    useEffect(() => {
        const init = async () => {
            try {
                const [userRes, projectsRes] = await Promise.all([
                    fetch('/api/auth/me'),
                    fetch('/api/projects')
                ]);

                if (userRes.status === 401) {
                    router.push('/login');
                    return;
                }

                const userData = await userRes.json();
                setUser(userData.user);

                const projectsData = await projectsRes.json();
                setProjects(Array.isArray(projectsData) ? projectsData : []);

                // Fetch agents if user is admin
                if (userData.user.role === 'SUPER_ADMIN' || userData.user.role === 'ADMIN') {
                    const agentsRes = await fetch('/api/users');
                    if (agentsRes.ok) {
                        const allUsers = await agentsRes.json();
                        setAgents(allUsers.filter((u: any) => u.role === 'AGENT'));
                    }
                }

                setLoading(false);
            } catch (error) {
                console.error('Initialization error:', error);
                setLoading(false);
            }
        };
        init();
    }, [router]);

    const handleAddProject = async () => {
        if (!newProject.name) {
            toast.error('Project name is required');
            return;
        }

        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProject)
            });

            if (res.ok) {
                const project = await res.json();

                // If we assigned an agent, we need to locally update the project to include that structure for immediate display if needed
                // But the simple refresh or append is fine.
                // However, our get returns 'assignedUsers' array, POST might return it or not depending on include.
                // Let's refetch or just manually patch it for UI consistency if critical.
                // Re-fetching all projects is safest but overkill. appending is faster. 
                // Let's assume the server response includes what we need or we reload list.
                // Actually server response for create usually doesn't include relations unless specified.
                // Let's just reload page or fetch projects again to be safe and consistent.

                const projectsRes = await fetch('/api/projects');
                const projectsData = await projectsRes.json();
                setProjects(Array.isArray(projectsData) ? projectsData : []);

                toast.success('Project created successfully!');
                setShowAddModalUnset();
            } else {
                toast.error('Failed to create project');
            }
        } catch (error) {
            toast.error('Error creating project');
        }
    };

    const setShowAddModalUnset = () => {
        setShowAddModal(false);
        setNewProject({ name: '', description: '', assignedAgentId: '' });
    };

    const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Are you sure? This will delete all leads inside this project.')) return;

        try {
            const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setProjects(projects.filter(p => p.id !== id));
                toast.success('Project deleted');
            } else {
                toast.error('Failed to delete project');
            }
        } catch (error) {
            toast.error('Error deleting project');
        }
    };

    const handleUpdateProjectAgents = async (projectId: string, newAgentIds: string[]) => {
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignedAgentIds: newAgentIds })
            });

            if (res.ok) {
                // Update local state
                const selectedAgents = agents.filter(a => newAgentIds.includes(a.id));

                setProjects(projects.map(p => {
                    if (p.id === projectId) {
                        return {
                            ...p,
                            assignedUsers: selectedAgents.map(a => ({ id: a.id, name: a.name }))
                        };
                    }
                    return p;
                }));

                toast.success('Agents updated');
            } else {
                toast.error('Failed to update agents');
            }
        } catch (error) {
            toast.error('Error updating agents');
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-slate-400 animate-pulse">Loading workspace...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="h-full flex flex-col bg-slate-900 overflow-y-auto">
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700 px-8 py-6 sticky top-0 z-10">
                <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <LayoutGrid className="w-8 h-8 text-blue-500" />
                            Projects
                        </h1>
                        <p className="text-slate-400 mt-1">Select a project to manage its leads</p>
                    </div>
                    {/* Only Admins should create projects? User requirement is vague but implies "we" (admins) assign. */}
                    {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-green-900/20 active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            New Project
                        </button>
                    )}
                </div>
            </div>

            {/* Projects Grid */}
            <div className="flex-1 p-8">
                <div className="max-w-7xl mx-auto">
                    {projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-700">
                            <Folder className="w-16 h-16 text-slate-600 mb-4" />
                            <h2 className="text-xl font-semibold text-white">No projects found</h2>
                            <p className="text-slate-400 mt-2 mb-8">
                                {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') ? 'Create your first project to start managing leads' : 'You have not been assigned any projects yet.'}
                            </p>
                            {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all"
                                >
                                    Get Started
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    className="group relative bg-slate-800 border border-slate-700 rounded-2xl p-6 transition-all hover:bg-slate-750 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/20 flex flex-col h-full"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-blue-600/10 text-blue-500 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <Folder className="w-6 h-6" />
                                        </div>
                                        <div
                                            className="flex items-center gap-2"
                                            onClick={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                        >
                                            {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                                                <>
                                                    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-y-auto h-24 scrollbar-thin scrollbar-thumb-slate-600">
                                                        {agents.map((agent) => {
                                                            const isAssigned = project.assignedUsers?.some((u: any) => u.id === agent.id);
                                                            return (
                                                                <div
                                                                    key={agent.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const currentIds = project.assignedUsers?.map((u: any) => u.id) || [];
                                                                        let newIds;
                                                                        if (isAssigned) {
                                                                            newIds = currentIds.filter((id: string) => id !== agent.id);
                                                                        } else {
                                                                            newIds = [...currentIds, agent.id];
                                                                        }
                                                                        handleUpdateProjectAgents(project.id, newIds);
                                                                    }}
                                                                    className={`px-3 py-1.5 text-xs cursor-pointer border-b border-slate-800 last:border-0 hover:bg-slate-800 transition-colors flex items-center justify-between ${isAssigned ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400'}`}
                                                                >
                                                                    <span>{agent.name}</span>
                                                                    {isAssigned && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleDeleteProject(e, project.id)}
                                                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 transition-colors">
                                        {project.name}
                                    </h3>

                                    <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-1">
                                        {project.description || 'No description provided for this project.'}
                                    </p>

                                    {/* Assigned Agent Display */}
                                    {project.assignedUsers && project.assignedUsers.length > 0 && (
                                        <div className="mb-4 flex items-center gap-2 text-sm text-slate-400 bg-slate-900/50 p-2 rounded-lg">
                                            <UserCircle className="w-4 h-4 text-blue-400" />
                                            <span>Assigned to: <span className="text-white font-medium">
                                                {project.assignedUsers.length === 1
                                                    ? project.assignedUsers[0].name
                                                    : `${project.assignedUsers.length} Agents`}
                                            </span></span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 mt-auto">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(project.createdAt).toLocaleDateString()}
                                        </div>
                                        <Link
                                            href={`/leads/${project.id}`}
                                            className="flex items-center gap-1 text-blue-500 font-bold text-sm hover:text-blue-400 transition-all hover:translate-x-1"
                                        >
                                            Open Grid
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Project Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-3xl p-8 w-full max-w-md border border-slate-700 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Create Project</h2>
                                <p className="text-slate-400 text-sm mt-1">Add a new workspace to group leads</p>
                            </div>
                            <button
                                onClick={setShowAddModalUnset}
                                className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">Project Name</label>
                                <input
                                    type="text"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                                    placeholder="e.g., My New Project"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">Assign to Agent (Optional)</label>
                                <select
                                    multiple
                                    value={Array.isArray(newProject.assignedAgentId) ? newProject.assignedAgentId : (newProject.assignedAgentId ? [newProject.assignedAgentId] : [])}
                                    onChange={(e) => {
                                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                                        setNewProject({ ...newProject, assignedAgentId: selected as any });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 scrollbar-thin scrollbar-thumb-slate-700"
                                >
                                    {agents.map((agent) => (
                                        <option key={agent.id} value={agent.id}>
                                            {agent.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2 ml-1">Description (Optional)</label>
                                <textarea
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600 min-h-[100px]"
                                    placeholder="What is this project about?"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={handleAddProject}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                            >
                                Create Project
                            </button>
                            <button
                                onClick={setShowAddModalUnset}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
