'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  X,
  FileText,
  CalendarDays,
  Clock,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/supabase/client'
import { toast } from 'sonner'

interface Appointment {
  id: string
  scheduled_at: string
  reason: string
  status: string
  patients: {
    full_name: string
  } | null
}

interface Doctor {
  id: string
  full_name: string
  specialty: string
  is_active: boolean
  created_at: string
}

export default function DetalleDoctorPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [userRole, setUserRole] = useState('')

  // Form states
  const [fullName, setFullName] = useState('')
  const [specialty, setSpecialty] = useState('')

  async function fetchDoctorDetails() {
    setLoading(true)
    try {
      // 1. Fetch user role
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .single()
        setUserRole(profile?.role || '')
      }

      // 2. Fetch doctor info
      const { data: docData, error: docError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single()

      if (docError) throw docError
      setDoctor(docData as unknown as Doctor)
      setFullName(docData.full_name)
      setSpecialty(docData.specialty)

      // 3. Fetch future appointments (scheduled_at >= now)
      const nowStr = new Date().toISOString()
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          scheduled_at,
          reason,
          status,
          patients (
            full_name
          )
        `)
        .eq('doctor_id', id)
        .gte('scheduled_at', nowStr)
        .order('scheduled_at', { ascending: true })

      if (appointmentsError) throw appointmentsError
      setAppointments((appointmentsData as unknown as Appointment[]) || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'desconocido'
      toast.error(`Error al obtener información del doctor: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchDoctorDetails()
    }
  }, [id])

  async function handleSaveChanges() {
    if (userRole !== 'admin') {
      toast.error('Acción exclusiva para el Administrador.')
      return
    }

    if (!fullName.trim() || !specialty) {
      toast.error('Nombre y especialidad son obligatorios')
      return
    }

    setSaving(true)
    try {
      // 1. Validar nombre único case-insensitive (excluyendo este doctor)
      const { data: existingDocs, error: checkError } = await supabase
        .from('doctors')
        .select('id')
        .ilike('full_name', fullName.trim())
        .neq('id', id)

      if (checkError) throw checkError
      if (existingDocs && existingDocs.length > 0) {
        toast.error(`Ya existe otro doctor registrado con el nombre: "${fullName}"`)
        setSaving(false)
        return
      }

      // 2. Guardar cambios
      const { error: updateError } = await supabase
        .from('doctors')
        .update({
          full_name: fullName.trim(),
          specialty
        })
        .eq('id', id)

      if (updateError) throw updateError

      toast.success('Cambios guardados con éxito')
      fetchDoctorDetails()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'desconocido'
      toast.error(`Error al guardar cambios: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando perfil del doctor...</p>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-muted-foreground">No se encontró el doctor.</p>
        <Link href="/doctores" className="text-primary hover:underline mt-2 inline-block">
          Volver a doctores
        </Link>
      </div>
    )
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
    <div className="p-6 pb-20 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/doctores">
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4" />
            Volver al listado
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => router.push('/doctores')}>
            <X className="w-4 h-4" />
            Cerrar
          </Button>
          {userRole === 'admin' && (
            <Button className="gap-2" onClick={handleSaveChanges} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar cambios
            </Button>
          )}
        </div>
      </div>

      {/* Doctor Profile Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-4xl border-2 border-border">
            {doctor.full_name.charAt(0)}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-foreground">{doctor.full_name}</h2>
            <Badge variant="outline" className="bg-secondary/10 text-secondary border-none text-[11px] font-bold uppercase">
              Médico Especialista
            </Badge>
          </div>
          <p className="text-base text-primary mb-1">{doctor.specialty}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</span>
            <span className={`text-sm font-bold uppercase ${doctor.is_active ? 'text-secondary' : 'text-destructive'}`}>
              {doctor.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editable Info + Citas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información Profesional */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Información Profesional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nameInput">Nombre Completo</Label>
                  <Input
                    id="nameInput"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={userRole !== 'admin'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialtySelect">Especialidad</Label>
                  <select
                    id="specialtySelect"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={userRole !== 'admin'}
                  >
                    <option value="Cardiología">Cardiología</option>
                    <option value="Neurología">Neurología</option>
                    <option value="Pediatría">Pediatría</option>
                    <option value="Oncología">Oncología</option>
                    <option value="Medicina General">Medicina General</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Próximas Citas */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  Próximas citas asignadas (Solo Lectura)
                </CardTitle>
                <Badge variant="outline" className="text-xs text-muted-foreground border-none">Solo lectura</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left border-b border-border">
                      <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paciente</th>
                      <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha y Hora</th>
                      <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Motivo</th>
                      <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {appointments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-sm text-muted-foreground">
                          No hay próximas citas programadas.
                        </td>
                      </tr>
                    ) : (
                      appointments.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-4">
                            <span className="text-sm font-semibold text-foreground">
                              {c.patients ? c.patients.full_name : 'Paciente Desconocido'}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-muted-foreground">{formatDateTime(c.scheduled_at)}</td>
                          <td className="py-4 text-sm text-muted-foreground">{c.reason}</td>
                          <td className="py-4">
                            <Badge variant="outline" className={
                              c.status === 'confirmada' ? 'bg-secondary/10 text-secondary border-none' :
                              c.status === 'completada' ? 'bg-primary/10 text-primary border-none' :
                              c.status === 'cancelada' ? 'bg-destructive/10 text-destructive border-none' :
                              'bg-accent/10 text-accent border-none'
                            }>
                              {c.status.toUpperCase()}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Disponibilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-foreground">Lunes a Viernes</span>
                  <span className="text-xs text-secondary font-bold">Turno Completo</span>
                </div>
                <p className="text-sm text-muted-foreground">08:00 — 17:00</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
