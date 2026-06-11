-- Crear tabla de campañas guardadas / cotizaciones
CREATE TABLE public.saved_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable para invitados
    campaign_name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    items JSONB NOT NULL, -- Array de CartItem con panelId, startDate, endDate, etc.
    total_amount NUMERIC NOT NULL
);

-- Habilitar Row Level Security
ALTER TABLE public.saved_campaigns ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- 1. Permitir que cualquier persona lea una cotización si tiene el enlace (UUID)
CREATE POLICY "Permitir lectura pública por ID" 
ON public.saved_campaigns 
FOR SELECT 
USING (true);

-- 2. Permitir que cualquier usuario (incluso anónimos) inserte una nueva cotización
CREATE POLICY "Permitir inserción pública" 
ON public.saved_campaigns 
FOR INSERT 
WITH CHECK (true);

-- 3. Permitir que el creador actualice o elimine su cotización (si está logueado)
CREATE POLICY "Permitir modificación al dueño" 
ON public.saved_campaigns 
FOR ALL 
USING (auth.uid() = user_id);
