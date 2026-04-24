# Orquestación del Proyecto: JMT_marketplace

## 1. Introducción
Este documento detalla la orquestación técnica y operativa del MVP de JMT Marketplace, enfocado en el "Usuario Comprador" para publicidad DOOH (Digital Out Of Home).

## 2. Stack Tecnológico
| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14+ (App Router) | Framework principal, SSR y Routing. |
| **Estilos** | Tailwind CSS + Shadcn UI | Interfaz premium y responsiva. |
| **Base de Datos** | Supabase (PostgreSQL) | Persistencia de datos e inventario. |
| **Autenticación** | Supabase Auth | Gestión de usuarios (Implicit Auth en Checkout). |
| **Mapas** | Mapbox GL JS | Visualización geoespacial de paneles. |
| **Pagos** | Culqi API | Procesamiento de transacciones locales. |
| **Storage** | Cloudflare R2 | Hosting de imágenes estáticas y creatividades de video. |

## 3. Orquestación de Flujos Críticos

### A. Flujo de Compra e Identidad (Implicit Auth)
1. El usuario selecciona paneles en el **Split-View** y procede al `/checkout`.
2. Al completar el pago vía **Culqi**, el sistema verifica si el usuario existe en **Supabase**.
3. Si no existe, se crea la cuenta de forma implícita y se vincula la compra al nuevo `user_id`.
4. Se registra el `Booking` en estado `PENDING_UPLOAD`.

### B. Gestión de Creatividades (Upload & Storage)
1. Tras el pago exitoso, el usuario es redirigido al `/success` (Upload Bridge).
2. El componente **Dropzone** valida en el cliente que el archivo `.mp4` sea < 100MB.
3. Se solicita una **URL Firmada (Presigned URL)** a través de una API Route de Next.js conectada a **Cloudflare R2**.
4. El archivo se sube directamente desde el navegador a R2 para evitar sobrecarga en el servidor.

### C. Retención y Limpieza de Datos (Lifecycle)
- **Activador**: Webhook de Supabase al cambiar estado a `VALIDATED`.
- **Acción**: Edge Function programa la eliminación del archivo en R2.
- **Regla**: El archivo se elimina exactamente **7 días** después de la validación para optimizar costos de almacenamiento.

## 4. Estructura del Proyecto
```markdown
/public/                    # Archivos estáticos accesibles directamente
 ├── assets/
 │   ├── logos/              # Logos en formato .svg o .png
 │   ├── images/             # Imágenes estáticas para el Home/UI
 │   └── videos/             # Videos promocionales cortos (demo)
/src
 ├── app/                    # Next.js App Router (Rutas de la aplicación)
 │   ├── (auth)/             # Grupo de rutas para autenticación
 │   ├── (marketplace)/      
 │   │   ├── page.tsx        # Home: Buscador principal de distritos
 │   │   └── map/page.tsx    # Split-View: Lista de paneles + Mapa Mapbox
 │   ├── checkout/           # Flujo transaccional (Auto-Auth Supabase + Pago Culqi)
 │   ├── success/            # Upload Bridge: Carga de video (Dropzone)
 │   └── dashboard/          # Panel del Comprador (Mis Pedidos)
 ├── components/             # UI y Componentes de presentación
 │   ├── ui/                 # Componentes base de Shadcn UI
 │   ├── map/                # Componentes de Mapbox
 │   └── upload/             # Componente Dropzone (Límite 100MB)
 ├── lib/                    # Utilidades y servicios
 │   ├── supabaseClient.ts   # Configuración Supabase
 │   ├── culqiClient.ts      # Configuración Culqi
 │   └── cloudflare.ts       # URLs firmadas para Cloudflare R2
 ├── hooks/                  # Custom React hooks (useCart, useGeolocation)
 └── types/                  # Typescript (Panel, CartItem, User)
```

## 5. Diseño Responsivo
- **Desktop**: Layout de pantalla dividida (Split-View) con lista a la izquierda y mapa a la derecha.
- **Mobile**: Vista de lista con opción de "Ver Mapa" flotante o mediante pestañas, optimizado para interacción táctil.

## 6. Estructura de la Base de Datos (Supabase)

La base de datos `mixooh_db` está diseñada bajo un modelo relacional que optimiza la búsqueda geoespacial y la gestión de inventario.

### A. Organizations
- **Propósito**: Entidad de más alto nivel (dueño del inventario).
- **Campos clave**: `id` (UUID), `name` (Nombre comercial), `slug` (URL amigable).

### B. Structures
- **Propósito**: Ubicación física única que puede albergar múltiples anuncios.
- **Campos clave**: `code` (Código de estructura), `address`, `district`, `city`, `latitude`, `longitude` (Coordenadas Mapbox).

### C. Panels
- **Propósito**: El espacio publicitario vendible (unidad mínima).
- **Campos clave**: 
    - `panel_code`: Código único (ej. MIR-004 A).
    - `media_type`: DIGITAL / TRADICIONAL.
    - `format`: Tipo de soporte (ej. Unipolar).
    - `audience`: Impactos estimados.
    - `daily_price`: Precio por día del panel.
    - `photo_url`: Enlace a Cloudflare R2.

### D. Bookings
- **Propósito**: Registro de transacciones y ocupación.
- **Campos clave**: `panel_id`, `client_name`, `start_date`, `end_date`, `status` (PENDING, PAID, VALIDATED), `payment_id` (ID de Culqi).

## 7. Principios de Desarrollo y Código

Para asegurar que el proyecto sea mantenible y escalable, se deben seguir las siguientes reglas de implementación:

### A. Simplicidad y Modularidad
- **KISS (Keep It Simple, Stupid)**: Evitar abstracciones innecesarias. El código debe ser fácil de leer y entender.
- **Componentes Reutilizables**: Si un elemento se usa más de una vez, debe ser un componente en `src/components`. Los cambios en un componente base deben afectar a toda la plataforma.

### B. Estándares de TypeScript y Next.js
- **TypeScript Estricto**: No se permite el uso de `any`. Definir interfaces precisas para el inventario y usuarios.
- **Server-First**: Priorizar **React Server Components (RSC)**. El uso de `"use client"` se reserva exclusivamente para interactividad (Mapbox, filtros dinámicos, modales).
- **Lógica desacoplada**: La lógica compleja de UI debe extraerse de las páginas (`/app`) hacia componentes pequeños y especializados.

### C. Estilos y Diseño
- **Design Tokens**: Uso estricto de variables de Tailwind y CSS. La personalización de colores o bordes debe realizarse en la configuración global para impactar a todo el sitio simultáneamente.

---
*Documento generado automáticamente para la orquestación del proyecto JMT_marketplace.*
