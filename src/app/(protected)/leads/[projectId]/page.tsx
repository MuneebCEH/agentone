'use client'

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import LeadGrid from '@/components/leads/LeadGrid';
import { User } from '@/types';
import { Loader2, Upload, Plus, RefreshCw, Filter, Users, Trash2, X, Search, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ProjectLeadsPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: 'All Statuses',
        category: 'All Categories',
        created: 'Any time'
    });

    const [newLead, setNewLead] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        status: 'Not Interested',
        assignedAgentId: ''
    });
    const [agents, setAgents] = useState<any[]>([]);

    useEffect(() => {
        // Fetch User and Project info
        const fetchData = async () => {
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

                const projects = await projectsRes.json();
                const currentProject = projects.find((p: any) => p.id === projectId);
                setProject(currentProject);

                // Fetch agents for project assignment if admin
                if (userData.user.role === 'SUPER_ADMIN' || userData.user.role === 'ADMIN') {
                    const agentsRes = await fetch('/api/users');
                    if (agentsRes.ok) {
                        const allUsers = await agentsRes.json();
                        setAgents(allUsers.filter((u: any) => u.role === 'AGENT'));
                    }
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };
        fetchData();
    }, [projectId, router]);

    const handleRefresh = () => {
        window.location.reload();
    };



    const handleImport = () => {
        document.getElementById('csv-upload')?.click();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const Papa = (await import('papaparse')).default;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const rawData = results.data;
                    if (rawData.length === 0) {
                        toast.error('CSV file is empty');
                        return;
                    }

                    // Map columns
                    const mappedLeads = rawData.map((row: any) => {
                        const newRow: any = {};

                        // Helper to find value case-insensitively
                        const findVal = (keys: string[]) => {
                            for (const key of keys) {
                                const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase().trim());
                                if (foundKey) return row[foundKey];
                            }
                            return undefined;
                        };

                        newRow.name = findVal(['name', 'prospect name', 'full name']) || 'Unknown';
                        newRow.company = findVal(['company', 'company name']);
                        newRow.email = findVal(['email', 'email address']);
                        newRow.phone = findVal(['phone', 'direct number', 'phone number']);
                        newRow.mobile = findVal(['mobile', 'mobile number']);
                        newRow.title = findVal(['title', 'job title']);
                        newRow.industry = findVal(['industry']);
                        newRow.revenue = findVal(['revenue', 'revenue size', 'annual revenue']);
                        newRow.employees = findVal(['employees', 'employee size', 'company size']);
                        newRow.state = findVal(['state', 'location']);
                        newRow.linkedin = findVal(['linkedin', 'linkedin url']);
                        newRow.website = findVal(['website', 'company website']);
                        newRow.notes = findVal(['notes', 'call notes', 'description']);
                        newRow.status = findVal(['status']) || 'Not Interested';

                        return newRow;
                    });

                    // Send to API
                    const toastId = toast.loading(`Importing ${mappedLeads.length} leads...`);

                    const res = await fetch('/api/leads/import', {
                        method: 'POST',
                        body: JSON.stringify({ leads: mappedLeads, projectId }),
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (!res.ok) throw new Error('Import failed');

                    const data = await res.json();
                    toast.dismiss(toastId);
                    toast.success(`Successfully imported ${data.count} leads`);

                    // Reset input
                    event.target.value = '';

                    // Refresh
                    window.location.reload();

                } catch (error) {
                    toast.error('Failed to import leads');
                    console.error(error);
                }
            },
            error: (error) => {
                toast.error('Error parsing CSV');
                console.error(error);
            }
        });
    };

    const handleAddLead = async () => {
        if (!newLead.name) {
            toast.error('Lead name is required');
            return;
        }

        try {
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newLead, projectId })
            });

            if (res.ok) {
                toast.success('Lead added successfully!');
                setShowAddModal(false);
                setNewLead({ name: '', company: '', email: '', phone: '', status: 'Not Interested', assignedAgentId: '' });
                // We can invalidate query instead of reload if using react-query properly
                // Since LeadGrid uses react-query, we might need a way to trigger refetch
                window.location.reload();
            } else {
                toast.error('Failed to add lead');
            }
        } catch (error) {
            toast.error('Error adding lead');
        }
    };

    const handleDeleteSelected = () => {
        alert('Delete Selected functionality coming soon!');
    };

    const handleBulkAssign = () => {
        alert('Bulk Assign functionality coming soon!');
    };

    const handleShowFilters = () => {
        setShowFilters(!showFilters);
    };

    const applyFilters = () => {
        toast.info('Filters applied');
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            status: 'All Statuses',
            category: 'All Categories',
            created: 'Any time'
        });
        toast.info('Filters cleared');
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!user || !project) return null;

    return (
        <div className="h-full flex flex-col bg-slate-900 overflow-hidden">
            {/* Header Toolbar */}
            <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/leads" className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
                            <ChevronLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                                <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs font-medium rounded border border-blue-600/30">Project</span>
                            </div>
                            <p className="text-sm text-slate-400 mt-1">{project.description || 'Project leads and management'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {(user?.role === 'SUPER_ADMIN' || user?.permissions?.includes('delete_leads')) && (
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Selected
                            </button>
                        )}
                        <button
                            onClick={handleBulkAssign}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                        >
                            <Users className="w-4 h-4" />
                            Bulk Assign
                        </button>
                        <button
                            onClick={handleShowFilters}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${showFilters ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                        >
                            <Filter className="w-4 h-4" />
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                        <button
                            onClick={handleImport}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                        >
                            <Upload className="w-4 h-4" />
                            Import CSV
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Lead
                        </button>
                    </div>
                    <input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileUpload}
                        title="Upload CSV"
                    />
                </div>
            </div>

            {/* Filter Section */}
            {showFilters && (
                <div className="bg-slate-800 border-b border-slate-700 p-6 animate-in slide-in-from-top duration-300">
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-8">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Search Leads</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Search by name, company, or phone..."
                                />
                            </div>
                        </div>
                        <div className="col-span-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option>All Statuses</option>
                                <option>Not Interested</option>
                                <option>Follow-Up</option>
                                <option>In QC</option>
                                <option>Qualified</option>
                                <option>Scheduled</option>
                                <option>Sales Complete</option>
                            </select>
                        </div>
                        <div className="col-span-4 flex items-end justify-end gap-3 mt-4">
                            <button onClick={applyFilters} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">Apply Filters</button>
                            <button onClick={clearFilters} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">Clear All</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className="flex-1 overflow-hidden">
                <LeadGrid user={user} filters={filters} projectId={projectId} />
            </div>

            {/* Add Lead Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-xl p-6 w-[500px] border border-slate-700 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Add New Lead to {project.name}</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Lead Name *</label>
                                <input type="text" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter lead name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Company</label>
                                <input type="text" value={newLead.company} onChange={(e) => setNewLead({ ...newLead, company: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter company" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                                    <input type="email" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Email" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                                    <input type="tel" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Phone" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Initial Status</label>
                                <select value={newLead.status} onChange={(e) => setNewLead({ ...newLead, status: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="Not Interested">Not Interested</option>
                                    <option value="Follow-Up">Follow-Up</option>
                                    <option value="In QC">In QC</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Scheduled">Scheduled</option>
                                </select>
                            </div>
                            {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Assign Agent</label>
                                    <select
                                        value={newLead.assignedAgentId}
                                        onChange={(e) => setNewLead({ ...newLead, assignedAgentId: e.target.value })}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Select Agent (Optional)</option>
                                        {agents.map(agent => (
                                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={handleAddLead} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-colors">Create Lead</button>
                            <button onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-semibold transition-colors">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
