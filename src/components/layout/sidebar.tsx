'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  ShieldCheck,
  Plus,
  Settings
} from 'lucide-react'
import { SignOutButton } from '@/components/sign-out-button'

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname === path || pathname.startsWith(path + '/')
  }

  const linkClass = (path: string) => {
    const active = isActive(path)
    return `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 active:scale-[0.98] ${
      active
        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
        : 'text-blue-100/75 hover:bg-white/10 hover:text-white'
    }`
  }

  return (
    <aside className="relative left-0 h-full w-[260px] flex flex-col p-4 gap-4 bg-[#1E3A8A] text-white border-r border-blue-900/40 z-50 shrink-0">
      {/* Logo Area */}
      <div className="px-2 mb-4 h-12 flex items-center justify-start overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-sidebar.png"
          alt="MedicIA Centro Médico Inteligente"
          className="h-28 w-auto max-w-none object-contain object-left -ml-12 shrink-0 mix-blend-screen"
        />
      </div>

      <nav className="flex-1 space-y-1">
        <Link href="/" className={linkClass('/')}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-sm">Tablero</span>
        </Link>
        <Link href="/pacientes" className={linkClass('/pacientes')}>
          <Users className="w-5 h-5" />
          <span className="text-sm">Pacientes</span>
        </Link>
        <Link href="/citas" className={linkClass('/citas')}>
          <CalendarDays className="w-5 h-5" />
          <span className="text-sm">Citas</span>
        </Link>
        <Link href="/doctores" className={linkClass('/doctores')}>
          <Stethoscope className="w-5 h-5" />
          <span className="text-sm">Doctores</span>
        </Link>
        <Link href="/usuarios" className={linkClass('/usuarios')}>
          <ShieldCheck className="w-5 h-5" />
          <span className="text-sm">Usuarios</span>
        </Link>
      </nav>

      <div className="mt-auto space-y-4">
        <Link
          href="/citas?new=true"
          className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors active:scale-[0.98] shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">Nueva Cita</span>
        </Link>
        <div className="border-t border-blue-800/60 pt-4 space-y-1">
          <Link href="/configuracion" className={linkClass('/configuracion')}>
            <Settings className="w-5 h-5" />
            <span className="text-sm">Configuración</span>
          </Link>
          <SignOutButton />
        </div>
      </div>
    </aside>
  )
}
