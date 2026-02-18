
-- Allow admins to see ALL stores (not just their own)
CREATE POLICY "Admins podem ver todas as lojas"
ON public.stores
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to see all profiles (for user management)
CREATE POLICY "Admins podem ver todos os perfis"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));
