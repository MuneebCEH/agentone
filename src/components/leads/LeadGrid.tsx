'use client'

import { useState, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
    ColDef,
    ModuleRegistry,
    ClientSideRowModelModule,
    ValidationModule,
    TextEditorModule,
    DateEditorModule,
    SelectEditorModule,
    NumberEditorModule,
    TextFilterModule,
    NumberFilterModule,
    DateFilterModule,
    ExternalFilterModule,
    QuickFilterModule,
    GridApi,
    GridReadyEvent,
    ICellRendererParams,
    CellValueChangedEvent
} from 'ag-grid-community';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Trash2, Phone } from 'lucide-react';
import { User, Lead } from '@/types';
import DialerPopup from '@/components/dialer/DialerPopup';

import 'ag-grid-community/styles/ag-theme-quartz.css';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ValidationModule,
    TextEditorModule,
    DateEditorModule,
    SelectEditorModule,
    NumberEditorModule,
    TextFilterModule,
    NumberFilterModule,
    DateFilterModule,
    ExternalFilterModule,
    QuickFilterModule
]);

export default function LeadGrid({ user, filters, projectId }: { user: User; filters?: { search?: string; status?: string;[key: string]: any }; projectId?: string }) {
    const queryClient = useQueryClient();
    const [gridApi, setGridApi] = useState<GridApi | null>(null);

    // Fetch Leads
    const { data: leads, isLoading } = useQuery<Lead[]>({
        queryKey: ['leads', projectId],
        queryFn: async () => {
            const url = projectId ? `/api/leads?projectId=${projectId}` : '/api/leads';
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch leads');
            return res.json();
        }
    });

    // Apply external filters when filters prop changes
    useEffect(() => {
        if (!gridApi || !filters) return;

        // 1. Apply Quick Filter (Search)
        gridApi.setGridOption('quickFilterText', filters.search);

        // 2. Apply Status Filter
        if (filters.status === 'All Statuses') {
            gridApi.setColumnFilterModel('status', null);
        } else {
            gridApi.setColumnFilterModel('status', {
                filterType: 'text',
                type: 'equals',
                filter: filters.status
            });
        }

        // 3. Grid Filter Refresh
        gridApi.onFilterChanged();
    }, [filters, gridApi]);

    const onGridReady = (params: GridReadyEvent) => {
        setGridApi(params.api);
    };

    // Update Mutation
    const updateLeadMutation = useMutation({
        mutationFn: async (data: { id: string; changes: Partial<Lead> }) => {
            const res = await fetch(`/api/leads/${data.id}`, {
                method: 'PATCH',
                body: JSON.stringify(data.changes),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.details || 'Failed to update');
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success('Lead updated');
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update lead');
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        }
    });

    // Delete Mutation
    const deleteLeadMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Lead deleted');
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        },
        onError: () => toast.error('Failed to delete lead')
    });

    const DeleteButtonRenderer = (props: ICellRendererParams) => {
        const canDelete = user.role === 'SUPER_ADMIN' || (user.permissions && user.permissions.includes('delete_leads'));
        if (!canDelete) return null;

        return (
            <button
                onClick={() => {
                    if (confirm('Are you sure you want to delete this lead?')) {
                        deleteLeadMutation.mutate(props.data.id);
                    }
                }}
                className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
            >
                <Trash2 className="w-3 h-3" />
                Delete
            </button>
        );
    };

    // Fetch Agents for dropdown
    const { data: agents } = useQuery<User[]>({
        queryKey: ['agents'],
        queryFn: async () => {
            const res = await fetch('/api/users');
            if (!res.ok) return [];
            const data = await res.json();
            return data.filter((u: any) => u.role === 'AGENT');
        }
    });

    // State for Dialer Popup
    const [dialerOpen, setDialerOpen] = useState(false);
    const [currentDialNumber, setCurrentDialNumber] = useState('');

    const handlePhoneClick = (phone: string) => {
        if (!phone) return;
        setCurrentDialNumber(phone);
        setDialerOpen(true);
    };

    const PhoneCellRenderer = (params: ICellRendererParams) => {
        if (!params.value) return null;
        return (
            <div
                onClick={() => handlePhoneClick(params.value)}
                className="cursor-pointer hover:text-blue-500 hover:underline flex items-center gap-2 group"
                title="Click to dial"
            >
                <span>{params.value}</span>
                <Phone className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
            </div>
        );
    };

    // All possible statuses
    const statuses = [
        'Not Interested',
        'Follow-Up',
        'In QC',
        'Not Qualified',
        'Qualified',
        'Scheduled',
        'Meeting Complete',
        'Meeting Rescheduled',
        'Proposal Sent',
        'Client Follow-Up',
        'Sales Complete',
        'VM1',
        'VM2',
        'VM3',
        'VM4',
        'VM5'
    ];

    // Column Definitions - Traditional Excel Style
    const [colDefs, setColDefs] = useState<ColDef[]>([]);

    useEffect(() => {
        if (!agents) return;

        const defs: ColDef[] = [
            {
                headerName: 'Actions',
                width: 80,
                pinned: 'left',
                cellRenderer: DeleteButtonRenderer,
                editable: false,
                filter: false
            },
            {
                field: 'createdAt',
                headerName: 'Date',
                width: 120,
                pinned: 'left',
                editable: false,
                filter: 'agDateColumnFilter',
                valueFormatter: (params) => {
                    if (!params.value) return '';
                    return new Date(params.value).toLocaleDateString();
                }
            },
            {
                field: 'assignedAgentId',
                headerName: 'Agent',
                width: 150,
                editable: true,
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: {
                    values: agents.map(a => a.id),
                    formatValue: (id: string) => agents.find(a => a.id === id)?.name || 'Unassigned'
                },
                filter: 'agTextColumnFilter',
                valueFormatter: (params) => {
                    return agents.find(a => a.id === params.value)?.name || params.data?.assignedAgent?.name || 'Unassigned';
                }
            },
            {
                field: 'name',
                headerName: 'Prospect Name',
                width: 180,
                editable: user.role !== 'AGENT',
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#f1f5f9' }
            },
            {
                field: 'company',
                headerName: 'Company Name',
                width: 180,
                editable: user.role !== 'AGENT',
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#f1f5f9' }
            },
            {
                field: 'title',
                headerName: 'Title',
                width: 150,
                editable: user.role !== 'AGENT',
                filter: 'agTextColumnFilter'
            },
            {
                field: 'industry',
                headerName: 'Industry',
                width: 150,
                editable: user.role !== 'AGENT',
                filter: 'agTextColumnFilter'
            },
            {
                field: 'revenue',
                headerName: 'Revenue Size',
                width: 150,
                editable: user.role !== 'AGENT',
                filter: 'agTextColumnFilter'
            },
            {
                field: 'employees',
                headerName: 'Employee Size',
                width: 150,
                editable: user.role !== 'AGENT',
                filter: 'agTextColumnFilter'
            },
            {
                field: 'mobile',
                headerName: 'Mobile Number',
                width: 160,
                editable: user.role !== 'AGENT',
                filter: 'agTextColumnFilter',
                cellRenderer: PhoneCellRenderer
            },
            {
                field: 'phone',
                headerName: 'Direct Number',
                width: 160,
                editable: user.role !== 'AGENT',
                filter: 'agTextColumnFilter',
                cellRenderer: PhoneCellRenderer
            },
            {
                field: 'corporatePhone',
                headerName: 'Corporate Number',
                width: 160,
                editable: user.role !== 'AGENT',
                filter: 'agTextColumnFilter',
                cellRenderer: PhoneCellRenderer
            },
            {
                field: 'email',
                headerName: 'Email Address',
                width: 200,
                editable: user.role !== 'AGENT',
                filter: 'agTextColumnFilter'
            },
            {
                field: 'state',
                headerName: 'State',
                width: 120,
                editable: user.role !== 'AGENT',
                filter: 'agTextColumnFilter'
            },
            {
                field: 'status',
                headerName: 'Status',
                width: 180,
                editable: true,
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: { values: statuses },
                filter: 'agTextColumnFilter',
                cellStyle: (params) => {
                    const status = params.value;
                    if (status === 'Not Interested' || status === 'Not Qualified') {
                        return { backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 'bold' };
                    } else if (status === 'Sales Complete' || status === 'Qualified') {
                        return { backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 'bold' };
                    } else if (status === 'In QC' || status === 'Follow-Up' || status === 'Client Follow-Up') {
                        return { backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 'bold' };
                    } else {
                        return { backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 'bold' };
                    }
                }
            },
            {
                field: 'nextFollowUp',
                headerName: 'Meeting Date & Time',
                width: 180,
                editable: true,
                filter: 'agDateColumnFilter',
                cellEditor: 'agDateCellEditor',
                valueFormatter: (params) => {
                    if (!params.value) return '';
                    const date = new Date(params.value);
                    return date.toLocaleString();
                }
            },
            {
                field: 'notes',
                headerName: 'Call Notes',
                width: 250,
                editable: true,
                filter: 'agTextColumnFilter',
                cellEditor: 'agLargeTextCellEditor',
                cellEditorParams: { maxLength: 500, rows: 5, cols: 50 }
            },
            {
                field: 'linkedin',
                headerName: 'LinkedIn',
                width: 180,
                editable: user.role !== 'AGENT',
                filter: 'agTextColumnFilter',
                cellRenderer: (params: ICellRendererParams) => {
                    if (params.value && params.value.startsWith('http')) {
                        return <a href={params.value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Link</a>;
                    }
                    return params.value;
                }
            },
            {
                field: 'website',
                headerName: 'Website',
                width: 180,
                editable: user.role !== 'AGENT',
                filter: 'agTextColumnFilter',
                cellRenderer: (params: ICellRendererParams) => {
                    if (params.value && params.value.startsWith('http')) {
                        return <a href={params.value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Link</a>;
                    }
                    return params.value;
                }
            }
        ];
        setColDefs(defs);
    }, [agents, user.role]);

    const onCellValueChanged = useCallback((params: CellValueChangedEvent) => {
        if (params.oldValue === params.newValue) return;
        if (!params.colDef.field) return;

        // Agent restrictions
        if (user.role === 'AGENT') {
            const lockedStatuses = ['Sales Complete', 'Not Qualified'];
            if (params.data.status && lockedStatuses.includes(params.data.status)) {
                toast.error('This lead is locked. Only Admins can edit.');
                params.api.undoCellEditing();
                return;
            }

            if (params.colDef.field === 'status') {
                const allowedStatuses = ['Not Interested', 'Follow-Up', 'In QC', 'Meeting Rescheduled', 'Scheduled', 'Meeting Complete', 'Client Follow-Up', 'VM1', 'VM2', 'VM3', 'VM4', 'VM5'];
                if (!allowedStatuses.includes(params.newValue)) {
                    toast.error(`You cannot set status to ${params.newValue}. Only Admins can.`);
                    params.api.undoCellEditing();
                    return;
                }
            }
        }

        updateLeadMutation.mutate({
            id: params.data.id,
            changes: { [params.colDef.field]: params.newValue }
        });
    }, [updateLeadMutation, user.role]);

    if (isLoading) return (
        <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
    );

    return (
        <div className="ag-theme-quartz-dark h-full">
            <AgGridReact
                rowData={leads}
                columnDefs={colDefs}
                onGridReady={onGridReady}
                onCellValueChanged={onCellValueChanged}
                defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                    floatingFilter: false
                }}
                rowSelection={undefined}
                cellSelection={false}
                suppressRowClickSelection={true}
                suppressCellFocus={false}
                suppressCopyRowsToClipboard={true}
                suppressCopySingleCellRanges={true}
                suppressMultiRangeSelection={true}
                suppressExcelExport={true}
                suppressCsvExport={true}
                animateRows={true}
                enableCellTextSelection={false}
                enableRangeSelection={false}
                ensureDomOrder={true}
            />
            <DialerPopup
                isOpen={dialerOpen}
                onClose={() => setDialerOpen(false)}
                initialNumber={currentDialNumber}
            />
        </div>
    );
}
