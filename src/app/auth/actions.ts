'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/supabase/server'
import { supabaseAdmin } from '@/supabase/admin'
import { User } from '@supabase/supabase-js'

/**
 * Server Action: Inicia sesión con email y contraseña.
 */
export async function login(formData: FormData) {
  const supabase = await createClient()

  const credentials = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword(credentials)

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // Verificar si está activo después de loguear para evitar consultas no seguras
  if (signInData?.user) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_active')
      .eq('id', signInData.user.id)
      .single()

    if (profile && profile.is_active === false) {
      await supabase.auth.signOut()
      return redirect(`/login?error=${encodeURIComponent('Esta cuenta ha sido desactivada.')}`)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * Server Action: Registra un nuevo usuario con email y contraseña.
 */
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const credentials = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('full_name') as string,
      },
    },
  }

  const { error } = await supabase.auth.signUp(credentials)

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  // Redirigir al login con un mensaje de confirmación
  redirect('/login?message=Revisa%20tu%20correo%20para%20confirmar%20tu%20cuenta')
}

/**
 * Server Action: Cierra la sesión del usuario actual.
 */
export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Server Action: Invita a un nuevo usuario del staff.
 * Solo puede ser ejecutada por un Administrador.
 */
export async function inviteStaffUser(name: string, email: string, role: 'admin' | 'doctor' | 'recepcionista') {
  const supabase = await createClient()

  // 1. Validar que la sesión actual sea de un Administrador
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: 'No autenticado' }
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    return { error: 'Acceso denegado. Solo administradores pueden invitar usuarios.' }
  }

  // Verificar si la service role key está configurada
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your_')) {
    return { error: 'Error de configuración: Por favor, introduce tu SUPABASE_SERVICE_ROLE_KEY real en el archivo .env.local para permitir el envío de invitaciones.' }
  }

  // 2. Validar que el correo no esté ya registrado
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) {
    return { error: `Error al verificar correos: ${listError.message}` }
  }

  const emailExists = usersData.users.some(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  )
  if (emailExists) {
    return { error: 'El correo electrónico ya está registrado en el sistema.' }
  }

  // 3. Invitar al usuario por correo
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: name,
    }
  })

  if (inviteError) {
    return { error: `Error al enviar invitación: ${inviteError.message}` }
  }

  const invitedUser = inviteData.user
  if (!invitedUser) {
    return { error: 'No se pudo crear el registro de invitación.' }
  }

  // 4. Actualizar/Insertar perfil en public.profiles
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: invitedUser.id,
      full_name: name,
      role: role,
      is_active: true
    })

  if (profileError) {
    return { error: `Error al configurar perfil: ${profileError.message}` }
  }

  // 5. Si es doctor, crear la fila correspondiente en public.doctors
  if (role === 'doctor') {
    const { error: doctorError } = await supabaseAdmin
      .from('doctors')
      .insert({
        profile_id: invitedUser.id,
        full_name: name,
        specialty: 'General',
        is_active: true
      })

    if (doctorError) {
      return { error: `Error al crear registro de doctor: ${doctorError.message}` }
    }
  }

  revalidatePath('/usuarios')
  return { success: true }
}

/**
 * Server Action: Desactiva o reactiva a un usuario del staff.
 * Solo puede ser ejecutada por un Administrador.
 */
export async function toggleUserActive(userId: string, is_active: boolean) {
  const supabase = await createClient()

  // 1. Validar que la sesión actual sea de un Administrador
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: 'No autenticado' }
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    return { error: 'Acceso denegado. Solo administradores pueden modificar usuarios.' }
  }

  if (currentUser.id === userId) {
    return { error: 'No puedes desactivar tu propia cuenta.' }
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your_')) {
    return { error: 'Error de configuración: Se requiere la SUPABASE_SERVICE_ROLE_KEY real en el archivo .env.local para suspender usuarios en auth.' }
  }

  // 2. Actualizar estado en public.profiles
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ is_active })
    .eq('id', userId)

  if (profileError) {
    return { error: `Error al actualizar perfil: ${profileError.message}` }
  }

  // 3. Banear o desbanear en Supabase Auth
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: is_active ? 'none' : '876000h' // 100 años para desactivación efectiva
  })

  if (authError) {
    return { error: `Error al actualizar estado de autenticación: ${authError.message}` }
  }

  revalidatePath('/usuarios')
  return { success: true }
}

/**
 * Server Action: Lista a todos los usuarios del staff cruzando profiles y auth.users.
 * Solo puede ser ejecutada por un Administrador.
 */
export async function listStaffUsers() {
  const supabase = await createClient()

  // 1. Validar que la sesión actual sea de un Administrador
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    throw new Error('No autenticado')
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    throw new Error('Acceso denegado. Solo administradores pueden listar usuarios.')
  }

  // 2. Fetch all users from auth.users (para ver last_sign_in_at/pending invitation)
  let authData = { users: [] as User[] }
  let hasAdminPrivileges = false
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your_')) {
    try {
      const { data, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      if (!authError && data) {
        authData = data
        hasAdminPrivileges = true
      }
    } catch (e) {
      console.warn("No se pudieron listar los usuarios de auth, se usará el fallback de profiles:", e)
    }
  }

  // 3. Fetch all profiles from public.profiles usando el cliente de usuario (seguro RLS si es admin)
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('*')

  if (profilesError) throw new Error(profilesError.message)

  // 4. Mapear la información combinada
  interface ProfileRow {
    id: string
    full_name: string
    role: 'admin' | 'doctor' | 'recepcionista'
    is_active: boolean | null
    created_at: string
  }

  const profilesList = (profilesData as unknown as ProfileRow[]) || []

  const combined = profilesList.map((p) => {
    const authUser = hasAdminPrivileges ? authData.users.find((u) => u.id === p.id) : null
    return {
      id: p.id,
      full_name: p.full_name,
      role: p.role,
      is_active: p.is_active ?? true,
      email: authUser?.email || (p.id === currentUser.id ? currentUser.email : 'correo@medicia.com'),
      pending: authUser ? !authUser.last_sign_in_at : false,
      created_at: p.created_at
    }
  })

  return combined
}


