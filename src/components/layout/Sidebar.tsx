'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, Database, Settings, LogOut, BarChart3, Filter, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User } from '@/types'

export default function Sidebar({ user }: { user: User }) {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        toast.success('Logged out')
        router.push('/login')
    }

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT'] },
        { name: 'All Leads', href: '/leads', icon: Database, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { name: 'My Leads', href: '/leads?view=mine', icon: Filter, roles: ['AGENT'] },
        { name: 'Proposals', href: '/proposals', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT'] }, // Was Social
        { name: 'Users', href: '/users', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { name: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN'] },
    ]

    const filteredNav = navItems.filter(item => item.roles.includes(user?.role || 'AGENT'))

    return (
        <div className="h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Outflux</h1>
                <p className="text-xs text-slate-500 mt-1">{user?.role?.replace('_', ' ')} Workspace</p>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {filteredNav.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith('/leads') && item.href.startsWith('/leads') && pathname === item.href.split('?')[0] && (item.href.includes('?view=mine') ? pathname.includes('view') : !pathname.includes('view')))
                    // Simple active check logic
                    const active = pathname === item.href.split('?')[0] && (item.href.includes('?view=mine') ? true : true) // Simplification for MVP

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                pathname.startsWith(item.href.split('?')[0])
                                    ? "bg-blue-600/10 text-blue-400"
                                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                        {user?.name?.[0]}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </div>
    )
}
