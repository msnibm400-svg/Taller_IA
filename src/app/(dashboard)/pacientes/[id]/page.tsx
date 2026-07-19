'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  X,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
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
  notes: string | null
  doctors: {
    full_name: string
    specialty: string
  } | null
}

interface Patient {
  id: string
  full_name: string
  document_id: string
  phone: string | null
  birth_date: string | null
  is_active: boolean
  created_at: string
}

export default function DetallePacientePage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])

  // Form states
  const [fullName, setFullName] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [isActive, setIsActive] = useState(true)

  async function fetchPatientDetails() {
    setLoading(true)
    try {
      // 1. Fetch patient
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()

      if (patientError) throw patientError
      setPatient(patientData)

      // Initialize form
      setFullName(patientData.full_name)
      setDocumentId(patientData.document_id)
      setPhone(patientData.phone || '')
      setBirthDate(patientData.birth_date || '')
      setIsActive(patientData.is_active ?? true)

      // 2. Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          scheduled_at,
          reason,
          status,
          notes,
          doctors (
            full_name,
            specialty
          )
        `)
        .eq('patient_id', id)
        .order('scheduled_at', { ascending: false })

      if (appointmentsError) throw appointmentsError
      setAppointments((appointmentsData as unknown as Appointment[]) || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'desconocido'
      toast.error(`Error al cargar datos del paciente: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchPatientDetails()
    }
  }, [id])

  async function handleSaveChanges() {
    if (!fullName.trim() || !documentId.trim()) {
      toast.error('Nombre y Documento son obligatorios')
      return
    }

    setSaving(true)
    try {
      // 1. Validar nombre único case-insensitive (excluyendo este paciente)
      const { data: existingPatients, error: checkError } = await supabase
        .from('patients')
        .select('id')
        .ilike('full_name', fullName.trim())
        .neq('id', id)

      if (checkError) throw checkError
      if (existingPatients && existingPatients.length > 0) {
        toast.error(`Ya existe otro paciente registrado con el nombre: "${fullName}"`)
        setSaving(false)
        return
      }

      // 2. Validar documento único (excluyendo este paciente)
      const { data: existingDoc, error: docError } = await supabase
        .from('patients')
        .select('id')
        .eq('document_id', documentId.trim())
        .neq('id', id)

      if (docError) throw docError
      if (existingDoc && existingDoc.length > 0) {
        toast.error(`Ya existe otro paciente registrado con el documento: "${documentId}"`)
        setSaving(false)
        return
      }

      // 3. Guardar cambios
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          full_name: fullName.trim(),
          document_id: documentId.trim(),
          phone: phone.trim() || null,
          birth_date: birthDate || null,
          is_active: isActive
        })
        .eq('id', id)

      if (updateError) throw updateError

      toast.success('Cambios guardados con éxito')
      fetchPatientDetails()
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
        <p className="text-sm text-muted-foreground">Cargando expediente del paciente...</p>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-muted-foreground">No se encontró el paciente.</p>
        <Link href="/pacientes" className="text-primary hover:underline mt-2 inline-block">
          Volver a pacientes
        </Link>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
    return {
      dia: d.getDate().toString().padStart(2, '0'),
      mes: months[d.getMonth()]
    }
  }

  return (
    <div className="p-6 pb-20 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/pacientes">
            <Button variant="outline" size="icon" className="w-10 h-10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] uppercase tracking-widest text-primary font-bold">Expediente Clínico</span>
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-secondary' : 'bg-muted-foreground'}`}></span>
              <span className="text-[11px] text-secondary font-semibold uppercase">
                {isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">{patient.full_name}</h2>
            <p className="text-sm text-muted-foreground">ID: {patient.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => router.push('/pacientes')}>
            <X className="w-4 h-4" />
            Cerrar
          </Button>
          <Button className="gap-2" onClick={handleSaveChanges} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Primary Data */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullNameInput">Nombre Completo</Label>
                  <Input
                    id="fullNameInput"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="docInput">Documento de Identidad</Label>
                  <Input
                    id="docInput"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phoneInput">Teléfono</Label>
                  <Input
                    id="phoneInput"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="birthInput">Fecha de Nacimiento</Label>
                  <Input
                    id="birthInput"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="statusInput">Estado</Label>
                  <select
                    id="statusInput"
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Desactivado</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historial de Citas */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Historial de Citas (Solo Lectura)
              </h3>
            </div>
            <div className="divide-y divide-border">
              {appointments.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Este paciente no registra citas históricas.
                </div>
              ) : (
                appointments.map((cita) => {
                  const { dia, mes } = formatDate(cita.scheduled_at)
                  return (
                    <div key={cita.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                          <span className="text-[10px] font-bold uppercase">{mes}</span>
                          <span className="text-xl font-bold -mt-1">{dia}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{cita.reason}</p>
                          <p className="text-sm text-muted-foreground">
                            {cita.doctors ? `${cita.doctors.full_name} • ${cita.doctors.specialty}` : 'Doctor no asignado'}
                          </p>
                          {cita.notes && <p className="text-xs text-muted-foreground/80 mt-0.5">Nota: {cita.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[11px] text-muted-foreground uppercase font-semibold">Estado</p>
                          <Badge variant="outline" className={
                            cita.status === 'confirmada' ? 'bg-secondary/10 text-secondary border-none' :
                            cita.status === 'completada' ? 'bg-primary/10 text-primary border-none' :
                            cita.status === 'cancelada' ? 'bg-destructive/10 text-destructive border-none' :
                            'bg-accent/10 text-accent border-none'
                          }>
                            {cita.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-primary text-primary-foreground rounded-xl p-6 shadow-md">
            <h4 className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-4">Resumen Clínico</h4>
            <div className="space-y-4">
              <div>
                <p className="text-4xl font-bold leading-tight">{appointments.length}</p>
                <p className="text-sm opacity-90">Citas agendadas</p>
              </div>
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-secondary rounded-full" 
                  style={{ 
                    width: `${appointments.length > 0 ? (appointments.filter(c => c.status === 'completada').length / appointments.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs">
                <span>Tasa de Completadas</span>
                <span className="font-bold">
                  {appointments.length > 0 
                    ? Math.round((appointments.filter(c => c.status === 'completada').length / appointments.length) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
