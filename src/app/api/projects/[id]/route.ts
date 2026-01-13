import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prismadb";
import { getSession } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params;

        // Verify project belongs to workspace
        const project = await prismadb.project.findUnique({
            where: { id }
        });

        if (!project) return new NextResponse("Not Found", { status: 404 });

        if (session.role !== 'SUPER_ADMIN' && project.workspaceId !== session.workspaceId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Delete leads first
        await prismadb.lead.deleteMany({
            where: { projectId: id }
        });

        await prismadb.project.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[PROJECT_DELETE]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const { name, description, assignedAgentId, assignedAgentIds } = body;

        const existingProject = await prismadb.project.findUnique({
            where: { id }
        });

        if (!existingProject) return new NextResponse("Not Found", { status: 404 });

        if (session.role !== 'SUPER_ADMIN' && existingProject.workspaceId !== session.workspaceId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;

        if (assignedAgentIds !== undefined && Array.isArray(assignedAgentIds)) {
            updateData.assignedUsers = {
                set: assignedAgentIds.map((id: string) => ({ id }))
            };
        } else if (assignedAgentId !== undefined) {
            // Legacy support or single select fallback
            updateData.assignedUsers = {
                set: assignedAgentId ? [{ id: assignedAgentId }] : []
            };
        }

        const project = await prismadb.project.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(project);
    } catch (error) {
        console.error('[PROJECT_PATCH]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
