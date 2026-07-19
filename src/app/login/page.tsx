import React from 'react';
import { Mail, Lock, Info, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import { login } from '@/app/auth/actions';

interface LoginPageProps {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams;

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-6">
      {/* Main Login Card Block */}
      <main className="w-full max-w-4xl bg-card rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-border">
        {/* Left Side: Login Form */}
        <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center">
          {/* Branding */}
          <div className="mb-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="MedicIA Logo"
              className="h-10 w-auto mb-6 object-contain"
            />
            <h1 className="text-2xl font-semibold text-primary tracking-tight">Bienvenido a MedicIA</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Ingrese sus credenciales para acceder al centro médico.
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
            </div>
          )}
          {message && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-primary">{decodeURIComponent(message)}</p>
            </div>
          )}

          {/* Form — usa Server Action directamente */}
          <form action={login} className="space-y-6">
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
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-white border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" name="remember" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
                <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                  Recordarme
                </span>
              </label>
              <a href="#" className="text-xs font-semibold text-primary hover:underline">
                ¿Olvidó su contraseña?
              </a>
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold py-3.5 rounded-lg transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
            >
              <span>Iniciar sesión</span>
              <LogIn className="h-5 w-5" />
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            ¿No tiene cuenta?{' '}
            <a href="/signup" className="text-primary font-semibold hover:underline">
              Regístrese aquí
            </a>
          </p>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-muted rounded-lg border border-border/30">
            <div className="flex gap-3">
              <Info className="text-primary h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Contacta al administrador si tienes problemas para acceder a la aplicación.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Panel */}
        <div className="hidden md:block md:w-1/2 relative overflow-hidden bg-[#0052CC] min-h-[600px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login-banner.png"
            alt="MedicIA Centro Médico"
            className="w-full h-full object-cover object-top"
          />
        </div>
      </main>
    </div>
  );
}
