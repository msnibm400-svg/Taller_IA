'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  CalendarDays,
  UserCheck,
  MoreVertical,
  UserPlus,
  Search,
  Loader2
} from 'lucide-react'
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

interface Patient {
  id: string
  full_name: string
  document_id: string
  phone: string | null
  birth_date: string | null
  is_active: boolean
  created_at: string
}

export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Form state
  const [fullName, setFullName] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')

  const supabase = createClient()

  // Stats
  const [totalCount, setTotalCount] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [citasHoyCount, setCitasHoyCount] = useState(0)

  async function fetchPatients() {
    setLoading(true)
    try {
      // Fetch stats
      const { count: total } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
      setTotalCount(total || 0)

      const { count: active } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      setActiveCount(active || 0)

      const todayStr = new Date().toISOString().split('T')[0]
      const { count: citasHoy } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_at', `${todayStr}T00:00:00Z`)
        .lte('scheduled_at', `${todayStr}T23:59:59Z`)
      setCitasHoyCount(citasHoy || 0)

      // Fetch list
      let query = supabase.from('patients').select('*').order('created_at', { ascending: false })
      if (debouncedSearch) {
        query = query.or(`full_name.ilike.*${debouncedSearch}*,document_id.ilike.*${debouncedSearch}*`)
      }

      const { data, error } = await query
      if (error) throw error
      setPatients(data || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'desconocido'
      toast.error(`Error al cargar pacientes: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [debouncedSearch])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !documentId.trim()) {
      toast.error('Nombre y Documento son obligatorios')
      return
    }

    setSaving(true)
    try {
      // 1. Validar duplicados por full_name case-insensitive
      const { data: existingPatients, error: checkError } = await supabase
        .from('patients')
        .select('id')
        .ilike('full_name', fullName.trim())
      
      if (checkError) throw checkError
      if (existingPatients && existingPatients.length > 0) {
        toast.error(`Ya existe un paciente registrado con el nombre: "${fullName}"`)
        setSaving(false)
        return
      }

      // 2. Validar documento único
      const { data: existingDoc, error: docError } = await supabase
        .from('patients')
        .select('id')
        .eq('document_id', documentId.trim())
      
      if (docError) throw docError
      if (existingDoc && existingDoc.length > 0) {
        toast.error(`Ya existe un paciente registrado con el documento: "${documentId}"`)
        setSaving(false)
        return
      }

      // 3. Obtener el perfil del creador
      const { data: { user } } = await supabase.auth.getUser()

      // 4. Crear paciente
      const { error: insertError } = await supabase
        .from('patients')
        .insert({
          full_name: fullName.trim(),
          document_id: documentId.trim(),
          phone: phone.trim() || null,
          birth_date: birthDate || null,
          is_active: true,
          created_by: user?.id || null
        })

      if (insertError) throw insertError

      toast.success('Paciente registrado con éxito')
      setShowModal(false)
      // Reset form
      setFullName('')
      setDocumentId('')
      setPhone('')
      setBirthDate('')
      
      fetchPatients()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'desconocido'
      toast.error(`Error al registrar paciente: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="p-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Pacientes</h2>
          <p className="text-sm text-muted-foreground">Gestión y registro centralizado de la base de datos de pacientes.</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Nuevo paciente
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Pacientes</p>
            <p className="text-xl font-bold text-foreground">{totalCount}</p>
          </div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Activos</p>
            <p className="text-xl font-bold text-foreground">{activeCount}</p>
          </div>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Citas Hoy</p>
            <p className="text-xl font-bold text-foreground">{citasHoyCount}</p>
          </div>
        </div>
        <div className="flex items-center justify-end relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o documento..."
            className="pl-9 w-full bg-card"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documento</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha de Nacimiento</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                // Skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted"></div>
                        <div className="h-4 bg-muted rounded w-28"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-16"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 bg-muted rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                    No se encontraron pacientes.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {getInitials(p.full_name)}
                        </div>
                        <Link href={`/pacientes/${p.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                          {p.full_name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{p.document_id}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{p.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{p.birth_date || '-'}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={p.is_active ? "bg-secondary/10 text-secondary border-none" : "bg-muted text-muted-foreground border-none"}>
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/pacientes/${p.id}`}>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                          Ver expediente
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nuevo Paciente */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Paciente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombrePac">Nombre Completo</Label>
                <Input
                  id="nombrePac"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Juan Perez"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="docPac">Documento de Identidad</Label>
                <Input
                  id="docPac"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  placeholder="Ej: 1.000.000.000"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telPac">Teléfono</Label>
                <Input
                  id="telPac"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: +57 300 000 0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fechaPac">Fecha de Nacimiento</Label>
                <Input
                  id="fechaPac"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
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
