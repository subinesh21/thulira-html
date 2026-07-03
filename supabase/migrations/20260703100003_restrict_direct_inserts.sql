-- Drop the insert policies on public.orders and public.order_items.
-- This forces clients to go through the security definer RPC function,
-- preventing any direct INSERT requests that bypass price calculation.
drop policy if exists "Users can insert own orders" on public.orders;
drop policy if exists "Users can insert own order items" on public.order_items;
