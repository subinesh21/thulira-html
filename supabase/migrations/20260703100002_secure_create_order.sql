-- Drop the old insecure version of create_order_with_items
drop function if exists public.create_order_with_items(text, text, text, numeric, numeric, jsonb);

-- Create the new server-trusted version
create or replace function public.create_order_with_items(
  p_customer_name text,
  p_customer_phone text,
  p_shipping_address text,
  p_items jsonb
) returns uuid as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_db_price numeric;
  v_db_title text;
  v_db_active boolean;
  v_item_total numeric := 0;
  v_order_total numeric := 0;
begin
  -- 1. Validate inputs
  if p_customer_name is null or trim(p_customer_name) = '' then
    raise exception 'Full name is required';
  end if;
  if p_customer_phone is null or trim(p_customer_phone) = '' then
    raise exception 'Phone number is required';
  end if;
  if p_shipping_address is null or trim(p_shipping_address) = '' then
    raise exception 'Shipping address is required';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart cannot be empty';
  end if;

  -- 2. Insert order placeholder (with total = 0, to be updated later)
  insert into public.orders (
    user_id,
    customer_name,
    customer_phone,
    shipping_address,
    subtotal,
    total
  ) values (
    auth.uid(),
    trim(p_customer_name),
    trim(p_customer_phone),
    trim(p_shipping_address),
    0,
    0
  ) returning id into v_order_id;

  -- 3. Loop through order items and insert them
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    
    if v_quantity <= 0 then
      raise exception 'Quantity must be greater than zero';
    end if;

    -- Look up true price and status from products table
    select price, title, active into v_db_price, v_db_title, v_db_active
    from public.products
    where id = v_product_id;

    if not found then
      raise exception 'Product not found: %', v_product_id;
    end if;

    if not v_db_active then
      raise exception 'Product is no longer active: %', v_db_title;
    end if;

    v_item_total := v_db_price * v_quantity;
    v_order_total := v_order_total + v_item_total;

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
      v_product_id,
      v_db_title,
      v_item->>'color',
      v_item->>'size',
      v_quantity,
      v_db_price
    );
  end loop;

  -- 4. Update the order with calculated server-side totals
  update public.orders
  set subtotal = v_order_total,
      total = v_order_total
  where id = v_order_id;

  return v_order_id;
end;
$$ language plpgsql security definer;
