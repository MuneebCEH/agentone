import { NextResponse } from 'next/server'
import { prismadb } from '@/lib/prismadb'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { User } from '@prisma/client'

export async function GET() {
    const session = await getSession()
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const users = await prismadb.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                permissions: true,
                createdAt: true,
                workspaceId: true,
            }
        })

        const parsedUsers = users.map(u => ({
            ...u,
            permissions: u.permissions ? JSON.parse(u.permissions) : []
        }))

        return NextResponse.json(parsedUsers)
    } catch (error) {
        console.error('[USERS_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getSession()
    if (!session || session.role !== 'SUPER_ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await req.json()
        const { name, email, password, role, permissions } = body

        if (!name || !email || !password || !role) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        const existingUser = await prismadb.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return new NextResponse('User already exists', { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const user = await prismadb.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                permissions: JSON.stringify(permissions || []),
                workspaceId: session.workspaceId // Assign to creator's workspace
            }
        })

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user

        return NextResponse.json({
            ...userWithoutPassword,
            permissions: JSON.parse(user.permissions)
        })
    } catch (error) {
        console.error('[USERS_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
