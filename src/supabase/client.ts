import { createBrowserClient } from '@supabase/ssr'

/**
 * Crea un cliente de Supabase para uso en Client Components ("use client").
 * Gestiona las cookies automáticamente en el navegador.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
