'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/supabase/client'
import { toast } from 'sonner'

interface Doctor {
  id: string
  profile_id: string | null
  full_name: string
  specialty: string
  is_active: boolean
  created_at: string
}

export default function DoctoresPage() {
  const [doctores, setDoctores] = useState<Doctor[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userRole, setUserRole] = useState<string>('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Form state
  const [fullName, setFullName] = useState('')
  const [specialty, setSpecialty] = useState('')

  const supabase = createClient()

  async function fetchRoleAndDoctores() {
    setLoading(true)
    try {
      // 1. Fetch user role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setUserRole(profile?.role || '')
      }

      // 2. Fetch doctors
      let query = supabase.from('doctors').select('*').order('created_at', { ascending: false })
      if (debouncedSearch) {
        query = query.or(`full_name.ilike.*${debouncedSearch}*,specialty.ilike.*${debouncedSearch}*`)
      }

      const { data, error } = await query
      if (error) throw error
      setDoctores((data as unknown as Doctor[]) || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'desconocido'
      toast.error(`Error al cargar datos: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoleAndDoctores()
  }, [debouncedSearch])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (userRole !== 'admin') {
      toast.error('Acción exclusiva para el rol Administrador.')
      return
    }

    if (!fullName.trim() || !specialty) {
      toast.error('Nombre y especialidad son obligatorios')
      return
    }

    setSaving(true)
    try {
      // 1. Validar nombre único case-insensitive
      const { data: existingDocs, error: checkError } = await supabase
        .from('doctors')
        .select('id')
        .ilike('full_name', fullName.trim())

      if (checkError) throw checkError
      if (existingDocs && existingDocs.length > 0) {
        toast.error(`Ya existe un doctor registrado con el nombre: "${fullName}"`)
        setSaving(false)
        return
      }

      // 2. Crear doctor
      const { error: insertError } = await supabase
        .from('doctors')
        .insert({
          full_name: fullName.trim(),
          specialty,
          is_active: true
        })

      if (insertError) throw insertError

      toast.success('Doctor registrado con éxito')
      setShowModal(false)
      setFullName('')
      setSpecialty('')
      fetchRoleAndDoctores()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'desconocido'
      toast.error(`Error al registrar doctor: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  // Optimistic UI for toggle status
  async function toggleDoctorActive(docId: string, currentStatus: boolean) {
    if (userRole !== 'admin') {
      toast.error('Acción exclusiva para el rol Administrador.')
      return
    }

    const newStatus = !currentStatus

    // 1. Optimistic Update in State
    setDoctores((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, is_active: newStatus } : d))
    )

    toast.success(newStatus ? 'Doctor activado' : 'Doctor desactivado')

    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_active: newStatus })
        .eq('id', docId)

      if (error) throw error
    } catch (err: unknown) {
      // Revert if error
      setDoctores((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, is_active: currentStatus } : d))
      )
      const msg = err instanceof Error ? err.message : 'desconocido'
      toast.error(`Error al actualizar estado del doctor: ${msg}`)
    }
  }

  return (
    <div className="p-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión de Doctores</h2>
          <p className="text-sm text-muted-foreground">Administra el personal médico y sus especialidades.</p>
        </div>
        {userRole === 'admin' && (
          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo doctor
          </Button>
        )}
      </div>

      {/* Search bar */}
      <div className="mb-6 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o especialidad..."
          className="pl-9 w-full bg-card"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Nombre del Doctor</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Especialidad</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted"></div>
                        <div className="h-4 bg-muted rounded w-28"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-16"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 bg-muted rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : doctores.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                    No se encontraron doctores registrados.
                  </td>
                </tr>
              ) : (
                doctores.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/30 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {d.full_name.charAt(0)}
                        </div>
                        <div>
                          <Link href={`/doctores/${d.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                            {d.full_name}
                          </Link>
                          <p className="text-xs text-muted-foreground">ID: {d.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-foreground">{d.specialty}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={d.is_active ? "bg-secondary/10 text-secondary border-none" : "bg-destructive/10 text-destructive border-none"}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${d.is_active ? "bg-secondary" : "bg-destructive"}`}></span>
                        {d.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link href={`/doctores/${d.id}`}>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                          Ver perfil
                        </Button>
                      </Link>
                      {userRole === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleDoctorActive(d.id, d.is_active)
                          }}
                          className={d.is_active ? "text-destructive hover:bg-destructive/10" : "text-secondary hover:bg-secondary/10"}
                        >
                          {d.is_active ? 'Desactivar' : 'Activar'}
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

      {/* Modal: Nuevo Doctor */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Doctor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="nombreDoc">Nombre Completo</Label>
              <Input
                id="nombreDoc"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Dra. Martha López"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="espDoc">Especialidad</Label>
              <select
                id="espDoc"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Seleccionar especialidad...</option>
                <option value="Cardiología">Cardiología</option>
                <option value="Dermatología">Dermatología</option>
                <option value="Pediatría">Pediatría</option>
                <option value="Oncología">Oncología</option>
                <option value="Neurología">Neurología</option>
                <option value="Medicina General">Medicina General</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Registro
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
