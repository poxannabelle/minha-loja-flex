-- Allow authenticated users to manage global categories (for now)
DROP POLICY IF EXISTS "Admins podem gerenciar categorias globais" ON public.categories;

CREATE POLICY "Usuários autenticados podem criar categorias globais"
ON public.categories
FOR INSERT
WITH CHECK (store_id IS NULL AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar categorias globais"
ON public.categories
FOR UPDATE
USING (store_id IS NULL AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar categorias globais"
ON public.categories
FOR DELETE
USING (store_id IS NULL AND auth.role() = 'authenticated');