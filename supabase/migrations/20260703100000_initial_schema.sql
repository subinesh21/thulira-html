-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Table: profiles
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  phone text,
  full_name text,
  created_at timestamptz default now()
);

-- Table: products
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  price numeric not null,
  category text,
  images jsonb,
  colors text[],
  sizes text[],
  active boolean default true
);

-- Table: orders
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'delivered', 'cancelled')),
  customer_name text,
  customer_phone text,
  shipping_address text,
  subtotal numeric,
  total numeric,
  created_at timestamptz default now(),
  confirmed_at timestamptz,
  delivered_at timestamptz
);

-- Table: order_items
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_title text not null,
  color text,
  size text,
  quantity integer not null,
  unit_price numeric not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- RLS Policies for products
create policy "Public can view active products" on public.products for select using (active = true);

-- RLS Policies for orders
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id);
-- No update policy for users on orders (admin only via service role)

-- RLS Policies for order_items
create policy "Users can view own order items" on public.order_items for select using (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
create policy "Users can insert own order items" on public.order_items for insert with check (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);

-- Trigger: auto create profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC: create_order_with_items
create or replace function public.create_order_with_items(
  p_customer_name text,
  p_customer_phone text,
  p_shipping_address text,
  p_subtotal numeric,
  p_total numeric,
  p_items jsonb
) returns uuid as $$
declare
  v_order_id uuid;
  v_item jsonb;
begin
  -- 1. Insert order
  insert into public.orders (
    user_id,
    customer_name,
    customer_phone,
    shipping_address,
    subtotal,
    total
  ) values (
    auth.uid(),
    p_customer_name,
    p_customer_phone,
    p_shipping_address,
    p_subtotal,
    p_total
  ) returning id into v_order_id;

  -- 2. Insert order items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (
      order_id,
      product_id,
      product_title,
      color,
      size,
      quantity,
      unit_price
    ) values (
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_title',
      v_item->>'color',
      v_item->>'size',
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::numeric
    );
  end loop;

  return v_order_id;
end;
$$ language plpgsql security definer;
