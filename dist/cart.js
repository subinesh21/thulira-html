const fallbackProducts = [
  {
    id: '001',
    title: 'Lira Pure Mini',
    description: 'Compact, lightweight, and perfect for everyday hydration. Ideal for kids, office, and travel. Made from eco-friendly rice husk & bamboo fiber, BPA-free, reusable, lightweight, durable, and a sustainable alternative to plastic. (Code: 001)',
    price: 579,
    category: 'Bottles',
    images: ['https://placehold.co/800x600/e0e0e0/555555?text=Lira+Pure+Mini'],
    colors: ['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
    sizes: ['400ml'],
    active: true
  },
  {
    id: '002',
    title: 'Lira Pure Insulated Maxi',
    description: 'Designed for those who need more hydration throughout the day. Durable, stylish, and easy to carry. Made from eco-friendly rice husk & bamboo fiber, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 002)',
    price: 649,
    category: 'Bottles',
    images: ['https://placehold.co/800x600/e0e0e0/555555?text=Lira+Pure+Insulated+Maxi'],
    colors: ['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
    sizes: ['600ml'],
    active: true
  },
  {
    id: '003',
    title: 'Lira Hydra Mini',
    description: 'A sleek everyday bottle that keeps you refreshed wherever you go. Perfect for work, school, and short trips. Made from eco-friendly rice husk & bamboo fiber, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 003)',
    price: 569,
    category: 'Bottles',
    images: ['https://placehold.co/800x600/e0e0e0/555555?text=Lira+Hydra+Mini'],
    colors: ['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
    sizes: ['400ml'],
    active: true
  },
  {
    id: '004',
    title: 'Lira Hydra Maxi',
    description: 'Built for active lifestyles with a larger capacity to keep you hydrated longer. Great for fitness, travel, and outdoor use. Made from eco-friendly rice husk & bamboo fiber, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 004)',
    price: 649,
    category: 'Bottles',
    images: ['https://placehold.co/800x600/e0e0e0/555555?text=Lira+Hydra+Maxi'],
    colors: ['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
    sizes: ['600ml'],
    active: true
  },
  {
    id: '005',
    title: 'Lira Sipper Mini',
    description: 'Convenient flip-sipper design for quick, spill-resistant drinking. Perfect for daily commutes and kids. Made from eco-friendly rice husk & bamboo fiber, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 005)',
    price: 719,
    category: 'Bottles',
    images: ['https://placehold.co/800x600/e0e0e0/555555?text=Lira+Sipper+Mini'],
    colors: ['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
    sizes: ['400ml'],
    active: true
  },
  {
    id: '006',
    title: 'Lira Sipper Maxi',
    description: 'Large-capacity sipper bottle with easy one-hand access. Ideal for sports, office, and long journeys. Made from eco-friendly rice husk & bamboo fiber, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 006)',
    price: 799,
    category: 'Bottles',
    images: ['https://placehold.co/800x600/e0e0e0/555555?text=Lira+Sipper+Maxi'],
    colors: ['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
    sizes: ['600ml'],
    active: true
  },
  {
    id: '007',
    title: 'Lira Aqua Lite',
    description: 'Ultra-lightweight and stylish, crafted for effortless everyday hydration. A perfect blend of comfort, durability, and modern design. Made from eco-friendly rice husk & bamboo fiber, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 007)',
    price: 699,
    category: 'Bottles',
    images: ['https://placehold.co/800x600/e0e0e0/555555?text=Lira+Aqua+Lite'],
    colors: ['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
    sizes: ['900ml'],
    active: true
  },
  {
    id: '011',
    title: 'Delight Mug',
    description: 'Elegant everyday coffee mug with a smooth finish and comfortable grip. Perfect for home, office, and gifting. Crafted from eco-friendly rice husk & bamboo fibres, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 011) (Specs: 11.5x8.5x10 cm, 100g)',
    price: 249,
    category: 'Drinkware',
    images: ['https://placehold.co/800x600/e0e0e0/555555?text=Delight+Mug'],
    colors: ['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
    sizes: ['300ml'],
    active: true
  },
  {
    id: '012',
    title: 'Classic Mug',
    description: 'Timeless design with a spacious capacity for your favourite beverages. Simple, stylish, and made for daily use. Crafted from eco-friendly rice husk & bamboo fibres, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 012) (Specs: 11.5x8.5x9 cm, 120g)',
    price: 220,
    category: 'Drinkware',
    images: ['https://placehold.co/800x600/e0e0e0/555555?text=Classic+Mug'],
    colors: ['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
    sizes: ['350ml'],
    active: true
  },
  {
    id: '013',
    title: 'Groovey Mug',
    description: 'Modern ribbed texture with a premium look and comfortable hold. A perfect blend of style and functionality. Crafted from eco-friendly rice husk & bamboo fibres, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 013) (Specs: 11.5x8.5x9.5 cm, 110g)',
    price: 199,
    category: 'Drinkware',
    images: ['https://placehold.co/800x600/e0e0e0/555555?text=Groovey+Mug'],
    colors: ['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
    sizes: ['350ml'],
    active: true
  },
  {
    id: '014',
    title: 'Trio Mug',
    description: 'Large-capacity mug with a unique ergonomic handle for a secure and comfortable grip. Ideal for coffee, tea, and hot beverages. Crafted from eco-friendly rice husk & bamboo fibres, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 014) (Specs: 70g)',
    price: 199,
    category: 'Drinkware',
    images: ['https://placehold.co/800x600/e0e0e0/555555?text=Trio+Mug'],
    colors: ['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
    sizes: ['400ml'],
    active: true
  },
  {
    id: '015',
    title: 'Wave Stainless',
    description: 'Double-wall stainless steel interior with an eco-friendly exterior to keep drinks enjoyable for longer. Durable, stylish, and travel-friendly. Crafted from eco-friendly rice husk & bamboo fibres, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 015) (Specs: 10.5x10.5x11 cm, 250g)',
    price: 279,
    category: 'Drinkware',
    images: ['https://placehold.co/800x600/e0e0e0/555555?text=Wave+Stainless'],
    colors: ['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
    sizes: ['250ml'],
    active: true
  },
  {
    id: '016',
    title: 'Duo Square Mug',
    description: 'Contemporary dual-tone design that adds elegance to every sip. Perfect for everyday use and premium gifting. Crafted from eco-friendly rice husk & bamboo fibres, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 016) (Specs: 10.5x8x9.5 cm, 110g)',
    price: 210,
    category: 'Drinkware',
    images: ['https://placehold.co/800x600/e0e0e0/555555?text=Duo+Square+Mug'],
    colors: ['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
    sizes: ['300ml'],
    active: true
  },
  {
    id: '017',
    title: 'Boat Tea Cup',
    description: 'Compact tea cup with a matching snack tray for a complete serving experience. Perfect for tea, coffee, and light refreshments. Crafted from eco-friendly rice husk & bamboo fibres, BPA-free, reusable, lightweight, durable, sustainable alternative to plastic. (Code: 017) (Specs: 17x10x5.5 cm, 75g)',
    price: 229,
    category: 'Drinkware',
    images: ['https://placehold.co/800x600/e0e0e0/555555?text=Boat+Tea+Cup'],
    colors: ['Coffee', 'Tortilla', 'Sand Castle', 'Coral', 'Oriole', 'Pink', 'Charcoal', 'Pebble', 'Azure', 'Fern', 'Zesty', 'Celeste', 'French Blue', 'Mauve', 'Citron'],
    sizes: ['150ml'],
    active: true
  }
];

// Thulira E-Commerce Cart Logic

const BOTTLE_ASSETS = {
  'Lira Pure Mini': {
    folder: 'Lira pure mini',
    colors: {
      'Green': { hex: '#8f9779', count: 9 },
      'Oriole': { hex: '#d67229', count: 9 },
      'Purple': { hex: '#7b1fa2', count: 9 },
      'Tortilla': { hex: '#c3ad96', count: 9 }
    },
    defaultColor: 'Green'
  },
  'Lira Hydra Mini': {
    folder: 'Lira hydra mini',
    colors: {
      'Coffee': { hex: '#4d3c33', count: 10 },
      'Green': { hex: '#8f9779', count: 10 },
      'Multi Color - Coffee-Oriole': { hex: 'linear-gradient(135deg, #4d3c33 50%, #d67229 50%)', count: 9 },
      'Multi Color - Green-Oriole': { hex: 'linear-gradient(135deg, #8f9779 50%, #d67229 50%)', count: 9 },
      'Multi Color - Green-Purple': { hex: 'linear-gradient(135deg, #8f9779 50%, #7b1fa2 50%)', count: 9 },
      'Oriole': { hex: '#d67229', count: 10 },
      'Purple': { hex: '#7b1fa2', count: 10 },
      'Tortilla': { hex: '#c3ad96', count: 10 }
    },
    defaultColor: 'Green'
  },
  'Lira Sipper Mini': {
    folder: 'Lira sipper mini',
    colors: {
      'Pink': { hex: '#fcfbfa', count: 13 },
      'Sand Castle': { hex: '#d3c2b0', count: 13 }
    },
    defaultColor: 'Pink'
  },
  'Lira Sipper Maxi': {
    folder: 'Lira sipper mixi',
    colors: {
      'Azure': { hex: '#3d7ca6', count: 13 },
      'Celeste': { hex: '#afeeee', count: 13 },
      'Pink': { hex: '#fcfbfa', count: 13 },
      'Sand Castle': { hex: '#d3c2b0', count: 13 }
    },
    defaultColor: 'Pink'
  },
  'Lira Aqua Lite': {
    folder: 'Lira aqualite',
    colors: {
      'Azure': { hex: '#3d7ca6', count: 9 },
      'Celeste': { hex: '#afeeee', count: 9 },
      'Coffee': { hex: '#4d3c33', count: 9 },
      'Pink': { hex: '#fcfbfa', count: 9 },
      'Oriole': { hex: '#d67229', count: 9 },
      'Purple': { hex: '#7b1fa2', count: 9 }
    },
    defaultColor: 'Azure'
  }
};

let PRODUCTS = {};
let cart = JSON.parse(localStorage.getItem('thulira_cart')) || [];

async function fetchProducts() {
  if (!window.supabaseClient) {
    if (window.initSupabase) {
      await window.initSupabase();
    }
  }

  let finalData = [];

  if (!window.supabaseClient) {
    console.error('Supabase client not initialized. Falling back to mock data.');
    finalData = fallbackProducts;
  } else {
    try {
      const { data, error } = await window.supabaseClient
        .from('products')
        .select('*')
        .eq('active', true);

      if (error || !data || data.length === 0) {
        console.warn('Empty catalog or error from Supabase. Falling back to mock data.');
        finalData = fallbackProducts;
      } else {
        finalData = data;
      }
    } catch (err) {
      console.error('Error fetching products from Supabase:', err);
      finalData = fallbackProducts;
    }
  }

  finalData.forEach(p => {
    // Check for match in BOTTLE_ASSETS
    const assetKey = Object.keys(BOTTLE_ASSETS).find(key =>
      p.title.toLowerCase() === key.toLowerCase() ||
      p.title.toLowerCase().includes(key.toLowerCase())
    );
    const localAsset = assetKey ? BOTTLE_ASSETS[assetKey] : null;

    let colors = p.colors;
    let images = p.images;
    let defaultImage = '';

    if (localAsset) {
      colors = Object.keys(localAsset.colors);
      const defColor = localAsset.defaultColor;
      images = [];
      const count = localAsset.colors[defColor].count;
      for (let i = 1; i <= count; i++) {
        const numStr = String(i).padStart(2, '0');
        images.push(`/products/Bottles/${localAsset.folder}/${defColor}/${numStr}.jpg`);
      }
      defaultImage = images[0];
    } else {
      defaultImage = (p.images && p.images.length > 0) ? p.images[0] : 'https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder';
    }

    PRODUCTS[p.id] = {
      id: p.id,
      name: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      image_url: defaultImage,
      images: images,
      colors: colors,
      variants: p.sizes && p.sizes.length > 0 ? p.sizes : ['Standard'],
      localAsset: localAsset
    };
  });
  return finalData;
}

function saveCart() {
  localStorage.setItem('thulira_cart', JSON.stringify(cart));
  updateCartBadges();
}

function addToCart(productId, variant, color) {
  const product = PRODUCTS[productId];
  if (!product) {
    console.error('Product not found in catalog:', productId);
    return;
  }

  // Default variant (size) if not provided
  if (!variant && product.variants && product.variants.length > 0) {
    variant = product.variants[0];
  } else if (!variant) {
    variant = 'Standard';
  }

  // Default color if not provided
  if (!color && product.colors && product.colors.length > 0) {
    color = product.colors[0];
  } else if (!color) {
    color = '';
  }

  const cartItemId = color ? `${productId}-${variant}-${color}` : `${productId}-${variant}`;

  const existingItem = cart.find(item => item.cartItemId === cartItemId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    let itemImage = product.image_url;
    if (color && product.localAsset && product.localAsset.colors[color]) {
      itemImage = `/products/Bottles/${product.localAsset.folder}/${color}/01.jpg`;
    }
    cart.push({
      id: productId,
      cartItemId: cartItemId,
      title: product.name,
      price: product.price,
      image: itemImage,
      variant: variant,
      color: color || null,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  openCartDrawer();

  // Close Webflow modal popup if it is open
  const openPopups = document.querySelectorAll('.service-item__popup-wrapper');
  openPopups.forEach(popup => {
    popup.style.opacity = '';
    popup.style.visibility = '';
  });
}

function updateQuantity(cartItemId, quantity) {
  const item = cart.find(item => item.cartItemId === cartItemId);
  if (!item) return;

  item.quantity = parseInt(quantity, 10);
  if (item.quantity <= 0) {
    removeFromCart(cartItemId);
    return;
  }

  saveCart();
  renderCart();
}

function removeFromCart(cartItemId) {
  cart = cart.filter(item => item.cartItemId !== cartItemId);
  saveCart();
  renderCart();
}

function getCartTotal() {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCartItemCount() {
  return cart.reduce((count, item) => count + item.quantity, 0);
}

function updateCartBadges() {
  const count = getCartItemCount();
  const badges = document.querySelectorAll('.cart-badge');
  badges.forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? (badge.closest('.nav__menu-link') ? 'inline-block' : 'flex') : 'none';
  });
}

function openCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer && overlay) {
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent main page scrolling
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer && overlay) {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
  }
}

function renderCart() {
  const itemsContainer = document.getElementById('cartItemsList');
  const grandTotalVal = document.getElementById('cartGrandTotalVal');
  const checkoutBtn = document.getElementById('cartCheckoutBtn');

  if (!itemsContainer) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <div style="font-weight:700; font-size:1.1rem;">Your Cart is Empty</div>
        <div style="font-size:0.9rem;">Browse our sustainable products and add them to get started.</div>
      </div>
    `;
    if (grandTotalVal) grandTotalVal.textContent = '₹0.00';
    if (checkoutBtn) {
      checkoutBtn.style.opacity = '0.5';
      checkoutBtn.style.pointerEvents = 'none';
    }
    return;
  }

  let html = '';
  cart.forEach(item => {
    const displayVariant = item.color ? `${item.variant} / ${item.color}` : item.variant;
    html += `
      <div class="cart-item" data-id="${item.cartItemId}">
        <img src="${item.image}" alt="${item.title}" class="cart-item-image">
        <div class="cart-item-details">
          <div>
            <h4 class="cart-item-title">${item.title} <span class="cart-item-size-badge">${displayVariant}</span></h4>
            <span class="cart-item-price">₹${item.price}</span>
          </div>
          <div class="cart-item-controls">
            <div class="quantity-picker">
              <button class="quantity-btn dec-qty-btn" data-id="${item.cartItemId}">-</button>
              <span class="quantity-value">${item.quantity}</span>
              <button class="quantity-btn inc-qty-btn" data-id="${item.cartItemId}">+</button>
            </div>
            <button class="cart-item-remove" data-id="${item.cartItemId}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Remove
            </button>
          </div>
        </div>
      </div>
    `;
  });

  itemsContainer.innerHTML = html;

  const grandTotal = getCartTotal();
  if (grandTotalVal) grandTotalVal.textContent = `₹${grandTotal}`;

  if (checkoutBtn) {
    checkoutBtn.style.opacity = '1';
    checkoutBtn.style.pointerEvents = 'all';
  }
}

// Inject Drawer HTML Dynamically
function injectCartMarkup() {
  if (document.getElementById('cartDrawer')) return;

  const overlay = document.createElement('div');
  overlay.className = 'cart-overlay';
  overlay.id = 'cartOverlay';

  const drawer = document.createElement('div');
  drawer.className = 'cart-drawer';
  drawer.id = 'cartDrawer';
  drawer.innerHTML = `
    <div class="cart-header">
      <h2>Your Cart</h2>
      <button class="cart-close-btn" id="cartCloseBtn">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="cart-items-list" id="cartItemsList"></div>
    <div class="cart-footer">
      <div class="cart-summary-line total">
        <span>Total Due on Delivery</span>
        <span id="cartGrandTotalVal">₹0.00</span>
      </div>
      <a href="checkout.html" class="cart-checkout-btn" id="cartCheckoutBtn">
        <span>Proceed to Checkout</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </a>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  // Close Event Listeners
  document.getElementById('cartCloseBtn').addEventListener('click', closeCartDrawer);
  overlay.addEventListener('click', closeCartDrawer);

  // Delegate Items Events
  drawer.addEventListener('click', (e) => {
    const incBtn = e.target.closest('.inc-qty-btn');
    const decBtn = e.target.closest('.dec-qty-btn');
    const remBtn = e.target.closest('.cart-item-remove');

    if (incBtn) {
      const id = incBtn.getAttribute('data-id');
      const item = cart.find(i => i.cartItemId === id);
      if (item) updateQuantity(id, item.quantity + 1);
    } else if (decBtn) {
      const id = decBtn.getAttribute('data-id');
      const item = cart.find(i => i.cartItemId === id);
      if (item) updateQuantity(id, item.quantity - 1);
    } else if (remBtn) {
      const id = remBtn.getAttribute('data-id');
      removeFromCart(id);
    }
  });
}

function injectAuthMarkup() {
  const overlay = document.createElement('div');
  overlay.className = 'cart-overlay';
  overlay.id = 'authOverlay';

  const modal = document.createElement('div');
  modal.className = 'auth-modal';
  modal.id = 'authModal';
  modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--thulira-bg-dark, #1c1c1c); padding: 2rem; border-radius: 8px; z-index: 10001; display: none; width: 90%; max-width: 400px; color: white; border: 1px solid rgba(255,255,255,0.1);';

  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="margin: 0; font-size: 1.5rem;">Sign In</h2>
      <button id="authCloseBtn" style="background: none; border: none; color: white; cursor: pointer;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
    
    <div id="authStep1">
      <p style="margin-bottom: 1rem; color: #aaa;">Enter your mobile number to sign in or create an account.</p>
      <input type="tel" id="authPhoneInput" placeholder="+6588888888" style="width: 100%; padding: 0.8rem; margin-bottom: 1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 4px;">
      <button id="authSendOtpBtn" style="width: 100%; padding: 0.8rem; background: var(--thulira-orange, #f78c44); color: black; border: none; font-weight: bold; cursor: pointer; border-radius: 4px;">Send OTP</button>
    </div>

    <div id="authStep2" style="display: none;">
      <p style="margin-bottom: 1rem; color: #aaa;">Enter the 6-digit code sent to your phone.</p>
      <input type="text" id="authOtpInput" placeholder="123456" style="width: 100%; padding: 0.8rem; margin-bottom: 1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 4px;" maxlength="6">
      <button id="authVerifyOtpBtn" style="width: 100%; padding: 0.8rem; background: var(--thulira-orange, #f78c44); color: black; border: none; font-weight: bold; cursor: pointer; border-radius: 4px;">Verify & Sign In</button>
      <button id="authBackBtn" style="width: 100%; padding: 0.8rem; background: transparent; color: #aaa; border: none; margin-top: 0.5rem; cursor: pointer;">Back</button>
    </div>
    <div id="authErrorMsg" style="color: #ff6b6b; margin-top: 1rem; text-align: center; font-size: 0.9rem;"></div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  const closeAuthModal = () => {
    overlay.classList.remove('active');
    modal.style.display = 'none';
  };

  document.getElementById('authCloseBtn').addEventListener('click', closeAuthModal);
  overlay.addEventListener('click', () => {
    if (modal.style.display === 'block') closeAuthModal();
  });

  document.getElementById('authSendOtpBtn').addEventListener('click', async () => {
    const phone = document.getElementById('authPhoneInput').value.trim();
    if (!phone) return alert('Please enter a valid phone number.');

    document.getElementById('authSendOtpBtn').textContent = 'Sending...';
    document.getElementById('authSendOtpBtn').disabled = true;
    document.getElementById('authErrorMsg').textContent = '';

    try {
      const response = await fetch('/api/auth/mock-otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const resData = await response.json();
      
      if (response.ok && resData.success) {
        console.log(`[MOCK OTP] OTP request succeeded for phone: ${phone}. Check the backend terminal log for the verification code.`);
        document.getElementById('authStep1').style.display = 'none';
        document.getElementById('authStep2').style.display = 'block';
      } else {
        throw new Error(resData.error || 'Mock OTP API failed');
      }
    } catch (err) {
      console.warn('Mock OTP request failed, falling back to real Supabase OTP:', err.message);
      // Fallback to real Supabase
      const { data, error } = await window.supabaseClient.auth.signInWithOtp({ phone });
      if (error) {
        document.getElementById('authErrorMsg').textContent = error.message;
      } else {
        document.getElementById('authStep1').style.display = 'none';
        document.getElementById('authStep2').style.display = 'block';
      }
    } finally {
      document.getElementById('authSendOtpBtn').textContent = 'Send OTP';
      document.getElementById('authSendOtpBtn').disabled = false;
    }
  });

  document.getElementById('authVerifyOtpBtn').addEventListener('click', async () => {
    const phone = document.getElementById('authPhoneInput').value.trim();
    const token = document.getElementById('authOtpInput').value.trim();
    if (!token) return alert('Please enter the OTP.');

    document.getElementById('authVerifyOtpBtn').textContent = 'Verifying...';
    document.getElementById('authVerifyOtpBtn').disabled = true;
    document.getElementById('authErrorMsg').textContent = '';

    try {
      const response = await fetch('/api/auth/mock-otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: token })
      });
      const resData = await response.json();

      if (response.ok && resData.success && resData.password) {
        if (!window.supabaseClient) {
          throw new Error('Supabase client is not initialized');
        }
        // Authenticate with Supabase using password
        let { data, error } = await window.supabaseClient.auth.signInWithPassword({
          email: resData.email,
          password: resData.password
        });
        
        // Fallback 1: If user doesn't exist, sign them up first and retry signing in
        if (error && (error.message.includes('Invalid login credentials') || error.status === 400)) {
          console.log('[MOCK OTP] User not found. Attempting to sign up user via frontend client...');
          const signupRes = await window.supabaseClient.auth.signUp({
            email: resData.email,
            password: resData.password
          });
          
          if (!signupRes.error) {
            console.log('[MOCK OTP] Signup succeeded. Retrying sign in...');
            const retryRes = await window.supabaseClient.auth.signInWithPassword({
              email: resData.email,
              password: resData.password
            });
            data = retryRes.data;
            error = retryRes.error;
          } else {
            error = signupRes.error;
          }
        }

        // Fallback 2: If sign up fails (e.g. rate limit), attempt Anonymous sign-in
        if (error && (error.message.includes('rate limit') || error.status === 429)) {
          console.warn('[MOCK OTP] Email rate limit exceeded. Falling back to anonymous sign-in...');
          const anonRes = await window.supabaseClient.auth.signInAnonymously({
            options: {
              data: {
                phone: phone,
                is_mock: true
              }
            }
          });
          
          if (!anonRes.error) {
            console.log('[MOCK OTP] Anonymous sign-in succeeded.');
            data = anonRes.data;
            error = null;
          } else {
            console.error('[MOCK OTP] Anonymous sign-in failed:', anonRes.error.message);
            error = anonRes.error;
          }
        }

        // Fallback 3: If anonymous sign-in also fails (e.g. disabled), use a shared test account
        if (error) {
          console.warn('[MOCK OTP] Falling back to shared test user login...');
          const sharedEmail = 'thulira.testuser@gmail.com';
          const sharedPassword = 'thuliraMockPassword123!';
          
          let sharedRes = await window.supabaseClient.auth.signInWithPassword({
            email: sharedEmail,
            password: sharedPassword
          });
          
          if (sharedRes.error) {
            // Register the shared user if they don't exist
            console.log('[MOCK OTP] Shared test user not found. Creating shared test user...');
            const sharedSignup = await window.supabaseClient.auth.signUp({
              email: sharedEmail,
              password: sharedPassword
            });
            
            if (!sharedSignup.error) {
              sharedRes = await window.supabaseClient.auth.signInWithPassword({
                email: sharedEmail,
                password: sharedPassword
              });
            }
          }
          
          if (!sharedRes.error) {
            console.log('[MOCK OTP] Shared test user sign-in succeeded.');
            // Save the phone in user metadata on the fly
            await window.supabaseClient.auth.updateUser({
              data: { phone: phone }
            });
            data = sharedRes.data;
            error = null;
          }
        }
        
        if (error) {
          let msg = error.message;
          // Strip email addresses from error message
          msg = msg.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'your account');
          document.getElementById('authErrorMsg').textContent = 'Supabase Auth Error: ' + msg;
        } else {
          closeAuthModal();
          // Reload page to refresh all active elements
          window.location.reload();
        }
      } else {
        // Display the specific backend validation error (e.g. "Invalid verification code")
        document.getElementById('authErrorMsg').textContent = resData.error || 'Verification failed. Please try again.';
      }
    } catch (err) {
      console.warn('Mock OTP verification failed, falling back to real Supabase verification:', err.message);
      // Fallback to real Supabase
      if (window.supabaseClient && window.supabaseClient.auth) {
        const { data, error } = await window.supabaseClient.auth.verifyOtp({ phone, token, type: 'sms' });
        if (error) {
          document.getElementById('authErrorMsg').textContent = error.message;
        } else {
          closeAuthModal();
        }
      } else {
        document.getElementById('authErrorMsg').textContent = 'Authentication client not loaded: ' + err.message;
      }
    } finally {
      document.getElementById('authVerifyOtpBtn').textContent = 'Verify & Sign In';
      document.getElementById('authVerifyOtpBtn').disabled = false;
    }
  });

  document.getElementById('authBackBtn').addEventListener('click', () => {
    document.getElementById('authStep1').style.display = 'block';
    document.getElementById('authStep2').style.display = 'none';
    document.getElementById('authErrorMsg').textContent = '';
  });
}

window.openAuthModal = function () {
  document.getElementById('authStep1').style.display = 'block';
  document.getElementById('authStep2').style.display = 'none';
  document.getElementById('authErrorMsg').textContent = '';
  document.getElementById('authPhoneInput').value = '';
  document.getElementById('authOtpInput').value = '';

  document.getElementById('authOverlay').classList.add('active');
  document.getElementById('authModal').style.display = 'block';
}

// Modify Navigation links to include Cart Trigger, Auth, and Orders
function enhanceNavigation() {
  const navFlex = document.querySelector('.nav__flex');
  if (!navFlex) return;

  const navRight = navFlex.querySelector('.nav__right');
  if (navRight && !navRight.querySelector('.nav__cart-trigger')) {

    // Cart Trigger
    const cartTrigger = document.createElement('a');
    cartTrigger.className = 'nav__cart-trigger';
    cartTrigger.id = 'navCartTriggerBtn';
    cartTrigger.style.cssText = 'margin-right: 1rem; cursor: pointer; display: flex; align-items: center; color: var(--thulira-text);';
    cartTrigger.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      <span class="cart-badge" style="display: none;">0</span>
    `;
    cartTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });

    // Auth Trigger (Icon)
    const authTrigger = document.createElement('a');
    authTrigger.className = 'nav__auth-trigger';
    authTrigger.style.cssText = 'margin-right: 1.5rem; cursor: pointer; display: flex; align-items: center; color: var(--thulira-text);';
    authTrigger.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    `;

    const quoteDiv = navRight.querySelector('[data-hide-landscape]');
    if (quoteDiv) {
      navRight.insertBefore(cartTrigger, quoteDiv);
      navRight.insertBefore(authTrigger, quoteDiv);
    } else {
      navRight.appendChild(cartTrigger);
      navRight.appendChild(authTrigger);
    }
  }

  const navMenuInner = document.querySelector('.nav__menu-inner ul');
  if (navMenuInner) {
    if (!navMenuInner.querySelector('[data-nav-menu-cart]')) {
      const cartLi = document.createElement('li');
      cartLi.setAttribute('data-nav-menu-cart', 'true');
      cartLi.innerHTML = `<a href="#" class="nav__menu-link" id="menuCartTrigger" style="display: flex; align-items: center; gap: 0.5rem;">Cart <span class="cart-badge" style="position:static; display:inline-block; padding:0 6px; background:var(--thulira-orange); color:white; font-weight:bold; border-radius:12px; font-size:0.8rem; box-shadow:none;">0</span></a>`;
      cartLi.querySelector('#menuCartTrigger').addEventListener('click', (e) => {
        e.preventDefault();
        openCartDrawer();
      });
      navMenuInner.appendChild(cartLi);
    }
  }
}

// Global click delegation for "Add to Cart" button (useful for popup triggers)
document.addEventListener('click', (e) => {
  const addBtn = e.target.closest('.add-to-cart-popup-btn');
  if (addBtn) {
    e.preventDefault();
    const prodId = addBtn.getAttribute('data-product-id');

    // Find the closest popup/container and get the selected variant
    const container = addBtn.closest('.service-item__popup-content__inner') || document;
    const activeSizeBtn = container.querySelector('.size-btn.active');
    const variant = activeSizeBtn ? activeSizeBtn.getAttribute('data-variant') : null;

    addToCart(prodId, variant);
  }

  // Handle variant button clicks
  const sizeBtn = e.target.closest('.size-btn');
  if (sizeBtn) {
    e.preventDefault();
    const container = sizeBtn.closest('.size-selector-group');
    if (container) {
      container.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
      sizeBtn.classList.add('active');
    }
  }
});

// Render Dynamic Products Grid
function renderProductsGrid() {
  const bottlesGrid = document.getElementById('bottlesGrid');
  const drinkwareGrid = document.getElementById('drinkwareGrid');

  if (!bottlesGrid && !drinkwareGrid) return;

  const productsList = Object.values(PRODUCTS);
  if (productsList.length === 0) return;

  const renderGrid = (gridEl, category) => {
    if (!gridEl) return;
    const items = productsList.filter(p => p.category === category);
    let html = '';
    items.forEach(p => {
      let variantsHtml = '';
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v, idx) => {
          const activeClass = idx === 0 ? 'active' : '';
          variantsHtml += `<button class="size-btn ${activeClass}" data-variant="${v}" onclick="event.stopPropagation(); this.parentElement.querySelectorAll('.size-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="margin-right: 0.35rem; margin-bottom: 0.35rem;">${v}</button>`;
        });
      }

      html += `
        <div class="projecten__item w-dyn-item" role="listitem">
          <div class="product-card" onclick="window.location.href=\'/product?id=${p.id}\'">
            
            <img alt="${p.name}" class="product-card__image" loading="lazy" src="${p.image_url || 'https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder'}" />
            
            <div class="product-card__overlay"></div>

            <div class="product-card__content">
              <!-- Details Section (Always visible, slides up on hover) -->
              <div class="product-card__details">
                <h3 class="product-card__title">${p.name}</h3>
                <div class="product-card__info-row">
                  <span class="product-card__price">₹${p.price}</span>
                  <div class="product-card__sizes-col" onclick="event.stopPropagation();">
                    ${variantsHtml}
                  </div>
                </div>
              </div>

              <!-- Bottom Action Button (Slides up on hover) -->
              <div class="product-card__bottom">
                <button class="product-card__button" onclick="
                  event.stopPropagation();
                  const activeSize = this.closest('.product-card').querySelector('.size-btn.active');
                  const variant = activeSize ? activeSize.getAttribute('data-variant') : 'Standard';
                  addToCart('${p.id}', variant, 1);
                  openCartDrawer();
                ">
                  Add to Cart <svg class="arrow-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </div>
            </div>
            
          </div>
        </div>
      `;
    });
    gridEl.innerHTML = html;
  };

  console.log("BottlesGrid HTML length INSIDE renderGrid:", bottlesGrid.innerHTML.length); renderGrid(bottlesGrid, "Bottles");
  renderGrid(drinkwareGrid, 'Drinkware');
}

// Setup cart on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Wait for supabase initialization
    if (window.initSupabase) {
      await window.initSupabase();

      if (window.supabaseClient && window.supabaseClient.auth) {
        // Define a helper to update all auth-related elements
        window.updateAuthUI = (session) => {
          const authLinks = document.querySelectorAll('.nav__auth-trigger, .nav__auth-link');
          authLinks.forEach(el => {
            if (el.classList.contains('nav__auth-trigger')) {
              // Icon button: keep SVG innerHTML, just update click handlers and title/tooltips
              if (session) {
                el.title = 'My Account';
                el.onclick = (e) => {
                  e.preventDefault();
                  window.location.href = 'account.html';
                };
              } else {
                el.title = 'Sign In';
                el.onclick = (e) => {
                  e.preventDefault();
                  if (window.openAuthModal) window.openAuthModal();
                };
              }
            } else {
              // Text links
              if (session) {
                el.textContent = 'My Account';
                el.onclick = (e) => {
                  e.preventDefault();
                  window.location.href = 'account.html';
                };
              } else {
                el.textContent = 'Sign In';
                el.onclick = (e) => {
                  e.preventDefault();
                  if (window.openAuthModal) window.openAuthModal();
                };
              }
            }
          });
        };

        // Initialize state listener
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
          window.currentSession = session;
          window.updateAuthUI(session);
        });

        // Run an initial check after a short delay
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        window.currentSession = session;
        window.updateAuthUI(session);
      }
    }
  } catch (err) {
    console.error("Supabase init error (non-fatal):", err);
  }

  try {
    await fetchProducts();
    renderProductsGrid();
  } catch (err) {
    console.error("Error fetching or rendering products:", err);
  }

  try {
    injectCartMarkup();
    if (typeof injectAuthMarkup === 'function') injectAuthMarkup();
    enhanceNavigation();
    if (window.updateAuthUI) {
      window.updateAuthUI(window.currentSession || null);
    }
    updateCartBadges();
    renderCart();
  } catch (err) {
    console.error("Error setting up cart markup:", err);
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.querySelector('.nav__toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      toggleBtn.classList.toggle('is-active');
    });
  }
});
