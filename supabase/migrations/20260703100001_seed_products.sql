-- Seed data for Thulira Products: Bottles and Drinkware

-- Clean existing data
TRUNCATE TABLE public.products CASCADE;

INSERT INTO public.products (title, description, price, category, images, colors, sizes, active)
VALUES
-- Bottles
(
  'Lira Pure Mini',
  'Compact, lightweight, and perfect for everyday hydration. Ideal for kids, office, and travel. Made from eco-friendly rice husk & bamboo fiber, BPA-free, reusable, lightweight, durable, and a sustainable alternative to plastic. (Code: 001)',
  579,
  'Bottles',
  '[]'::jsonb,
  ARRAY['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
  ARRAY['400ml'],
  true
),
(
  'Lira Pure Insulated Maxi',
  'Designed for those who need more hydration throughout the day. Durable, stylish, and easy to carry. Made from eco-friendly rice husk & bamboo fiber, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 002)',
  649,
  'Bottles',
  '[]'::jsonb,
  ARRAY['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
  ARRAY['600ml'],
  true
),
(
  'Lira Hydra Mini',
  'A sleek everyday bottle that keeps you refreshed wherever you go. Perfect for work, school, and short trips. Made from eco-friendly rice husk & bamboo fiber, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 003)',
  569,
  'Bottles',
  '[]'::jsonb,
  ARRAY['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
  ARRAY['400ml'],
  true
),
(
  'Lira Hydra Maxi',
  'Built for active lifestyles with a larger capacity to keep you hydrated longer. Great for fitness, travel, and outdoor use. Made from eco-friendly rice husk & bamboo fiber, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 004)',
  649,
  'Bottles',
  '[]'::jsonb,
  ARRAY['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
  ARRAY['600ml'],
  true
),
(
  'Lira Sipper Mini',
  'Convenient flip-sipper design for quick, spill-resistant drinking. Perfect for daily commutes and kids. Made from eco-friendly rice husk & bamboo fiber, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 005)',
  719,
  'Bottles',
  '[]'::jsonb,
  ARRAY['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
  ARRAY['400ml'],
  true
),
(
  'Lira Sipper Maxi',
  'Large-capacity sipper bottle with easy one-hand access. Ideal for sports, office, and long journeys. Made from eco-friendly rice husk & bamboo fiber, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 006)',
  799,
  'Bottles',
  '[]'::jsonb,
  ARRAY['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
  ARRAY['600ml'],
  true
),
(
  'Lira Aqua Lite',
  'Ultra-lightweight and stylish, crafted for effortless everyday hydration. A perfect blend of comfort, durability, and modern design. Made from eco-friendly rice husk & bamboo fiber, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 007)',
  699,
  'Bottles',
  '[]'::jsonb,
  ARRAY['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
  ARRAY['900ml'],
  true
),

-- Drinkware
(
  'Delight Mug',
  'Elegant everyday coffee mug with a smooth finish and comfortable grip. Perfect for home, office, and gifting. Crafted from eco-friendly rice husk & bamboo fibres, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 011) (Specs: 11.5x8.5x10 cm, 100g)',
  249,
  'Drinkware',
  '[]'::jsonb,
  ARRAY['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
  ARRAY['300ml'],
  true
),
(
  'Classic Mug',
  'Timeless design with a spacious capacity for your favourite beverages. Simple, stylish, and made for daily use. Crafted from eco-friendly rice husk & bamboo fibres, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 012) (Specs: 11.5x8.5x9 cm, 120g)',
  220,
  'Drinkware',
  '[]'::jsonb,
  ARRAY['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
  ARRAY['350ml'],
  true
),
(
  'Groovey Mug',
  'Modern ribbed texture with a premium look and comfortable hold. A perfect blend of style and functionality. Crafted from eco-friendly rice husk & bamboo fibres, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 013) (Specs: 11.5x8.5x9.5 cm, 110g)',
  199,
  'Drinkware',
  '[]'::jsonb,
  ARRAY['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
  ARRAY['350ml'],
  true
),
(
  'Trio Mug',
  'Large-capacity mug with a unique ergonomic handle for a secure and comfortable grip. Ideal for coffee, tea, and hot beverages. Crafted from eco-friendly rice husk & bamboo fibres, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 014) (Specs: 70g)',
  199,
  'Drinkware',
  '[]'::jsonb,
  ARRAY['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
  ARRAY['400ml'],
  true
),
(
  'Wave Stainless',
  'Double-wall stainless steel interior with an eco-friendly exterior to keep drinks enjoyable for longer. Durable, stylish, and travel-friendly. Crafted from eco-friendly rice husk & bamboo fibres, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 015) (Specs: 10.5x10.5x11 cm, 250g)',
  279,
  'Drinkware',
  '[]'::jsonb,
  ARRAY['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
  ARRAY['250ml'],
  true
),
(
  'Duo Square Mug',
  'Contemporary dual-tone design that adds elegance to every sip. Perfect for everyday use and premium gifting. Crafted from eco-friendly rice husk & bamboo fibres, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 016) (Specs: 10.5x8x9.5 cm, 110g)',
  210,
  'Drinkware',
  '[]'::jsonb,
  ARRAY['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
  ARRAY['300ml'],
  true
),
(
  'Boat Tea Cup',
  'Compact tea cup with a matching snack tray for a complete serving experience. Perfect for tea, coffee, and light refreshments. Crafted from eco-friendly rice husk & bamboo fibres, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 017) (Specs: 17x10x5.5 cm, 75g)',
  229,
  'Drinkware',
  '[]'::jsonb,
  ARRAY['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
  ARRAY['150ml'],
  true
);
