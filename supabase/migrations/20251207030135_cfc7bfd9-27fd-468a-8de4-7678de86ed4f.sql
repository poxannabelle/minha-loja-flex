-- Create product_variants table for colors, sizes, models
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_type TEXT NOT NULL, -- 'cor', 'tamanho', 'modelo'
  variant_value TEXT NOT NULL,
  price_adjustment NUMERIC DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, variant_type, variant_value)
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Everyone can view variants of active products
CREATE POLICY "Todos podem ver variantes de produtos ativos"
ON public.product_variants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_variants.product_id
    AND p.status = 'ativo'
    AND s.status = 'ativa'
  )
);

-- Store owners and managers can manage variants
CREATE POLICY "Donos e gerentes podem gerenciar variantes"
ON public.product_variants
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = product_variants.product_id
    AND (is_store_owner(auth.uid(), p.store_id) OR has_role_in_store(auth.uid(), p.store_id, 'gerente'))
  )
);

-- Add selected_variants to cart_items to store chosen options
ALTER TABLE public.cart_items 
ADD COLUMN selected_variants JSONB DEFAULT '{}';

-- Create index for performance
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);