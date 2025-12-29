-- Tabela para identificar lojas como estabelecimentos alimentícios
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_food_business boolean NOT NULL DEFAULT false;

-- Tabela de itens do menu (separada de produtos gerais)
CREATE TABLE public.menu_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    name text NOT NULL,
    description text,
    image_url text,
    base_price numeric NOT NULL DEFAULT 0,
    is_available boolean NOT NULL DEFAULT true,
    preparation_time_minutes integer DEFAULT 30,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de tamanhos dos itens do menu
CREATE TABLE public.menu_item_sizes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    name text NOT NULL, -- Ex: Pequeno, Médio, Grande
    price_adjustment numeric NOT NULL DEFAULT 0, -- Ajuste de preço em relação ao base_price
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de adicionais específicos de cada item
CREATE TABLE public.menu_item_extras (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    name text NOT NULL, -- Ex: Queijo extra, Bacon
    price numeric NOT NULL DEFAULT 0,
    max_quantity integer DEFAULT 1, -- Quantidade máxima que pode adicionar
    is_available boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de mesas para QR Code
CREATE TABLE public.store_tables (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    table_number text NOT NULL,
    qr_code_url text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(store_id, table_number)
);

-- Tabela de pedidos do menu (separada de orders para maior flexibilidade)
CREATE TABLE public.menu_orders (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    table_id uuid REFERENCES public.store_tables(id) ON DELETE SET NULL,
    customer_name text,
    customer_phone text,
    customer_email text,
    order_type text NOT NULL CHECK (order_type IN ('delivery', 'mesa', 'retirada')),
    status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'preparando', 'pronto', 'entregando', 'entregue', 'cancelado')),
    subtotal numeric NOT NULL DEFAULT 0,
    delivery_fee numeric DEFAULT 0,
    discount numeric DEFAULT 0,
    total numeric NOT NULL DEFAULT 0,
    payment_method text,
    payment_status text NOT NULL DEFAULT 'pendente' CHECK (payment_status IN ('pendente', 'pago', 'falhou', 'reembolsado')),
    stripe_payment_intent_id text,
    delivery_address text,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de itens do pedido do menu
CREATE TABLE public.menu_order_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.menu_orders(id) ON DELETE CASCADE,
    menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
    size_id uuid REFERENCES public.menu_item_sizes(id) ON DELETE SET NULL,
    quantity integer NOT NULL DEFAULT 1,
    unit_price numeric NOT NULL,
    extras_total numeric NOT NULL DEFAULT 0,
    total_price numeric NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de adicionais selecionados em cada item do pedido
CREATE TABLE public.menu_order_item_extras (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_item_id uuid NOT NULL REFERENCES public.menu_order_items(id) ON DELETE CASCADE,
    extra_id uuid NOT NULL REFERENCES public.menu_item_extras(id) ON DELETE RESTRICT,
    quantity integer NOT NULL DEFAULT 1,
    price numeric NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_order_item_extras ENABLE ROW LEVEL SECURITY;

-- RLS Policies para menu_items
CREATE POLICY "Donos e gerentes podem gerenciar itens do menu"
ON public.menu_items FOR ALL
USING (is_store_owner(auth.uid(), store_id) OR has_role_in_store(auth.uid(), store_id, 'gerente'));

CREATE POLICY "Todos podem ver itens de lojas ativas"
ON public.menu_items FOR SELECT
USING (is_available = true AND EXISTS (
    SELECT 1 FROM stores WHERE stores.id = menu_items.store_id AND stores.status = 'ativa'
));

-- RLS Policies para menu_item_sizes
CREATE POLICY "Donos e gerentes podem gerenciar tamanhos"
ON public.menu_item_sizes FOR ALL
USING (EXISTS (
    SELECT 1 FROM menu_items mi WHERE mi.id = menu_item_sizes.menu_item_id 
    AND (is_store_owner(auth.uid(), mi.store_id) OR has_role_in_store(auth.uid(), mi.store_id, 'gerente'))
));

CREATE POLICY "Todos podem ver tamanhos de itens disponíveis"
ON public.menu_item_sizes FOR SELECT
USING (EXISTS (
    SELECT 1 FROM menu_items mi 
    JOIN stores s ON s.id = mi.store_id
    WHERE mi.id = menu_item_sizes.menu_item_id 
    AND mi.is_available = true AND s.status = 'ativa'
));

-- RLS Policies para menu_item_extras
CREATE POLICY "Donos e gerentes podem gerenciar adicionais"
ON public.menu_item_extras FOR ALL
USING (EXISTS (
    SELECT 1 FROM menu_items mi WHERE mi.id = menu_item_extras.menu_item_id 
    AND (is_store_owner(auth.uid(), mi.store_id) OR has_role_in_store(auth.uid(), mi.store_id, 'gerente'))
));

CREATE POLICY "Todos podem ver adicionais de itens disponíveis"
ON public.menu_item_extras FOR SELECT
USING (is_available = true AND EXISTS (
    SELECT 1 FROM menu_items mi 
    JOIN stores s ON s.id = mi.store_id
    WHERE mi.id = menu_item_extras.menu_item_id 
    AND mi.is_available = true AND s.status = 'ativa'
));

-- RLS Policies para store_tables
CREATE POLICY "Donos e gerentes podem gerenciar mesas"
ON public.store_tables FOR ALL
USING (is_store_owner(auth.uid(), store_id) OR has_role_in_store(auth.uid(), store_id, 'gerente'));

CREATE POLICY "Todos podem ver mesas de lojas ativas"
ON public.store_tables FOR SELECT
USING (is_active = true AND EXISTS (
    SELECT 1 FROM stores WHERE stores.id = store_tables.store_id AND stores.status = 'ativa'
));

-- RLS Policies para menu_orders
CREATE POLICY "Donos e gerentes podem ver todos os pedidos"
ON public.menu_orders FOR SELECT
USING (is_store_owner(auth.uid(), store_id) OR has_role_in_store(auth.uid(), store_id, 'gerente'));

CREATE POLICY "Donos e gerentes podem gerenciar pedidos"
ON public.menu_orders FOR ALL
USING (is_store_owner(auth.uid(), store_id) OR has_role_in_store(auth.uid(), store_id, 'gerente'));

CREATE POLICY "Clientes podem ver seus próprios pedidos"
ON public.menu_orders FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Clientes autenticados podem criar pedidos"
ON public.menu_orders FOR INSERT
WITH CHECK (auth.uid() = customer_id OR customer_id IS NULL);

CREATE POLICY "Pedidos anônimos podem ser criados"
ON public.menu_orders FOR INSERT
WITH CHECK (customer_id IS NULL);

-- RLS Policies para menu_order_items
CREATE POLICY "Donos e gerentes podem ver itens dos pedidos"
ON public.menu_order_items FOR SELECT
USING (EXISTS (
    SELECT 1 FROM menu_orders mo WHERE mo.id = menu_order_items.order_id 
    AND (is_store_owner(auth.uid(), mo.store_id) OR has_role_in_store(auth.uid(), mo.store_id, 'gerente'))
));

CREATE POLICY "Clientes podem ver itens de seus pedidos"
ON public.menu_order_items FOR SELECT
USING (EXISTS (
    SELECT 1 FROM menu_orders mo WHERE mo.id = menu_order_items.order_id AND mo.customer_id = auth.uid()
));

CREATE POLICY "Itens podem ser inseridos com pedido"
ON public.menu_order_items FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM menu_orders mo WHERE mo.id = menu_order_items.order_id
));

-- RLS Policies para menu_order_item_extras
CREATE POLICY "Donos e gerentes podem ver extras dos pedidos"
ON public.menu_order_item_extras FOR SELECT
USING (EXISTS (
    SELECT 1 FROM menu_order_items moi 
    JOIN menu_orders mo ON mo.id = moi.order_id
    WHERE moi.id = menu_order_item_extras.order_item_id 
    AND (is_store_owner(auth.uid(), mo.store_id) OR has_role_in_store(auth.uid(), mo.store_id, 'gerente'))
));

CREATE POLICY "Clientes podem ver extras de seus pedidos"
ON public.menu_order_item_extras FOR SELECT
USING (EXISTS (
    SELECT 1 FROM menu_order_items moi 
    JOIN menu_orders mo ON mo.id = moi.order_id
    WHERE moi.id = menu_order_item_extras.order_item_id AND mo.customer_id = auth.uid()
));

CREATE POLICY "Extras podem ser inseridos com item do pedido"
ON public.menu_order_item_extras FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM menu_order_items moi WHERE moi.id = menu_order_item_extras.order_item_id
));

-- Trigger para updated_at
CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_orders_updated_at
BEFORE UPDATE ON public.menu_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();