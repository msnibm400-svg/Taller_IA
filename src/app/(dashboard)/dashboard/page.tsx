import Link from "next/link";
import { 
  CalendarCheck, 
  Users, 
  Clock, 
  TrendingUp,
  MoreVertical,
  ArrowRight,
  FileText,
  BarChart
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="p-6 pb-20">
      {/* Welcome Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Tablero de Control</h2>
        <p className="text-sm text-muted-foreground">Bienvenido de nuevo, Dr. Garcia. Aquí tienes el resumen de hoy.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="relative overflow-hidden group border-border">
          <CardContent className="p-5">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Citas de hoy</p>
                <h3 className="text-4xl font-bold text-primary">12</h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 relative z-10">
              <span className="text-secondary text-xs font-semibold flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" /> +15%
              </span>
              <span className="text-muted-foreground text-xs font-medium">vs. ayer</span>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <CalendarCheck className="w-24 h-24" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group border-border">
          <CardContent className="p-5">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Pacientes activos</p>
                <h3 className="text-4xl font-bold text-primary">48</h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 relative z-10">
              <span className="text-secondary text-xs font-semibold flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" /> +4
              </span>
              <span className="text-muted-foreground text-xs font-medium">esta semana</span>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <Users className="w-24 h-24" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group border-border">
          <CardContent className="p-5">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Citas pendientes</p>
                <h3 className="text-4xl font-bold text-accent">05</h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 relative z-10">
              <span className="text-muted-foreground text-xs font-medium">Requieren confirmación urgente</span>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <Clock className="w-24 h-24" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments Section */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <h3 className="text-lg font-semibold text-foreground">Próximas citas</h3>
          <Link href="/citas" className="text-primary text-sm font-semibold flex items-center hover:underline">
            Ver todas <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hora</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Row 1 */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">MS</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Maria Sánchez</p>
                      <p className="text-xs text-muted-foreground">ID: #4592</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-foreground">Dr. Ricardo Ruiz</p>
                  <p className="text-xs text-muted-foreground">Cardiología</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">09:30 AM</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-none">Confirmada</Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </td>
              </tr>
              {/* Row 2 */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xs">JL</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Jose López</p>
                      <p className="text-xs text-muted-foreground">ID: #3120</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-foreground">Dra. Elena Vaz</p>
                  <p className="text-xs text-muted-foreground">Pediatría</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">10:15 AM</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="bg-accent/10 text-accent border-none">En espera</Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </td>
              </tr>
              {/* Row 3 */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive font-bold text-xs">AG</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Ana García</p>
                      <p className="text-xs text-muted-foreground">ID: #8832</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-foreground">Dr. Ricardo Ruiz</p>
                  <p className="text-xs text-muted-foreground">Cardiología</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">11:00 AM</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-none">Pendiente</Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex items-center gap-4 group cursor-pointer hover:bg-primary/10 transition-colors">
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-primary mb-1">Registrar Historial</h4>
            <p className="text-sm text-muted-foreground">Acceso rápido para añadir nuevas notas clínicas.</p>
          </div>
        </div>
        <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-6 flex items-center gap-4 group cursor-pointer hover:bg-secondary/10 transition-colors">
          <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
            <BarChart className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-secondary mb-1">Reporte Mensual</h4>
            <p className="text-sm text-muted-foreground">Visualiza las estadísticas de rendimiento clínico.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
