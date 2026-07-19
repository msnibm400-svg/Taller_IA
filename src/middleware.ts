import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware de autenticación.
 * 
 * - Refresca la sesión de Supabase en cada petición, actualizando las cookies.
 * - Redirige a /login si el usuario no está autenticado y accede a una ruta protegida.
 * - Redirige a / si un usuario ya autenticado intenta acceder a /login o /signup.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Pasar las cookies actualizadas al request y a la response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: No escribir lógica entre createServerClient y getUser().
  // Un error aquí puede causar que el usuario sea deslogueado inesperadamente.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname === '/login' || pathname === '/signup'

  // Si no hay sesión y no es una ruta pública → redirigir a /login
  if (!user && !isAuthRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Si hay sesión y está en /login o /signup → redirigir al tablero
  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  // IMPORTANTE: Devolver supabaseResponse para preservar las cookies de sesión.
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Excluir rutas internas de Next.js y archivos estáticos.
     * Aplicar el middleware a todas las demás rutas.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
