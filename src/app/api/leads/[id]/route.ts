import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prismadb";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { id } = await params; // AWAIT params - it's a Promise in Next.js 15!

        console.log('[LEAD_PATCH] ID from params:', id, 'Type:', typeof id);
        console.log('[LEAD_PATCH] Body:', body);

        // Fetch existing with project relations
        const existingLead = await prismadb.lead.findUnique({
            where: { id },
            include: {
                project: {
                    include: {
                        assignedUsers: {
                            select: { id: true }
                        }
                    }
                }
            }
        });

        if (!existingLead) {
            console.error('[LEAD_PATCH] Lead not found:', id);
            return NextResponse.json({ error: "Not Found" }, { status: 404 });
        }

        // Permission Check
        if (session.role === 'AGENT') {
            const isAssignedToLead = existingLead.assignedAgentId === session.id;
            const isAssignedToProject = existingLead.project?.assignedUsers.some(u => u.id === session.id);

            if (!isAssignedToLead && !isAssignedToProject) {
                console.warn('[LEAD_PATCH] Forbidden: Agent not assigned to lead or project', {
                    agentId: session.id,
                    leadAssignedTo: existingLead.assignedAgentId,
                    projectAssignedUsers: existingLead.project?.assignedUsers.map(u => u.id)
                });
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            // Check if locked
            if (existingLead.status === 'Sales Complete' || existingLead.status === 'Not Qualified') {
                return NextResponse.json({ error: "Record is locked" }, { status: 403 });
            }
        }

        // AGENT RESTRICTIONS: Only allow specific fields
        if (session.role === 'AGENT') {
            const allowedFields = ['status', 'notes', 'nextFollowUp', 'assignedAgentId'];
            const attemptedFields = Object.keys(body);
            const unauthorizedFields = attemptedFields.filter(field => !allowedFields.includes(field));

            if (unauthorizedFields.length > 0) {
                console.log('[LEAD_PATCH] Agent attempted to update unauthorized fields:', unauthorizedFields);
                // We can either throw an error or just ignore them. 
                // To be safe and avoid breaking the UI if it sends extra data, let's strictly filter the updateData below.
            }
        }

        // Build update object with explicit typing
        const updateData: Prisma.LeadUpdateInput = {};

        // For Agents, we only populate specifically allowed fields. For Admins, everything.
        const isAgent = session.role === 'AGENT';

        if ((!isAgent || isAgent) && body.status !== undefined) updateData.status = body.status;
        if ((!isAgent || isAgent) && body.notes !== undefined) updateData.notes = body.notes;
        if ((!isAgent || isAgent) && body.nextFollowUp !== undefined) updateData.nextFollowUp = body.nextFollowUp;

        // Allow all roles to update assigned agent
        if (body.assignedAgentId !== undefined) {
            updateData.assignedAgent = body.assignedAgentId
                ? { connect: { id: body.assignedAgentId } }
                : { disconnect: true };
        }

        // Admin-only fields
        if (!isAgent) {
            if (body.name !== undefined) updateData.name = body.name;
            if (body.company !== undefined) updateData.company = body.company;
            if (body.email !== undefined) updateData.email = body.email;
            if (body.phone !== undefined) updateData.phone = body.phone;
            if (body.dealValue !== undefined) updateData.dealValue = Number(body.dealValue);
            if (body.source !== undefined) updateData.source = body.source;
            if (body.title !== undefined) updateData.title = body.title;
            if (body.industry !== undefined) updateData.industry = body.industry;
            if (body.revenue !== undefined) updateData.revenue = body.revenue;
            if (body.employees !== undefined) updateData.employees = body.employees;
            if (body.mobile !== undefined) updateData.mobile = body.mobile;
            if (body.corporatePhone !== undefined) updateData.corporatePhone = body.corporatePhone;
            if (body.state !== undefined) updateData.state = body.state;
            if (body.linkedin !== undefined) updateData.linkedin = body.linkedin;
            if (body.website !== undefined) updateData.website = body.website;
        }

        console.log('[LEAD_PATCH] Update data:', updateData);

        // Capture Status Change for Logging
        if (updateData.status && updateData.status !== existingLead.status) {
            await prismadb.activityLog.create({
                data: {
                    leadId: id,
                    userId: session.id,
                    action: 'STATUS_CHANGE',
                    previousStatus: existingLead.status,
                    newStatus: updateData.status as string,
                    details: `Status changed from ${existingLead.status} to ${updateData.status}`
                }
            });
        }

        const updatedLead = await prismadb.lead.update({
            where: { id },
            data: updateData
        });

        console.log('[LEAD_PATCH] Success');
        return NextResponse.json(updatedLead);
    } catch (error) {
        console.error('[LEAD_PATCH] Full error:', error);
        return NextResponse.json({
            error: "Failed to update lead",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params; // AWAIT params

        // Only Admin and Super Admin can delete
        // Only Super Admin or users with delete_leads permission can delete
        const canDelete = session.role === 'SUPER_ADMIN' || (session.permissions && session.permissions.includes('delete_leads'));

        if (!canDelete) {
            return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
        }

        // Delete the lead
        await prismadb.lead.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[LEAD_DELETE]', error);
        return NextResponse.json({
            error: "Failed to delete lead",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
