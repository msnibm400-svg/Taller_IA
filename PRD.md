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

## 6. Wireframes textuales por pantalla

**`/login`**
- Formulario: campo correo, campo contraseña, botón "Ingresar".
- Mensaje de error inline si las credenciales fallan.

**`/` (Tablero Principal)**
- 3 tarjetas de métricas: *Citas hoy*, *Pacientes activos*, *Citas pendientes*.
- 3 gráficos dinámicos Bento-style (SVG nativos):
  - *Citas por Estado*: Distribución porcentual con barras horizontales de colores.
  - *Volumen de Citas*: Barras verticales con hover tooltips clasificado por fecha local.
  - *Carga por Doctor*: Barras de progreso de citas asignadas para balancear la carga del staff.
- Lista compacta: próximas 5 citas (paciente, doctor, hora, estado).
- Enlace rápido para registrar citas y acceder a la base de pacientes.

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

**Tablero de métricas y analítica**
- "Citas hoy" cuenta únicamente citas con `scheduled_at` en el día actual.
- "Pacientes activos" refleja el conteo total de la tabla `patients`.
- Las métricas y gráficos cargan de forma asíncrona y fluida en menos de 2s.
- Los gráficos Bento-style se adaptan al rol: los doctores solo visualizan sus estadísticas y cargas asignadas, mientras que administradores y recepcionistas ven consolidados globales.
- La clasificación de citas en el gráfico de Volumen se basa estrictamente en la **zona horaria local del navegador** del usuario (clasificando por fecha local en vez de UTC) para evitar desfases de día.
- Las alturas de las barras verticales del gráfico se definen en píxeles (`px`) absolutos calculados para evitar problemas de colapso en pantallas de tamaño variable.

---

*Fin del documento — MVP scope, listo para sprint de implementación.*
