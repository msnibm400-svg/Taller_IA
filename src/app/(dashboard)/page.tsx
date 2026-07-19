'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Users,
  Clock,
  ArrowRight,
  FileText,
  BarChart,
  Loader2,
  PieChart,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/supabase/client'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface Appointment {
  id: string
  scheduled_at: string
  reason: string
  status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
  patients: {
    full_name: string
    document_id: string
  } | null
  doctors: {
    full_name: string
    specialty: string
  } | null
}

interface DoctorOccupation {
  name: string
  specialty: string
  count: number
}

const statusBadge: Record<string, string> = {
  confirmada: "bg-secondary/10 text-secondary border-none",
  pendiente: "bg-accent/10 text-accent border-none",
  completada: "bg-primary/10 text-primary border-none",
  cancelada: "bg-destructive/10 text-destructive border-none",
}

const statusColor: Record<string, string> = {
  pendiente: "bg-amber-500",
  confirmada: "bg-sky-500",
  completada: "bg-emerald-500",
  cancelada: "bg-rose-500",
}

export default function DashboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  // User Profile
  const [profileName, setProfileName] = useState('')
  const [profileRole, setProfileRole] = useState('')
  const [doctorRecordId, setDoctorRecordId] = useState<string | null>(null)

  // Metrics
  const [citasHoy, setCitasHoy] = useState(0)
  const [pacientesActivos, setPacientesActivos] = useState(0)
  const [citasPendientes, setCitasPendientes] = useState(0)

  // Next Appointments
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])

  // Chart States
  const [chartCitasEstado, setChartCitasEstado] = useState({ pendiente: 0, confirmada: 0, completada: 0, cancelada: 0 })
  const [chartCitasDia, setChartCitasDia] = useState<{ label: string; count: number }[]>([])
  const [chartDoctorOcupacion, setChartDoctorOcupacion] = useState<DoctorOccupation[]>([])

  async function fetchDashboardData() {
    setLoading(true)
    try {
      // 1. Get logged in user & profile
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()
      
      if (profileErr) throw profileErr
      setProfileName(profile?.full_name || '')
      const role = profile?.role || ''
      setProfileRole(role)

      // 2. Resolve Doctor Record ID if user is a doctor
      let docId: string | null = null
      if (role === 'doctor') {
        const { data: docData } = await supabase
          .from('doctors')
          .select('id')
          .eq('profile_id', user.id)
          .single()
        if (docData) {
          docId = docData.id
          setDoctorRecordId(docData.id)
        }
      }

      // 3. Fetch metrics
      // Today range
      const today = new Date()
      const startOfDay = new Date(today.setHours(0,0,0,0)).toISOString()
      const endOfDay = new Date(today.setHours(23,59,59,999)).toISOString()

      // Today's appointments count
      let citasHoyQuery = supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_at', startOfDay)
        .lte('scheduled_at', endOfDay)
      if (role === 'doctor' && docId) {
        citasHoyQuery = citasHoyQuery.eq('doctor_id', docId)
      }
      const { count: countHoy } = await citasHoyQuery
      setCitasHoy(countHoy || 0)

      // Active Patients
      const { count: countPats } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      setPacientesActivos(countPats || 0)

      // Pending appointments count
      let citasPendientesQuery = supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendiente')
      if (role === 'doctor' && docId) {
        citasPendientesQuery = citasPendientesQuery.eq('doctor_id', docId)
      }
      const { count: countPendientes } = await citasPendientesQuery
      setCitasPendientes(countPendientes || 0)

      // 4. Fetch upcoming 5 appointments
      const nowStr = new Date().toISOString()
      let upcomingQuery = supabase
        .from('appointments')
        .select(`
          id,
          scheduled_at,
          reason,
          status,
          patients (
            full_name,
            document_id
          ),
          doctors (
            full_name,
            specialty
          )
        `)
        .gte('scheduled_at', nowStr)
        .order('scheduled_at', { ascending: true })
        .limit(5)
      
      if (role === 'doctor' && docId) {
        upcomingQuery = upcomingQuery.eq('doctor_id', docId)
      }

      const { data: upcomingData, error: upcomingErr } = await upcomingQuery
      if (upcomingErr) throw upcomingErr
      setUpcomingAppointments((upcomingData as unknown as Appointment[]) || [])

      // 5. Fetch weekly data for charts
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      sevenDaysAgo.setHours(0, 0, 0, 0)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString()

      let weeklyQuery = supabase
        .from('appointments')
        .select(`
          id,
          status,
          scheduled_at,
          doctor_id,
          doctors (
            full_name,
            specialty
          )
        `)
        .gte('scheduled_at', sevenDaysAgoStr)

      if (role === 'doctor' && docId) {
        weeklyQuery = weeklyQuery.eq('doctor_id', docId)
      }

      const { data: weeklyData, error: weeklyErr } = await weeklyQuery
      if (weeklyErr) throw weeklyErr

      const weekList = weeklyData || []

      // Chart 1: Citas por estado
      const statesCounts = { pendiente: 0, confirmada: 0, completada: 0, cancelada: 0 }
      weekList.forEach(app => {
        if (app.status in statesCounts) {
          statesCounts[app.status as keyof typeof statesCounts]++
        }
      })
      setChartCitasEstado(statesCounts)

      // Chart 2: Citas por día de la semana (últimos 7 días)
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d
      }).reverse()

      const dayList = last7Days.map(day => {
        const dayDateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
        const count = weekList.filter(app => {
          if (!app.scheduled_at) return false
          const appDate = new Date(app.scheduled_at)
          const appDateStr = `${appDate.getFullYear()}-${String(appDate.getMonth() + 1).padStart(2, '0')}-${String(appDate.getDate()).padStart(2, '0')}`
          return appDateStr === dayDateStr
        }).length
        const label = day.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
        return { label, count }
      })
      setChartCitasDia(dayList)

      // Chart 3: Ocupación por doctor
      const docCounts: Record<string, { name: string; specialty: string; count: number }> = {}
      weekList.forEach(app => {
        if (app.doctors) {
          const dId = app.doctor_id
          interface DocInfo {
            full_name: string
            specialty: string
          }
          const doc = app.doctors as unknown as DocInfo
          if (!docCounts[dId]) {
            docCounts[dId] = {
              name: doc.full_name,
              specialty: doc.specialty,
              count: 0
            }
          }
          docCounts[dId].count++
        }
      })
      const doctorOccupations = Object.values(docCounts).sort((a, b) => b.count - a.count)
      setChartDoctorOcupacion(doctorOccupations)

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'desconocido'
      toast.error(`Error al cargar datos del panel: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  // Chart data calculations
  const totalCitasSemana = chartCitasEstado.pendiente + chartCitasEstado.confirmada + chartCitasEstado.completada + chartCitasEstado.cancelada
  const maxDayCount = Math.max(...chartCitasDia.map(d => d.count), 1)
  const maxDocCount = Math.max(...chartDoctorOcupacion.map(d => d.count), 1)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Inicializando tablero clínico...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Welcome Header */}
      <div className="animate-in fade-in duration-300">
        <h2 className="text-2xl font-semibold text-foreground">Tablero de Control</h2>
        <p className="text-sm text-muted-foreground">
          Bienvenido de nuevo, {profileName || 'Usuario'}. Aquí tienes el resumen de hoy.
        </p>
      </div>

      {/* Metric Cards (Bento-style Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Citas de hoy */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Citas de hoy</p>
              <h3 className="text-4xl font-bold text-primary">{citasHoy}</h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 relative z-10">
            <span className="text-secondary text-[11px] font-medium">Programadas para hoy</span>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <Calendar className="w-24 h-24" />
          </div>
        </div>

        {/* Pacientes activos */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Pacientes activos</p>
              <h3 className="text-4xl font-bold text-primary">{pacientesActivos}</h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 relative z-10">
            <span className="text-secondary text-[11px] font-medium">Registrados en el centro</span>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <Users className="w-24 h-24" />
          </div>
        </div>

        {/* Citas pendientes */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Citas pendientes</p>
              <h3 className="text-4xl font-bold text-destructive">{citasPendientes}</h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 relative z-10">
            <span className="text-muted-foreground text-[11px] font-medium">Requieren atención/confirmación</span>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <Clock className="w-24 h-24" />
          </div>
        </div>
      </div>

      {/* NEW: Analytics Section with Bento-style SVG Charts */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Análisis y Estadísticas (Últimos 7 días)</h3>
          <p className="text-xs text-muted-foreground">Datos consolidados de la actividad del centro médico.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Citas por Estado */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
              <PieChart className="w-5 h-5 text-primary" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Citas por Estado</h4>
                <p className="text-[11px] text-muted-foreground">Distribución actual de las citas</p>
              </div>
            </div>

            {totalCitasSemana === 0 ? (
              <div className="flex-1 flex items-center justify-center py-8 text-xs text-muted-foreground">
                No hay citas registradas esta semana.
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center space-y-4">
                {Object.entries(chartCitasEstado).map(([status, count]) => {
                  const pct = totalCitasSemana > 0 ? Math.round((count / totalCitasSemana) * 100) : 0
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="capitalize font-medium text-foreground flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${statusColor[status]}`}></span>
                          {status}
                        </span>
                        <span className="text-muted-foreground font-semibold">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${statusColor[status]} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Chart 2: Volumen de Citas por Día */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
              <BarChart className="w-5 h-5 text-secondary" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Volumen de Citas</h4>
                <p className="text-[11px] text-muted-foreground">Cantidad diaria de consultas</p>
              </div>
            </div>

            <div className="flex-1 flex items-end justify-between h-40 px-2 pt-6">
              {chartCitasDia.map((d, i) => {
                const barHeight = maxDayCount > 0 ? (d.count / maxDayCount) * 110 : 0
                const resolvedHeight = d.count > 0 ? Math.max(barHeight, 8) : 2
                return (
                  <div key={i} className="flex flex-col items-center flex-1 group">
                    <div className="relative w-full flex justify-center">
                      <span className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md z-20 whitespace-nowrap">
                        {d.count} {d.count === 1 ? 'cita' : 'citas'}
                      </span>
                    </div>
                    <div
                      className="w-5 bg-secondary/20 hover:bg-secondary rounded-t-sm transition-all duration-300 relative overflow-hidden"
                      style={{ height: `${resolvedHeight}px` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-secondary/30 to-secondary opacity-60"></div>
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-2 truncate w-full text-center">
                      {d.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Chart 3: Ocupación por Doctor */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
              <Activity className="w-5 h-5 text-accent" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Carga por Doctor</h4>
                <p className="text-[11px] text-muted-foreground">Distribución de citas asignadas</p>
              </div>
            </div>

            {chartDoctorOcupacion.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-8 text-xs text-muted-foreground">
                No hay doctores asignados con citas esta semana.
              </div>
            ) : (
              <div className="flex-1 space-y-4 max-h-48 overflow-y-auto pr-1">
                {chartDoctorOcupacion.slice(0, 4).map((doc, idx) => {
                  const pct = (doc.count / maxDocCount) * 100
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-foreground truncate max-w-[150px]">{doc.name}</p>
                          <p className="text-[9px] text-muted-foreground leading-none">{doc.specialty}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">
                          {doc.count} {doc.count === 1 ? 'cita' : 'citas'}
                        </span>
                      </div>
                      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointments Section */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <h3 className="text-lg font-semibold text-foreground">Próximas citas</h3>
          <Link href="/citas" className="text-primary text-xs font-semibold flex items-center hover:underline">
            Ver todas <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hora</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {upcomingAppointments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-sm text-muted-foreground">
                    No hay próximas citas programadas.
                  </td>
                </tr>
              ) : (
                upcomingAppointments.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {c.patients ? getInitials(c.patients.full_name) : '??'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{c.patients?.full_name || 'Desconocido'}</p>
                          <p className="text-[11px] text-muted-foreground">Doc: {c.patients?.document_id || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">{c.doctors?.full_name || 'Desconocido'}</p>
                      <p className="text-[11px] text-muted-foreground">{c.doctors?.specialty || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{formatTime(c.scheduled_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`text-[11px] font-bold ${statusBadge[c.status]}`}>
                        {c.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/citas" className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex items-center gap-4 group cursor-pointer hover:bg-primary/10 transition-colors">
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xl font-semibold text-primary mb-1">Registrar Citas</h4>
            <p className="text-sm text-muted-foreground">Acceso rápido para añadir y programar nuevas consultas.</p>
          </div>
        </Link>

        <Link href="/pacientes" className="bg-secondary/5 border border-secondary/20 rounded-xl p-6 flex items-center gap-4 group cursor-pointer hover:bg-secondary/10 transition-colors">
          <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xl font-semibold text-secondary mb-1">Base de Pacientes</h4>
            <p className="text-sm text-muted-foreground">Revisar expedientes, historiales y fichas médicas.</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
