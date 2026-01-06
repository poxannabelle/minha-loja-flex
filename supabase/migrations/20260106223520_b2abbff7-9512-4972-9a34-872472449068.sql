-- Primeiro remover a FK constraint que referencia profiles
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_owner_id_fkey;

-- Desabilitar RLS temporariamente
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_sizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_extras DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_tables DISABLE ROW LEVEL SECURITY;

-- Dropar trigger que pode causar problemas
DROP TRIGGER IF EXISTS on_store_created ON stores;

-- Inserir lojas de demonstração
INSERT INTO stores (id, owner_id, name, slug, description, is_food_business, status, logo_url, primary_color, secondary_color)
VALUES 
  ('11111111-aaaa-bbbb-cccc-111111111111', '00000000-aaaa-bbbb-cccc-000000000001', 'Pizzaria Bella Napoli', 'bella-napoli', 'As melhores pizzas artesanais da cidade, feitas com ingredientes frescos e receitas tradicionais italianas.', true, 'ativa', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop', '#D32F2F', '#FFC107'),
  ('22222222-aaaa-bbbb-cccc-222222222222', '00000000-aaaa-bbbb-cccc-000000000002', 'Burger House Premium', 'burger-house', 'Hambúrgueres artesanais com carnes selecionadas e ingredientes premium.', true, 'ativa', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop', '#FF6B35', '#1A1A1A'),
  ('33333333-aaaa-bbbb-cccc-333333333333', '00000000-aaaa-bbbb-cccc-000000000003', 'Açaí da Amazônia', 'acai-amazonia', 'O melhor açaí da região, direto do Pará para sua mesa.', true, 'ativa', 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=100&h=100&fit=crop', '#6B21A8', '#FBBF24');

-- Inserir categorias - Pizzaria
INSERT INTO categories (id, store_id, name, description) VALUES 
  ('aaaaaaaa-1111-1111-1111-111111111111', '11111111-aaaa-bbbb-cccc-111111111111', 'Pizzas Tradicionais', 'Clássicas receitas italianas'),
  ('aaaaaaaa-1111-1111-1111-222222222222', '11111111-aaaa-bbbb-cccc-111111111111', 'Pizzas Especiais', 'Criações exclusivas da casa'),
  ('aaaaaaaa-1111-1111-1111-333333333333', '11111111-aaaa-bbbb-cccc-111111111111', 'Bebidas', 'Refrigerantes e sucos');

-- Inserir categorias - Burger House
INSERT INTO categories (id, store_id, name, description) VALUES 
  ('aaaaaaaa-2222-2222-2222-111111111111', '22222222-aaaa-bbbb-cccc-222222222222', 'Burgers Clássicos', 'Os favoritos de sempre'),
  ('aaaaaaaa-2222-2222-2222-222222222222', '22222222-aaaa-bbbb-cccc-222222222222', 'Burgers Premium', 'Criações especiais'),
  ('aaaaaaaa-2222-2222-2222-333333333333', '22222222-aaaa-bbbb-cccc-222222222222', 'Acompanhamentos', 'Batatas e porções');

-- Inserir categorias - Açaí
INSERT INTO categories (id, store_id, name, description) VALUES 
  ('aaaaaaaa-3333-3333-3333-111111111111', '33333333-aaaa-bbbb-cccc-333333333333', 'Açaí no Copo', 'Várias porções'),
  ('aaaaaaaa-3333-3333-3333-222222222222', '33333333-aaaa-bbbb-cccc-333333333333', 'Açaí na Tigela', 'Com coberturas especiais');

-- Inserir itens do menu - Pizzaria
INSERT INTO menu_items (id, store_id, category_id, name, description, base_price, image_url, is_available, preparation_time_minutes) VALUES 
  ('bbbbbbbb-1111-1111-1111-111111111111', '11111111-aaaa-bbbb-cccc-111111111111', 'aaaaaaaa-1111-1111-1111-111111111111', 'Margherita', 'Molho de tomate, mussarela, manjericão fresco e azeite', 45.90, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop', true, 30),
  ('bbbbbbbb-1111-1111-1111-222222222222', '11111111-aaaa-bbbb-cccc-111111111111', 'aaaaaaaa-1111-1111-1111-111111111111', 'Calabresa', 'Calabresa fatiada, cebola e azeitonas', 42.90, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop', true, 25),
  ('bbbbbbbb-1111-1111-1111-333333333333', '11111111-aaaa-bbbb-cccc-111111111111', 'aaaaaaaa-1111-1111-1111-222222222222', 'Quatro Queijos', 'Mussarela, gorgonzola, parmesão e provolone', 52.90, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop', true, 30),
  ('bbbbbbbb-1111-1111-1111-444444444444', '11111111-aaaa-bbbb-cccc-111111111111', 'aaaaaaaa-1111-1111-1111-333333333333', 'Refrigerante Lata', 'Coca-Cola, Guaraná ou Sprite', 6.00, 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=300&fit=crop', true, 2);

-- Inserir itens do menu - Burger House
INSERT INTO menu_items (id, store_id, category_id, name, description, base_price, image_url, is_available, preparation_time_minutes) VALUES 
  ('bbbbbbbb-2222-2222-2222-111111111111', '22222222-aaaa-bbbb-cccc-222222222222', 'aaaaaaaa-2222-2222-2222-111111111111', 'Classic Burger', 'Hambúrguer 180g, queijo cheddar, alface, tomate e molho especial', 32.90, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop', true, 15),
  ('bbbbbbbb-2222-2222-2222-222222222222', '22222222-aaaa-bbbb-cccc-222222222222', 'aaaaaaaa-2222-2222-2222-111111111111', 'Cheese Bacon', 'Hambúrguer 180g, queijo cheddar, bacon crocante e cebola caramelizada', 38.90, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop', true, 18),
  ('bbbbbbbb-2222-2222-2222-333333333333', '22222222-aaaa-bbbb-cccc-222222222222', 'aaaaaaaa-2222-2222-2222-222222222222', 'Premium Angus', 'Blend angus 200g, queijo brie, rúcula e geleia de pimenta', 48.90, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop', true, 20),
  ('bbbbbbbb-2222-2222-2222-444444444444', '22222222-aaaa-bbbb-cccc-222222222222', 'aaaaaaaa-2222-2222-2222-333333333333', 'Batata Frita', 'Porção de batatas fritas crocantes', 18.90, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop', true, 10);

-- Inserir itens do menu - Açaí
INSERT INTO menu_items (id, store_id, category_id, name, description, base_price, image_url, is_available, preparation_time_minutes) VALUES 
  ('bbbbbbbb-3333-3333-3333-111111111111', '33333333-aaaa-bbbb-cccc-333333333333', 'aaaaaaaa-3333-3333-3333-111111111111', 'Açaí Tradicional', 'Açaí puro batido com guaraná', 12.00, 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&h=300&fit=crop', true, 5),
  ('bbbbbbbb-3333-3333-3333-222222222222', '33333333-aaaa-bbbb-cccc-333333333333', 'aaaaaaaa-3333-3333-3333-222222222222', 'Açaí Premium', 'Açaí com banana, morango, granola e leite condensado', 22.00, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=300&fit=crop', true, 8);

-- Inserir tamanhos
INSERT INTO menu_item_sizes (menu_item_id, name, price_adjustment, is_default) VALUES 
  ('bbbbbbbb-1111-1111-1111-111111111111', 'Pequena (4 fatias)', -10.00, false),
  ('bbbbbbbb-1111-1111-1111-111111111111', 'Média (6 fatias)', 0.00, true),
  ('bbbbbbbb-1111-1111-1111-111111111111', 'Grande (8 fatias)', 15.00, false),
  ('bbbbbbbb-1111-1111-1111-222222222222', 'Pequena (4 fatias)', -8.00, false),
  ('bbbbbbbb-1111-1111-1111-222222222222', 'Média (6 fatias)', 0.00, true),
  ('bbbbbbbb-1111-1111-1111-222222222222', 'Grande (8 fatias)', 12.00, false),
  ('bbbbbbbb-1111-1111-1111-333333333333', 'Média (6 fatias)', 0.00, true),
  ('bbbbbbbb-1111-1111-1111-333333333333', 'Grande (8 fatias)', 18.00, false),
  ('bbbbbbbb-3333-3333-3333-111111111111', '300ml', 0.00, true),
  ('bbbbbbbb-3333-3333-3333-111111111111', '500ml', 6.00, false),
  ('bbbbbbbb-3333-3333-3333-111111111111', '700ml', 10.00, false),
  ('bbbbbbbb-3333-3333-3333-222222222222', 'Pequena', 0.00, true),
  ('bbbbbbbb-3333-3333-3333-222222222222', 'Média', 8.00, false),
  ('bbbbbbbb-3333-3333-3333-222222222222', 'Grande', 14.00, false);

-- Inserir extras
INSERT INTO menu_item_extras (menu_item_id, name, price, max_quantity, is_available) VALUES 
  ('bbbbbbbb-1111-1111-1111-111111111111', 'Borda recheada catupiry', 8.00, 1, true),
  ('bbbbbbbb-1111-1111-1111-111111111111', 'Borda recheada cheddar', 8.00, 1, true),
  ('bbbbbbbb-1111-1111-1111-222222222222', 'Extra calabresa', 6.00, 2, true),
  ('bbbbbbbb-1111-1111-1111-222222222222', 'Borda recheada catupiry', 8.00, 1, true),
  ('bbbbbbbb-2222-2222-2222-111111111111', 'Bacon extra', 5.00, 2, true),
  ('bbbbbbbb-2222-2222-2222-111111111111', 'Queijo extra', 4.00, 2, true),
  ('bbbbbbbb-2222-2222-2222-111111111111', 'Ovo', 3.00, 2, true),
  ('bbbbbbbb-2222-2222-2222-222222222222', 'Bacon extra', 5.00, 2, true),
  ('bbbbbbbb-2222-2222-2222-333333333333', 'Bacon extra', 5.00, 1, true),
  ('bbbbbbbb-3333-3333-3333-111111111111', 'Granola', 2.00, 2, true),
  ('bbbbbbbb-3333-3333-3333-111111111111', 'Leite condensado', 2.00, 2, true),
  ('bbbbbbbb-3333-3333-3333-111111111111', 'Banana', 2.50, 2, true),
  ('bbbbbbbb-3333-3333-3333-111111111111', 'Morango', 3.00, 2, true),
  ('bbbbbbbb-3333-3333-3333-222222222222', 'Nutella', 5.00, 2, true),
  ('bbbbbbbb-3333-3333-3333-222222222222', 'Paçoca', 2.50, 2, true);

-- Inserir mesas
INSERT INTO store_tables (store_id, table_number, is_active) VALUES 
  ('11111111-aaaa-bbbb-cccc-111111111111', '1', true),
  ('11111111-aaaa-bbbb-cccc-111111111111', '2', true),
  ('11111111-aaaa-bbbb-cccc-111111111111', '3', true),
  ('22222222-aaaa-bbbb-cccc-222222222222', '1', true),
  ('22222222-aaaa-bbbb-cccc-222222222222', '2', true),
  ('33333333-aaaa-bbbb-cccc-333333333333', '1', true);

-- Reabilitar RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_tables ENABLE ROW LEVEL SECURITY;