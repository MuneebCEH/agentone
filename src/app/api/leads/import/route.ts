import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prismadb";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { leads, projectId } = body;

        if (!Array.isArray(leads) || leads.length === 0) {
            return new NextResponse("No leads provided", { status: 400 });
        }
        if (!projectId) {
            return new NextResponse("Project ID is required", { status: 400 });
        }

        // Get Workspace ID (Fallback to default if not present, similar to single create)
        let workspaceId = session.workspaceId;
        if (!workspaceId) {
            const defaultWorkspace = await prismadb.workspace.findFirst({ where: { name: 'Default Workspace' } });
            if (defaultWorkspace) workspaceId = defaultWorkspace.id;
            else {
                const newWs = await prismadb.workspace.create({ data: { name: 'Default Workspace' } });
                workspaceId = newWs.id;
            }
        }

        // Prepare data
        // Filter out keys that don't exist in Prisma schema or handle conversion
        const validFields = [
            'name', 'email', 'phone', 'company', 'title', 'industry', 'revenue',
            'employees', 'mobile', 'corporatePhone', 'state', 'website', 'linkedin',
            'notes', 'status', 'dealValue', 'nextFollowUp', 'source', 'assignedAgentId'
        ];

        const leadsToCreate = leads.map((lead: any) => {
            const cleanLead: any = {
                projectId,
                workspaceId,
                source: 'CSV Import',
                status: lead.status || 'Not Interested', // Default
            };

            // Copy valid fields
            validFields.forEach(field => {
                if (lead[field] !== undefined && lead[field] !== null && lead[field] !== '') {
                    if (field === 'dealValue') cleanLead[field] = Number(lead[field]) || 0;
                    else if (field === 'nextFollowUp') cleanLead[field] = new Date(lead[field]);
                    else cleanLead[field] = String(lead[field]);
                }
            });

            // Auto-assign if Agent importing
            if (session.role === 'AGENT') {
                cleanLead.assignedAgentId = session.id;
            }

            return cleanLead;
        });

        const created = await prismadb.lead.createMany({
            data: leadsToCreate
        });

        // Log activity for the first lead as a representative (or one log per batch)
        await prismadb.activityLog.create({
            data: {
                leadId: 'BATCH_IMPORT', // Placeholder since createMany doesn't return IDs
                userId: session.id,
                action: 'IMPORT',
                details: `Imported ${created.count} leads via CSV`
            }
        }).catch(() => { }); // Ignore error if foreign key fails for placeholder

        return NextResponse.json({ success: true, count: created.count });

    } catch (error) {
        console.error('[LEADS_IMPORT]', error);
        return new NextResponse(JSON.stringify({ error: "Internal Error", details: String(error) }), { status: 500 });
    }
}
