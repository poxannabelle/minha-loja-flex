-- Criar enum para roles
create type public.app_role as enum ('admin', 'gerente', 'operador', 'usuario');

-- Criar enum para status de loja
create type public.store_status as enum ('ativa', 'inativa', 'em_configuracao');

-- Criar enum para status de produto
create type public.product_status as enum ('ativo', 'inativo', 'rascunho');

-- Tabela de perfis de usuário
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.profiles enable row level security;

-- Tabela de roles de usuário (separada para segurança)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  store_id uuid,
  role app_role not null,
  created_at timestamp with time zone not null default now(),
  unique (user_id, store_id, role)
);

alter table public.user_roles enable row level security;

-- Tabela de lojas (tenants)
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  primary_color text default '#000000',
  secondary_color text default '#FFD700',
  status store_status not null default 'em_configuracao',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.stores enable row level security;

-- Tabela de categorias
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  name text not null,
  description text,
  parent_id uuid references public.categories(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (store_id, name)
);

alter table public.categories enable row level security;

-- Tabela de produtos
create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price decimal(10,2) not null,
  original_price decimal(10,2),
  image_url text,
  stock_quantity integer not null default 0,
  status product_status not null default 'rascunho',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.products enable row level security;

-- Função para atualizar updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers para updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();

create trigger update_stores_updated_at
  before update on public.stores
  for each row
  execute function public.update_updated_at_column();

create trigger update_categories_updated_at
  before update on public.categories
  for each row
  execute function public.update_updated_at_column();

create trigger update_products_updated_at
  before update on public.products
  for each row
  execute function public.update_updated_at_column();

-- Função para criar perfil automaticamente
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

-- Trigger para criar perfil ao criar usuário
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Função de segurança para verificar roles (evita recursão em RLS)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Função para verificar role em loja específica
create or replace function public.has_role_in_store(_user_id uuid, _store_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and (store_id = _store_id or store_id is null)
      and role = _role
  )
$$;

-- Função para verificar se é dono da loja
create or replace function public.is_store_owner(_user_id uuid, _store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.stores
    where id = _store_id
      and owner_id = _user_id
  )
$$;

-- RLS Policies para profiles
create policy "Usuários podem ver seu próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários podem atualizar seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- RLS Policies para user_roles
create policy "Admins podem ver todos os roles"
  on public.user_roles for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Donos de loja podem ver roles de sua loja"
  on public.user_roles for select
  using (
    exists (
      select 1 from public.stores
      where stores.id = user_roles.store_id
      and stores.owner_id = auth.uid()
    )
  );

create policy "Usuários podem ver seus próprios roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins podem gerenciar roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para stores
create policy "Todos podem ver lojas ativas"
  on public.stores for select
  using (status = 'ativa');

create policy "Donos podem ver sua própria loja"
  on public.stores for select
  using (auth.uid() = owner_id);

create policy "Usuários autenticados podem criar lojas"
  on public.stores for insert
  with check (auth.uid() = owner_id);

create policy "Donos podem atualizar sua loja"
  on public.stores for update
  using (auth.uid() = owner_id);

create policy "Admins podem atualizar qualquer loja"
  on public.stores for update
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para categories
create policy "Todos podem ver categorias de lojas ativas"
  on public.categories for select
  using (
    exists (
      select 1 from public.stores
      where stores.id = categories.store_id
      and stores.status = 'ativa'
    )
  );

create policy "Donos e gerentes podem gerenciar categorias"
  on public.categories for all
  using (
    public.is_store_owner(auth.uid(), store_id)
    or public.has_role_in_store(auth.uid(), store_id, 'gerente')
  );

-- RLS Policies para products
create policy "Todos podem ver produtos ativos"
  on public.products for select
  using (
    status = 'ativo'
    and exists (
      select 1 from public.stores
      where stores.id = products.store_id
      and stores.status = 'ativa'
    )
  );

create policy "Donos podem ver todos os produtos de sua loja"
  on public.products for select
  using (public.is_store_owner(auth.uid(), store_id));

create policy "Gerentes e operadores podem ver produtos"
  on public.products for select
  using (
    public.has_role_in_store(auth.uid(), store_id, 'gerente')
    or public.has_role_in_store(auth.uid(), store_id, 'operador')
  );

create policy "Donos e gerentes podem gerenciar produtos"
  on public.products for all
  using (
    public.is_store_owner(auth.uid(), store_id)
    or public.has_role_in_store(auth.uid(), store_id, 'gerente')
  );

-- Trigger para criar role de admin ao criar loja
create or replace function public.handle_new_store()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Criar role de admin para o dono da loja
  insert into public.user_roles (user_id, store_id, role)
  values (new.owner_id, new.id, 'admin');
  return new;
end;
$$;

create trigger on_store_created
  after insert on public.stores
  for each row
  execute function public.handle_new_store();