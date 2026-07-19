'use client'

import { useState, useEffect } from 'react'
import {
  Clock,
  Plus,
  CalendarDays,
  Loader2,
  Calendar
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
import { User } from '@supabase/supabase-js'

interface Doctor {
  id: string
  full_name: string
  specialty: string
  is_active: boolean
}

interface Patient {
  id: string
  full_name: string
  document_id: string
}

interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  scheduled_at: string
  reason: string
  status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
  notes: string | null
  patients: {
    id: string
    full_name: string
    document_id: string
  } | null
  doctors: {
    id: string
    full_name: string
    specialty: string
  } | null
}

const statusBadge: Record<string, string> = {
  confirmada: "bg-secondary/10 text-secondary border-none",
  pendiente: "bg-accent/10 text-accent border-none",
  completada: "bg-primary/10 text-primary border-none",
  cancelada: "bg-destructive/10 text-destructive border-none",
}

export default function CitasPage() {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  // Auth and profile info
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [profileRole, setProfileRole] = useState('')
  const [doctorRecordId, setDoctorRecordId] = useState<string | null>(null)

  // Filters state
  const [filterDoctor, setFilterDoctor] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  // Modal / Form state
  const [showModal, setShowModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [saving, setSaving] = useState(false)

  // Form Fields
  const [formPatientId, setFormPatientId] = useState('')
  const [formDoctorId, setFormDoctorId] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formReason, setFormReason] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formStatus, setFormStatus] = useState<'pendiente' | 'confirmada' | 'completada' | 'cancelada'>('pendiente')

  async function initializeAuthAndFilters() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        const role = profile?.role || ''
        setProfileRole(role)

        // If user is a doctor, resolve their doctor record id
        if (role === 'doctor') {
          const { data: docData } = await supabase
            .from('doctors')
            .select('id')
            .eq('profile_id', user.id)
            .single()
          if (docData) {
            setDoctorRecordId(docData.id)
            setFilterDoctor(docData.id) // Force filter doctor to self
          }
        }
      }

      // Fetch active doctors & patients
      const { data: docs } = await supabase.from('doctors').select('*').eq('is_active', true)
      setDoctors((docs as unknown as Doctor[]) || [])

      const { data: pats } = await supabase.from('patients').select('*').eq('is_active', true)
      setPatients((pats as unknown as Patient[]) || [])
    } catch (err: unknown) {
      console.error(err)
    }
  }

  async function fetchAppointments() {
    setLoading(true)
    try {
      let query = supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          doctor_id,
          scheduled_at,
          reason,
          status,
          notes,
          patients (
            id,
            full_name,
            document_id
          ),
          doctors (
            id,
            full_name,
            specialty
          )
        `)
        .order('scheduled_at', { ascending: true })

      // Enforce RLS and views by role
      if (profileRole === 'doctor' && doctorRecordId) {
        query = query.eq('doctor_id', doctorRecordId)
      } else {
        if (filterDoctor !== 'all') {
          query = query.eq('doctor_id', filterDoctor)
        }
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      if (filterStartDate) {
        query = query.gte('scheduled_at', `${filterStartDate}T00:00:00Z`)
      }
      if (filterEndDate) {
        query = query.lte('scheduled_at', `${filterEndDate}T23:59:59Z`)
      }

      const { data, error } = await query
      if (error) throw error
      setAppointments((data as unknown as Appointment[]) || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'desconocido'
      toast.error(`Error al cargar citas: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initializeAuthAndFilters()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('new') === 'true') {
        openNewModal()
        // Limpiar URL para no reabrir el modal al refrescar
        const url = new URL(window.location.href)
        url.searchParams.delete('new')
        window.history.replaceState({}, '', url.pathname + url.search)
      }
    }
  }, [profileRole, doctorRecordId])

  useEffect(() => {
    if (profileRole) {
      fetchAppointments()
    }
  }, [profileRole, doctorRecordId, filterDoctor, filterStatus, filterStartDate, filterEndDate])

  // Open modal for new appointment
  const openNewModal = () => {
    setSelectedAppointment(null)
    setFormPatientId('')
    setFormDoctorId(profileRole === 'doctor' && doctorRecordId ? doctorRecordId : '')
    setFormDate('')
    setFormTime('')
    setFormReason('')
    setFormNotes('')
    setFormStatus('pendiente')
    setShowModal(true)
  }

  // Open modal for editing appointment
  const openEditModal = (appt: Appointment) => {
    setSelectedAppointment(appt)
    setFormPatientId(appt.patient_id)
    setFormDoctorId(appt.doctor_id)
    const dateObj = new Date(appt.scheduled_at)
    setFormDate(dateObj.toISOString().split('T')[0])
    setFormTime(dateObj.toTimeString().split(' ')[0].slice(0, 5))
    setFormReason(appt.reason)
    setFormNotes(appt.notes || '')
    setFormStatus(appt.status)
    setShowModal(true)
  }

  // Optimistic update for quick status toggle
  async function updateAppointmentStatus(apptId: string, currentStatus: Appointment['status'], nextStatus: 'pendiente' | 'confirmada' | 'completada' | 'cancelada') {
    // 1. Optimistic Update State
    setAppointments(prev =>
      prev.map(a => a.id === apptId ? { ...a, status: nextStatus } : a)
    )
    toast.success(`Cita cambiada a: ${nextStatus.toUpperCase()}`)

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: nextStatus })
        .eq('id', apptId)

      if (error) throw error
      fetchAppointments()
    } catch (err: unknown) {
      // Revert on error
      setAppointments(prev =>
        prev.map(a => a.id === apptId ? { ...a, status: currentStatus } : a)
      )
      const msg = err instanceof Error ? err.message : 'desconocido'
      toast.error(`Error al actualizar estado: ${msg}`)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formPatientId || !formDoctorId || !formDate || !formTime || !formReason.trim()) {
      toast.error('Todos los campos excepto notas son obligatorios')
      return
    }

    setSaving(true)
    try {
      const scheduledAt = new Date(`${formDate}T${formTime}:00`).toISOString()
      const { data: { user } } = await supabase.auth.getUser()

      if (selectedAppointment) {
        // Edit appointment
        const { error } = await supabase
          .from('appointments')
          .update({
            patient_id: formPatientId,
            doctor_id: formDoctorId,
            scheduled_at: scheduledAt,
            reason: formReason.trim(),
            notes: formNotes.trim() || null,
            status: formStatus
          })
          .eq('id', selectedAppointment.id)

        if (error) throw error
        toast.success('Cita reprogramada con éxito')
      } else {
        // Create appointment
        const { error } = await supabase
          .from('appointments')
          .insert({
            patient_id: formPatientId,
            doctor_id: formDoctorId,
            scheduled_at: scheduledAt,
            reason: formReason.trim(),
            notes: formNotes.trim() || null,
            status: formStatus,
            created_by: user?.id || null
          })

        if (error) throw error
        toast.success('Cita agendada con éxito')
      }

      setShowModal(false)
      fetchAppointments()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'desconocido'
      toast.error(`Error al agendar cita: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Lista de Citas</h2>
          <p className="text-sm text-muted-foreground">Gestiona y supervisa todas las consultas médicas agendadas.</p>
        </div>
        <Button onClick={openNewModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Cita
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block ml-1">Fecha Inicio</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block ml-1">Fecha Fin</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block ml-1">Doctor</Label>
          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            disabled={profileRole === 'doctor'}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">Todos los Doctores</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block ml-1">Estado</Label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">Todos los Estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha y Hora</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Doctor / Especialidad</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24"></div></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted"></div>
                        <div className="h-4 bg-muted rounded w-28"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-16"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 bg-muted rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                    No se encontraron citas agendadas.
                  </td>
                </tr>
              ) : (
                appointments.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-foreground">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">{formatDateTime(c.scheduled_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{c.patients?.full_name || 'Desconocido'}</p>
                        <p className="text-xs text-muted-foreground">Doc: {c.patients?.document_id || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-foreground">{c.doctors?.full_name || 'Desconocido'}</p>
                        <p className="text-xs text-primary font-medium">{c.doctors?.specialty || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`text-[11px] font-bold ${statusBadge[c.status]}`}>
                        {c.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(c)}>
                        Editar
                      </Button>
                      <select
                        value={c.status}
                        onChange={(e) => updateAppointmentStatus(c.id, c.status, e.target.value as Appointment['status'])}
                        className="text-xs border border-input rounded bg-background p-1 focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Agendar/Editar Cita */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAppointment ? 'Reprogramar Cita' : 'Nueva Cita Médica'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-full">
                <Label htmlFor="pacienteSelect">Paciente</Label>
                <select
                  id="pacienteSelect"
                  value={formPatientId}
                  onChange={(e) => setFormPatientId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Seleccionar Paciente...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.document_id})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doctorSelect">Doctor Responsable</Label>
                <select
                  id="doctorSelect"
                  value={formDoctorId}
                  onChange={(e) => setFormDoctorId(e.target.value)}
                  disabled={profileRole === 'doctor'}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Seleccionar Doctor...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.full_name} — {d.specialty}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="estadoSelect">Estado de la Cita</Label>
                <select
                  id="estadoSelect"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as Appointment['status'])}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="formDateInput">Fecha</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="formDateInput"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="formTimeInput">Horario</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="formTimeInput"
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="col-span-full space-y-1.5">
                <Label htmlFor="reasonInput">Motivo de la Consulta</Label>
                <textarea
                  id="reasonInput"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  rows={3}
                  placeholder="Descripción del motivo de la consulta..."
                  required
                />
              </div>

              <div className="col-span-full space-y-1.5">
                <Label htmlFor="notesInput">Notas Clínicas Adicionales</Label>
                <textarea
                  id="notesInput"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  rows={2}
                  placeholder="Observaciones adicionales, antecedentes o indicaciones..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cita
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
