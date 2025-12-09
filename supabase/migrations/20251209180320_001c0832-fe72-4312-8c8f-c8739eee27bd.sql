-- Make store_id nullable in categories (NULL = global/predefined category)
ALTER TABLE public.categories ALTER COLUMN store_id DROP NOT NULL;

-- Create junction table to link stores to predefined categories
CREATE TABLE public.store_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, category_id)
);

-- Enable RLS
ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;

-- Policies for store_categories
CREATE POLICY "Donos e gerentes podem gerenciar vínculos de categorias"
ON public.store_categories
FOR ALL
USING (
  is_store_owner(auth.uid(), store_id) OR has_role_in_store(auth.uid(), store_id, 'gerente')
);

CREATE POLICY "Todos podem ver vínculos de categorias de lojas ativas"
ON public.store_categories
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_categories.store_id
    AND stores.status = 'ativa'
  )
);

-- Update RLS for categories to allow viewing global categories
DROP POLICY IF EXISTS "Todos podem ver categorias de lojas ativas" ON public.categories;

CREATE POLICY "Todos podem ver categorias globais e de lojas ativas"
ON public.categories
FOR SELECT
USING (
  store_id IS NULL OR
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = categories.store_id
    AND stores.status = 'ativa'
  )
);

-- Policy for admins to manage global categories
CREATE POLICY "Admins podem gerenciar categorias globais"
ON public.categories
FOR ALL
USING (
  store_id IS NULL AND has_role(auth.uid(), 'admin')
);

-- Index for performance
CREATE INDEX idx_store_categories_store_id ON public.store_categories(store_id);
CREATE INDEX idx_store_categories_category_id ON public.store_categories(category_id);
CREATE INDEX idx_categories_store_id ON public.categories(store_id);