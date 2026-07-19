'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  UserPlus,
  Users,
  CheckCircle2,
  Mail,
  Loader2,
  Search,
  ShieldAlert
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/supabase/client'
import { listStaffUsers, inviteStaffUser, toggleUserActive } from '@/app/auth/actions'
import { toast } from 'sonner'

interface StaffUser {
  id: string
  full_name: string
  role: 'admin' | 'doctor' | 'recepcionista'
  is_active: boolean
  email: string
  pending: boolean
  created_at: string
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<StaffUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form states
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'doctor' | 'recepcionista'>('recepcionista')

  const supabase = createClient()

  async function checkPermissionAndFetch() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      setIsAdmin(true)
      const data = await listStaffUsers()
      setUsers(data as StaffUser[])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'desconocido'
      toast.error(`Error al cargar datos del personal: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkPermissionAndFetch()
  }, [])

  const filteredUsers = users.filter((u) => {
    const text = `${u.full_name} ${u.email}`.toLowerCase()
    return text.includes(search.toLowerCase())
  })

  // Stats
  const totalCount = users.length
  const activeCount = users.filter((u) => u.is_active).length
  const pendingCount = users.filter((u) => u.pending).length

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      toast.error('Nombre y correo son obligatorios')
      return
    }

    setSaving(true)
    try {
      const result = await inviteStaffUser(fullName.trim(), email.trim().toLowerCase(), role)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Invitación enviada con éxito a ${email}`)
        setShowModal(false)
        setFullName('')
        setEmail('')
        setRole('recepcionista')
        // Refresh list
        const updated = await listStaffUsers()
        setUsers(updated as StaffUser[])
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'desconocido'
      toast.error(`Error al enviar invitación: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  // Optimistic UI for toggling user active state
  async function handleToggleActive(userId: string, currentStatus: boolean) {
    const newStatus = !currentStatus

    // 1. Optimistic Update in State
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: newStatus } : u))
    )

    toast.success(newStatus ? 'Usuario reactivado' : 'Usuario desactivado')

    try {
      const result = await toggleUserActive(userId, newStatus)
      if (result.error) {
        throw new Error(result.error)
      }
    } catch (err: unknown) {
      // Revert if failed
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: currentStatus } : u))
      )
      const msg = err instanceof Error ? err.message : 'desconocido'
      toast.error(`Error al cambiar estado del usuario: ${msg}`)
    }
  }

  if (loading && isAdmin === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verificando permisos y cargando personal...</p>
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="p-6 text-center max-w-md mx-auto space-y-4 pt-16">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Acceso Denegado</h3>
        <p className="text-sm text-muted-foreground">
          Esta sección es exclusiva para usuarios con el rol de **Administrador**. Tu rol actual no tiene permisos para ver o modificar el personal del sistema.
        </p>
        <Link href="/" className="inline-block">
          <Button variant="outline">Volver al Tablero</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Gestión de Usuarios</h1>
          <p className="text-sm text-muted-foreground">Administra los accesos y roles del personal del centro médico.</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <UserPlus className="w-5 h-5" />
          Nuevo usuario
        </Button>
      </div>

      {/* Bento Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Usuarios Totales</p>
            <p className="text-xl font-bold text-foreground">{totalCount}</p>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center text-secondary">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Activos</p>
            <p className="text-xl font-bold text-foreground">{activeCount}</p>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pendientes</p>
            <p className="text-xl font-bold text-foreground">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar usuarios por nombre o correo..."
          className="pl-9 w-full bg-card"
        />
      </div>

      {/* Table Container */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Correo</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted"></div>
                        <div className="h-4 bg-muted rounded w-24"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-36"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-20"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 bg-muted rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {u.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm text-foreground font-medium">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-tighter">
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${u.pending ? 'bg-amber-500' : u.is_active ? 'bg-secondary' : 'bg-muted-foreground'}`}></span>
                        <span className="text-sm font-medium text-foreground">
                          {u.pending ? 'Invitación pendiente' : u.is_active ? 'Activo' : 'Desactivado'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!u.pending && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(u.id, u.is_active)}
                          className={u.is_active ? "text-destructive hover:bg-destructive/10" : "text-secondary hover:bg-secondary/10"}
                        >
                          {u.is_active ? 'Desactivar' : 'Activar'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simple Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <form className="space-y-4 pt-2" onSubmit={handleInvite}>
            <div className="space-y-1.5">
              <Label htmlFor="fullname">Nombre Completo</Label>
              <Input
                id="fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Dra. Ana Luz"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emailInput">Correo Electrónico</Label>
              <Input
                id="emailInput"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@medicia.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roleSelect">Rol de Acceso</Label>
              <select
                id="roleSelect"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'doctor' | 'recepcionista')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="doctor">Doctor</option>
                <option value="admin">Administrador</option>
                <option value="recepcionista">Recepción</option>
              </select>
            </div>
            <div className="pt-4 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground"
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar invitación
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
