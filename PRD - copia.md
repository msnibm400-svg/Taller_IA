# PRD — MedicIA
**Gestor de citas y pacientes para centros médicos pequeños**
Versión 1.0 · MVP

---

## 1. Resumen ejecutivo

**MedicIA** es una aplicación web que permite a un centro médico pequeño (clínica, consultorio o policlínico) administrar su operación diaria: pacientes, doctores/especialidades y citas médicas, con un tablero de métricas básicas para el personal administrativo.

El MVP prioriza el flujo mínimo viable: **agendar, ver y actualizar citas**, con control de acceso por rol (admin, doctor, recepción).

**Stack obligatorio:**
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + PostgreSQL + RLS)
- Despliegue en Vercel

**Fuera de alcance del MVP:** historia clínica electrónica, facturación, notificaciones por correo/SMS, pagos, telemedicina, reportes avanzados, multi-sede.

---

## 2. Personas y casos de uso

| Persona | Rol en el sistema | Necesidad principal |
|---|---|---|
| **Rosa, recepcionista** | `recepcionista` | Registrar pacientes y agendar/reprogramar citas rápidamente |
| **Dr. Álvarez, médico** | `doctor` | Ver su agenda del día y marcar citas como completadas |
| **Marco, administrador** | `admin` | Gestionar doctores, ver métricas generales del centro |

**Casos de uso clave:**
1. Recepción registra un paciente nuevo y le agenda una cita.
2. Un doctor consulta sus citas del día y actualiza su estado.
3. El administrador visualiza el volumen de citas y pacientes activos.

---

## 3. Historias de usuario

1. **Como** recepcionista, **quiero** iniciar sesión con correo y contraseña, **para** acceder solo a las funciones que me corresponden.
2. **Como** recepcionista, **quiero** registrar un paciente con sus datos básicos, **para** poder asociarlo a citas futuras.
3. **Como** recepcionista, **quiero** crear una cita indicando paciente, doctor, fecha/hora y motivo, **para** organizar la agenda del centro.
4. **Como** doctor, **quiero** ver solo mis citas del día, **para** organizar mi jornada sin ruido de otras agendas.
5. **Como** doctor o recepcionista, **quiero** cambiar el estado de una cita (pendiente, confirmada, completada, cancelada), **para** reflejar el avance real de la atención.
6. **Como** administrador, **quiero** dar de alta/baja doctores y sus especialidades, **para** mantener actualizado el staff médico.
7. **Como** administrador, **quiero** ver un tablero con métricas básicas (citas de hoy, pacientes totales, citas por estado), **para** tener visibilidad operativa del centro.
8. **Como** administrador, **quiero** crear cuentas de acceso para el personal del centro (doctor o recepcionista), **para** que puedan ingresar al sistema con sus propias credenciales. *(No existe autorregistro/signup público: el acceso es exclusivo para staff dado de alta manualmente por un administrador.)*

---

## 4. Modelo de datos — SQL DDL

```sql
-- =========================================
-- ENUMS
-- =========================================
create type user_role as enum ('admin', 'doctor', 'recepcionista');
create type appointment_status as enum ('pendiente', 'confirmada', 'completada', 'cancelada');

-- =========================================
-- PROFILES (extiende auth.users)
-- =========================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'recepcionista',
  created_at timestamptz not null default now()
);

-- =========================================
-- DOCTORS
-- =========================================
create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  specialty text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================================
-- PATIENTS
-- =========================================
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  document_id text not null unique,
  phone text,
  birth_date date,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

-- =========================================
-- APPOINTMENTS
-- =========================================
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  scheduled_at timestamptz not null,
  reason text not null,
  status appointment_status not null default 'pendiente',
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create index idx_appointments_doctor_date on public.appointments (doctor_id, scheduled_at);
create index idx_appointments_status on public.appointments (status);
create index idx_patients_document on public.patients (document_id);
```

**Relaciones:** `profiles 1—1 auth.users` · `doctors N—1 profiles` (opcional) · `appointments N—1 patients` · `appointments N—1 doctors`.

---

## 5. Políticas RLS sugeridas

```sql
alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;

-- PROFILES: cada usuario ve/edita su propio perfil; admin ve todos
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

-- DOCTORS: lectura para todo usuario autenticado; escritura solo admin
create policy "doctors_select_authenticated"
  on public.doctors for select
  using (auth.role() = 'authenticated');

create policy "doctors_write_admin"
  on public.doctors for all
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

-- PATIENTS: lectura/escritura para staff autenticado (admin, doctor, recepcionista)
create policy "patients_all_staff"
  on public.patients for all
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
  ));

-- APPOINTMENTS: recepción y admin ven todo; doctor solo ve/edita las suyas
create policy "appointments_select_scoped"
  on public.appointments for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','recepcionista'))
    or doctor_id in (select id from public.doctors where profile_id = auth.uid())
  );

create policy "appointments_insert_staff"
  on public.appointments for insert
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','recepcionista'))
  );

create policy "appointments_update_scoped"
  on public.appointments for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','recepcionista'))
    or doctor_id in (select id from public.doctors where profile_id = auth.uid())
  );
```

---

## 6. Wireframes textuales por pantalla

**`/login`**
- Formulario: campo correo, campo contraseña, botón "Ingresar".
- Mensaje de error inline si las credenciales fallan.

**`/dashboard`**
- 3 tarjetas de métricas: *Citas hoy*, *Pacientes activos*, *Citas pendientes*.
- Lista compacta: próximas 5 citas (paciente, doctor, hora, estado).

**`/pacientes`**
- Tabla: nombre, documento, teléfono, fecha nacimiento.
- Botón "Nuevo paciente" → modal con formulario (shadcn `Dialog`).
- Buscador por nombre/documento.
- Cada fila es clickeable y abre el detalle del paciente.

**`/pacientes/[id]`** *(detalle de paciente)*
- Encabezado con nombre completo y documento.
- Datos editables in situ: teléfono, fecha de nacimiento.
- Botón "Guardar cambios".
- Sección "Historial de citas" (solo lectura): fecha, doctor, motivo, badge de estado.

**`/citas`**
- Vista tipo lista/calendario simple, filtrable por doctor y fecha.
- Cada fila: paciente, doctor, hora, motivo, badge de estado (color por estado), acción "Cambiar estado".
- Botón "Nueva cita" → formulario (paciente vía búsqueda, doctor vía select, fecha/hora, motivo).

**`/doctores`** *(solo admin)*
- Tabla: nombre, especialidad, estado (activo/inactivo).
- Botón "Nuevo doctor" → modal con formulario simple (nombre, especialidad).
- Buscador por nombre/especialidad.
- Cada fila es clickeable y abre el detalle del doctor.

**`/doctores/[id]`** *(detalle de doctor, solo admin)*
- Encabezado con nombre completo y especialidad.
- Datos editables in situ: nombre completo, especialidad.
- Switch para activar/desactivar (no eliminar).
- Botón "Guardar cambios".
- Sección "Próximas citas asignadas" (solo lectura): fecha, paciente, motivo, badge de estado.

**`/usuarios`** *(solo admin)*
- Tabla: nombre completo, correo, rol (badge: Admin/Doctor/Recepcionista), estado (Activo/Invitación pendiente).
- Buscador por nombre o correo.
- Botón "Nuevo usuario" → modal con formulario (nombre completo, correo, selector de rol) y botón "Enviar invitación".
- Acción por fila para desactivar/reactivar usuario (no eliminar).

---

## 7. Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # solo uso en server actions/route handlers
NEXT_PUBLIC_SITE_URL=
```

---

## 8. Criterios de aceptación por funcionalidad

**Login (Supabase Auth)**
- Un usuario con credenciales válidas accede al dashboard.
- Credenciales inválidas muestran error sin exponer detalles del sistema.
- Rutas protegidas redirigen a `/login` si no hay sesión activa.
- No existe opción de autorregistro (signup) visible ni accesible en la pantalla de login; el self-signup está deshabilitado a nivel de Supabase Auth.

**Gestión de usuarios / creación de cuentas de staff (por administrador)**
- Solo un usuario con rol `admin` puede acceder a la pantalla `/usuarios` y crear cuentas nuevas de acceso (doctor o recepcionista).
- El formulario "Nuevo usuario" requiere nombre completo, correo y rol; valida que el correo no esté ya registrado antes de enviar la invitación.
- Al confirmar, se envía una invitación por correo (`inviteUserByEmail`) en vez de generar una contraseña manualmente; el nuevo usuario define su propia contraseña al aceptar la invitación.
- Al crearse el usuario en `auth.users`, se dispara el trigger de perfil automático que genera la fila correspondiente en `profiles`; el rol seleccionado en el formulario se asigna inmediatamente después.
- El usuario puede iniciar sesión una vez que acepta la invitación y define su contraseña.
- El admin puede desactivar/reactivar un usuario desde la tabla, sin eliminarlo.

**Gestión de pacientes**
- Se puede crear un paciente con nombre y documento obligatorios; el documento es único (constraint `unique`).
- La lista de pacientes es visible para cualquier rol autenticado.

**Gestión de doctores**
- Solo `admin` puede crear/editar/desactivar doctores.
- Un doctor inactivo no aparece como opción al crear una cita nueva.
- Al seleccionar un doctor de la lista, se muestra su detalle con datos editables y sus próximas citas asignadas (solo lectura).

**Gestión de citas**
- Una cita requiere paciente, doctor, fecha/hora y motivo.
- Un `doctor` solo puede ver y actualizar el estado de sus propias citas (validado por RLS).
- `admin` y `recepcionista` pueden crear, ver y reprogramar cualquier cita.
- El cambio de estado se refleja de inmediato en la vista de lista.

**Tablero de métricas**
- "Citas hoy" cuenta únicamente citas con `scheduled_at` en el día actual.
- "Pacientes activos" refleja el conteo total de la tabla `patients`.
- Las métricas cargan en menos de 2s con datos de hasta 5,000 registros (uso de índices definidos en la sección 4).

---

*Fin del documento — MVP scope, listo para sprint de implementación.*
