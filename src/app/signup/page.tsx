import React from 'react';
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { signup } from '@/app/auth/actions';

interface SignupPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error } = await searchParams;

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-6">
      <main className="w-full max-w-4xl bg-card rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-border">
        {/* Left Side: Signup Form */}
        <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center">
          {/* Branding */}
          <div className="mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="MedicIA Logo"
              className="h-10 w-auto mb-6 object-contain"
            />
            <h1 className="text-2xl font-semibold text-primary tracking-tight">Crear una cuenta</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Regístrese para acceder al sistema de gestión médica.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
            </div>
          )}

          {/* Form — usa Server Action directamente */}
          <form action={signup} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="full_name" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  required
                  placeholder="Dr. Nombre Apellido"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="ejemplo@medicia.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold py-3.5 rounded-lg transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              <span>Crear cuenta</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            ¿Ya tiene cuenta?{' '}
            <a href="/login" className="text-primary font-semibold hover:underline">
              Iniciar sesión
            </a>
          </p>
        </div>

        {/* Right Side: Visual Panel */}
        <div className="hidden md:block md:w-1/2 relative bg-primary overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className="relative h-full w-full flex flex-col items-center justify-center p-12 text-center text-white">
            <div className="relative z-10 space-y-8">
              {/* Feature Highlights */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold leading-tight">
                  Gestión médica<br />inteligente
                </h2>
                <div className="space-y-4 text-left max-w-xs">
                  {[
                    { icon: '🏥', title: 'Historial clínico', desc: 'Accede a la historia de cada paciente en segundos.' },
                    { icon: '📅', title: 'Agenda integrada', desc: 'Gestiona citas con doctores y especialistas.' },
                    { icon: '🤖', title: 'Asistente IA', desc: 'Insights clínicos automatizados para mejores decisiones.' },
                  ].map((feature) => (
                    <div key={feature.title} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-lg shrink-0">
                        {feature.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{feature.title}</p>
                        <p className="text-xs text-primary-foreground/70 mt-0.5">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute bottom-10 left-0 right-0">
              <div className="flex items-center justify-center gap-4 opacity-60">
                <div className="h-[1px] w-8 bg-white"></div>
                <span className="text-xs uppercase tracking-widest font-medium">MedicIA Ecosystem</span>
                <div className="h-[1px] w-8 bg-white"></div>
              </div>
            </div>
          </div>
          <div className="absolute top-[-5%] right-[-5%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-black/10 rounded-full blur-3xl"></div>
        </div>
      </main>
    </div>
  );
}
