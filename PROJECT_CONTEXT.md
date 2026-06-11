# JMT Marketplace — Documento de Contexto Completo para IA

> **Propósito:** Este documento es el "cerebro" del proyecto. Cualquier IA o desarrollador que lo lea debe ser capaz de entender la arquitectura, las convenciones, los flujos críticos y las reglas de desarrollo sin necesidad de revisar el código fuente. Actualizar este archivo cada vez que se cambie algo estructural.

---

## 1. Descripción del Producto

**JMT Marketplace** es una plataforma SaaS de tipo **DOOH (Digital Out Of Home)** que permite a marcas y agencias de publicidad **descubrir, reservar y gestionar espacios publicitarios exteriores** (paneles físicos geolocalizados) en Lima, Perú.

### Usuarios del sistema
| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `user` | Comprador / Anunciante. Reserva paneles y sube creatividades. | `/`, `/map`, `/checkout`, `/dashboard`, `/order-success` |
| `gestor` | Operador interno de JMT. Aprueba órdenes, valida creatividades. | `/gestor` |
| `admin` | Administrador total del sistema. | Todo + `/admin` (futuro) |

### Modelo de negocio
- Precio **por día por panel** (`daily_price`).
- El comprador selecciona rango de fechas → el sistema calcula el total.
- Pago único con **Culqi** (pasarela peruana).
- Tras el pago, el comprador sube el video (.mp4) de su creatividad.
- El gestor **valida** la creatividad y activa la campaña.

---

## 2. Stack Tecnológico

### Core
| Capa | Tecnología | Versión / Notas |
|------|-----------|-----------------|
| Framework | **Next.js** (App Router) | `latest` (~15). `"use client"` solo para interactividad. |
| Lenguaje | **TypeScript** | Estricto. Sin `any`. Interfaces explícitas. |
| Estilos | **Tailwind CSS v4** + CSS Variables | Sin Shadcn en runtime. Componentes propios en `/components/ui`. |
| UI Icons | `lucide-react` + `@phosphor-icons/react` | Lucide es el primario. |
| Animaciones | **Framer Motion** `^12` | Para transiciones de modales, sidebars y sugerencias. |

### Backend / Infraestructura
| Servicio | Rol | Cómo se accede |
|---------|-----|----------------|
| **Supabase** | Base de datos PostgreSQL + Auth + RLS | `@supabase/ssr` (server), `@supabase/supabase-js` (client) |
| **Cloudflare R2** | Storage de imágenes y videos de creatividades | `@aws-sdk/client-s3` (S3-compatible). URLs firmadas via API Route. |
| **Mapbox GL JS** | Mapas interactivos y geocodificación | `react-map-gl` v8 + `mapbox-gl` v3. Token vía `NEXT_PUBLIC_MAPBOX_TOKEN`. |
| **Culqi** | Pasarela de pagos peruana | SDK client-side cargado desde CDN. `culqiClient.ts` en `/lib`. |
| **FFmpeg.wasm** | Procesamiento de video en el cliente | `@ffmpeg/ffmpeg` + `@ffmpeg/core`. Usado en `/order-success`. |
| **Vercel** | Deploy y Edge Functions | `@vercel/functions` para cron jobs. |

### Package Manager
> **SIEMPRE usar `pnpm`**. Existe `pnpm-lock.yaml`. NUNCA usar `npm` o `yarn`.

```bash
pnpm install          # instalar dependencias
pnpm add <pkg>        # agregar dependencia
pnpm add -D <pkg>     # dev dependency
pnpm run dev          # servidor de desarrollo
pnpm run build        # build producción
```

---

## 3. Estructura de Archivos

```
JMT_marketplace/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Grupo: login, signup (páginas sin layout de marketplace)
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (marketplace)/            # Grupo: páginas públicas con TopBar + Footer
│   │   │   ├── layout.tsx            # Layout con HeaderWrapper
│   │   │   ├── page.tsx              # Home: búsqueda de distritos por mapa
│   │   │   ├── map/page.tsx          # Split-View: lista de paneles + mapa Mapbox
│   │   │   └── design-system/page.tsx # Página de showcase del Design System
│   │   ├── api/                      # API Routes de Next.js
│   │   │   ├── upload-video/         # Genera Presigned URL para subir a R2
│   │   │   ├── download/             # Descarga desde R2
│   │   │   ├── gestor/               # Endpoints internos del gestor
│   │   │   ├── reclamos/             # Guardar reclamos (libro de reclamaciones)
│   │   │   ├── temp-calc/            # Cálculos temporales de precio
│   │   │   └── cron/                 # Limpieza programada de R2 (Vercel Cron)
│   │   ├── checkout/page.tsx         # Flujo de pago (Culqi). 45KB — muy complejo.
│   │   ├── dashboard/                # Panel del usuario comprador
│   │   │   ├── page.tsx              # Resumen de campaña / pedidos
│   │   │   ├── orders/               # Mis órdenes
│   │   │   └── quotes/               # Cotizaciones guardadas
│   │   ├── gestor/page.tsx           # Panel del operador JMT
│   │   ├── order-success/            # Upload Bridge tras pago exitoso
│   │   ├── success/                  # Pantalla final tras upload
│   │   ├── legal/                    # Páginas legales
│   │   │   └── libro-de-reclamaciones/page.tsx
│   │   ├── unauthorized/             # Redireccionamiento por rol insuficiente
│   │   ├── layout.tsx                # Root layout (fuente Roboto, metadata global)
│   │   └── globals.css               # Design tokens CSS + Tailwind v4 @theme
│   │
│   ├── components/
│   │   ├── ui/                       # Componentes base propios (NO Shadcn)
│   │   │   ├── Button.tsx            # Variantes: default, outline, ghost, destructive
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Dialog.tsx            # Modal propio con overlay + framer-motion
│   │   │   ├── Badge.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Label.tsx
│   │   │   ├── Alert.tsx
│   │   │   ├── Logo.tsx              # Logo SVG del proyecto (Next/Image fill)
│   │   │   ├── DatePicker.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── SegmentedControl.tsx
│   │   │   ├── Container.tsx
│   │   │   ├── BackButton.tsx
│   │   │   ├── OrderTrackingStepper.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── layout/
│   │   │   ├── TopBar.tsx            # Header flex (logo | center slot | right slot)
│   │   │   ├── TopBarSearch.tsx      # Barra de búsqueda con fechas y autocomplete
│   │   │   ├── AuthButton.tsx        # Login/logout/avatar adaptativo
│   │   │   ├── HeaderWrapper.tsx     # Wrapper server-side para el TopBar
│   │   │   └── Footer.tsx
│   │   ├── map/
│   │   │   ├── MapViewClient.tsx     # Componente principal del mapa (muy grande, ~1446 líneas)
│   │   │   ├── StructureDetailModal.tsx # Modal lateral de detalle de estructura
│   │   │   ├── QuotePDFDocument.tsx  # Generador PDF de cotización (html2canvas + jsPDF)
│   │   │   ├── MapErrorBoundary.tsx
│   │   │   ├── mapUtils.ts           # Geocodificación, normalización de distritos
│   │   │   ├── components/
│   │   │   │   ├── MapCartSidebar.tsx    # Carrito de paneles seleccionados
│   │   │   │   ├── MapFiltersSidebar.tsx # Filtros (tipo, precio, audiencia)
│   │   │   │   ├── MobileSearchBox.tsx   # Buscador flotante mobile
│   │   │   │   └── QuoteDialog.tsx       # Diálogo para guardar cotización
│   │   │   └── hooks/                # Hooks específicos del mapa
│   │   ├── dashboard/                # Componentes del panel de usuario
│   │   ├── gestor/                   # Componentes del panel del gestor
│   │   ├── home/                     # Componentes de la página principal
│   │   └── upload/
│   │       ├── UploadDropzone.tsx    # Dropzone de archivos mp4 (react-dropzone)
│   │       ├── UploadTypeSelector.tsx
│   │       ├── FrameSelector.tsx     # Selector de frame del video
│   │       ├── UploadLoading.tsx
│   │       ├── UploadFallback.tsx
│   │       └── UploadErrorBoundary.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # createBrowserClient (componentes client)
│   │   │   └── server.ts             # createServerClient (RSC, API Routes, middleware)
│   │   ├── supabaseClient.ts         # Re-export conveniente del client
│   │   ├── bboxCache.ts              # Cache de 2 capas para queries de mapa (memory + localStorage, TTL 5min)
│   │   ├── cloudflare.ts             # Helper para R2 (S3 SDK)
│   │   ├── culqiClient.ts            # Inicialización Culqi
│   │   ├── ffmpegClient.ts           # FFmpeg.wasm wrapper
│   │   ├── imageComposer.ts          # Composición de imágenes para thumbnail
│   │   ├── videoAnalyzer.ts          # Análisis de metadatos de video
│   │   └── utils.ts                  # cn() — helper para classnames (clsx + tailwind-merge)
│   │
│   ├── store/
│   │   └── cartStore.ts              # Zustand persist — carrito de paneles seleccionados
│   │
│   └── types/
│       └── database.types.ts         # Tipos autogenerados desde Supabase CLI
│
├── middleware.ts                     # Auth middleware (protege /dashboard, /gestor, /admin)
├── next.config.js                    # Config Next.js (imágenes R2, FFmpeg headers, external pkgs)
├── tailwind.config.ts                # Tailwind config (extiende tokens de globals.css)
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

---

## 4. Modelo de Datos (Supabase PostgreSQL)

### Diagrama de relaciones
```
organizations
    └── structures (organization_id → organizations.id)
            └── panels (structure_id → structures.id)
                    └── bookings (panel_id → panels.id)

profiles (extends auth.users, id = auth.users.id)
    ├── organization_id → organizations.id (nullable)
    └── role: 'admin' | 'user' | 'gestor'

orders (user_id → profiles.id)
    └── bookings (order_id → orders.id)

saved_campaigns (user_id → profiles.id)
reclamos (user_id → profiles.id, nullable)
districts (tabla GeoJSON de distritos de Lima)
```

### Tabla: `organizations`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `name` | text | Nombre comercial del proveedor |
| `slug` | text | URL-friendly identifier |
| `plan_type` | text | Tipo de plan SaaS |
| `default_currency` | text | Moneda (ej: "PEN") |

### Tabla: `structures`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `code` | text | Código único de estructura (ej: "MIR-001") |
| `address` | text | Dirección completa |
| `district` | text | Distrito normalizado |
| `city` | text | Ciudad |
| `latitude` / `longitude` | float | Coordenadas Mapbox |
| `organization_id` | UUID | FK → organizations |
| `poi_tags` | text[] | Tags de puntos de interés cercanos |
| `poi_details` | jsonb | Detalles de POIs en formato JSON |
| `reference` | text | Referencia visual de ubicación |

### Tabla: `panels` (unidad vendible)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `panel_code` | text | Código único (ej: "MIR-004 A") |
| `structure_id` | UUID | FK → structures |
| `media_type` | text | `"DIGITAL"` o `"TRADICIONAL"` |
| `format` | text | Tipo físico: "Unipolar", "Triángulo", etc. |
| `face` | text | Cara del soporte |
| `width` / `height` | float | Dimensiones físicas (metros) |
| `daily_price` | float | Precio por día en PEN |
| `base_price` | float | Precio base (para cálculos) |
| `price_period` | text | Período de precio ("day", "week", etc.) |
| `audience` | int | Impactos diarios estimados |
| `max_slots` | int | Slots de tiempo para DIGITAL |
| `slot_duration_seconds` | int | Duración de cada slot |
| `operating_start_time` / `operating_end_time` | time | Horario de operación |
| `resolution_width` / `resolution_height` | int | Resolución pantalla DIGITAL |
| `photo_url` | text | URL de Cloudflare R2 |
| `traffic_view` | text | Vista de tráfico |
| `status` | text | `"active"`, `"inactive"` |
| `currency` | text | Moneda del precio |

### Tabla: `bookings`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `panel_id` | UUID | FK → panels |
| `order_id` | UUID | FK → orders (nullable) |
| `user_id` | UUID | FK → profiles (nullable para guest checkout) |
| `client_name` | text | Nombre del anunciante |
| `campaign_name` | text | Nombre de campaña |
| `start_date` / `end_date` | date | Rango reservado |
| `amount` | float | Monto pagado |
| `status` | text | `"PENDING_UPLOAD"`, `"PAID"`, `"VALIDATED"`, `"REJECTED"` |
| `payment_id` | text | ID de transacción Culqi |
| `video_url` | text | URL R2 de la creatividad |

### Tabla: `orders`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → profiles |
| `total_amount` | float | Suma total del pedido |
| `status` | text | `"pending"`, `"paid"`, `"validated"`, `"rejected"` |
| `video_url` | text | Video de la creatividad |
| `rejection_reason` | text | Motivo de rechazo del gestor |

### Tabla: `profiles` (extiende auth.users)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK = `auth.users.id` |
| `email` | text | Email del usuario |
| `role` | enum | `"admin"` \| `"user"` \| `"gestor"` |
| `full_name` | text | Nombre completo |
| `phone` | text | Teléfono (react-international-phone) |
| `document_type` | text | "DNI", "RUC", "CE" |
| `document_number` | text | Número de documento |
| `receipt_type` | text | "boleta" o "factura" |
| `company_name` | text | Nombre de empresa (si factura) |
| `organization_id` | UUID | FK → organizations (para gestores) |
| `is_active` | bool | Si la cuenta está activa |
| `user_type` | text | Tipo adicional de usuario |

### Tabla: `saved_campaigns`
Guarda cotizaciones como JSON para recuperación posterior (sharing de cotizaciones entre usuarios).

### Tabla: `districts`
GeoJSON de distritos de Lima para highlight en el mapa.

### Tabla: `reclamos`
Libro de Reclamaciones legal peruano (Indecopi). Secuencial por año.

### Funciones PostgreSQL
- `is_admin()` → boolean — verificar si el usuario actual es admin
- `is_gestor()` → boolean — verificar si el usuario actual es gestor
- `sync_user_profile(...)` — sincronizar datos de perfil desde checkout

---

## 5. Sistema de Autenticación

### Middleware (`middleware.ts`)
El middleware corre en **Edge Runtime** en cada request:

```
Request →
  1. Crea Supabase server client con cookies
  2. Llama supabase.auth.getUser()
  3. Si error de refresh token → borra cookies stale (previene loops)
  4. Rutas protegidas: /admin, /gestor, /dashboard
     - Sin usuario → redirect /login
     - Con usuario → lee profiles.role
       - /admin → solo admin
       - /gestor → admin o gestor
       - /dashboard → cualquier autenticado
  5. Si autenticado y en /login o /signup → redirect /dashboard
```

### Clientes Supabase
```typescript
// Client components
import { createBrowserClient } from '@supabase/ssr'
// src/lib/supabase/client.ts

// Server components / API Routes / middleware
import { createServerClient } from '@supabase/ssr'
// src/lib/supabase/server.ts — maneja cookies de Next.js
```

### Guest Checkout (Auth implícita)
- Un usuario NO autenticado puede añadir paneles al carrito y pagar.
- Al finalizar el checkout, se crea automáticamente una cuenta con el email del formulario.
- La campaña (`saved_campaigns`) queda en `user_id = null` y se puede "linkear" a una cuenta posterior.

---

## 6. Design System

### Filosofía
- **Un solo punto de cambio**: todos los tokens están en `globals.css` (`@theme` y `:root`).
- Cambiar `--radius` afecta TODOS los componentes. Cambiar `--primary` afecta todos los colores primarios.
- Los componentes en `/components/ui` usan SOLO tokens — nunca colores hardcodeados.

### Paleta de colores (modo claro por defecto)
```css
--background: 0 0% 100%          /* Blanco puro */
--foreground: 0 0% 10%           /* Casi negro */
--card: 0 0% 97.5%               /* Gris muy claro */
--primary: 115.2 39.1% 49.6%     /* Verde medio — color principal de marca */
--primary-foreground: 0 0% 97.5% /* Blanco sobre primary */
--muted: 0 0% 94%
--muted-foreground: 0 0% 45%
--border: 0 0% 90%
--brand-dark: 224 50% 11%        /* #0e162b — azul marino oscuro */
--brand-blue: 223 38% 17%        /* #1a233a */
--upload: 262.1 83.3% 57.8%      /* Violeta — para módulo de upload */
```

> ⚠️ **No hay modo oscuro** actualmente implementado. El proyecto es light-mode only.

### Sistema de radios (border-radius)
```css
--radius: 1rem                   /* BASE — modificar aquí afecta todo */
--radius-button: calc(var(--radius) * 0.625)   /* ~10px */
--radius-card: calc(var(--radius) * 1.25)      /* ~20px */
--radius-input: calc(var(--radius) * 0.75)     /* ~12px */
--radius-dialog: calc(var(--radius) * 1.5)     /* ~24px */
--radius-badge: calc(var(--radius) * 0.375)    /* ~6px */
--radius-avatar: 9999px                         /* Círculo perfecto */
```

Clases Tailwind disponibles (desde @theme en globals.css):
- `rounded-card`, `rounded-input`, `rounded-button`, `rounded-dialog`, `rounded-badge`, `rounded-avatar`
- `rounded-button-sm`, `rounded-button-lg`, `rounded-button-xl`, `rounded-button-2xl`

### Sistema de espaciado fluido (fluid spacing)
Sin breakpoints — usa `clamp()`:
```css
--spacing-fluid-xs: clamp(0.5rem, 0.8vw, 0.75rem)
--spacing-fluid-sm: clamp(0.75rem, 1.2vw, 1rem)
--spacing-fluid-md: clamp(1rem, 1.8vw, 1.5rem)
--spacing-fluid-lg: clamp(1.5rem, 2.5vw, 2.25rem)
--spacing-fluid-xl: clamp(2rem, 3.5vw, 3rem)
```

Clases: `p-fluid-md`, `gap-fluid-sm`, `px-fluid-lg`, etc.

### Tipografía fluida
```css
--font-size-fluid-xs: clamp(0.7rem, 0.4vw + 0.6rem, 0.8rem)
--font-size-fluid-sm: clamp(0.8rem, 0.5vw + 0.65rem, 0.95rem)
--font-size-fluid-base: clamp(0.95rem, 0.6vw + 0.8rem, 1.1rem)
--font-size-fluid-lg: clamp(1.1rem, 0.8vw + 0.9rem, 1.3rem)
```

Fuente principal: **Roboto** (Google Fonts, cargada via `next/font/google`).

### Componentes UI base
| Componente | Variantes disponibles |
|------------|-----------------------|
| `Button` | `default`, `outline`, `ghost`, `destructive`; sizes: `sm`, `md`, `lg`, `icon`, `icon-lg`, `2xl` |
| `Card` | Solo estilos base |
| `Badge` | `default`, `secondary`, `outline`, `destructive` |
| `Input` | Base estilizado |
| `Dialog` | Con overlay + AnimatePresence de Framer Motion |
| `Alert` | Informativo |

---

## 7. Flujos Críticos del Sistema

### 7.1 Flujo de Mapa y Búsqueda
```
Usuario llega a /map
  → MapViewClient.tsx (Client Component, ~1446 líneas)
    → react-map-gl renderiza mapa Mapbox
    → onIdle / onMoveEnd → fetchStructuresInBounds()
      → Consulta Supabase: structures + panels dentro del bbox actual
      → bboxCache: 2 capas (memory Map + localStorage, TTL 5 min)
      → Clave de cache: bbox redondeado a 3 decimales (~111m precisión)
    → Markers: precio por día flotando sobre el mapa
    → TopBar con TopBarSearch:
      → Input de ubicación → Mapbox Geocoding API → sugerencias autocomplete
      → Seleccionar sugerencia → fit map bounds al distrito GeoJSON
      → Filtros: tipo de panel, rango de precio, audiencia mínima
```

### 7.2 Flujo de Carrito y Cotización
```
Usuario selecciona panel → StructureDetailModal → "Agregar a Campaña"
  → useCartStore (Zustand persist → localStorage "jmt-cart-storage")
    CartItem: { panelId, panelCode, address, district, dailyPrice, startDate, endDate, days, totalPrice, format, mediaType }
  → MapCartSidebar muestra el carrito en tiempo real
  → Opción: "Guardar Cotización" → QuoteDialog
    → Genera PDF con jsPDF + html2canvas-pro
    → Guarda en Supabase: saved_campaigns { id, user_id, items (JSON), campaign_name, client_name, total_amount }
    → URL de recuperación: /map?campaign={id}
```

### 7.3 Flujo de Checkout y Pago
```
/checkout/page.tsx (muy grande, ~45KB)
  Pasos:
  1. Confirmar selección de paneles (desde cartStore)
  2. Formulario de datos del cliente (nombre, email, teléfono, documento, comprobante)
     → react-international-phone para teléfono
  3. Validación de disponibilidad (re-check en Supabase)
  4. Culqi: tokeniza la tarjeta en el navegador → obtiene token
  5. API Route: /api/.../ → carga a Culqi server-side con el token
  6. Si pago OK:
     → Crea order en Supabase (status: "pending")
     → Crea bookings (uno por panel) con status: "PENDING_UPLOAD"
     → Si usuario no existe → crea cuenta Supabase Auth implícita
     → Envía email de confirmación
     → Limpia cartStore
     → Redirect → /order-success
```

### 7.4 Flujo de Upload de Creatividad
```
/order-success/
  → UploadDropzone: acepta .mp4 < 100MB
  → Validación client-side (formato, tamaño, duración)
  → POST /api/upload-video → genera Presigned URL de Cloudflare R2
  → Upload directo desde navegador → R2 (no pasa por Next.js server)
  → PATCH Supabase: booking.video_url = URL de R2
  → FrameSelector: FFmpeg.wasm extrae thumbnail del video
  → Redirect → /success
```

### 7.5 Flujo del Gestor
```
/gestor/page.tsx
  → Lista órdenes con status "pending" / "PENDING_UPLOAD"
  → Para cada orden: visualiza paneles, fechas, monto, video subido
  → Acciones:
    - "Validar" → order.status = "validated", bookings.status = "VALIDATED"
    - "Rechazar" → order.status = "rejected", rejection_reason = motivo
  → Webhook (futuro): notificar al usuario por email
```

---

## 8. Reglas de Arquitectura (Golden Rules)

### 8.1 Server vs Client Components
```
✅ Server Component (por defecto):
  - Páginas estáticas o con fetch de datos
  - Layouts
  - Secciones que no necesitan estado
  - Cualquier componente que solo lea datos de Supabase

❌ Usar "use client" SOLO para:
  - Mapas (Mapbox requiere window/DOM)
  - Dropzone (react-dropzone)
  - Formularios con estado local
  - Modales con AnimatePresence
  - Carrito (Zustand)
  - Culqi (SDK client-side)
```

### 8.2 Lógica de Base de Datos
- **SIEMPRE** a través del Supabase Client (nunca SQL crudo en el frontend).
- **RLS habilitado** en todas las tablas. Los permisos se definen a nivel de base de datos.
- Para operaciones del gestor/admin que requieren saltarse RLS, usar **Service Role Key** SOLO en API Routes del servidor — nunca exponer al cliente.

### 8.3 Separación de responsabilidades
```
src/app/         → Rutas y páginas (composición)
src/components/  → UI y presentación
  /ui/           → Componentes atómicos reutilizables
  /map/          → Lógica específica del mapa
  /layout/       → Layout global (TopBar, Footer)
src/lib/         → Servicios externos y utilidades puras
src/store/       → Estado global del cliente (Zustand)
src/types/       → Interfaces TypeScript
```

### 8.4 Convenciones de código
- **Sin `any`**: siempre tipar explícitamente.
- **Imports**: usar `@/` para paths absolutos desde `src/`.
- **Clases CSS**: siempre usar tokens del design system. NO hardcodear colores (evitar `text-blue-500`, usar `text-primary`).
- **Border radius**: usar `rounded-card`, `rounded-input`, `rounded-button` — NUNCA `rounded-2xl`, `rounded-lg` hardcodeado.
- **Nomenclatura**: PascalCase para componentes, camelCase para funciones/variables.

---

## 9. Variables de Entorno

Archivo: `.env.local` (nunca commitear)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...         # Clave pública (segura en cliente)
SUPABASE_SERVICE_ROLE_KEY=eyJ...             # Clave privada (solo server-side)

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...           # Token público de Mapbox

# Cloudflare R2
CLOUDFLARE_R2_BUCKET_NAME=jmt-media
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_PUBLIC_URL=https://pub-[hash].r2.dev

# Culqi (pagos)
NEXT_PUBLIC_CULQI_PUBLIC_KEY=pk_test_...     # Clave pública Culqi
CULQI_SECRET_KEY=sk_test_...                 # Clave secreta (solo server)
```

---

## 10. API Routes

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/upload-video` | POST | Genera Presigned URL de R2 para upload directo |
| `/api/download` | GET | Descarga archivo desde R2 |
| `/api/gestor/*` | POST/PATCH | Operaciones del gestor (validar/rechazar órdenes) |
| `/api/reclamos` | POST | Guarda reclamo en Supabase |
| `/api/temp-calc` | POST | Cálculo temporal de precios |
| `/api/cron/*` | GET | Limpieza programada de R2 (Vercel Cron, autenticado por header) |

---

## 11. Configuración especial de Next.js

```javascript
// next.config.js
{
  images: {
    remotePatterns: [{ hostname: 'pub-4951180469144594abaab94c53f99a18.r2.dev' }]
  },
  serverExternalPackages: ['fluent-ffmpeg', '@ffmpeg-installer/ffmpeg', '@ffprobe-installer/ffprobe'],
  headers: {
    '/order-success/*' → Cross-Origin-Opener-Policy: same-origin  // Para FFmpeg.wasm
    '/ffmpeg/*'        → Cross-Origin-Resource-Policy: same-origin
    '/ffmpeg-core.js'  → Cross-Origin-Resource-Policy: same-origin
    '/ffmpeg-core.wasm'→ Cross-Origin-Resource-Policy: same-origin
  }
}
```

> ⚠️ **COEP no está activo** en `/order-success` para evitar que bloquee los videos de R2. FFmpeg.wasm funciona sin SharedArrayBuffer en este proyecto.

---

## 12. Estado Global (Zustand)

### `cartStore` (persist en localStorage `"jmt-cart-storage"`)
```typescript
type CartItem = {
  panelId: string;
  structureId: string;
  panelCode: string;         // ej: "MIR-004 A"
  address: string;
  district: string;
  photoUrl: string | null;
  dailyPrice: number;
  startDate: string;         // "YYYY-MM-DD"
  endDate: string;           // "YYYY-MM-DD"
  days: number;
  totalPrice: number;
  format: string;
  mediaType: string;         // "DIGITAL" | "TRADICIONAL"
  width?: number | null;
  height?: number | null;
};

interface CartState {
  items: CartItem[];
  campaignId: string | null; // ID de saved_campaign si existe
  addItem(item: CartItem): void;      // ignora duplicados por panelId
  updateItem(panelId: string, updates): void;
  removeItem(panelId: string): void;
  clearCart(): void;
  setCampaignId(id: string | null): void;
  getTotalItems(): number;
  getTotalPrice(): number;
}
```

---

## 13. Cache de Queries del Mapa

Sistema custom en `src/lib/bboxCache.ts`:

- **Capa 1 (memory)**: `Map<string, {...}>` en módulo JS — instantáneo, se pierde al recargar.
- **Capa 2 (localStorage)**: persiste entre recargas. Prefix `jmt_bbox_`.
- **TTL**: 5 minutos.
- **Clave**: bbox redondeado a 3 decimales + página + filtros activos.
- **Invalidación**: `invalidateAll()` — limpiar al hacer cambios en inventario.

```typescript
// Uso
const cached = getCached(swLat, swLng, neLat, neLng, page, filters);
if (cached) return cached;

const result = await supabase.from('structures')...;
setCached(swLat, swLng, neLat, neLng, page, result.data, result.count, filters);
```

---

## 14. Mapa (Mapbox)

- **Estilo custom**: `mapbox://styles/luis3sc/cmkew1btx007x01qq60hf55ok`
- **Token**: `NEXT_PUBLIC_MAPBOX_TOKEN`
- **Librería**: `react-map-gl` v8 + `mapbox-gl` v3
- **Geocodificación**: Mapbox Geocoding API v5 para búsqueda de distritos/avenidas
- **Marcadores**: precio flotante por panel. Al seleccionar → `scale-125` + color primary.
- **Bounding box**: Se calculan queries por bounds del mapa visible (`onIdle` + `onMoveEnd`).
- **Distritos**: Al seleccionar un distrito desde el buscador → se carga el GeoJSON desde `districts` en Supabase → se dibuja con `Source` + `Layer` (fill + line).

---

## 15. Responsive Design

### Breakpoints (Tailwind estándar)
- `sm`: 640px+
- `md`: 768px+ (tablet)
- `lg`: 1024px+ (laptop)
- `xl`: 1280px+ (desktop)

### Estrategia por vista
| Pantalla | Layout del mapa |
|----------|----------------|
| Mobile (<768px) | Tab: Lista **O** Mapa. Bottom navbar fijo con tabs. MobileSearchBox flotante. |
| Tablet (768-1023px) | Split-view: Lista izquierda + Mapa derecha. TopBar con search + fechas compactas + botón filtros solo ícono. |
| Desktop (1024px+) | Split-view completo. TopBar con search expandido + fechas completas + botón filtros con texto. |

### TopBar layout
```
[Logo | shrink-0] [SearchBar | flex-1 | center] [Filtros + Auth | shrink-0]
```
- El search usa `flex-1` — toma todo el espacio disponible entre logo y botones.
- En `md`: fechas compactas (`Desde → Hasta`).
- En `lg+`: fechas completas con separadores.
- Filtros: `icon-only` en `md`, `icon + texto` en `lg+`.

---

## 16. Páginas Clave y sus responsabilidades

### `/` (Home)
Buscador de distritos. Cards con imagen del distrito. CTA hacia `/map?district=xxx`.

### `/map` (Split-View principal)
El core del producto. Ver sección 7.1. Recibe query params:
- `?district=miraflores` → centra el mapa en ese distrito
- `?campaign=UUID` → carga una cotización guardada al carrito

### `/checkout`
El flujo de pago más complejo. Maneja:
- Estado del formulario con múltiples pasos
- Integración Culqi (checkout.js desde CDN)
- Creación de cuenta implícita en Supabase
- Verificación de disponibilidad antes del pago
- Manejo de errores de red y reintentos

### `/order-success`
Upload Bridge. Recibe `?orderId=UUID`. Muestra el estado de la orden y permite subir el video.

### `/dashboard`
Panel del usuario autenticado. Muestra órdenes activas, historial, cotizaciones guardadas.

### `/gestor`
Panel del operador JMT. Lista y gestiona órdenes pendientes de validación.

### `/design-system`
Página interna de showcase del design system. Permite visualizar todos los tokens, componentes y variantes del sistema de diseño.

---

## 17. Puntos de Acoplamiento — Cómo Cambiar Proveedores

### Cambiar Supabase por otro BaaS (ej: PlanetScale + Auth.js)
- Adaptar `src/lib/supabase/client.ts` y `server.ts`
- Refactorizar `middleware.ts` (cambiar `createServerClient` por la auth del nuevo proveedor)
- El resto del código ya usa el cliente abstraído → cambio localizado
- Los tipos en `src/types/database.types.ts` deben regenerarse con el nuevo proveedor

### Cambiar Mapbox por MapLibre JS
- Cambiar `mapbox-gl` por `maplibre-gl` en `package.json`
- En `MapViewClient.tsx`: reemplazar `import mapboxgl` y el estilo de mapa
- La API de `react-map-gl` v8 soporta MapLibre (cambiar prop `mapLib`)
- Los estilos de mapa deben ser MapTiler, OpenMapTiles u otro proveedor compatible

### Cambiar Cloudflare R2 por AWS S3
- Solo cambiar credenciales en `.env.local`
- El SDK `@aws-sdk/client-s3` es S3-compatible → sin cambios de código
- Actualizar `CLOUDFLARE_R2_PUBLIC_URL` por la URL pública de S3/CloudFront

### Cambiar Culqi por Stripe
- Reemplazar el script CDN de Culqi en `/checkout/page.tsx`
- Adaptar la lógica de tokenización (Stripe Elements vs Culqi Checkout)
- Cambiar la API Route de procesamiento de pago

---

## 18. Comandos útiles

```bash
# Desarrollo
pnpm run dev                    # Servidor de desarrollo (Next.js + Turbopack)

# Tipos Supabase (regenerar tras cambios en BD)
npx supabase gen types typescript --project-id [ID] > src/types/database.types.ts

# Build
pnpm run build

# Lint
pnpm run lint

# Importar inventario inicial (script personalizado)
pnpm tsx src/scripts/importInventory.ts
```

---

## 19. Gotchas y Decisiones Técnicas

1. **FFmpeg.wasm y COEP**: Se desactivó `Cross-Origin-Embedder-Policy` en `/order-success` porque bloqueaba los videos de R2 (`ERR_BLOCKED_BY_RESPONSE`). FFmpeg.wasm funciona sin SharedArrayBuffer en este contexto.

2. **bboxCache redondeo**: Los coords se redondean a 3 decimales (~111m) para que pans micro no generen cache miss. Ajustar si se necesita más precisión.

3. **Guest checkout**: `user_id` puede ser `null` en `bookings` y `saved_campaigns`. Siempre manejar este caso.

4. **react-map-gl v8**: La API cambió respecto a v7. Usar `onIdle` (no `onLoad` solo) para queries de bounds. El `ref` del mapa es `MapRef` de `react-map-gl`.

5. **Culqi**: El SDK se carga desde CDN en el `<head>` del checkout. No hay paquete npm oficial robusto. El token de Culqi expira — no cachear.

6. **Supabase RLS**: RLS está activo. Para lecturas públicas de `structures` y `panels`, debe existir una política `SELECT` para roles anónimos (`anon`).

7. **Tailwind v4**: Este proyecto usa Tailwind CSS v4 con la nueva sintaxis `@import "tailwindcss"` y `@theme {}` en lugar de la config de v3. Los plugins de Tailwind v3 pueden no ser compatibles.

8. **No hay modo oscuro**: Actualmente solo hay tokens `:root` (modo claro). Si se agrega modo oscuro, añadir `[data-theme="dark"]` o `@media (prefers-color-scheme: dark)` en `globals.css`.

9. **Imágenes de R2**: Las imágenes están en `pub-4951180469144594abaab94c53f99a18.r2.dev`. Este dominio está whitelisteado en `next.config.js` para `next/image`.

10. **`cn()` utility**: Siempre usar `cn()` de `@/lib/utils` para combinar clases Tailwind (es `clsx` + `tailwind-merge`).

---

*Última actualización: Mayo 2026 — Mantenido por el equipo de JMT.*
