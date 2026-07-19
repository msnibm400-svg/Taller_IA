# DESIGN.md — MedicIA

> Fuente de verdad visual para el diseño e implementación de la interfaz de **MedicIA**, plataforma digital para centros médicos.
> Este documento está pensado para ser consumido por herramientas de generación de UI (Stitch MCP, Antigravity) y por cualquier desarrollador o diseñador que trabaje en el producto.

---

## 1. Filosofía de diseño

MedicIA debe transmitir **confianza clínica** sin caer en la frialdad institucional típica del software médico. La referencia visual combina:

- **Notion**: tipografía cómoda de leer, espacios en blanco generosos, jerarquía clara de contenido.
- **Linear**: precisión geométrica, microinteracciones sutiles, paleta contenida, sensación de producto "rápido" y moderno.

Principios rectores:

1. **Claridad clínica primero.** La información crítica (prioridad, alertas, estados) nunca compite visualmente con elementos decorativos.
2. **Calma, no aburrimiento.** Uso de color con propósito, no decoración gratuita.
3. **Accesibilidad no negociable.** Contraste AA mínimo en todos los estados y modos.
4. **Consistencia sistemática.** Todo tamaño, espacio y color proviene de una escala definida, nunca de valores arbitrarios.

---

## 2. Paleta de colores

### 2.1 Colores primarios

| Token | Hex (Light) | Hex (Dark) | Uso |
|---|---|---|---|
| `color-primary` | `#2F6FED` | `#5B8DF6` | Acciones principales, links, foco |
| `color-primary-hover` | `#265ACB` | `#7BA3F8` | Hover/active sobre primario |
| `color-primary-subtle` | `#EAF1FE` | `#16233D` | Fondos suaves, chips activos |

### 2.2 Color secundario

| Token | Hex (Light) | Hex (Dark) | Uso |
|---|---|---|---|
| `color-secondary` | `#0EA5A4` | `#2DD4CF` | Elementos de apoyo, gráficos, badges informativos |
| `color-secondary-subtle` | `#E6F7F6` | `#0F2A29` | Fondos secundarios |

### 2.3 Color de acento

| Token | Hex (Light) | Hex (Dark) | Uso |
|---|---|---|---|
| `color-accent` | `#8B5CF6` | `#A78BFA` | Elementos destacados, IA/insights, badges "Nuevo" |

### 2.4 Semáforo de prioridad clínica

Sistema de 4 niveles, usado en triage, alertas y estados de pacientes. Debe ser reconocible incluso sin texto (forma + color).

| Nivel | Token | Hex (Light) | Hex (Dark) | Significado |
|---|---|---|---|---|
| Crítico | `color-priority-critical` | `#DC2626` | `#F87171` | Atención inmediata / emergencia |
| Alto | `color-priority-high` | `#EA580C` | `#FB923C` | Urgente, atender en breve |
| Medio | `color-priority-medium` | `#EAB308` | `#FACC15` | Programado, requiere seguimiento |
| Bajo | `color-priority-low` | `#16A34A` | `#4ADE80` | Estable / rutinario |

> **Regla de accesibilidad**: el semáforo nunca debe ser el único indicador. Acompañar siempre con ícono o etiqueta de texto (ej. "Crítico", "Estable") para usuarios con daltonismo.

### 2.5 Neutrales (base de UI)

| Token | Hex (Light) | Hex (Dark) |
|---|---|---|
| `color-bg` | `#FFFFFF` | `#0B0E14` |
| `color-bg-subtle` | `#F7F8FA` | `#121620` |
| `color-surface` | `#FFFFFF` | `#171B26` |
| `color-border` | `#E5E7EB` | `#262B38` |
| `color-text-primary` | `#111827` | `#F3F4F6` |
| `color-text-secondary` | `#6B7280` | `#9CA3AF` |
| `color-text-disabled` | `#D1D5DB` | `#4B5563` |

### 2.6 Colores de estado (feedback de sistema)

| Estado | Token | Hex (Light) | Hex (Dark) |
|---|---|---|---|
| Éxito | `color-success` | `#16A34A` | `#4ADE80` |
| Advertencia | `color-warning` | `#EAB308` | `#FACC15` |
| Error | `color-error` | `#DC2626` | `#F87171` |
| Info | `color-info` | `#2F6FED` | `#5B8DF6` |

---

## 3. Tipografía

**Familia tipográfica:** sans-serif moderna, geométrica pero cálida.

```
font-family: "Inter", "Geist", "SF Pro Text", system-ui, -apple-system, sans-serif;
font-family-mono: "JetBrains Mono", "Geist Mono", monospace; /* datos clínicos, IDs, códigos */
```

### 3.1 Escala tipográfica (responsive)

Se usa una escala fluida: tamaño mínimo en móvil, máximo en escritorio, interpolado con `clamp()`.

| Token | Uso | Móvil | Escritorio | CSS sugerido |
|---|---|---|---|---|
| `text-xs` | Metadatos, timestamps | 11px | 12px | `clamp(11px, 0.9vw, 12px)` |
| `text-sm` | Texto secundario, labels | 13px | 14px | `clamp(13px, 1vw, 14px)` |
| `text-base` | Cuerpo de texto | 15px | 16px | `clamp(15px, 1.1vw, 16px)` |
| `text-lg` | Subtítulos, énfasis | 17px | 18px | `clamp(17px, 1.3vw, 18px)` |
| `text-xl` | Títulos de sección | 20px | 22px | `clamp(20px, 1.6vw, 22px)` |
| `text-2xl` | Títulos de página | 24px | 28px | `clamp(24px, 2.2vw, 28px)` |
| `text-3xl` | Hero / dashboards | 30px | 36px | `clamp(30px, 3vw, 36px)` |

### 3.2 Pesos

| Token | Valor | Uso |
|---|---|---|
| `font-regular` | 400 | Cuerpo de texto |
| `font-medium` | 500 | Labels, botones secundarios |
| `font-semibold` | 600 | Títulos, botones primarios |
| `font-bold` | 700 | Alertas críticas, cifras destacadas |

### 3.3 Altura de línea

- Cuerpo de texto: `1.5`
- Títulos: `1.25`
- Datos tabulares/clínicos: `1.4`

---

## 4. Espaciado — sistema base de 4px

Toda medida de padding, margin, gap y radio debe ser múltiplo de 4.

| Token | Valor | Uso típico |
|---|---|---|
| `space-1` | 4px | Separación mínima entre íconos y texto |
| `space-2` | 8px | Padding interno de chips, gaps pequeños |
| `space-3` | 12px | Padding de inputs, botones compactos |
| `space-4` | 16px | Padding estándar de Card, gap entre elementos |
| `space-5` | 20px | Separación entre bloques relacionados |
| `space-6` | 24px | Padding de Modal, secciones |
| `space-8` | 32px | Separación entre secciones grandes |
| `space-10` | 40px | Márgenes de página en escritorio |
| `space-12` | 48px | Separación entre bloques de dashboard |
| `space-16` | 64px | Hero sections, espaciado de layout mayor |

**Radios de borde** (mismo sistema):

| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 4px | Chips, badges |
| `radius-md` | 8px | Inputs, botones |
| `radius-lg` | 12px | Cards |
| `radius-xl` | 16px | Modales |
| `radius-full` | 9999px | Avatares, pills |

---

## 5. Componentes esperados

### 5.1 Button

**Variantes:** `primary`, `secondary`, `ghost`, `destructive`, `outline`
**Tamaños:** `sm` (32px alto), `md` (40px alto), `lg` (48px alto)

- Radio: `radius-md`
- Padding horizontal: `space-4` (sm) / `space-5` (md) / `space-6` (lg)
- Peso de fuente: `font-medium`
- Transición: `all 120ms ease-out`
- Estado disabled: opacidad 40%, cursor `not-allowed`
- Estado loading: spinner reemplaza ícono izquierdo, texto se mantiene

### 5.2 Card

- Fondo: `color-surface`
- Borde: `1px solid color-border`
- Radio: `radius-lg`
- Padding: `space-4` a `space-6` según densidad
- Sombra (light): `0 1px 2px rgba(16,24,40,0.05)`
- Sombra (dark): ninguna (se usa borde + leve elevación de fondo)
- Variante `interactive`: hover eleva sombra y sube `border-color` a `color-primary` al 20% opacidad

### 5.3 Modal

- Overlay: `rgba(15,17,21,0.5)` con `backdrop-filter: blur(2px)`
- Contenedor: `color-surface`, `radius-xl`, padding `space-6`
- Ancho máximo: 480px (sm), 640px (md), 800px (lg)
- Animación: fade + scale desde 0.96 a 1, 150ms ease-out
- Header con título `text-xl font-semibold` + botón cerrar (ícono Lucide `X`)
- Footer con acciones alineadas a la derecha, `space-3` entre botones

### 5.4 Toast

- Posición: esquina inferior derecha (escritorio), centrado inferior (móvil)
- Ancho: 320–400px
- Radio: `radius-md`
- Íconos por tipo: `CheckCircle2` (éxito), `AlertTriangle` (warning), `XCircle` (error), `Info` (info)
- Barra de color lateral izquierda de 4px según tipo de estado
- Auto-dismiss: 4s (informativo), sin auto-dismiss para errores críticos
- Animación de entrada: slide-in + fade, 200ms

### 5.5 Sidebar

- Ancho: 260px (expandido) / 72px (colapsado, solo íconos)
- Fondo: `color-bg-subtle`
- Ítem activo: fondo `color-primary-subtle` (opacidad del 10% del primario), texto `color-primary` y peso `font-semibold`. Su enrutamiento y estado activo se calculan en el cliente usando `usePathname()`.
- Ítem hover: fondo `color-bg-subtle` con opacidad incremental.
- Logotipo oficial: alineado de forma horizontal con el texto descriptivo del centro médico mediante Flexbox (`flex items-center gap-3`), con una línea divisoria vertical para balancear la estética.
- En móvil: se convierte en drawer deslizable desde la izquierda, overlay incluido.

### 5.6 Bento Charts (Analítica Visual)

- **Distribución de tarjetas**: Layout de rejilla Bento (`grid grid-cols-1 lg:grid-cols-3 gap-6`).
- **Gráficos de barras horizontales (Citas por Estado / Carga por Doctor)**:
  - Estructurados con barras de progreso relativas (`width: x%` en Tailwind).
  - Coloreados según el semáforo clínico en HSL (Ámbar: pendiente, Azul: confirmada, Esmeralda: completada, Rosa: cancelada).
- **Gráficos de barras verticales (Volumen de Citas)**:
  - Renderizados mediante bloques SVG con alturas calculadas en píxeles (`px`) en lugar de porcentajes para evitar colapsos de visualización en contenedores flexibles.
  - Altura máxima escalada a `110px`, con alturas mínimas garantizadas (`8px` para valores bajos y `2px` para indicar cero consultas).
  - Clasificación de fechas basada en la **zona horaria local del navegador** del usuario (formateando localmente a `YYYY-MM-DD`) para evitar desfases de día causados por zonas horarias de huso horario negativo (como UTC-5).
  - Interactividad: Incorporación de **tooltips flotantes** (`group-hover:scale-100`) para ver el número exacto de citas al pasar el cursor.

---

## 6. Modo claro y oscuro

- Ambos modos son **ciudadanos de primera clase**, no se diseña uno y se "invierte" automáticamente.
- Cambio de tema mediante `data-theme="light" | "dark"` en el elemento raíz.
- Todos los tokens de color de la sección 2 tienen su par light/dark explícito.
- El modo oscuro **no es negro puro**: usa `#0B0E14` como base para reducir fatiga visual.
- Las sombras se reemplazan por bordes sutiles en modo oscuro (las sombras no se perciben bien sobre fondos oscuros).
- Los colores de semáforo de prioridad se aclaran ligeramente en dark mode para mantener contraste AA sobre fondo oscuro (ver tabla 2.4).

---

## 7. Iconografía

- Librería: **[Lucide Icons](https://lucide.dev)** exclusivamente. No mezclar con otras librerías de íconos.
- Tamaño estándar: 16px (inline con texto), 20px (botones/UI general), 24px (headers, estados vacíos).
- Grosor de trazo: `1.5` (default de Lucide, no modificar salvo casos puntuales de énfasis).
- Color: hereda `currentColor` — nunca hardcodear color de ícono fuera del sistema de tokens.

**Íconos clínicos sugeridos por contexto:**

| Contexto | Ícono Lucide |
|---|---|
| Paciente | `User`, `Users` |
| Historial clínico | `FileText`, `ClipboardList` |
| Cita/agenda | `Calendar`, `Clock` |
| Signos vitales | `Activity`, `HeartPulse` |
| Alerta clínica | `AlertTriangle`, `AlertCircle` |
| Medicación | `Pill` |
| IA / insights | `Sparkles`, `Bot` |
| Configuración | `Settings` |
| Búsqueda | `Search` |

---

## 8. Estados de interfaz

### 8.1 Estado de carga (Loading)

- Usar **skeletons** (bloques con `color-bg-subtle` y animación shimmer) para listas, cards y tablas — no spinners genéricos para carga de contenido.
- Spinners reservados para acciones puntuales dentro de botones o envíos de formulario.
- Duración mínima de skeleton visible: 300ms, para evitar parpadeo en cargas muy rápidas.

### 8.2 Estado vacío (Empty state)

- Ilustración simple o ícono Lucide grande (48–64px) en `color-text-secondary`.
- Título breve (`text-lg font-semibold`) + descripción de una línea (`text-sm color-text-secondary`).
- Acción primaria cuando aplique (ej. "Agregar paciente").
- Tono: informativo y orientador, nunca genérico tipo "No hay datos".

### 8.3 Estado de error

- Ícono `AlertCircle` o `XCircle` en `color-error`.
- Mensaje claro del problema + acción de recuperación ("Reintentar", "Volver").
- Errores de red vs. errores clínicos/de validación deben distinguirse visualmente: red usa tono neutro con acento de error; validación usa inline junto al campo afectado, sin modal disruptivo salvo error crítico de guardado de datos de paciente.

---

## 9. Notas de implementación para generadores de UI (Stitch MCP / Antigravity)

- Todos los tokens definidos aquí deben mapearse 1:1 a variables CSS (`--color-primary`, `--space-4`, etc.) o al theme de Tailwind si el stack lo usa.
- No inventar valores de color, espaciado o tipografía fuera de esta guía; si falta un caso de uso, extrapolar desde la escala existente en lugar de introducir un valor arbitrario.
- Prioridad de legibilidad clínica > estética: en caso de conflicto entre "verse más moderno" y "cumplir contraste AA", siempre gana el contraste.
- Componentes nuevos no listados en la sección 5 deben heredar radios, espaciados y tipografía de los componentes más cercanos ya definidos (ej. un `Dropdown` hereda de `Button` + `Card`).
