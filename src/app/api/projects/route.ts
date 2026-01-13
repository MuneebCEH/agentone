import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prismadb";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const whereClause: Record<string, any> = {};
        let workspaceId = session.workspaceId;

        // Fetch workspaceId if missing
        if (!workspaceId && session.role !== 'SUPER_ADMIN') {
            const user = await prismadb.user.findUnique({
                where: { id: session.id },
                select: { workspaceId: true }
            });
            workspaceId = user?.workspaceId || "";
        }

        // Role-based filtering
        if (session.role === 'SUPER_ADMIN') {
            // Super Admin sees everything across all workspaces
        } else if (session.role === 'ADMIN') {
            // Admin sees all projects in their workspace
            if (workspaceId) {
                whereClause.workspaceId = workspaceId;
            }
        } else {
            // AGENT only sees projects they are specifically assigned to
            whereClause.assignedUsers = {
                some: { id: session.id }
            };
        }

        const projects = await prismadb.project.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                assignedUsers: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        return NextResponse.json(projects);
    } catch (error) {
        console.error('[PROJECTS_GET]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { name, description, assignedAgentId } = body;

        if (!name) return new NextResponse("Name is required", { status: 400 });

        let workspaceId: string | undefined | null = session.workspaceId;

        if (!workspaceId) {
            const user = await prismadb.user.findUnique({
                where: { id: session.id },
                select: { workspaceId: true }
            });
            workspaceId = user?.workspaceId;
        }

        if (!workspaceId) {
            const defaultWorkspace = await prismadb.workspace.findFirst({
                where: { name: 'Default Workspace' }
            });
            workspaceId = defaultWorkspace?.id;
        }

        if (!workspaceId) return new NextResponse("No workspace found", { status: 400 });

        const projectData: any = {
            name,
            description,
            workspaceId: workspaceId as string
        };

        if (assignedAgentId) {
            if (Array.isArray(assignedAgentId)) {
                // If array of IDs
                if (assignedAgentId.length > 0) {
                    projectData.assignedUsers = {
                        connect: assignedAgentId.map((id: string) => ({ id }))
                    };
                }
            } else {
                // If single string ID
                projectData.assignedUsers = {
                    connect: { id: assignedAgentId }
                };
            }
        }

        const project = await prismadb.project.create({
            data: projectData
        });

        return NextResponse.json(project);
    } catch (error) {
        console.error('[PROJECTS_POST]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
