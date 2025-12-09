
-- Criar tabela de unidades das lojas
CREATE TABLE public.store_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  is_main BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.store_units ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Donos e gerentes podem gerenciar unidades"
ON public.store_units
FOR ALL
USING (
  is_store_owner(auth.uid(), store_id) OR has_role_in_store(auth.uid(), store_id, 'gerente')
);

CREATE POLICY "Todos podem ver unidades de lojas ativas"
ON public.store_units
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_units.store_id
    AND stores.status = 'ativa'
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_store_units_updated_at
BEFORE UPDATE ON public.store_units
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índice para performance
CREATE INDEX idx_store_units_store_id ON public.store_units(store_id);
