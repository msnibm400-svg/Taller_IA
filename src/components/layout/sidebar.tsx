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
    return `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 active:scale-[0.98] ${
      active
        ? 'bg-primary/10 text-primary font-semibold'
        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
    }`
  }

  return (
    <aside className="relative left-0 h-full w-[260px] flex flex-col p-4 gap-4 bg-card border-r border-border z-50 shrink-0">
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-2 mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmzx3zQOPO8oRFEGwl08rr-pSOK-49BFzyU5CXOmmCjRNcxH5buX68SgRcPYqGtM-ACsGBrTmxhRxOojZI7rUsmSo_oDoNQK_Ay6Kt0jtGlSlQht3zvVfY_049aBz-6QChUTRFkR_T02KgikJRUFX1b3onGa5wU-Vvq3-FGHB1SBL3ImKPRijP7cDpYlHOSS7pffLLxJqWLMuYPG7ahfFfbk8aB_Ucxti--nJAC6_yrOQTq4cTJ5Mqc4lT72TPE-Ul"
          alt="MedicIA Logo"
          className="h-8 w-auto"
        />
        <div className="border-l border-border pl-3 py-0.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
            Centro
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mt-1">
            Médico
          </p>
        </div>
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
          className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">Nueva Cita</span>
        </Link>
        <div className="border-t border-border pt-4 space-y-1">
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
