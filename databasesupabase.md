# Documentación y Arquitectura de Base de Datos - Mixooh DB (`kssgxqyzzshtawtbnfry`)

Este documento detalla la configuración completa, arquitectura, relaciones, políticas de seguridad (RLS), funciones, disparadores (triggers) y almacenamiento de la base de datos de **Mixooh DB** (Proyecto Supabase `kssgxqyzzshtawtbnfry`). Contiene el código DDL consolidado y las explicaciones detalladas para poder recrear una base de datos idéntica de manera exacta en cualquier entorno de Supabase.

---

## 1. Arquitectura General y Flujo de Datos

La base de datos está diseñada para operar como una plataforma multi-inquilino (multi-tenant) de publicidad exterior digital e impresa (DOOH/OOH - *Digital Out Of Home* / *Out Of Home*).

### Entidades y Relaciones Clave:
1. **Multi-Tenancy (`organizations`)**: Las empresas administradoras de pantallas o paneles publicitarios (proveedores como *JMT Outdoors* o *ALAC OOH*) se segregan por organización.
2. **Soportes Físicos (`structures`)**: Puntos físicos geolocalizados en el mapa. Cada estructura pertenece a una organización y contiene información de geolocalización (`latitude`, `longitude`) y Puntos de Interés (`poi_details` y `poi_tags`) cercanos.
3. **Caras Publicitarias (`panels`)**: Las caras de los soportes que se alquilan. Un soporte físico (`structure`) puede tener uno o más paneles (por ejemplo, Cara A y Cara B, representadas por `face`). Los paneles pueden ser `DIGITAL` o `TRADICIONAL` (impresos). Tienen tarifas diarias/mensuales, dimensiones, y configuraciones de slots de tiempo si son pantallas digitales.
4. **Usuarios y Permisos (`profiles` & `auth.users`)**: Los perfiles extienden a la tabla estándar de autenticación de Supabase (`auth.users`) y asignan roles (`user`, `gestor`, `admin`). Un trigger automático clona la información a `public.profiles` cuando se registra un usuario en `auth.users`.
5. **Transacciones y Reservas (`orders` & `bookings`)**:
   - `orders`: Representa el carrito de compras procesado. Agrupa las compras y contiene el estado (`PENDING_UPLOAD`, `VIDEO_SENT`, `CONFIRMED`) y el video publicitario general.
   - `bookings`: La reserva individual de un panel para un rango de fechas (`start_date` a `end_date`). Cada reserva está ligada a un panel y a una orden de compra global.
6. **Mapeo Geográfico (`districts`)**: Contiene polígonos o geometrías JSON de los distritos de Lima, permitiendo filtrar estructuras y paneles por su distrito de pertenencia geográfica.
7. **Libro de Reclamaciones (`reclamos`)**: Sistema independiente para registrar reclamos o quejas en cumplimiento legal. Autogenera un número correlativo anual (ej: `000001-2026`).
8. **Campañas Guardadas (`saved_campaigns`)**: Permite a usuarios anónimos o registrados pre-guardar configuraciones y cotizaciones de paneles seleccionados antes de pasar por caja.

---

## 2. Configuración Global de la Base de Datos

### Extensiones Habilitadas:
- `plpgsql`: Lenguaje procedimental estructurado por defecto.
- `uuid-ossp`: Generación de identificadores únicos universales (UUID).
- `pgcrypto`: Criptografía para hashes y generación de UUIDs.
- `pg_stat_statements`: Registro de estadísticas de ejecución SQL para diagnóstico.
- `supabase_vault`: Manejo de secretos integrados en Supabase.

### Tipos Personalizados (Enums):
```sql
CREATE TYPE public.user_role AS ENUM ('admin', 'user', 'gestor');
```

### Secuencias:
```sql
CREATE SEQUENCE public.reclamos_secuencia_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1
    NO CYCLE;
```

---

## 3. Especificación Detallada de Tablas

### 3.1. `public.organizations`
* **Propósito**: Almacena las agencias u operadores dueños de los paneles.
* **DDL de Creación**:
```sql
CREATE TABLE public.organizations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NULL,
    plan_type text NULL DEFAULT 'FREE'::text,
    created_at timestamp with time zone NULL DEFAULT now(),
    default_currency text NULL DEFAULT 'PEN'::text,
    CONSTRAINT organizations_pkey PRIMARY KEY (id),
    CONSTRAINT organizations_slug_key UNIQUE (slug)
);
```
* **Políticas RLS**:
  - **Habilitada**: Sí.
  - **Lectura Pública**:
    - Nombre: `Public read organizations`
    - Operación: `SELECT`
    - Roles: `public`
    - Condición (`USING`): `true`
* **Datos de Ejemplo**:
  - `id`: `b5d9c611-3c61-4dde-833b-513b1cf4462f`, `name`: `"JMT OUTDOORS"`, `slug`: `"jmt-outdoors"`, `plan_type`: `"CORP"`, `default_currency`: `"PEN"`

---

### 3.2. `public.structures`
* **Propósito**: Ubicaciones físicas geolocalizadas donde se instalan paneles publicitarios.
* **DDL de Creación**:
```sql
CREATE TABLE public.structures (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    code text NOT NULL,
    address text NULL,
    reference text NULL,
    district text NULL,
    city text NULL DEFAULT 'Lima'::text,
    latitude double precision NULL,
    longitude double precision NULL,
    poi_tags text[] NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    poi_details jsonb NULL DEFAULT '{}'::jsonb,
    CONSTRAINT structures_pkey PRIMARY KEY (id),
    CONSTRAINT structures_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
```
* **Índices**:
  - `idx_structures_organization_id` en `organization_id` (B-Tree).
  - `idx_structures_poi_details` en `poi_details` (GIN para búsquedas rápidas en objetos JSONB).
* **Políticas RLS**:
  - **Habilitada**: Sí.
  - **Lectura Pública**:
    - Nombre: `Public read structures`
    - Operación: `SELECT`
    - Roles: `anon`, `authenticated`
    - Condición (`USING`): `true`
* **Datos de Ejemplo**:
  - `poi_details`: Objeto JSONB estructurado que contiene información sobre la cantidad y ubicación de puntos de interés cercanos como bancos, clínicas y centros comerciales con distancias calculadas en metros.
  ```json
  {
    "resumen": ["Centro Comercial", "Banca", "Hospital / Clínica"],
    "total_count": 43,
    "por_categoria": {
      "Banco": [{"nombre": "BBVA", "distancia_metros": 277}],
      "Clinicas": [{"nombre": "Policlinico Fiori", "distancia_metros": 230}]
    }
  }
  ```

---

### 3.3. `public.panels`
* **Propósito**: Caras de visualización disponibles para alquiler en los soportes físicos.
* **DDL de Creación**:
```sql
CREATE TABLE public.panels (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    structure_id uuid NOT NULL,
    panel_code text NOT NULL,
    face text NULL,
    media_type text NULL,
    format text NULL,
    width numeric NULL,
    height numeric NULL,
    traffic_view text NULL,
    audience bigint NULL,
    base_price numeric NULL,
    currency text NULL DEFAULT 'PEN'::text,
    price_period text NULL DEFAULT 'MONTH'::text,
    status text NULL DEFAULT 'AVAILABLE'::text,
    photo_url text NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    daily_price numeric NULL,
    resolution_width integer NULL,
    resolution_height integer NULL,
    slot_duration_seconds integer NULL DEFAULT 7,
    max_slots integer NULL DEFAULT 23,
    operating_start_time time without time zone NULL DEFAULT '06:00:00'::time without time zone,
    operating_end_time time without time zone NULL DEFAULT '00:00:00'::time without time zone,
    CONSTRAINT panels_pkey PRIMARY KEY (id),
    CONSTRAINT panels_structure_id_fkey FOREIGN KEY (structure_id) REFERENCES public.structures(id),
    CONSTRAINT panels_media_type_check CHECK (media_type = ANY (ARRAY['TRADICIONAL'::text, 'DIGITAL'::text]))
);

COMMENT ON COLUMN public.panels.resolution_width IS 'Ancho en píxeles de la resolución nativa del panel';
COMMENT ON COLUMN public.panels.resolution_height IS 'Alto en píxeles de la resolución nativa del panel';
```
* **Índices**:
  - `idx_panels_structure_id` en `structure_id` (B-Tree).
* **Políticas RLS**:
  - **Habilitada**: Sí.
  - **Lectura Pública**:
    - Nombre: `Public read panels`
    - Operación: `SELECT`
    - Roles: `anon`, `authenticated`
    - Condición (`USING`): `true`

---

### 3.4. `public.profiles`
* **Propósito**: Guarda información extendida sobre los usuarios registrados. Actúa como puente entre `auth.users` y la lógica de roles de negocio de la aplicación.
* **DDL de Creación**:
```sql
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text NULL,
    avatar_url text NULL,
    phone text NULL,
    company_name text NULL,
    role public.user_role NOT NULL DEFAULT 'user'::public.user_role,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    document_number text NULL,
    document_type text NULL,
    receipt_type text NULL,
    user_type text NULL DEFAULT 'individual'::text,
    organization_id uuid NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
```
* **Índices**:
  - `idx_profiles_role` en `role`.
  - `idx_profiles_email` en `email`.
  - `idx_profiles_is_active` en `is_active`.
* **Disparadores (Triggers)**:
  - `set_profiles_updated_at`: `BEFORE UPDATE` -> Ejecuta `public.handle_updated_at()`.
* **Políticas RLS**:
  - **Habilitada**: Sí.
  - **Selección de Perfiles (Lectura)**:
    - Nombre: `profiles_select_policy`
    - Operación: `SELECT`
    - Roles: `authenticated`
    - Condición (`USING`): `(id = auth.uid()) OR is_admin() OR is_gestor()`
  - **Inserción**:
    - Nombre: `profiles_insert_policy`
    - Operación: `INSERT`
    - Roles: `authenticated`
    - Condición (`WITH CHECK`): `(id = auth.uid()) OR is_admin()`
  - **Actualización**:
    - Nombre: `profiles_update_policy`
    - Operación: `UPDATE`
    - Roles: `authenticated`
    - Condición (`USING`/`WITH CHECK`): `(id = auth.uid()) OR is_admin()`

---

### 3.5. `public.user_sessions_log`
* **Propósito**: Registro de auditoría de inicio de sesión de los usuarios.
* **DDL de Creación**:
```sql
CREATE TABLE public.user_sessions_log (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    ip_address text NULL,
    user_agent text NULL,
    logged_in_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_sessions_log_pkey PRIMARY KEY (id),
    CONSTRAINT user_sessions_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```
* **Índices**:
  - `idx_user_sessions_log_user_id` en `user_id`.
* **Políticas RLS**:
  - **Habilitada**: Sí.
  - **Lectura**:
    - Nombre: `user_sessions_log_select_policy`
    - Operación: `SELECT`
    - Roles: `anon`, `authenticated`
    - Condición (`USING`): `((SELECT auth.uid() AS uid) = user_id) OR is_admin()`

---

### 3.6. `public.orders`
* **Propósito**: Órdenes de compra consolidadas de espacios de paneles.
* **DDL de Creación**:
```sql
CREATE TABLE public.orders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NULL,
    total_amount numeric NOT NULL,
    status text NULL DEFAULT 'PENDING_UPLOAD'::text,
    video_url text NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    rejection_reason text NULL,
    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES public.profiles(id),
    CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```
* **Índices**:
  - `idx_orders_user_id` en `user_id`.
* **Políticas RLS**:
  - **Habilitada**: Sí.
  - **Lectura**:
    - Nombre: `orders_select_policy`
    - Operación: `SELECT`
    - Roles: `anon`, `authenticated`
    - Condición (`USING`): `((SELECT auth.uid() AS uid) = user_id) OR is_gestor() OR is_admin() OR ((SELECT auth.uid() AS uid) IS NULL)`
  - **Inserción**:
    - Nombre: `orders_insert_policy`
    - Operación: `INSERT`
    - Roles: `authenticated`
    - Condición (`WITH CHECK`): `(user_id = auth.uid())`
  - **Actualización**:
    - Nombre: `orders_update_policy`
    - Operación: `UPDATE`
    - Roles: `authenticated`
    - Condición (`USING`): `is_gestor() OR is_admin()`

---

### 3.7. `public.bookings`
* **Propósito**: Reservas transaccionales de fechas específicas para los paneles asociados a una orden.
* **DDL de Creación**:
```sql
CREATE TABLE public.bookings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    panel_id uuid NOT NULL,
    client_name text NOT NULL,
    campaign_name text NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text NULL DEFAULT 'CONFIRMED'::text,
    amount numeric NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    payment_id text NULL,
    user_id uuid NULL,
    video_url text NULL,
    order_id uuid NULL,
    CONSTRAINT bookings_pkey PRIMARY KEY (id),
    CONSTRAINT bookings_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
    CONSTRAINT bookings_panel_id_fkey FOREIGN KEY (panel_id) REFERENCES public.panels(id),
    CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```
* **Índices**:
  - `idx_bookings_user_id` en `user_id`.
  - `idx_bookings_panel_id` en `panel_id`.
  - `idx_bookings_order_id` en `order_id`.
* **Políticas RLS**:
  - **Habilitada**: Sí.
  - **Lectura**:
    - Nombre: `bookings_select_policy`
    - Operación: `SELECT`
    - Roles: `anon`, `authenticated`
    - Condición (`USING`): `((SELECT auth.uid() AS uid) = user_id) OR is_gestor() OR is_admin() OR ((SELECT auth.uid() AS uid) IS NULL)`
  - **Inserción**:
    - Nombre: `bookings_insert_policy`
    - Operación: `INSERT`
    - Roles: `anon`, `authenticated`
    - Condición (`WITH CHECK`): `((SELECT auth.uid() AS uid) = user_id) OR ((SELECT auth.uid() AS uid) IS NULL)`
  - **Actualización**:
    - Nombre: `bookings_update_policy`
    - Operación: `UPDATE`
    - Roles: `authenticated`
    - Condición (`USING`): `((SELECT auth.uid() AS uid) = user_id) OR is_gestor() OR is_admin()`

---

### 3.8. `public.reclamos`
* **Propósito**: Libro de Reclamaciones Virtual. Gestiona quejas o reclamos registrando automáticamente correlativos por año.
* **DDL de Creación**:
```sql
CREATE TABLE public.reclamos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    numero_reclamo text NOT NULL,
    anio integer NOT NULL DEFAULT (EXTRACT(year FROM now()))::integer,
    secuencia bigint NOT NULL,
    reclamante_nombre text NOT NULL,
    reclamante_tipo_doc text NOT NULL,
    reclamante_num_doc text NOT NULL,
    reclamante_domicilio text NOT NULL,
    reclamante_telefono text NOT NULL,
    reclamante_email text NOT NULL,
    tipo_bien text NOT NULL,
    descripcion_servicio text NOT NULL,
    monto_reclamado numeric NULL,
    tipo_disconformidad text NOT NULL,
    detalle_reclamo text NOT NULL,
    pedido_consumidor text NULL,
    observaciones_empresa text NULL,
    estado text NOT NULL DEFAULT 'pendiente'::text,
    respuesta_empresa text NULL,
    fecha_respuesta timestamp with time zone NULL,
    user_id uuid NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT reclamos_pkey PRIMARY KEY (id),
    CONSTRAINT reclamos_numero_reclamo_key UNIQUE (numero_reclamo),
    CONSTRAINT reclamos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT reclamos_reclamante_tipo_doc_check CHECK (reclamante_tipo_doc = ANY (ARRAY['DNI'::text, 'CE'::text, 'RUC'::text, 'PASAPORTE'::text])),
    CONSTRAINT reclamos_tipo_bien_check CHECK (tipo_bien = ANY (ARRAY['producto'::text, 'servicio'::text])),
    CONSTRAINT reclamos_tipo_disconformidad_check CHECK (tipo_disconformidad = ANY (ARRAY['reclamo'::text, 'queja'::text])),
    CONSTRAINT reclamos_estado_check CHECK (estado = ANY (ARRAY['pendiente'::text, 'en_proceso'::text, 'resuelto'::text, 'cerrado'::text]))
);
```
* **Índices**:
  - `idx_reclamos_numero` en `numero_reclamo`.
  - `idx_reclamos_email` en `reclamante_email`.
  - `idx_reclamos_estado` en `estado`.
  - `idx_reclamos_created_at` en `created_at DESC` (Indexación temporal inversa).
* **Disparadores (Triggers)**:
  - `trigger_generar_numero_reclamo`: `BEFORE INSERT` -> Ejecuta `public.generar_numero_reclamo()`.
  - `trigger_reclamos_updated_at`: `BEFORE UPDATE` -> Ejecuta `public.update_updated_at_column()`.
* **Políticas RLS**:
  - **Habilitada**: Sí.
  - **Inserción Pública**:
    - Nombre: `Permitir inserción pública de reclamos`
    - Operación: `INSERT`
    - Roles: `public`
    - Condición (`WITH CHECK`): `true`
  - **Lectura Propietario**:
    - Nombre: `El usuario puede leer sus propios reclamos`
    - Operación: `SELECT`
    - Roles: `public`
    - Condición (`USING`): `(auth.uid() IS NOT NULL) AND (auth.uid() = user_id)`
  - **Lectura Administrador/Gestor**:
    - Nombre: `Admins pueden leer todos los reclamos`
    - Operación: `SELECT`
    - Roles: `public`
    - Condición (`USING`): `EXISTS (SELECT 1 FROM profiles WHERE (profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'gestor'::user_role])))`
  - **Actualización Administrador/Gestor**:
    - Nombre: `Admins pueden actualizar reclamos`
    - Operación: `UPDATE`
    - Roles: `public`
    - Condición (`USING`): `EXISTS (SELECT 1 FROM profiles WHERE (profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'gestor'::user_role])))`

---

### 3.9. `public.districts`
* **Propósito**: Zonas o comunas limítrofes geográficas cargadas como polígonos vectoriales para visualización y filtrado territorial de paneles en el mapa de Mapbox.
* **DDL de Creación**:
```sql
CREATE TABLE public.districts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    display_name text NOT NULL,
    province text NOT NULL,
    department text NOT NULL,
    geometry jsonb NOT NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT districts_pkey PRIMARY KEY (id),
    CONSTRAINT districts_name_key UNIQUE (name)
);
```
* **Políticas RLS**:
  - **Habilitada**: Sí.
  - **Lectura Pública**:
    - Nombre: `Allow public read access`
    - Operación: `SELECT`
    - Roles: `public`
    - Condición (`USING`): `true`

---

### 3.10. `public.saved_campaigns`
* **Propósito**: Presupuestos de cotización guardados por el cliente antes de ser confirmados como una orden real.
* **DDL de Creación**:
```sql
CREATE TABLE public.saved_campaigns (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    user_id uuid NULL,
    campaign_name text NOT NULL,
    client_name text NOT NULL,
    items jsonb NOT NULL,
    total_amount numeric NOT NULL,
    CONSTRAINT saved_campaigns_pkey PRIMARY KEY (id),
    CONSTRAINT saved_campaigns_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```
* **Políticas RLS**:
  - **Habilitada**: Sí.
  - **Lectura Pública por ID**:
    - Nombre: `Permitir lectura pública por ID`
    - Operación: `SELECT`
    - Roles: `public`
    - Condición (`USING`): `true`
  - **Inserción Pública**:
    - Nombre: `Permitir inserción pública`
    - Operación: `INSERT`
    - Roles: `public`
    - Condición (`WITH CHECK`): `true`
  - **Modificación al Dueño**:
    - Nombre: `Permitir modificación al dueño`
    - Operación: `ALL` (SELECT, INSERT, UPDATE, DELETE)
    - Roles: `public`
    - Condición (`USING`): `(auth.uid() = user_id)`
  - **Vincular Campaña Invitada**:
    - Nombre: `Permitir vincular campaña invitada` (Para asociar una campaña creada como usuario no registrado al iniciar sesión)
    - Operación: `UPDATE`
    - Roles: `public`
    - Condición (`USING`): `(user_id IS NULL)`
    - Validación (`WITH CHECK`): `(auth.uid() = user_id)`
* **Datos de Ejemplo**:
  - `items`: Contiene un arreglo de objetos JSON que representan los paneles agregados al presupuesto con sus detalles geográficos, tarifas y fechas tentativas.
  ```json
  [
    {
      "panelId": "e4d7d5b8-224d-4848-8a25-52941cba7c94",
      "panelCode": "SMP-010-A",
      "startDate": "2026-05-29",
      "endDate": "2026-05-30",
      "dailyPrice": 180,
      "totalPrice": 212.4
    }
  ]
  ```

---

## 4. Funciones e Integración del Sistema (Procedimientos Almacenados)

Estas funciones controlan el ciclo de vida de los datos, la sincronización de perfiles de usuario, y la verificación de permisos sin exponer lógica crítica en el lado del cliente (seguridad a nivel de base de datos).

### 4.1. Generador de Código de Reclamo
* **Nombre**: `public.generar_numero_reclamo`
* **Tipo**: Trigger Function (`RETURNS trigger`)
* **Código**:
```sql
CREATE OR REPLACE FUNCTION public.generar_numero_reclamo()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_anio INTEGER;
  v_seq  BIGINT;
BEGIN
  v_anio := EXTRACT(YEAR FROM NOW());
  v_seq := nextval('public.reclamos_secuencia_seq');
  NEW.secuencia := v_seq;
  NEW.anio := v_anio;
  NEW.numero_reclamo := LPAD(v_seq::TEXT, 6, '0') || '-' || v_anio::TEXT;
  RETURN NEW;
END;
$function$;
```

### 4.2. Registro Automático de Perfiles en Login/Registro
* **Nombre**: `public.handle_new_user`
* **Tipo**: Trigger Function (`RETURNS trigger` / `SECURITY DEFINER`)
* **Código**:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user', 
    true, 
    now(), 
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$function$;
```

Este procedimiento está enlazado a un trigger de sistema en la tabla de autenticación:
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 4.3. Sincronización Manual/API de Perfiles (Sobrecargas de Función)
Se utilizan dos firmas para actualizar la data proveniente de servicios web externos o formularios de checkout del frontend.

* **Firma 1 (8 Parámetros)**:
```sql
CREATE OR REPLACE FUNCTION public.sync_user_profile(
    p_user_id uuid,
    p_email text,
    p_full_name text,
    p_phone text,
    p_document_number text,
    p_document_type text,
    p_receipt_type text,
    p_user_type text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, phone, document_number,
    document_type, receipt_type, user_type, role, is_active, created_at, updated_at
  )
  VALUES (
    p_user_id, p_email, p_full_name, p_phone,
    p_document_number, p_document_type, p_receipt_type, p_user_type,
    'user', true, now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email           = EXCLUDED.email,
    full_name       = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    phone           = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
    document_number = CASE WHEN EXCLUDED.document_number <> '' THEN EXCLUDED.document_number ELSE public.profiles.document_number END,
    document_type   = EXCLUDED.document_type,
    receipt_type    = EXCLUDED.receipt_type,
    user_type       = EXCLUDED.user_type,
    updated_at      = now();
END;
$function$;
```

* **Firma 2 (7 Parámetros)**:
```sql
CREATE OR REPLACE FUNCTION public.sync_user_profile(
    p_user_id uuid,
    p_email text,
    p_full_name text,
    p_phone text,
    p_document_number text,
    p_document_type text,
    p_receipt_type text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, phone, document_number,
    document_type, receipt_type, role, is_active, created_at, updated_at
  )
  VALUES (
    p_user_id, p_email, p_full_name, p_phone,
    p_document_number, p_document_type, p_receipt_type,
    'user', true, now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email           = EXCLUDED.email,
    full_name       = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    phone           = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
    document_number = CASE WHEN EXCLUDED.document_number <> '' THEN EXCLUDED.document_number ELSE public.profiles.document_number END,
    document_type   = EXCLUDED.document_type,
    receipt_type    = EXCLUDED.receipt_type,
    updated_at      = now();
END;
$function$;
```

### 4.4. Helpers de Verificación de Roles para RLS
* **Verificar Admin (`is_admin`)**:
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::public.user_role AND is_active = true
  );
$function$;
```

* **Verificar Gestor (`is_gestor`)**:
```sql
CREATE OR REPLACE FUNCTION public.is_gestor()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'gestor'::public.user_role AND is_active = true
  );
$function$;
```

### 4.5. Automatización de Fecha de Edición (`updated_at`)
* **handle_updated_at (Profiles)**:
```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
```

* **update_updated_at_column (Reclamos)**:
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
```

---

## 5. Configuración de Almacenamiento (Supabase Storage)

La base de datos cuenta con un sistema de almacenamiento configurado para albergar los videos y creatividades publicitarias subidos por los clientes.

### Bucket: `campaign_videos`
* **Id**: `campaign_videos`
* **Nombre**: `campaign_videos`
* **Público**: Sí (`public = true`)
* **Límite de Tamaño**: Sin límites estrictos en base de datos.
* **Mime Types Permitidos**: Todos.

### Políticas RLS de Almacenamiento:
1. **Permitir inserción de archivos**:
   - Tabla: `storage.objects`
   - Comando: `INSERT`
   - Condición (`WITH CHECK`): `(bucket_id = 'campaign_videos'::text)`
   - Rol: `authenticated`
2. **Permitir actualización de archivos**:
   - Tabla: `storage.objects`
   - Comando: `UPDATE`
   - Condición (`USING`): `(bucket_id = 'campaign_videos'::text)`
   - Rol: `authenticated`
3. **Permitir eliminación de archivos**:
   - Tabla: `storage.objects`
   - Comando: `DELETE`
   - Condición (`USING`): `(bucket_id = 'campaign_videos'::text)`
   - Rol: `authenticated`
4. **Permitir lectura de buckets**:
   - Tabla: `storage.buckets`
   - Comando: `SELECT`
   - Condición (`USING`): `true`
   - Rol: `public` (Acceso anónimo y autenticado)
5. **Permitir lectura pública de objetos por URL directa**:
   - Tabla: `storage.objects`
   - Comando: `SELECT`
   - Condición (`USING`): `((bucket_id = 'campaign_videos'::text) AND (name ~~ 'campaign-videos/%'::text))`
   - Rol: `public`

---

## 6. Script DDL Completo Consolidado

Ejecutando el siguiente bloque SQL en el panel de consultas de Supabase se puede reproducir la base de datos de manera exacta:

```sql
-- =====================================================================
-- 1. TIPOS PERSONALIZADOS Y EXTENSIONES
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.user_role AS ENUM ('admin', 'user', 'gestor');

-- =====================================================================
-- 2. SECUENCIAS
-- =====================================================================
CREATE SEQUENCE public.reclamos_secuencia_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1
    NO CYCLE;

-- =====================================================================
-- 3. CREACIÓN DE TABLAS
-- =====================================================================

-- Tabla: organizations
CREATE TABLE public.organizations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NULL,
    plan_type text NULL DEFAULT 'FREE'::text,
    created_at timestamp with time zone NULL DEFAULT now(),
    default_currency text NULL DEFAULT 'PEN'::text,
    CONSTRAINT organizations_pkey PRIMARY KEY (id),
    CONSTRAINT organizations_slug_key UNIQUE (slug)
);

-- Tabla: structures
CREATE TABLE public.structures (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    code text NOT NULL,
    address text NULL,
    reference text NULL,
    district text NULL,
    city text NULL DEFAULT 'Lima'::text,
    latitude double precision NULL,
    longitude double precision NULL,
    poi_tags text[] NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    poi_details jsonb NULL DEFAULT '{}'::jsonb,
    CONSTRAINT structures_pkey PRIMARY KEY (id),
    CONSTRAINT structures_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Tabla: panels
CREATE TABLE public.panels (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    structure_id uuid NOT NULL,
    panel_code text NOT NULL,
    face text NULL,
    media_type text NULL,
    format text NULL,
    width numeric NULL,
    height numeric NULL,
    traffic_view text NULL,
    audience bigint NULL,
    base_price numeric NULL,
    currency text NULL DEFAULT 'PEN'::text,
    price_period text NULL DEFAULT 'MONTH'::text,
    status text NULL DEFAULT 'AVAILABLE'::text,
    photo_url text NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    daily_price numeric NULL,
    resolution_width integer NULL,
    resolution_height integer NULL,
    slot_duration_seconds integer NULL DEFAULT 7,
    max_slots integer NULL DEFAULT 23,
    operating_start_time time without time zone NULL DEFAULT '06:00:00'::time without time zone,
    operating_end_time time without time zone NULL DEFAULT '00:00:00'::time without time zone,
    CONSTRAINT panels_pkey PRIMARY KEY (id),
    CONSTRAINT panels_structure_id_fkey FOREIGN KEY (structure_id) REFERENCES public.structures(id) ON DELETE CASCADE,
    CONSTRAINT panels_media_type_check CHECK (media_type = ANY (ARRAY['TRADICIONAL'::text, 'DIGITAL'::text]))
);

COMMENT ON COLUMN public.panels.resolution_width IS 'Ancho en píxeles de la resolución nativa del panel';
COMMENT ON COLUMN public.panels.resolution_height IS 'Alto en píxeles de la resolución nativa del panel';

-- Tabla: profiles
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text NULL,
    avatar_url text NULL,
    phone text NULL,
    company_name text NULL,
    role public.user_role NOT NULL DEFAULT 'user'::public.user_role,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    document_number text NULL,
    document_type text NULL,
    receipt_type text NULL,
    user_type text NULL DEFAULT 'individual'::text,
    organization_id uuid NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- Tabla: user_sessions_log
CREATE TABLE public.user_sessions_log (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    ip_address text NULL,
    user_agent text NULL,
    logged_in_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_sessions_log_pkey PRIMARY KEY (id),
    CONSTRAINT user_sessions_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabla: orders
CREATE TABLE public.orders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NULL,
    total_amount numeric NOT NULL,
    status text NULL DEFAULT 'PENDING_UPLOAD'::text,
    video_url text NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    rejection_reason text NULL,
    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabla: bookings
CREATE TABLE public.bookings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    panel_id uuid NOT NULL,
    client_name text NOT NULL,
    campaign_name text NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text NULL DEFAULT 'CONFIRMED'::text,
    amount numeric NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    payment_id text NULL,
    user_id uuid NULL,
    video_url text NULL,
    order_id uuid NULL,
    CONSTRAINT bookings_pkey PRIMARY KEY (id),
    CONSTRAINT bookings_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL,
    CONSTRAINT bookings_panel_id_fkey FOREIGN KEY (panel_id) REFERENCES public.panels(id) ON DELETE CASCADE,
    CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabla: reclamos
CREATE TABLE public.reclamos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    numero_reclamo text NOT NULL,
    anio integer NOT NULL DEFAULT (EXTRACT(year FROM now()))::integer,
    secuencia bigint NOT NULL,
    reclamante_nombre text NOT NULL,
    reclamante_tipo_doc text NOT NULL,
    reclamante_num_doc text NOT NULL,
    reclamante_domicilio text NOT NULL,
    reclamante_telefono text NOT NULL,
    reclamante_email text NOT NULL,
    tipo_bien text NOT NULL,
    descripcion_servicio text NOT NULL,
    monto_reclamado numeric NULL,
    tipo_disconformidad text NOT NULL,
    detalle_reclamo text NOT NULL,
    pedido_consumidor text NULL,
    observaciones_empresa text NULL,
    estado text NOT NULL DEFAULT 'pendiente'::text,
    respuesta_empresa text NULL,
    fecha_respuesta timestamp with time zone NULL,
    user_id uuid NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT reclamos_pkey PRIMARY KEY (id),
    CONSTRAINT reclamos_numero_reclamo_key UNIQUE (numero_reclamo),
    CONSTRAINT reclamos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT reclamos_reclamante_tipo_doc_check CHECK (reclamante_tipo_doc = ANY (ARRAY['DNI'::text, 'CE'::text, 'RUC'::text, 'PASAPORTE'::text])),
    CONSTRAINT reclamos_tipo_bien_check CHECK (tipo_bien = ANY (ARRAY['producto'::text, 'servicio'::text])),
    CONSTRAINT reclamos_tipo_disconformidad_check CHECK (tipo_disconformidad = ANY (ARRAY['reclamo'::text, 'queja'::text])),
    CONSTRAINT reclamos_estado_check CHECK (estado = ANY (ARRAY['pendiente'::text, 'en_proceso'::text, 'resuelto'::text, 'cerrado'::text]))
);

-- Tabla: districts
CREATE TABLE public.districts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    display_name text NOT NULL,
    province text NOT NULL,
    department text NOT NULL,
    geometry jsonb NOT NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT districts_pkey PRIMARY KEY (id),
    CONSTRAINT districts_name_key UNIQUE (name)
);

-- Tabla: saved_campaigns
CREATE TABLE public.saved_campaigns (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    user_id uuid NULL,
    campaign_name text NOT NULL,
    client_name text NOT NULL,
    items jsonb NOT NULL,
    total_amount numeric NOT NULL,
    CONSTRAINT saved_campaigns_pkey PRIMARY KEY (id),
    CONSTRAINT saved_campaigns_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- =====================================================================
-- 4. CREACIÓN DE ÍNDICES
-- =====================================================================
CREATE INDEX idx_structures_organization_id ON public.structures USING btree (organization_id);
CREATE INDEX idx_structures_poi_details ON public.structures USING gin (poi_details);

CREATE INDEX idx_panels_structure_id ON public.panels USING btree (structure_id);

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX idx_profiles_is_active ON public.profiles USING btree (is_active);

CREATE INDEX idx_user_sessions_log_user_id ON public.user_sessions_log USING btree (user_id);

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);

CREATE INDEX idx_bookings_user_id ON public.bookings USING btree (user_id);
CREATE INDEX idx_bookings_panel_id ON public.bookings USING btree (panel_id);
CREATE INDEX idx_bookings_order_id ON public.bookings USING btree (order_id);

CREATE INDEX idx_reclamos_numero ON public.reclamos USING btree (numero_reclamo);
CREATE INDEX idx_reclamos_email ON public.reclamos USING btree (reclamante_email);
CREATE INDEX idx_reclamos_estado ON public.reclamos USING btree (estado);
CREATE INDEX idx_reclamos_created_at ON public.reclamos USING btree (created_at DESC);

-- =====================================================================
-- 5. PROCEDIMIENTOS ALMACENADOS (FUNCIONES)
-- =====================================================================

-- 5.1 Helpers de verificación de RLS
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::public.user_role AND is_active = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_gestor()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'gestor'::public.user_role AND is_active = true
  );
$function$;

-- 5.2 Manejo de fecha de edición
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 5.3 Generador automático del número de reclamo
CREATE OR REPLACE FUNCTION public.generar_numero_reclamo()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_anio INTEGER;
  v_seq  BIGINT;
BEGIN
  v_anio := EXTRACT(YEAR FROM NOW());
  v_seq := nextval('public.reclamos_secuencia_seq');
  NEW.secuencia := v_seq;
  NEW.anio := v_anio;
  NEW.numero_reclamo := LPAD(v_seq::TEXT, 6, '0') || '-' || v_anio::TEXT;
  RETURN NEW;
END;
$function$;

-- 5.4 Clonador automático de perfiles al registrarse en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$function$;

-- 5.5 Sincronizador de perfiles (8 Parámetros)
CREATE OR REPLACE FUNCTION public.sync_user_profile(
    p_user_id uuid,
    p_email text,
    p_full_name text,
    p_phone text,
    p_document_number text,
    p_document_type text,
    p_receipt_type text,
    p_user_type text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, phone, document_number,
    document_type, receipt_type, user_type, role, is_active, created_at, updated_at
  )
  VALUES (
    p_user_id, p_email, p_full_name, p_phone,
    p_document_number, p_document_type, p_receipt_type, p_user_type,
    'user', true, now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email           = EXCLUDED.email,
    full_name       = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    phone           = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
    document_number = CASE WHEN EXCLUDED.document_number <> '' THEN EXCLUDED.document_number ELSE public.profiles.document_number END,
    document_type   = EXCLUDED.document_type,
    receipt_type    = EXCLUDED.receipt_type,
    user_type       = EXCLUDED.user_type,
    updated_at      = now();
END;
$function$;

-- 5.6 Sincronizador de perfiles (7 Parámetros)
CREATE OR REPLACE FUNCTION public.sync_user_profile(
    p_user_id uuid,
    p_email text,
    p_full_name text,
    p_phone text,
    p_document_number text,
    p_document_type text,
    p_receipt_type text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, phone, document_number,
    document_type, receipt_type, role, is_active, created_at, updated_at
  )
  VALUES (
    p_user_id, p_email, p_full_name, p_phone,
    p_document_number, p_document_type, p_receipt_type,
    'user', true, now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email           = EXCLUDED.email,
    full_name       = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    phone           = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
    document_number = CASE WHEN EXCLUDED.document_number <> '' THEN EXCLUDED.document_number ELSE public.profiles.document_number END,
    document_type   = EXCLUDED.document_type,
    receipt_type    = EXCLUDED.receipt_type,
    updated_at      = now();
END;
$function$;

-- =====================================================================
-- 6. ASOCIACIÓN DE TRIGGERS
-- =====================================================================

-- Trigger de updated_at para perfiles
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger de correlativo para reclamos
CREATE TRIGGER trigger_generar_numero_reclamo
    BEFORE INSERT ON public.reclamos
    FOR EACH ROW
    EXECUTE FUNCTION public.generar_numero_reclamo();

-- Trigger de updated_at para reclamos
CREATE TRIGGER trigger_reclamos_updated_at
    BEFORE UPDATE ON public.reclamos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger de creación automática de perfil en el registro (Debe crearse en la base de datos vinculada a auth.users)
-- NOTA: Requiere permisos superusuario para ejecutarse en el esquema auth.
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- 7. ACTIVACIÓN DE ROW LEVEL SECURITY (RLS) Y POLÍTICAS
-- =====================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reclamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_campaigns ENABLE ROW LEVEL SECURITY;

-- 7.1 Políticas: organizations
CREATE POLICY "Public read organizations" ON public.organizations
    FOR SELECT TO public USING (true);

-- 7.2 Políticas: structures
CREATE POLICY "Public read structures" ON public.structures
    FOR SELECT TO anon, authenticated USING (true);

-- 7.3 Políticas: panels
CREATE POLICY "Public read panels" ON public.panels
    FOR SELECT TO anon, authenticated USING (true);

-- 7.4 Políticas: profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated USING ((id = auth.uid()) OR public.is_admin() OR public.is_gestor());

CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK ((id = auth.uid()) OR public.is_admin());

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE TO authenticated USING ((id = auth.uid()) OR public.is_admin());

-- 7.5 Políticas: user_sessions_log
CREATE POLICY "user_sessions_log_select_policy" ON public.user_sessions_log
    FOR SELECT TO anon, authenticated USING (((SELECT auth.uid() AS uid) = user_id) OR public.is_admin());

-- 7.6 Políticas: orders
CREATE POLICY "orders_select_policy" ON public.orders
    FOR SELECT TO anon, authenticated USING (((SELECT auth.uid() AS uid) = user_id) OR public.is_gestor() OR public.is_admin() OR ((SELECT auth.uid() AS uid) IS NULL));

CREATE POLICY "orders_insert_policy" ON public.orders
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_update_policy" ON public.orders
    FOR UPDATE TO authenticated USING (public.is_gestor() OR public.is_admin());

-- 7.7 Políticas: bookings
CREATE POLICY "bookings_select_policy" ON public.bookings
    FOR SELECT TO anon, authenticated USING (((SELECT auth.uid() AS uid) = user_id) OR public.is_gestor() OR public.is_admin() OR ((SELECT auth.uid() AS uid) IS NULL));

CREATE POLICY "bookings_insert_policy" ON public.bookings
    FOR INSERT TO anon, authenticated WITH CHECK (((SELECT auth.uid() AS uid) = user_id) OR ((SELECT auth.uid() AS uid) IS NULL));

CREATE POLICY "bookings_update_policy" ON public.bookings
    FOR UPDATE TO authenticated USING (((SELECT auth.uid() AS uid) = user_id) OR public.is_gestor() OR public.is_admin());

-- 7.8 Políticas: reclamos
CREATE POLICY "Permitir inserción pública de reclamos" ON public.reclamos
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "El usuario puede leer sus propios reclamos" ON public.reclamos
    FOR SELECT TO public USING ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id));

CREATE POLICY "Admins pueden leer todos los reclamos" ON public.reclamos
    FOR SELECT TO public USING (EXISTS (SELECT 1 FROM public.profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'gestor'::public.user_role])))));

CREATE POLICY "Admins pueden actualizar reclamos" ON public.reclamos
    FOR UPDATE TO public USING (EXISTS (SELECT 1 FROM public.profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'gestor'::public.user_role])))));

-- 7.9 Políticas: districts
CREATE POLICY "Allow public read access" ON public.districts
    FOR SELECT TO public USING (true);

-- 7.10 Políticas: saved_campaigns
CREATE POLICY "Permitir lectura pública por ID" ON public.saved_campaigns
    FOR SELECT TO public USING (true);

CREATE POLICY "Permitir inserción pública" ON public.saved_campaigns
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Permitir modificación al dueño" ON public.saved_campaigns
    FOR ALL TO public USING (auth.uid() = user_id);

CREATE POLICY "Permitir vincular campaña invitada" ON public.saved_campaigns
    FOR UPDATE TO public USING (user_id IS NULL) WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- 8. CONFIGURACIÓN DE STORAGE (BUCKETS Y POLÍTICAS)
-- =====================================================================

-- Crear bucket de storage si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign_videos', 'campaign_videos', true)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS en storage.objects y storage.buckets (por defecto ya suele estar habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Políticas para storage.buckets
DROP POLICY IF EXISTS "Allow public select on buckets" ON storage.buckets;
CREATE POLICY "Allow public select on buckets" ON storage.buckets
    FOR SELECT TO public USING (true);

-- Políticas para storage.objects
DROP POLICY IF EXISTS "Allow public object read by direct url" ON storage.objects;
CREATE POLICY "Allow public object read by direct url" ON storage.objects
    FOR SELECT TO public USING ((bucket_id = 'campaign_videos'::text) AND (name ~~ 'campaign-videos/%'::text));

DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'campaign_videos'::text);

DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
CREATE POLICY "Allow users to update their own files" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'campaign_videos'::text);

DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
CREATE POLICY "Allow users to delete their own files" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'campaign_videos'::text);
```

