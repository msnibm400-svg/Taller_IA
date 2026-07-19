import { createClient } from '@supabase/supabase-js'

/**
 * Cliente de administración de Supabase.
 * Utiliza la llave de servicio de Supabase (service_role_key) para omitir RLS.
 * NUNCA debe ser expuesto ni usado en el navegador o en componentes de cliente ("use client").
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // fallback seguro para evitar crash en build
)
