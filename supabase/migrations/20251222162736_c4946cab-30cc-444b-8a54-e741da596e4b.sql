-- Criar tabela de pedidos/compras
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id),
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  order_type TEXT NOT NULL CHECK (order_type IN ('online', 'loja')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'em_preparacao', 'enviado', 'entregue', 'cancelado', 'finalizado')),
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens do pedido
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para orders
CREATE POLICY "Donos e gerentes podem ver pedidos da loja"
ON public.orders FOR SELECT
USING (is_store_owner(auth.uid(), store_id) OR has_role_in_store(auth.uid(), store_id, 'gerente'));

CREATE POLICY "Operadores podem ver pedidos da loja"
ON public.orders FOR SELECT
USING (has_role_in_store(auth.uid(), store_id, 'operador'));

CREATE POLICY "Donos e gerentes podem gerenciar pedidos"
ON public.orders FOR ALL
USING (is_store_owner(auth.uid(), store_id) OR has_role_in_store(auth.uid(), store_id, 'gerente'));

CREATE POLICY "Operadores podem criar pedidos"
ON public.orders FOR INSERT
WITH CHECK (has_role_in_store(auth.uid(), store_id, 'operador'));

CREATE POLICY "Operadores podem atualizar pedidos"
ON public.orders FOR UPDATE
USING (has_role_in_store(auth.uid(), store_id, 'operador'));

CREATE POLICY "Clientes podem ver seus próprios pedidos"
ON public.orders FOR SELECT
USING (auth.uid() = customer_id);

-- Políticas para order_items
CREATE POLICY "Donos e gerentes podem ver itens de pedidos"
ON public.order_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_items.order_id
  AND (is_store_owner(auth.uid(), o.store_id) OR has_role_in_store(auth.uid(), o.store_id, 'gerente'))
));

CREATE POLICY "Operadores podem ver itens de pedidos"
ON public.order_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_items.order_id
  AND has_role_in_store(auth.uid(), o.store_id, 'operador')
));

CREATE POLICY "Donos e gerentes podem gerenciar itens"
ON public.order_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_items.order_id
  AND (is_store_owner(auth.uid(), o.store_id) OR has_role_in_store(auth.uid(), o.store_id, 'gerente'))
));

CREATE POLICY "Operadores podem criar itens"
ON public.order_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_items.order_id
  AND has_role_in_store(auth.uid(), o.store_id, 'operador')
));

CREATE POLICY "Clientes podem ver itens de seus pedidos"
ON public.order_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_items.order_id
  AND o.customer_id = auth.uid()
));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();