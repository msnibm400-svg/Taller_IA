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
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmzx3zQOPO8oRFEGwl08rr-pSOK-49BFzyU5CXOmmCjRNcxH5buX68SgRcPYqGtM-ACsGBrTmxhRxOojZI7rUsmSo_oDoNQK_Ay6Kt0jtGlSlQht3zvVfY_049aBz-6QChUTRFkR_T02KgikJRUFX1b3onGa5wU-Vvq3-FGHB1SBL3ImKPRijP7cDpYlHOSS7pffLLxJqWLMuYPG7ahfFfbk8aB_Ucxti--nJAC6_yrOQTq4cTJ5Mqc4lT72TPE-Ul"
              alt="MedicIA Logo"
              className="h-12 w-auto mb-6"
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
                Contacta a tu administrador si tienes problemas para acceder al tablero.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Panel */}
        <div className="hidden md:block md:w-1/2 relative bg-primary overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className="relative h-full w-full flex flex-col items-center justify-center p-12 text-center text-white">
            <div className="relative z-10 space-y-8">
              <div className="w-full aspect-square max-w-[320px] mx-auto rounded-full bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0s_jj5rK2lxM7dIydM3jS58Kj2corcHRV4_jFdQPardUkX0s7iC1t3-3BPey9NAw5ZEkoqetFUQVKdxijsUvtcbbLL1UkKcjmF2K-4YPRWnbRjEfgK4GqIRIQpeoy9e0jVNrY-ldwIE-flYmB3fv9ydrvnr1agewc0bOsfYNc7xeh_lGu9CHoEyhBeucFDqzDXYXVpLbYsd7h2UKmoT6tap5LBN4Tb8d1pu7jzp66p5ULhVR5VEE"
                  alt="Doctor portrait"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-3">
                <h2 className="text-4xl font-bold">Centro Médico</h2>
                <p className="text-lg text-primary-foreground/80 max-w-xs mx-auto">
                  Gestionando la salud del futuro con inteligencia y eficiencia operativa.
                </p>
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
