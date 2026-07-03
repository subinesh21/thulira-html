# Thulira Project Codebase

This file contains the complete source code of the Thulira project for reference and review.

## Table of Contents

- [astro.config.mjs](#astroconfigmjs)
- [package.json](#packagejson)
- [server.js](#serverjs)
- [src/env.d.ts](#srcenvdts)
- [functions/api/config.js](#functionsapiconfigjs)
- [src/db/supabase.js](#srcdbsupabasejs)
- [src/pages/about.html](#srcpagesabouthtml)
- [src/pages/admin.html](#srcpagesadminhtml)
- [src/pages/blog.html](#srcpagesbloghtml)
- [src/pages/checkout.html](#srcpagescheckouthtml)
- [src/pages/index.html](#srcpagesindexhtml)
- [src/pages/order-success.html](#srcpagesordersuccesshtml)
- [src/pages/orders.html](#srcpagesordershtml)
- [src/pages/product.html](#srcpagesproducthtml)
- [src/pages/shop.html](#srcpagesshophtml)
- [supabase/migrations/20260703100000_initial_schema.sql](#supabasemigrations20260703100000initialschemasql)
- [supabase/migrations/20260703100001_seed_products.sql](#supabasemigrations20260703100001seedproductssql)
- [supabase/migrations/20260703100002_secure_create_order.sql](#supabasemigrations20260703100002securecreateordersql)
- [supabase/migrations/20260703100003_restrict_direct_inserts.sql](#supabasemigrations20260703100003restrictdirectinsertssql)
- [functions/api/admin/orders.js](#functionsapiadminordersjs)
- [functions/api/admin/orders/[id].js](#functionsapiadminorders[id]js)

---

## astro.config.mjs

```javascript
import { defineConfig } from 'astro/config';
export default defineConfig({});

```

---

## package.json

```json
{
  "name": "thulira-astro",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "astro": "^4.16.19",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.9",
    "typescript": "^5.9.3"
  }
}

```

---

## server.js

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("CRITICAL CONFIGURATION ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// --- Public Config API ---
app.get('/api/config', (req, res) => {
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!anonKey) {
    return res.status(500).json({ error: "Configuration error: SUPABASE_ANON_KEY is not set." });
  }
  res.json({
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: anonKey
  });
});

// --- Protected Admin API ---

const adminAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ error: 'Invalid authorization format. Use Bearer <token>' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized access. Invalid session.' });
    }

    const adminEmailsEnv = process.env.ADMIN_EMAILS;
    if (!adminEmailsEnv) {
      console.warn("WARNING: ADMIN_EMAILS environment variable is not configured. Admin access is disabled.");
      return res.status(403).json({ error: 'Forbidden. Admin configuration missing.' });
    }

    const adminEmails = adminEmailsEnv
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.length === 0 || !adminEmails.includes(user.email.toLowerCase())) {
      return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Error in adminAuth middleware:', err);
    res.status(500).json({ error: 'Internal server error validating auth token' });
  }
};

// Get all orders (Admin only)
app.get('/api/admin/orders', adminAuth, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update order status (Admin only)
app.patch('/api/admin/orders/:id', adminAuth, async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;
  
  if (!['pending', 'confirmed', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    let updates = { status };
    if (status === 'confirmed') updates.confirmed_at = new Date().toISOString();
    if (status === 'delivered') updates.delivered_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select();

    if (error) throw error;
    res.json({ success: true, status, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

```

---

## src/env.d.ts

```typescript
/// <reference path="../.astro/types.d.ts" />
```

---

## functions/api/config.js

```javascript
export async function onRequestGet({ env }) {
  return new Response(
    JSON.stringify({
      SUPABASE_URL: env.SUPABASE_URL || 'http://127.0.0.1:54321',
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || 'anon_key_placeholder'
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}

```

---

## src/db/supabase.js

```javascript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

```

---

## src/pages/about.html

```html
<!DOCTYPE html>

<!-- This site was created in Webflow. https://webflow.com --><!-- Last Published: Thu May 28 2026 11:30:34 GMT+0000 (Coordinated Universal Time) --><html data-wf-domain="www.thulira.com" data-wf-page="69c3b24f436721e02207e17d" data-wf-site="6978c74eb7a56e10b85274cb" lang="en"><head><meta charset="utf-8"/><link crossorigin="anonymous" href="https://cdn.prod.website-files.com" rel="preconnect"/><title>About Us | Thulira</title><meta content="Discover Thulira's mission to curate sustainable alternatives for your home." name="description"/><meta content="About Us - Thulira | Eco-friendly Store Singapore" property="og:title"/><meta content="Discover Thulira's mission to curate sustainable alternatives for your home." property="og:description"/><meta content="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/6a0420ffaf0e855ffd198ae3_Modus%20Open%20Graph.jpg" property="og:image"/><meta content="About Us - Thulira | Eco-friendly Store Singapore" name="twitter:title"/><meta content="Discover Thulira's mission to curate sustainable alternatives for your home." name="twitter:description"/><meta content="website" property="og:type"/><meta content="summary_large_image" name="twitter:card"/><meta content="width=device-width, initial-scale=1" name="viewport"/><meta content="Webflow" name="generator"/><link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.shared.e97910e78.min.css" integrity="sha384-6XkQ54zt5ZhQdYI3Cx7JctA/Nr8ro5njqFDfYJJIYwhTuj2/ibnU3ZsiTqnERiYm" rel="stylesheet" type="text/css"/><link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.69c3b24f436721e02207e17d.f69189963.opt.min.css" integrity="sha384-9pGJljibpXXllA70RrjsS3MN95/1YjeTY62O4mDVs5LW1qJzHFO3a+i6c7G4EKFq" rel="stylesheet" type="text/css"/><style>html.w-mod-js:not(.w-mod-ix3) :is([data-popup-overlay], [data-popup-content], button[data-popup-close], [data-floatcard-1], [data-floatcard-2], [data-floatcard-3], :not([data-no-anim]) :is(.h1, .h2, .h3, .h4, .h5, .h6):not([data-no-anim]), .floating-content__text, [data-toggle-icon], .vertical-dash, [data-menu-wrapper], [data-menu-wrapper] li, [data-menu-icon-open], [data-menu-icon-close], section:first-child, .nav__component) {visibility: hidden !important;}</style><script type="text/javascript">!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);</script><link href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/6997158e5fac364205ad5ab5_Favicon.png" rel="shortcut icon" type="image/x-icon"/><link href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/699715925c02a742c5f3854f_Webclip.png" rel="apple-touch-icon"/><link href="/about" rel="canonical"/><script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About Us",
  "url": "/over-ons",
  "inLanguage": "en",
  "about": {
    "@type": "Organization",
    "@id": "https://schema.org/#organization",
    "name": "Thulira",
    "description": "Discover Thulira's mission to curate sustainable alternatives for your home.",
    "slogan": "Built on Trust. Proven by Results.",
    "url": "/",
    "email": "info@thulira.com",
    "telephone": "+6582355452",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Singapore",
      "addressCountry": "SG"
    },
    "sameAs": [
      "https://wa.me/6582355452"
    ]
  }
}
</script><link href="https://unpkg.com/lenis@1.3.17/dist/lenis.css" rel="stylesheet"/>
<script async="" src="https://plausible.io/js/pa-Sqg6vyhtWsckPaZZKPPpJ.js"></script>
<script>
  window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
  plausible.init()
</script>
<!-- Leadinfo tracking code -->
<script>
(function(l,e,a,d,i,n,f,o){if(!l[i]){l.GlobalLeadinfoNamespace=l.GlobalLeadinfoNamespace||[];
l.GlobalLeadinfoNamespace.push(i);l[i]=function(){(l[i].q=l[i].q||[]).push(arguments)};l[i].t=l[i].t||n;
l[i].q=l[i].q||[];o=e.createElement(a);f=e.getElementsByTagName(a)[0];o.async=1;o.src=d;f.parentNode.insertBefore(o,f);}
}(window,document,'script','https://cdn.leadinfo.net/ping.js','leadinfo','LI-69E624F75B59D'));
</script><link href="ecommerce.css?v=999?v=999" rel="stylesheet"/><script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script defer="" src="supabaseClient.js?v=2"></script>
<script defer="" src="cart.js?v=2"></script>
<style>
  /* Prevent Webflow scaling down interaction on the page content */
  .page__wrapper,
  .main__wrapper,
  main,
  body {
    transform: none !important;
    scale: none !important;
  }
</style>

</head><body><div class="page__wrapper"><div class="nav__component" data-nav-element=""><div class="nav__wrapper" data-nav-wrapper=""><div class="nav__flex"><div class="nav__left" style="display:flex; align-items:center;"><button class="nav__toggle" data-menu-toggle-button=""><div class="icon__24 w-embed" data-menu-icon-open=""><svg aria-hidden="true" class="iconify iconify--tabler" height="24" preserveaspectratio="xMidYMid meet" role="img" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg></div><div class="icon__24 w-embed" data-menu-icon-close=""><svg aria-hidden="true" class="iconify iconify--ic" height="24" preserveaspectratio="xMidYMid meet" role="img" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z" fill="currentColor"></path></svg></div></button></div><div class="nav__center"><a class="nav__logo w-inline-block" href="/"><img src="/thulira-transparent.png" alt="Thulira Logo" style="height: 32px; width: auto; display: block;" /></a></div><div class="nav__right"><div data-hide-landscape=""><a class="button w-inline-block" href="/shop"><div>Shop Now</div></a></div></div></div><div class="nav__menu-wrapper" data-menu-wrapper=""><nav class="nav__menu-inner"><ul class="w-list-unstyled" role="list"><li><a class="nav__menu-link" href="/">Home</a></li><li><a class="nav__menu-link" href="/shop">Shop</a></li><li><a class="nav__menu-link" href="/blog">Blog</a></li><li><a aria-current="page" class="nav__menu-link w--current" href="/about">About Us</a></li></ul></nav></div></div><div class="w-embed"><style>

  [data-z-one] {
    z-index: 5;
    position: relative;
  }

  [data-margin-none] {
    margin: 0px !important;
  }

:root {

-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;

}

  .logo-marquee__image {
    -webkit-user-drag: none;
  }


  p:last-child {
    margin-bottom: 0px !important;
  }

  .h1:first-child, .h2:first-child, .h3:first-child, .h4:first-child, .h5:first-child {
    margin-top: 0px !important;
  }

  [data-height-full] {
    height: 100%;
  }

  .h1:last-child,
  .h2:last-child,
  .h3:last-child,
  .h4:last-child,
  .h5:last-child,
  .h6:last-child,
  h1:last-child,
  h2:last-child,
  h3:last-child,
  h4:last-child,
  h5:last-child,
  h6:last-child {
    margin-bottom: 0 !important;
  }

  @media (max-width: 992px) {
  [data-hide-landscape] {
    display: none !important;
  }
}

</style></div><div class="w-condition-invisible w-embed w-script"><script>
  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('[data-nav-wrapper]');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      let bc = nav.style.borderColor;
      if (window.scrollY > 40) {
        nav.style.maxWidth = '1200px';
        nav.style.borderColor = bc;
      } else {
        nav.style.maxWidth = '';
        nav.style.borderColor = '';
      }
    });

    setTimeout(() => {
      window.scrollBy(0, 3);

      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        window.scrollBy(0, -3);
      });
    }, 250);
  });
</script></div></div><main><section class="section is__tinted"><div class="w-layout-blockcontainer container w-container"><div class="about-video__hero"><h1 class="h1">Curating Sustainable Alternatives.</h1><p class="max__500">Thulira exists to curate sustainable alternatives for Indian households. We discovered eha's incredible biocomposite materials and decided to bring them directly to customers who care about the planet.</p></div><div class="about-video__pinner" data-sequence-end="bottom bottom" data-sequence-start="top top" data-sequence-wrap=""><div class="about-video__wrapper"><div class="image-sequence__element v-about" data-sequence-element=""><canvas class="image-sequence__canvas is__about" data-desktop-src="https://cdn.overflow.nl/modus-sequence-v7/frame" data-digits="4" data-filetype="jpg" data-frames="120" data-index-start="0" data-mobile-src="https://cdn.overflow.nl/modus-sequence-v7/frame" data-sequence-canvas="" data-static-src="https://cdn.overflow.nl/modus-sequence-v5/frame00000.jpg"></canvas></div></div></div></div><div class="w-condition-invisible w-embed w-script"><script>
function initImageSequenceScroll() {
  const wraps = document.querySelectorAll('[data-sequence-wrap]');
  
  wraps.forEach((wrap) => {
    // Prevent double-initializing
    if (wrap.dataset.sequenceInit === 'true') return;
    wrap.dataset.sequenceInit = 'true';

    const element = wrap.querySelector('[data-sequence-element]');
    const canvas = element && element.querySelector('[data-sequence-canvas]');
    if (!element || !canvas) return;
    
    // Data attributes and their fallbacks
    const frames = parseInt(canvas.dataset.frames, 10) || 1;
    const digits = parseInt(canvas.dataset.digits, 10) || 3;
    const indexStart = parseInt(canvas.dataset.indexStart, 10) || 0;
    const desktopSrc = canvas.dataset.desktopSrc || '';
    const mobileSrc = canvas.dataset.mobileSrc || desktopSrc;
    const staticSrc = canvas.dataset.staticSrc;
    const filetype = canvas.dataset.filetype || 'webp';
    const startTrigger = wrap.dataset.scrollStart || 'top top';
    const endTrigger = wrap.dataset.scrollEnd || 'bottom bottom';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const baseUrl = isMobile ? mobileSrc : desktopSrc;
    const lastIndex = indexStart + frames - 1;

    // Track last rendered scroll progress so we can redraw on resize
    let lastProgress = 0;

    // Canvas setup (size to the sticky element)
    const ctx = canvas.getContext('2d');
    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    }
    resizeCanvas();

    // Image cache and loading queue
    const loaded = new Map();
    const queue = [];
    let processingQueue = false;
    let resizeTimer;

    // Draw helper (canvas equivalent of object-fit: cover)
    function drawCover(img) {
      if (!img) return;
      resizeCanvas();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height);
      const x = (canvasWidth - img.width * scale) / 2;
      const y = (canvasHeight - img.height * scale) / 2;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    }

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeCanvas();
        if (loaded.size) render(lastProgress);
        ScrollTrigger.refresh();
      }, 200);
    });

    function pad(num) {
      return String(num).padStart(digits, '0');
    }
    
    function getUrl(i) {
      return `${baseUrl}${pad(i)}.${filetype}`;
    }
    
    function loadFrame(i, onDone) {
      if (loaded.has(i) || i < indexStart || i > lastIndex) return;
      const img = new Image();
      img.src = getUrl(i);

      img.onload = () => {
        loaded.set(i, img);
        if (typeof onDone === 'function') onDone();
      };

      // Log when a frame is missing or fails to load
      img.onerror = () => {
        console.warn('[ImageSequence] Failed to load frame', {
          index: i,
          url,
          wrap: wrap
        });
      };
    }

    // Daybreak-style progressive loader (binary midpoint / "wave" fill)
    function processQueue() {
      if (processingQueue) return;
      const next = queue.shift();
      if (!next) return;
      processingQueue = true;
      const [a, b] = next;
      if (b - a <= 1) {
        processingQueue = false;
        processQueue();
        return;
      }
      const m = Math.floor((a + b) / 2);
      loadFrame(m, () => {
        queue.push([a, m], [m, b]);
        processingQueue = false;
        setTimeout(processQueue, 0);
      });
    }
    
    function startLoading() {
      loadFrame(indexStart, () => {
        drawImageAt(indexStart); // Show the first frame right away
        loadFrame(lastIndex); // Preload the last frame
        queue.push([indexStart, lastIndex]);
        processQueue();
        ScrollTrigger.refresh();
      });
    }
    
    function findNearestLoaded(i) {
      for (let r = 1; r <= 10; r++) {
        if (loaded.has(i - r)) return i - r;
        if (loaded.has(i + r)) return i + r;
      }

      const keys = Array.from(loaded.keys());
      if (keys.length === 0) return null;
      let nearest = keys[0];
      let minDiff = Math.abs(i - nearest);
      for (const k of keys) {
        const diff = Math.abs(i - k);
        if (diff < minDiff) {
          nearest = k;
          minDiff = diff;
        }
      }
      return nearest;
    }
    
    function drawImageAt(i) {
      const img = loaded.get(i);
      if (!img) return;
      drawCover(img);
    }
    
    function render(progress) {
      const relative = progress * (frames - 1);
      const index = indexStart + Math.round(relative);
      if (loaded.has(index)) {
        drawImageAt(index);
      } else {
        const nearest = findNearestLoaded(index);
        if (nearest !== null) drawImageAt(nearest);
      }
    }

    // Reduced motion: draw a single static image (or first frame fallback)
    if (reduceMotion) {
      if (staticSrc) {
        const staticImage = new Image();
        staticImage.src = staticSrc;
        staticImage.onload = () => {
          drawCover(staticImage);
        };
        staticImage.onerror = () => {};
        return;
      }
      loadFrame(indexStart, () => {
        drawImageAt(indexStart);
      });
      return;
    }
    
    // Begin loading frames in the background
    startLoading();
    
    // Set up ScrollTrigger
    const st = ScrollTrigger.create({
      trigger: wrap,
      start: startTrigger,
      end: endTrigger,
      scrub: true,
      onUpdate: (self) => {
        lastProgress = self.progress;
        render(self.progress);
      }
    });

    // Draw once immediately
    lastProgress = st.progress || 0;
    render(lastProgress);

  });
}

// Init Image Sequence on Scroll
document.addEventListener("DOMContentLoaded", () => {
  initImageSequenceScroll();
});
</script></div></section><section class="section" data-floatcard-section="" data-wf--usp--variant="base"><div class="w-layout-blockcontainer container w-container"><div class="row"><div class="col__1"><div class="col"><div class="center-content"><div class="max__600"><h2 class="h2">Our Promise</h2></div></div></div></div><div class="col__3"><div class="usp-card" data-floatcard-1=""><h3 class="h4">Durability</h3><p>Our products are designed to last. Unlike clay or ceramic alternatives that easily crack or break, our biocomposite materials withstand everyday drops and impacts.</p><div class="usp-card__no">01</div><div class="usp-card__graphic w-embed"><svg fill="none" height="100%" viewbox="0 0 437 263" width="100%" xmlns="http://www.w3.org/2000/svg">
<g opacity="0.5">
<path d="M0 0H1.45086V263H0V0Z" fill="url(#paint0_linear_2427_764)"></path>
<path d="M8.41501 0H11.3167V263H8.41501V0Z" fill="url(#paint1_linear_2427_764)"></path>
<path d="M18.2809 0H22.6335V263H18.2809V0Z" fill="url(#paint2_linear_2427_764)"></path>
<path d="M29.5976 0H35.4011V263H29.5976V0Z" fill="url(#paint3_linear_2427_764)"></path>
<path d="M42.3652 0H49.6195V263H42.3652V0Z" fill="url(#paint4_linear_2427_764)"></path>
<path d="M56.5837 0H65.2888V263H56.5837V0Z" fill="url(#paint5_linear_2427_764)"></path>
<path d="M72.253 0H82.409V263H72.253V0Z" fill="url(#paint6_linear_2427_764)"></path>
<path d="M89.3732 0H100.98V263H89.3732V0Z" fill="url(#paint7_linear_2427_764)"></path>
<path d="M107.944 0H121.002V263H107.944V0Z" fill="url(#paint8_linear_2427_764)"></path>
<path d="M127.966 0H142.475V263H127.966V0Z" fill="url(#paint9_linear_2427_764)"></path>
<path d="M149.439 0H165.398V263H149.439V0Z" fill="url(#paint10_linear_2427_764)"></path>
<path d="M172.363 0H189.773V263H172.363V0Z" fill="url(#paint11_linear_2427_764)"></path>
<path d="M196.737 0H215.598V263H196.737V0Z" fill="url(#paint12_linear_2427_764)"></path>
<path d="M222.562 0H242.874V263H222.562V0Z" fill="url(#paint13_linear_2427_764)"></path>
<path d="M249.839 0H271.602V263H249.839V0Z" fill="url(#paint14_linear_2427_764)"></path>
<path d="M278.566 0H301.78V263H278.566V0Z" fill="url(#paint15_linear_2427_764)"></path>
<path d="M308.744 0H333.408V263H308.744V0Z" fill="url(#paint16_linear_2427_764)"></path>
<path d="M340.372 0H366.488V263H340.372V0Z" fill="url(#paint17_linear_2427_764)"></path>
<path d="M373.452 0H401.019V263H373.452V0Z" fill="url(#paint18_linear_2427_764)"></path>
<path d="M407.983 0H437V263H407.983V0Z" fill="url(#paint19_linear_2427_764)"></path>
</g>
<defs>
<lineargradient gradientunits="userSpaceOnUse" id="paint0_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint1_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint2_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint3_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint4_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint5_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint6_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint7_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint8_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint9_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint10_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint11_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint12_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint13_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint14_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint15_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint16_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint17_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint18_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint19_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
</defs>
</svg></div></div><div class="usp-card is__2" data-floatcard-2=""><h3 class="h4">Non-Toxic &amp; Safe</h3><p>Tested for food safety. Our products are 100% free from BPA, melamine, formaldehyde, and PFAS, ensuring that your family's health is always protected.</p><div class="usp-card__no">02</div><div class="usp-card__graphic w-embed"><svg fill="none" height="100%" viewbox="0 0 437 263" width="100%" xmlns="http://www.w3.org/2000/svg">
<mask height="263" id="mask0_2427_769" maskunits="userSpaceOnUse" style="mask-type:alpha" width="437" x="0" y="0">
<path d="M437 263L435.549 263L435.549 3.80769e-05L437 3.82038e-05L437 263Z" fill="url(#paint0_linear_2427_769)"></path>
<path d="M428.585 263L425.683 263L425.683 3.72144e-05L428.585 3.74681e-05L428.585 263Z" fill="url(#paint1_linear_2427_769)"></path>
<path d="M418.719 263L414.367 263L414.367 3.62251e-05L418.719 3.66056e-05L418.719 263Z" fill="url(#paint2_linear_2427_769)"></path>
<path d="M407.402 263L401.599 263L401.599 3.51089e-05L407.402 3.56162e-05L407.402 263Z" fill="url(#paint3_linear_2427_769)"></path>
<path d="M394.635 263L387.38 263L387.381 3.38659e-05L394.635 3.45001e-05L394.635 263Z" fill="url(#paint4_linear_2427_769)"></path>
<path d="M380.416 263L371.711 263L371.711 3.2496e-05L380.416 3.32571e-05L380.416 263Z" fill="url(#paint5_linear_2427_769)"></path>
<path d="M364.747 263L354.591 263L354.591 3.09993e-05L364.747 3.18872e-05L364.747 263Z" fill="url(#paint6_linear_2427_769)"></path>
<path d="M347.627 263L336.02 263L336.02 2.93758e-05L347.627 3.03905e-05L347.627 263Z" fill="url(#paint7_linear_2427_769)"></path>
<path d="M329.056 263L315.998 263L315.998 2.76254e-05L329.056 2.8767e-05L329.056 263Z" fill="url(#paint8_linear_2427_769)"></path>
<path d="M309.034 263L294.525 263L294.525 2.57482e-05L309.034 2.70166e-05L309.034 263Z" fill="url(#paint9_linear_2427_769)"></path>
<path d="M287.561 263L271.602 263L271.602 2.37442e-05L287.561 2.51394e-05L287.561 263Z" fill="url(#paint10_linear_2427_769)"></path>
<path d="M264.637 263L247.227 263L247.227 2.16133e-05L264.637 2.31353e-05L264.637 263Z" fill="url(#paint11_linear_2427_769)"></path>
<path d="M240.263 263L221.402 263L221.402 1.93556e-05L240.263 2.10045e-05L240.263 263Z" fill="url(#paint12_linear_2427_769)"></path>
<path d="M214.438 263L194.126 263L194.126 1.6971e-05L214.438 1.87467e-05L214.438 263Z" fill="url(#paint13_linear_2427_769)"></path>
<path d="M187.161 263L165.398 263L165.398 1.44596e-05L187.161 1.63622e-05L187.161 263Z" fill="url(#paint14_linear_2427_769)"></path>
<path d="M158.434 263L135.22 263L135.22 1.18213e-05L158.434 1.38508e-05L158.434 263Z" fill="url(#paint15_linear_2427_769)"></path>
<path d="M128.256 263L103.592 263L103.592 9.05627e-06L128.256 1.12125e-05L128.256 263Z" fill="url(#paint16_linear_2427_769)"></path>
<path d="M96.6275 263L70.512 263L70.512 6.16435e-06L96.6275 8.44744e-06L96.6275 263Z" fill="url(#paint17_linear_2427_769)"></path>
<path d="M63.5478 263L35.9814 263L35.9814 3.1456e-06L63.5478 5.55553e-06L63.5478 263Z" fill="url(#paint18_linear_2427_769)"></path>
<path d="M29.0173 263L0 263L2.29922e-05 0L29.0173 2.53677e-06L29.0173 263Z" fill="url(#paint19_linear_2427_769)"></path>
</mask>
<g mask="url(#mask0_2427_769)">
<circle cx="218" cy="247" fill="#D9D9D9" opacity="0.5" r="247" transform="rotate(-180 218 247)"></circle>
</g>
<defs>
<lineargradient gradientunits="userSpaceOnUse" id="paint0_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint1_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint2_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint3_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint4_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint5_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint6_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint7_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint8_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint9_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint10_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint11_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint12_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint13_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint14_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint15_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint16_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint17_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint18_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint19_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
</defs>
</svg></div></div><div class="usp-card is__3" data-floatcard-3=""><h3 class="h4">Made in India &amp; Transparent</h3><p>Locally manufactured to support the local economy. We also provide full transparency into our materials—blending agricultural crop-waste with a small amount of polypropylene to bind it.</p><div class="usp-card__no">03</div><div class="usp-card__graphic w-embed"><svg fill="none" height="100%" viewbox="0 0 438 318" width="100%" xmlns="http://www.w3.org/2000/svg">
<mask height="318" id="mask0_2427_780" maskunits="userSpaceOnUse" style="mask-type:alpha" width="529" x="-28" y="0">
<path d="M-27.666 0L-25.9117 0L-25.9117 318H-27.666L-27.666 0Z" fill="url(#paint0_linear_2427_780)"></path>
<path d="M-17.4912 0L-13.9827 0L-13.9827 318H-17.4912L-17.4912 0Z" fill="url(#paint1_linear_2427_780)"></path>
<path d="M-5.56214 0L-0.299316 0L-0.299316 318H-5.56214L-5.56214 0Z" fill="url(#paint2_linear_2427_780)"></path>
<path d="M8.1212 0L15.1383 0L15.1383 318H8.1212L8.1212 0Z" fill="url(#paint3_linear_2427_780)"></path>
<path d="M23.5588 0L32.3302 0L32.3302 318H23.5588L23.5588 0Z" fill="url(#paint4_linear_2427_780)"></path>
<path d="M40.7507 0L51.2764 0L51.2764 318H40.7507L40.7507 0Z" fill="url(#paint5_linear_2427_780)"></path>
<path d="M59.6969 0L71.9768 0L71.9768 318H59.6969L59.6969 0Z" fill="url(#paint6_linear_2427_780)"></path>
<path d="M80.3974 0L94.4316 0L94.4316 318H80.3974L80.3974 0Z" fill="url(#paint7_linear_2427_780)"></path>
<path d="M102.852 0L118.641 0L118.641 318H102.852L102.852 0Z" fill="url(#paint8_linear_2427_780)"></path>
<path d="M127.061 0L144.604 0L144.604 318H127.061L127.061 0Z" fill="url(#paint9_linear_2427_780)"></path>
<path d="M153.024 0L172.321 0L172.321 318H153.024L153.024 0Z" fill="url(#paint10_linear_2427_780)"></path>
<path d="M180.742 0L201.793 0L201.793 318H180.742L180.742 0Z" fill="url(#paint11_linear_2427_780)"></path>
<path d="M210.214 0L233.019 0L233.019 318H210.214L210.214 0Z" fill="url(#paint12_linear_2427_780)"></path>
<path d="M241.44 0L266 0L266 318H241.44L241.44 0Z" fill="url(#paint13_linear_2427_780)"></path>
<path d="M274.42 0L300.734 0L300.734 318H274.42L274.42 0Z" fill="url(#paint14_linear_2427_780)"></path>
<path d="M309.155 0L337.223 0L337.223 318H309.155L309.155 0Z" fill="url(#paint15_linear_2427_780)"></path>
<path d="M345.644 0L375.467 0L375.467 318H345.644L345.644 0Z" fill="url(#paint16_linear_2427_780)"></path>
<path d="M383.887 0L415.464 0L415.464 318H383.887L383.887 0Z" fill="url(#paint17_linear_2427_780)"></path>
<path d="M423.885 0L457.216 0L457.216 318H423.885L423.885 0Z" fill="url(#paint18_linear_2427_780)"></path>
<path d="M465.636 0L500.722 0V318H465.636L465.636 0Z" fill="url(#paint19_linear_2427_780)"></path>
</mask>
<g mask="url(#mask0_2427_780)">
<path d="M-52.7091 154.764L528.82 -1.05579L372.999 580.473L-52.7091 154.764Z" fill="url(#paint20_linear_2427_780)" opacity="0.5"></path>
</g>
<defs>
<lineargradient gradientunits="userSpaceOnUse" id="paint0_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint1_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint2_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint3_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint4_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint5_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint6_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint7_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint8_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint9_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint10_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint11_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint12_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint13_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint14_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint15_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint16_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint17_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint18_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint19_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint20_linear_2427_780" x1="193.334" x2="232.834" y1="97.0491" y2="273.049">
<stop stop-color="#848C8F" stop-opacity="0"></stop>
<stop offset="1" stop-color="#848C8F"></stop>
</lineargradient>
</defs>
</svg></div></div></div></div></div></section><section class="section"><div class="w-layout-blockcontainer container w-container"><div class="row"><div class="col__1"><div class="col" id="w-node-acb125f3-0eb7-5977-fe12-a80dc73ca2af-c73ca2ab"><p>Thulira is an authorized reseller of eha (eha.eco) sustainable products.</p></div></div><div class="draggable-marquee" data-direction="left" data-draggable-marquee-init="" data-duration="35" data-multiplier="35" data-sensitivity="0.01"><div class="logo-marquee__collection w-dyn-list" data-draggable-marquee-collection=""><div class="logo-marquee__list w-dyn-items" data-draggable-marquee-list="" role="list"><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Revital" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Van Besouw" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Impuls Küchen" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Xenz" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="RIHO" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Van Rijn" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Bliss" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Schuler Keukens" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Nobilia" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Pro-line" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="IVY" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="INK" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Sanibell" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div></div></div><div class="logo-marquee__fade is-left"></div><div class="logo-marquee__fade is-right"></div></div></div></div><div class="w-condition-invisible w-embed w-script"><script>
function initDraggableMarquee() {
  const wrappers = document.querySelectorAll("[data-draggable-marquee-init]");

  const getNumberAttr = (el, name, fallback) => {
    const value = parseFloat(el.getAttribute(name));
    return Number.isFinite(value) ? value : fallback;
  };

  wrappers.forEach((wrapper) => {
    if (wrapper.getAttribute("data-draggable-marquee-init") === "initialized") return;

    const collection = wrapper.querySelector("[data-draggable-marquee-collection]");
    const list = wrapper.querySelector("[data-draggable-marquee-list]");
    if (!collection || !list) return;

    const duration = getNumberAttr(wrapper, "data-duration", 20);
    const multiplier = getNumberAttr(wrapper, "data-multiplier", 40);
    const sensitivity = getNumberAttr(wrapper, "data-sensitivity", 0.01);

    const wrapperWidth = wrapper.getBoundingClientRect().width;
    const listWidth = list.scrollWidth || list.getBoundingClientRect().width;
    if (!wrapperWidth || !listWidth) return;

    // Make enough duplicates to cover screen
    const minRequiredWidth = wrapperWidth + listWidth + 2;
    while (collection.scrollWidth < minRequiredWidth) {
      const listClone = list.cloneNode(true);
      listClone.setAttribute("data-draggable-marquee-clone", "");
      listClone.setAttribute("aria-hidden", "true");
      collection.appendChild(listClone);
    }

    const wrapX = gsap.utils.wrap(-listWidth, 0);
    
    gsap.set(collection, { x: 0 });
    
    const marqueeLoop = gsap.to(collection, {
      x: -listWidth,
      duration,
      ease: "none",
      repeat: -1,
      onReverseComplete: () => marqueeLoop.progress(1),
      modifiers: {
        x: (x) => wrapX(parseFloat(x)) + "px"
      },
    });
    
    // Direction can be used for css + set initial direction on load
    const initialDirectionAttr = (wrapper.getAttribute("data-direction") || "left").toLowerCase();
    const baseDirection = initialDirectionAttr === "right" ? -1 : 1;
    
    const timeScale = { value: 1 };
    
    timeScale.value = baseDirection;
    wrapper.setAttribute("data-direction", baseDirection < 0 ? "right" : "left");
    
    if (baseDirection < 0) marqueeLoop.progress(1);
    
    function applyTimeScale() {
      marqueeLoop.timeScale(timeScale.value);
      wrapper.setAttribute("data-direction", timeScale.value < 0 ? "right" : "left");
    }
    
    applyTimeScale();

    // Drag observer
    const marqueeObserver = Observer.create({
      target: wrapper,
      type: "pointer,touch",
      preventDefault: true,
      debounce: false,
      onChangeX: (observerEvent) => {
        let velocityTimeScale = observerEvent.velocityX * -sensitivity;
        velocityTimeScale = gsap.utils.clamp(-multiplier, multiplier, velocityTimeScale);

        gsap.killTweensOf(timeScale);

        const restingDirection = velocityTimeScale < 0 ? -1 : 1;

        gsap.timeline({ onUpdate: applyTimeScale })
          .to(timeScale, { value: velocityTimeScale, duration: 0.1, overwrite: true })
          .to(timeScale, { value: restingDirection, duration: 1.0 });
      }
    });

    // Pause marquee when scrolled out of view
    ScrollTrigger.create({
      trigger: wrapper,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => { marqueeLoop.resume(); applyTimeScale(); marqueeObserver.enable(); },
      onEnterBack: () => { marqueeLoop.resume(); applyTimeScale(); marqueeObserver.enable(); },
      onLeave: () => { marqueeLoop.pause(); marqueeObserver.disable(); },
      onLeaveBack: () => { marqueeLoop.pause(); marqueeObserver.disable(); }
    });
    
    wrapper.setAttribute("data-draggable-marquee-init", "initialized");
  });
}

// Initialize Draggable Marquee (Directional)
document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger, Observer);
  initDraggableMarquee();
});
</script></div></section><section class="section is__dark"><div class="w-layout-blockcontainer container w-container" data-z-one=""><div class="col__2"><div class="col"><h2 class="h2">Curating Sustainable Alternatives.</h2></div><div class="col"><p class="max__500">Our experienced team offers direct coordination and single-turnkey responsibility, ensuring absolute project quality.</p><div class="team-members__collection w-dyn-list"><div class="team-members__list w-dyn-items" role="list"><div class="team-members__item w-dyn-item" role="listitem"><div class="team-members__meta"><h3 class="h3">Alvin Goh</h3><p class="body__s">With over 20 years of hands-on experience in Singapore's eco-friendly retail industry, Alvin coordinates on-site operations and project management. He ensures all eco-friendly products, and product sourcing comply with strict BCA guidelines and safety standards.</p><div class="team-members__connect"><a class="team-members__connect-link w-inline-block" href="mailto:info@thulira.com"><div class="icon__24 w-embed"><svg fill="none" height="24" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="white"></path>
</svg></div></a><a class="team-members__connect-link w-inline-block" href="https://wa.me/6582355452" target="_blank"><div class="icon__24 w-embed"><svg fill="none" height="100%" viewbox="0 0 24 24" width="100%" xmlns="http://www.w3.org/2000/svg">
<path d="M4.98292 7.1968C6.19132 7.1968 7.17092 6.2172 7.17092 5.0088C7.17092 3.8004 6.19132 2.8208 4.98292 2.8208C3.77452 2.8208 2.79492 3.8004 2.79492 5.0088C2.79492 6.2172 3.77452 7.1968 4.98292 7.1968Z" fill="white"></path>
<path d="M9.2377 8.85518V20.9942H13.0067V14.9912C13.0067 13.4072 13.3047 11.8732 15.2687 11.8732C17.2057 11.8732 17.2297 13.6842 17.2297 15.0912V20.9952H21.0007V14.3382C21.0007 11.0682 20.2967 8.55518 16.4747 8.55518C14.6397 8.55518 13.4097 9.56218 12.9067 10.5152H12.8557V8.85518H9.2377ZM3.0957 8.85518H6.8707V20.9942H3.0957V8.85518Z" fill="white"></path>
</svg></div></a></div></div><img alt="" class="team-members__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div><div class="team-members__item w-dyn-item" role="listitem"><div class="team-members__meta"><h3 class="h3">Kelvin Tan</h3><p class="body__s">Kelvin specializes in quality control and waterpeco-friendly products solutions. Using moisture meters and thermal imaging technology, he leads our rapid response teams and coordinates single-turnkey execution for complex commercial and residential projects.</p><div class="team-members__connect"><a class="team-members__connect-link w-inline-block" href="mailto:info@thulira.com"><div class="icon__24 w-embed"><svg fill="none" height="24" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="white"></path>
</svg></div></a><a class="team-members__connect-link w-inline-block" href="https://wa.me/6582355452" target="_blank"><div class="icon__24 w-embed"><svg fill="none" height="100%" viewbox="0 0 24 24" width="100%" xmlns="http://www.w3.org/2000/svg">
<path d="M4.98292 7.1968C6.19132 7.1968 7.17092 6.2172 7.17092 5.0088C7.17092 3.8004 6.19132 2.8208 4.98292 2.8208C3.77452 2.8208 2.79492 3.8004 2.79492 5.0088C2.79492 6.2172 3.77452 7.1968 4.98292 7.1968Z" fill="white"></path>
<path d="M9.2377 8.85518V20.9942H13.0067V14.9912C13.0067 13.4072 13.3047 11.8732 15.2687 11.8732C17.2057 11.8732 17.2297 13.6842 17.2297 15.0912V20.9952H21.0007V14.3382C21.0007 11.0682 20.2967 8.55518 16.4747 8.55518C14.6397 8.55518 13.4097 9.56218 12.9067 10.5152H12.8557V8.85518H9.2377ZM3.0957 8.85518H6.8707V20.9942H3.0957V8.85518Z" fill="white"></path>
</svg></div></a></div></div><img alt="" class="team-members__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div><div class="team-members__item w-dyn-item" role="listitem"><div class="team-members__meta"><h3 class="h3">Marcus Lim</h3><p class="body__s">Marcus manages our customer relations, scheduling, and supplier network across Singapore. He is committed to transparent pricing and swift, island-wide mobilization for eco-friendly and sustainable products emergencies.</p><div class="team-members__connect"><a class="team-members__connect-link w-inline-block" href="mailto:info@thulira.com"><div class="icon__24 w-embed"><svg fill="none" height="24" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="white"></path>
</svg></div></a><a class="team-members__connect-link w-inline-block" href="https://wa.me/6582355452" target="_blank"><div class="icon__24 w-embed"><svg fill="none" height="100%" viewbox="0 0 24 24" width="100%" xmlns="http://www.w3.org/2000/svg">
<path d="M4.98292 7.1968C6.19132 7.1968 7.17092 6.2172 7.17092 5.0088C7.17092 3.8004 6.19132 2.8208 4.98292 2.8208C3.77452 2.8208 2.79492 3.8004 2.79492 5.0088C2.79492 6.2172 3.77452 7.1968 4.98292 7.1968Z" fill="white"></path>
<path d="M9.2377 8.85518V20.9942H13.0067V14.9912C13.0067 13.4072 13.3047 11.8732 15.2687 11.8732C17.2057 11.8732 17.2297 13.6842 17.2297 15.0912V20.9952H21.0007V14.3382C21.0007 11.0682 20.2967 8.55518 16.4747 8.55518C14.6397 8.55518 13.4097 9.56218 12.9067 10.5152H12.8557V8.85518H9.2377ZM3.0957 8.85518H6.8707V20.9942H3.0957V8.85518Z" fill="white"></path>
</svg></div></a></div></div><img alt="" class="team-members__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div></div></div></div></div><div class="w-embed"><style>
  @media (min-width: 468px) {
    .team-members__item:hover .team-members__image {
      transform: translate(-50%, -50%);
      width: 100%;
      filter: brightness(40%);
      top: 50%;
    }

    .team-members__item:hover .team-members__connect {
      height: 2rem;
      opacity: 100%;
    }
  }
</style></div><div class="section-deco__bottom-left w-embed"><svg fill="none" height="100%" preserveaspectratio="none" viewbox="0 0 151 908" width="100%" xmlns="http://www.w3.org/2000/svg">
<path d="M151 908L144.435 908L144.435 -5.7395e-07L151 0L151 908Z" fill="url(#paint0_linear_2353_199)"></path>
<path d="M131.304 908L118.174 908L118.174 -2.86975e-06L131.304 -1.72185e-06L131.304 908Z" fill="url(#paint1_linear_2353_199)"></path>
<path d="M105.043 908L85.3478 908L85.3479 -5.7395e-06L105.044 -4.01765e-06L105.043 908Z" fill="url(#paint2_linear_2353_199)"></path>
<path d="M72.2174 908L45.9565 908L45.9565 -9.1832e-06L72.2174 -6.8874e-06L72.2174 908Z" fill="url(#paint3_linear_2353_199)"></path>
<path d="M32.826 908L-7.62939e-05 908L3.08594e-06 -1.32008e-05L32.8261 -1.03311e-05L32.826 908Z" fill="url(#paint4_linear_2353_199)"></path>
<defs>
<lineargradient gradientunits="userSpaceOnUse" id="paint0_linear_2353_199" x1="75.5002" x2="75.5017" y1="-9.07266e-05" y2="908">
<stop offset="0.149038" stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint1_linear_2353_199" x1="75.5002" x2="75.5017" y1="-9.07266e-05" y2="908">
<stop offset="0.149038" stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint2_linear_2353_199" x1="75.5002" x2="75.5017" y1="-9.07266e-05" y2="908">
<stop offset="0.149038" stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint3_linear_2353_199" x1="75.5002" x2="75.5017" y1="-9.07266e-05" y2="908">
<stop offset="0.149038" stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint4_linear_2353_199" x1="75.5002" x2="75.5017" y1="-9.07266e-05" y2="908">
<stop offset="0.149038" stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
</defs>
</svg></div></section><section class="section"><div class="w-layout-blockcontainer container w-container"><div class="row"><div class="col__1"><div class="col"><div class="center-content"><h2 class="h1">Our Proven<br/>Process</h2></div></div></div><div class="process__scroll-pin" data-process-pin=""><div class="process__stick" data-process-stick=""><div class="process__item-wrapper" data-proces-item=""><img alt="Hand wijst met pen op architectuurplattegronden op een bureau met laptop, telefoon en een kop koffie." class="process__item-image" data-process-image="" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="process__item-content"><div class="process__item-heading" data-process-heading=""><div class="process__item-icon w-embed" data-process-icon=""><svg aria-hidden="true" height="32" viewbox="0 0 40 40" width="32">
<circle cx="20" cy="20" fill="none" opacity="0.15" r="16" stroke="currentColor" stroke-width="3"></circle>
<circle cx="20" cy="20" data-process-ring="" fill="none" r="16" stroke="currentColor" stroke-linecap="round" stroke-width="3" transform="rotate(-90 20 20)"></circle>
</svg></div><h3 class="h3" data-margin-none="">Diagnostics &amp; Site Inspection</h3></div><div class="process__item-text" data-process-content=""><div class="vertical-dash is-highlight"></div><p>We begin with a thorough thermal imaging and moisture diagnostics inspection of your site to identify current product vulnerabilities and outline accurate builder requirements.</p></div></div></div><div class="process__item-wrapper" data-proces-item=""><img alt="Twee mannen bekijken tegelstalen in een showroom, met een rek vol verschillende kleuren en texturen tegels." class="process__item-image" data-process-image="" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="process__item-content"><div class="process__item-heading" data-process-heading=""><div class="process__item-icon w-embed" data-process-icon=""><svg aria-hidden="true" height="32" viewbox="0 0 40 40" width="32">
<circle cx="20" cy="20" fill="none" opacity="0.15" r="16" stroke="currentColor" stroke-width="3"></circle>
<circle cx="20" cy="20" data-process-ring="" fill="none" r="16" stroke="currentColor" stroke-linecap="round" stroke-width="3" transform="rotate(-90 20 20)"></circle>
</svg></div><h3 class="h3" data-margin-none="">Integrated Design &amp; Build</h3></div><div class="process__item-text" data-process-content=""><div class="vertical-dash is-highlight"></div><p>Our in-house design and engineering teams develop a customized proposal, selecting appropriate waterpeco-friendly products membranes, UV materials, and product materials.</p></div></div></div><div class="process__item-wrapper" data-proces-item=""><img alt="Hand tekent op een projectplanning met een pen naast markeerstiften en papieren op een bureau." class="process__item-image" data-process-image="" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="process__item-content"><div class="process__item-heading" data-process-heading=""><div class="process__item-icon w-embed" data-process-icon=""><svg aria-hidden="true" height="32" viewbox="0 0 40 40" width="32">
<circle cx="20" cy="20" fill="none" opacity="0.15" r="16" stroke="currentColor" stroke-width="3"></circle>
<circle cx="20" cy="20" data-process-ring="" fill="none" r="16" stroke="currentColor" stroke-linecap="round" stroke-width="3" transform="rotate(-90 20 20)"></circle>
</svg></div><h3 class="h3" data-margin-none="">Safety &amp; Quality Execution</h3></div><div class="process__item-text" data-process-content=""><div class="vertical-dash is-highlight"></div><p>Our licensed, safety-certified builders execute construction under strict BCA Class I guidelines, ensuring maximum safety, quality control, and regulatory compliance.</p></div></div></div><div class="process__item-wrapper" data-proces-item=""><img alt="Stapel dozen verpakt in plastic op een metalen kar met vier wielen in een magazijn, met een label 'Sanitair Bouwnummer 24'." class="process__item-image" data-process-image="" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="process__item-content"><div class="process__item-heading" data-process-heading=""><div class="process__item-icon w-embed" data-process-icon=""><svg aria-hidden="true" height="32" viewbox="0 0 40 40" width="32">
<circle cx="20" cy="20" fill="none" opacity="0.15" r="16" stroke="currentColor" stroke-width="3"></circle>
<circle cx="20" cy="20" data-process-ring="" fill="none" r="16" stroke="currentColor" stroke-linecap="round" stroke-width="3" transform="rotate(-90 20 20)"></circle>
</svg></div><h3 class="h3" data-margin-none="">Warranty &amp; Support</h3></div><div class="process__item-text" data-process-content=""><div class="vertical-dash is-highlight"></div><p>We provide up to a 10-year warranty on selected works, backed by our 24-hour rapid response emergency hotline for immediate assistance with any product defects.</p></div></div></div><div class="process__stick-line"></div></div></div></div></div><div class="w-condition-invisible w-embed w-script"><script>
document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const section = document.querySelector(".process__scroll-pin");
  const stick = section?.querySelector(".process__stick");
  const items = stick ? gsap.utils.toArray(stick.querySelectorAll("[data-proces-item]")) : [];

  if (!section || !stick || !items.length) return;

  gsap.set(stick, { clearProps: "position,top" });

  const ICON_SIZE = 32;
  const INACTIVE_HEADING_OPACITY = 0.25;

  const states = items.map((item, index) => {
    const image = item.querySelector("[data-process-image]");
    const content = item.querySelector("[data-process-content]");
    const heading = item.querySelector("[data-process-heading]");
    const iconWrap = item.querySelector("[data-process-icon]");

    if (!image || !content || !heading || !iconWrap) return null;

    iconWrap.innerHTML = `
      <svg viewBox="0 0 40 40" width="32" height="32" aria-hidden="true">
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          opacity="0.15"
        />
        <circle
          data-process-ring
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          transform="rotate(-90 20 20)"
        />
      </svg>
    `;

    const ring = iconWrap.querySelector("[data-process-ring]");
    const circumference = 2 * Math.PI * 16;

    gsap.set(ring, {
      strokeDasharray: circumference,
      strokeDashoffset: circumference
    });

    gsap.set(iconWrap, {
      width: index === 0 ? ICON_SIZE : 0,
      opacity: index === 0 ? 1 : 0,
      overflow: "hidden",
      flexShrink: 0,
      display: "inline-flex"
    });

    return {
      item,
      image,
      content,
      heading,
      iconWrap,
      ring,
      circumference,
      index
    };
  }).filter(Boolean);

  let currentIndex = 0;
  let isAnimating = false;

  function setRingProgress(state, progress) {
    const clamped = gsap.utils.clamp(0, 1, progress);
    const offset = state.circumference * (1 - clamped);
    gsap.set(state.ring, { strokeDashoffset: offset });
  }

  function setInitialState() {
    states.forEach((state, index) => {
      gsap.set(state.image, { opacity: index === 0 ? 1 : 0 });
      gsap.set(state.content, { opacity: index === 0 ? 1 : 0 });
      gsap.set(state.heading, {
        opacity: index === 0 ? 1 : INACTIVE_HEADING_OPACITY
      });
      setRingProgress(state, 0);
    });
  }

  function showItem(newIndex, direction = "forward") {
    if (newIndex === currentIndex || isAnimating) return;
    if (newIndex < 0 || newIndex >= states.length) return;

    isAnimating = true;

    const current = states[currentIndex];
    const next = states[newIndex];

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        currentIndex = newIndex;
        isAnimating = false;
      }
    });

    // hide current
    tl.to(current.image, { opacity: 0, duration: 0.35 }, 0);
    tl.to(current.content, { opacity: 0, duration: 0.35 }, 0);
    tl.to(current.heading, { opacity: INACTIVE_HEADING_OPACITY, duration: 0.35 }, 0);
    tl.to(current.iconWrap, {
      width: 0,
      opacity: 0,
      duration: 0.3
    }, 0);

    // show next
    tl.to(next.image, { opacity: 1, duration: 0.35 }, 0);
    tl.to(next.content, { opacity: 1, duration: 0.35 }, 0);
    tl.to(next.heading, { opacity: 1, duration: 0.35 }, 0);

    tl.set(next.iconWrap, { opacity: 1 }, 0.12);
    tl.to(next.iconWrap, {
      width: ICON_SIZE,
      duration: 0.3
    }, 0.12);

    tl.set(next.ring, { strokeDashoffset: next.circumference }, 0.12);
  }

  setInitialState();

  const stepSize = () => window.innerHeight;
  const totalScroll = () => window.innerHeight * states.length;

  ScrollTrigger.create({
    trigger: section,
    pin: stick,
    start: "top top",
    end: () => `+=${totalScroll()}`,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true
  });

  for (let i = 1; i < states.length; i++) {
    ScrollTrigger.create({
      trigger: section,
      start: () => `top top-=${stepSize() * i}`,
      end: () => `top top-=${stepSize() * i + 1}`,
      onEnter: () => showItem(i, "forward"),
      onLeaveBack: () => showItem(i - 1, "backward"),
      invalidateOnRefresh: true
    });
  }

  states.forEach((state, index) => {
    ScrollTrigger.create({
      trigger: section,
      start: () => `top top-=${stepSize() * index}`,
      end: () => `top top-=${stepSize() * (index + 1)}`,
      onUpdate: (self) => {
        if (currentIndex !== index) return;
        setRingProgress(state, self.progress);
      },
      onEnter: () => {
        if (currentIndex === index) {
          gsap.set(state.iconWrap, { opacity: 1, width: ICON_SIZE });
          gsap.set(state.heading, { opacity: 1 });
          setRingProgress(state, 0);
        }
      },
      onEnterBack: () => {
        if (currentIndex === index) {
          gsap.set(state.iconWrap, { opacity: 1, width: ICON_SIZE });
          gsap.set(state.heading, { opacity: 1 });
          setRingProgress(state, 1);
        }
      },
      onLeave: () => {
        if (currentIndex === index) {
          setRingProgress(state, 1);
        }
      },
      onLeaveBack: () => {
        if (currentIndex === index) {
          setRingProgress(state, 0);
        }
      },
      invalidateOnRefresh: true
    });
  });

  ScrollTrigger.refresh();
});
</script></div></section><section class="section is__dark"><div class="w-layout-blockcontainer container w-container"><div class="row"><div class="col__1"><div class="col"><div class="center-content"><div class="max__500"><h2 class="h2">Projecten waar wij trots op zijn.</h2><p>Bekijk een greep uit de vastgoedproject waar wij unieke en passende afbouw mogen leveren.</p></div></div></div></div><div class="col__1"><div class="col"><div aria-label="Featured content" aria-roledescription="carousel" class="cascading-slider" data-cascading-slider-wrap=""><div class="cascading-slider__collection w-dyn-list"><div class="cascading-slider__list w-dyn-items" data-cascading-viewport="" role="list"><div aria-roledescription="slide" class="cascading-slider__item w-dyn-item" data-cascading-slide="" role="listitem"><div class="cascading-slider__item-inner"><div class="cascading-slider__item-bg"><img alt="" class="cascading-slider__img" draggable="false" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div><div class="cascading-slider__item-content"><h3 class="cascading-slider__h">Silo Amerika</h3><p class="margin-none">Rotterdam</p></div></div></div><div aria-roledescription="slide" class="cascading-slider__item w-dyn-item" data-cascading-slide="" role="listitem"><div class="cascading-slider__item-inner"><div class="cascading-slider__item-bg"><img alt="" class="cascading-slider__img" draggable="false" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div><div class="cascading-slider__item-content"><h3 class="cascading-slider__h">Johann Siegerstraat 16-18</h3><p class="margin-none">Amsterdam</p></div></div></div><div aria-roledescription="slide" class="cascading-slider__item w-dyn-item" data-cascading-slide="" role="listitem"><div class="cascading-slider__item-inner"><div class="cascading-slider__item-bg"><img alt="" class="cascading-slider__img" draggable="false" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div><div class="cascading-slider__item-content"><h3 class="cascading-slider__h">Based In</h3><p class="margin-none">Hoogvliet Rotterdam</p></div></div></div><div aria-roledescription="slide" class="cascading-slider__item w-dyn-item" data-cascading-slide="" role="listitem"><div class="cascading-slider__item-inner"><div class="cascading-slider__item-bg"><img alt="" class="cascading-slider__img" draggable="false" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div><div class="cascading-slider__item-content"><h3 class="cascading-slider__h">Van Aerssenstraat</h3><p class="margin-none">Den Haag</p></div></div></div><div aria-roledescription="slide" class="cascading-slider__item w-dyn-item" data-cascading-slide="" role="listitem"><div class="cascading-slider__item-inner"><div class="cascading-slider__item-bg"><img alt="" class="cascading-slider__img" draggable="false" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div><div class="cascading-slider__item-content"><h3 class="cascading-slider__h">Glasgebouw</h3><p class="margin-none">Eindhoven</p></div></div></div><div aria-roledescription="slide" class="cascading-slider__item w-dyn-item" data-cascading-slide="" role="listitem"><div class="cascading-slider__item-inner"><div class="cascading-slider__item-bg"><img alt="" class="cascading-slider__img" draggable="false" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div><div class="cascading-slider__item-content"><h3 class="cascading-slider__h">Amstelwood</h3><p class="margin-none">Amstelveen</p></div></div></div></div></div><nav aria-label="slider navigation" class="cascading-slider__nav"><button aria-label="previous slide" class="cascading-slider__button" data-cascading-slider-prev=""><svg class="cascading-slider__button-arrow is--prev" fill="none" viewbox="0 0 24 24" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M14 19L21 12L14 5" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.5"></path><path d="M21 12H2" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.5"></path></svg></button><button aria-label="next slide" class="cascading-slider__button" data-cascading-slider-next=""><svg class="cascading-slider__button-arrow" fill="none" viewbox="0 0 24 24" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M14 19L21 12L14 5" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.5"></path><path d="M21 12H2" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.5"></path></svg></button></nav></div></div></div></div></div><div class="w-embed"><style>

[data-cascading-viewport] {
  --gap: 0.5em;
}

[data-cascading-slide] {
  --clip: 0;
  --radius: 0.25rem;
}

[data-cascading-slide][data-status="active"] {
  cursor: default;
}

[data-cascading-slide] .cascading-slider__h {
  transition-delay: 0ms;
}

[data-cascading-slide][data-status="active"] .cascading-slider__h {
  transition-delay: 400ms;
  opacity: 1;
  transform: translate(0px, 0em);
}

.wf-design-mode [data-cascading-viewport] {
  display: flex;
  flex-direction: row;
  gap: 1em;
  overflow: auto;
}

.wf-design-mode [data-cascading-slide] {
  position: relative;
  width: 60%;
  flex: 0 0 auto;
}

.wf-design-mode .cascading-slider__h {
  opacity: 1;
  transform: translate(0px, 0em);
}

</style></div><div class="hide w-embed w-script"><script defer="">

function initCascadingSlider() {

  const duration = 0.65;
  const ease = 'power3.inOut';

  const breakpoints = [
    { maxWidth: 479, activeWidth: 0.78, siblingWidth: 0.08 },
    { maxWidth: 767, activeWidth: 0.70, siblingWidth: 0.10 },
    { maxWidth: 991, activeWidth: 0.60, siblingWidth: 0.10 },
    { maxWidth: Infinity, activeWidth: 0.60, siblingWidth: 0.13 },
  ];

  const wrappers = document.querySelectorAll('[data-cascading-slider-wrap]');
  wrappers.forEach(setupInstance);

  function setupInstance(wrapper) {
    const viewport = wrapper.querySelector('[data-cascading-viewport]');
    const prevButton = wrapper.querySelector('[data-cascading-slider-prev]');
    const nextButton = wrapper.querySelector('[data-cascading-slider-next]');
    const slides = Array.from(viewport.querySelectorAll('[data-cascading-slide]'));
    let totalSlides = slides.length;

    if (totalSlides === 0) return;

    if (totalSlides < 9) {
      const originalSlides = slides.slice();
      while (slides.length < 9) {
        originalSlides.forEach(function(original) {
          const clone = original.cloneNode(true);
          clone.setAttribute('data-clone', '');
          viewport.appendChild(clone);
          slides.push(clone);
        });
      }
      totalSlides = slides.length;
    }

    let activeIndex = 0;
    let isAnimating = false;
    let slideWidth = 0;
    let slotCenters = {};
    let slotWidths = {};

    function readGap() {
      const raw = getComputedStyle(viewport).getPropertyValue('--gap').trim();
      if (!raw) return 0;
      const temp = document.createElement('div');
      temp.style.width = raw;
      temp.style.position = 'absolute';
      temp.style.visibility = 'hidden';
      viewport.appendChild(temp);
      const px = temp.offsetWidth;
      viewport.removeChild(temp);
      return px;
    }

    function getSettings() {
      const windowWidth = window.innerWidth;
      for (let i = 0; i < breakpoints.length; i++) {
        if (windowWidth <= breakpoints[i].maxWidth) return breakpoints[i];
      }
      return breakpoints[breakpoints.length - 1];
    }

    function getOffset(slideIndex, fromIndex) {
      if (fromIndex === undefined) fromIndex = activeIndex;
      let distance = slideIndex - fromIndex;
      const half = totalSlides / 2;
      if (distance > half) distance -= totalSlides;
      if (distance < -half) distance += totalSlides;
      return distance;
    }

    function measure() {
      const settings = getSettings();
      const viewportWidth = viewport.offsetWidth;
      const gap = readGap();

      const activeSlideWidth = viewportWidth * settings.activeWidth;
      const siblingSlideWidth = viewportWidth * settings.siblingWidth;
      const farSlideWidth = Math.max(0, (viewportWidth - activeSlideWidth - 2 * siblingSlideWidth - 4 * gap) / 2);

      slideWidth = activeSlideWidth;

      const visibleSlots = [
        { slot: -2, width: farSlideWidth },
        { slot: -1, width: siblingSlideWidth },
        { slot: 0, width: activeSlideWidth },
        { slot: 1, width: siblingSlideWidth },
        { slot: 2, width: farSlideWidth },
      ];

      let x = 0;
      visibleSlots.forEach(function(def, i) {
        slotCenters[String(def.slot)] = x + def.width / 2;
        slotWidths[String(def.slot)] = def.width;
        if (i < visibleSlots.length - 1) x += def.width + gap;
      });

      slotCenters['-3'] = slotCenters['-2'] - farSlideWidth / 2 - gap - farSlideWidth / 2;
      slotWidths['-3'] = farSlideWidth;
      slotCenters['3'] = slotCenters['2'] + farSlideWidth / 2 + gap + farSlideWidth / 2;
      slotWidths['3'] = farSlideWidth;

      slides.forEach(function(slide) {
        slide.style.width = slideWidth + 'px';
      });
    }

    function getSlideProps(offset) {
      const clamped = Math.max(-3, Math.min(3, offset));
      const slotWidth = slotWidths[String(clamped)];
      const clipAmount = Math.max(0, (slideWidth - slotWidth) / 2);
      const translateX = slotCenters[String(clamped)] - slideWidth / 2;

      return {
        x: translateX,
        '--clip': clipAmount,
        zIndex: 10 - Math.abs(clamped),
      };
    }

    function layout(animate, previousIndex) {
      slides.forEach(function(slide, index) {
        const offset = getOffset(index);

        if (offset < -3 || offset > 3) {
          if (animate && previousIndex !== undefined) {
            const previousOffset = getOffset(index, previousIndex);
            if (previousOffset >= -2 && previousOffset <= 2) {
              const exitSlot = previousOffset < 0 ? -3 : 3;
              gsap.to(slide, Object.assign({}, getSlideProps(exitSlot), {
                duration: duration,
                ease: ease,
                overwrite: true,
              }));
              return;
            }
          }

          const parkSlot = offset < 0 ? -3 : 3;
          gsap.set(slide, getSlideProps(parkSlot));
          return;
        }

        const props = getSlideProps(offset);
        slide.setAttribute('data-status', offset === 0 ? 'active' : 'inactive');

        if (animate) {
          gsap.to(slide, Object.assign({}, props, {
            duration: duration,
            ease: ease,
            overwrite: true,
          }));
        } else {
          gsap.set(slide, props);
        }
      });
    }

    function goTo(targetIndex) {
      const normalizedTarget = ((targetIndex % totalSlides) + totalSlides) % totalSlides;
      if (isAnimating || normalizedTarget === activeIndex) return;
      isAnimating = true;

      const previousIndex = activeIndex;
      const travelDirection = getOffset(normalizedTarget, previousIndex) > 0 ? 1 : -1;

      slides.forEach(function(slide, index) {
        const currentOffset = getOffset(index, previousIndex);
        const nextOffset = getOffset(index, normalizedTarget);
        const wasInRange = currentOffset >= -3 && currentOffset <= 3;
        const willBeVisible = nextOffset >= -2 && nextOffset <= 2;

        if (!wasInRange && willBeVisible) {
          const entrySlot = travelDirection > 0 ? 3 : -3;
          gsap.set(slide, getSlideProps(entrySlot));
        }

        const wasInvisible = Math.abs(currentOffset) >= 3;
        const willBeStaging = Math.abs(nextOffset) === 3;
        const crossesSides = currentOffset * nextOffset < 0;
        if (wasInvisible && willBeStaging && crossesSides) {
          gsap.set(slide, getSlideProps(nextOffset > 0 ? 3 : -3));
        }
      });

      activeIndex = normalizedTarget;
      layout(true, previousIndex);
      gsap.delayedCall(duration + 0.05, function() { isAnimating = false; });
    }

    if (prevButton) prevButton.addEventListener('click', function() { goTo(activeIndex - 1); });
    if (nextButton) nextButton.addEventListener('click', function() { goTo(activeIndex + 1); });

    slides.forEach(function(slide, index) {
      slide.addEventListener('click', function() {
        if (index !== activeIndex) goTo(index);
      });
    });

    document.addEventListener('keydown', function(event) {
      if (event.key === 'ArrowLeft') goTo(activeIndex - 1);
      if (event.key === 'ArrowRight') goTo(activeIndex + 1);
    });

    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        measure();
        layout(false);
      }, 100);
    });

    measure();
    layout(false);
  }
}

// Initialize Cascading Slider
document.addEventListener('DOMContentLoaded', function() {
  initCascadingSlider();
});

</script></div></section></main><footer class="footer__wrapper"><section class="footer__topper"><div class="w-layout-blockcontainer container w-container"><div class="col__1"><div class="col"><div class="z-1"><div class="center-content"><div class="max__500"><div class="mb__l"><h3 class="h3 is__bigger">Curating Sustainable Alternatives.</h3></div><a class="button w-inline-block" href="/shop"><div>Shop Now</div></a><div class="cta-people"><img alt="Thulira team consulting during a site inspection." loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="opacity__65">Get in touch today</div></div></div></div></div><img alt="Modern wastafel met een houten kast met verticale lijnen, een metalen kraan, en twee tandenborstels in een roze glazen houder tegen een lichte terrazzo muur." class="cta-image is__1" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><img alt="Zwarte vrijstaande badkraan naast een wit bad en een beige gevlochten poef met een witte handdoek in een moderne badkamer." class="cta-image is__2" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><img alt="Minimalistisch badkamerinterieur met hangende houten wastafel, asymmetrische verlichte spiegel en vrijstaand wit bad met mand voor handdoeken." class="cta-image is__3" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div></div></section><section class="section is__dark v__footer"><div class="z-1"><div class="w-layout-blockcontainer container w-container"><div class="row"><div class="col__footer"><div class="col" id="w-node-_59d0562d-fb65-eaa0-fc67-8e3d4af3a4e3-4af3a4d1"><p class="h4">Sustainable biocomposite home products including bottles and drinkware.</p><p class="mb__m">Ethically sourced, highly durable, and 100% food-safe sustainable alternatives.</p><a class="button w-inline-block" href="/shop"><div>Shop Now</div></a></div><nav class="col"><div class="footer__text is__heading">Menu</div><ul class="w-list-unstyled" role="list"><li><a class="footer__text" href="/">Home</a></li><li><a aria-current="page" class="footer__text w--current" href="/about">About Us</a></li><li><a class="footer__text" href="/shop">Shop</a></li><li><a class="footer__text" href="/blog">Blog</a></li></ul></nav><nav class="col"><div class="footer__text is__heading">Contact</div><ul class="w-list-unstyled" role="list"><li><a class="footer__text" href="mailto:info@thulira.com">info@thulira.com</a></li><li><a class="footer__text" href="tel:+6582355452">+65 8235 5452</a></li><li><a class="footer__text" href="https://wa.me/6582355452" target="_blank">WhatsApp</a></li><li><div class="footer__text">Sustainable Materials</div></li><li><div class="footer__text">100% Food Safe</div></li><li><div class="footer__text">Island-wide Delivery</div></li></ul></nav></div><div class="col__1"><div class="col"><div class="w-embed"><div class="footer__logo-text-wrap" style="width: 100%; display: flex; justify-content: center; align-items: center; padding: 2rem 0; box-sizing: border-box;"><h2 style="font-family: 'Inter', sans-serif; font-size: calc(2rem + 3.5vw); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.06); text-align: center; margin: 0; line-height: 0.9; user-select: none;">Thulira</h2></div></div></div><div class="col__1"><div class="col"><div class="imprint__wrapper"><a class="imprint__text" href="https://www.overflow.nl">By Overflow</a></div></div></div></div></div></div><div class="footer__deco v-footer w-embed"><svg fill="none" height="100%" viewbox="0 0 151 850" width="100%" xmlns="http://www.w3.org/2000/svg">
<path d="M0 -26H6.56522L6.56522 851H0L0 -26Z" fill="url(#paint0_linear_2462_171)"></path>
<path d="M19.6957 -26H32.8261L32.8261 851H19.6957L19.6957 -26Z" fill="url(#paint1_linear_2462_171)"></path>
<path d="M45.9565 -26H65.6522L65.6522 851H45.9565L45.9565 -26Z" fill="url(#paint2_linear_2462_171)"></path>
<path d="M78.7826 -26L105.043 -26L105.043 851H78.7826L78.7826 -26Z" fill="url(#paint3_linear_2462_171)"></path>
<path d="M118.174 -26L151 -26L151 851H118.174L118.174 -26Z" fill="url(#paint4_linear_2462_171)"></path>
<defs>
<lineargradient gradientunits="userSpaceOnUse" id="paint0_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint1_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint2_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint3_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint4_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
</defs>
</svg></div></div></section></footer></div><script crossorigin="anonymous" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=6978c74eb7a56e10b85274cb" type="text/javascript"></script><script crossorigin="anonymous" integrity="sha384-eLhtiOwpAcsrjTU3szoidTK2FT4sgwN998/lRT314vxiyUJEzKSwZ02q/f+3Y8k8" src="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/js/webflow.schunk.05ab46bf443beb37.js" type="text/javascript"></script><script crossorigin="anonymous" integrity="sha384-EVx92WuQb9mkhZNxF68hHdqG3YKkx56dL/nD5M2q9oiJEb7dNT9DlzNekRovfOhz" src="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/js/webflow.5546c6e4.499238e9946a7c5f.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/gsap.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/ScrollTrigger.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/Observer.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/Draggable.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/SplitText.min.js" type="text/javascript"></script><script type="text/javascript">gsap.registerPlugin(ScrollTrigger,Observer,Draggable,SplitText);</script><script src="https://unpkg.com/lenis@1.3.17/dist/lenis.min.js"></script>
<script>
  
const lenis = new Lenis();

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000); // Convert time from seconds to milliseconds
});

gsap.ticker.lagSmoothing(0);

  
</script></body></html>
```

---

## src/pages/admin.html

```html
<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Admin Dashboard | Thulira</title>
<meta content="View your order history with Thulira Singapore." name="description"/>
<meta content="width=device-width, initial-scale=1" name="viewport"/>
<link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.shared.e97910e78.min.css" integrity="sha384-6XkQ54zt5ZhQdYI3Cx7JctA/Nr8ro5njqFDfYJJIYwhTuj2/ibnU3ZsiTqnERiYm" rel="stylesheet" type="text/css"/>
<link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.69c3b278cebe0890cc1deff6.279609e48.opt.min.css" integrity="sha384-J5YJ5IODQP3dWDCguNMeegsI+pxEg3y/1oh76z8WYZOLOF8Mz4zlr2auNzYvFebx" rel="stylesheet" type="text/css"/>
<link href="ecommerce.css?v=999?v=999" rel="stylesheet"/>
<script type="text/javascript">
    !function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);
  </script>
<link href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/6997158e5fac364205ad5ab5_Favicon.png" rel="shortcut icon" type="image/x-icon"/>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script defer="" src="supabaseClient.js?v=2"></script>
<script defer="" src="cart.js?v=2"></script>

<style>
  /* Prevent Webflow scaling down interaction on the page content */
  .page__wrapper,
  .main__wrapper,
  main,
  body {
    transform: none !important;
    scale: none !important;
  }
</style>

</head>
<body>
<div class="page__wrapper">
<div class="nav__component" data-nav-element="">
<div class="nav__wrapper" data-nav-wrapper="">
<div class="nav__flex">
<div class="nav__left">
<a class="nav__link" href="/about">About Us</a>
<a class="nav__link" href="/blog">Blog</a>
</div>
<div class="nav__center">
<a class="nav__logo w-inline-block" href="/"><img src="/thulira-transparent.png" alt="Thulira Logo" style="height: 32px; width: auto; display: block;" /></a>
</div>
<div class="nav__right">
<div data-hide-landscape="">
<a class="button w-inline-block" href="/shop"><div>Shop Now</div></a>
</div>

</div>
</div>
<div class="nav__menu-wrapper" data-menu-wrapper="">
<nav class="nav__menu-inner">
<ul class="w-list-unstyled" role="list">
<li><a class="nav__menu-link" href="/">Home</a></li>
<li><a class="nav__menu-link" href="/shop">Shop</a></li>
<li><a class="nav__menu-link" href="/blog">Blog</a></li>
<li><a class="nav__menu-link" href="/about">About Us</a></li>

</ul>
</nav>
</div>
</div>
</div>
<main style="min-height: 85vh; background: var(--thulira-bg-dark); padding-top: 6rem;">
<div class="orders-page-container">
<div class="orders-page-header">
<h1>Admin Dashboard</h1>
</div>
<div style="margin-bottom: 1.5rem;">
<input id="searchInput" placeholder="Search by Order ID, Name, or Phone..." style="width: 100%; max-width: 400px; padding: 0.8rem; border-radius: 4px; border: 1px solid var(--thulira-border); background: rgba(255,255,255,0.05); color: white;" type="text"/>
</div>
<div class="admin-tabs">
<button class="admin-tab active" data-filter="pending">Pending Orders</button>
<button class="admin-tab" data-filter="confirmed">Confirmed Orders</button>
<button class="admin-tab" data-filter="delivered">Delivered Orders</button>
<button class="admin-tab" data-filter="cancelled">Cancelled</button>
<button class="admin-tab" data-filter="all">All Orders</button>
</div>
<div class="orders-list" id="ordersList">
<!-- Dynamic Order cards -->
</div>
<div class="no-orders-box" id="emptyOrdersBox" style="display: none;">
<svg fill="none" height="48" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewbox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
<rect height="18" rx="2" ry="2" width="18" x="3" y="4"></rect>
<line x1="16" x2="16" y1="2" y2="6"></line>
<line x1="8" x2="8" y1="2" y2="6"></line>
<line x1="3" x2="21" y1="10" y2="10"></line>
</svg>
<h2 style="color: white; margin:0;">No Orders Found</h2>
<p>There are no orders matching this view.</p>
</div>
</div>
</main>
</div>
<script>
    document.addEventListener('DOMContentLoaded', async () => {
      // 1. Enforce Authentication
      if (window.initSupabase) await window.initSupabase();
      const { data: { session } } = await window.supabaseClient.auth.getSession();

      if (!session) {
        document.querySelector('.orders-page-container').innerHTML = `
          <div style="text-align: center; padding: 4rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--thulira-orange)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 2rem;">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <h1 style="color: white; margin-bottom: 1rem;">Admin Access Restricted</h1>
            <p style="color: var(--thulira-text-muted); margin-bottom: 2rem;">You must be logged in with administrator credentials to view this page.</p>
            <button class="button" onclick="if(window.openAuthModal) window.openAuthModal(); else alert('Auth not initialized. Please go to home page to login.');">Sign In</button>
          </div>
        `;
        return; // Halt execution of the rest of the dashboard
      }

      // -- Dashboard Logic Starts Here --
      let orders = [];
      const listDiv = document.getElementById('ordersList');
      const emptyDiv = document.getElementById('emptyOrdersBox');
      const tabs = document.querySelectorAll('.admin-tab');
      const searchInput = document.getElementById('searchInput');
      let currentFilter = 'pending';
      let searchQuery = '';

      function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function showUnauthorizedView(email) {
        document.querySelector('.orders-page-container').innerHTML = `
          <div style="text-align: center; padding: 4rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 2rem;">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h1 style="color: white; margin-bottom: 1rem;">Unauthorized</h1>
            <p style="color: var(--thulira-text-muted);">Your account (${escapeHTML(email)}) does not have administrator privileges.</p>
            <button class="button" onclick="window.supabaseClient.auth.signOut().then(() => window.location.reload())" style="margin-top: 2rem;">Sign Out</button>
          </div>
        `;
      }

      function fetchOrders() {
        listDiv.innerHTML = '<div style="color:white;">Loading...</div>';
        fetch('/api/admin/orders', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
          .then(res => {
            if (res.status === 401 || res.status === 403) {
              showUnauthorizedView(session.user.email);
              return null;
            }
            return res.json();
          })
          .then(data => {
            if (data && Array.isArray(data)) {
              orders = data;
              renderOrders();
            }
          })
          .catch(err => {
            console.error(err);
            listDiv.innerHTML = '<div style="color:red;">Error fetching orders.</div>';
          });
      }

      window.updateStatus = function(orderId, newStatus) {
        fetch(`/api/admin/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ status: newStatus })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            orders = orders.map(o => {
              if (o.id === orderId) o.status = newStatus;
              return o;
            });
            renderOrders();
          } else {
            alert('Error updating status: ' + data.error);
          }
        })
        .catch(err => {
          console.error(err);
          alert('Failed to update status.');
        });
      };

      tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          tabs.forEach(t => t.classList.remove('active'));
          e.target.classList.add('active');
          currentFilter = e.target.getAttribute('data-filter');
          renderOrders();
        });
      });

      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderOrders();
      });

      function renderOrders() {
        let filteredOrders = currentFilter === 'all' 
          ? orders 
          : orders.filter(o => (o.status || 'pending').toLowerCase() === currentFilter);

        if (searchQuery) {
          filteredOrders = filteredOrders.filter(o => 
            (o.id && o.id.toLowerCase().includes(searchQuery)) ||
            (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery)) ||
            (o.customer_phone && o.customer_phone.toLowerCase().includes(searchQuery))
          );
        }

        if (filteredOrders.length === 0) {
          listDiv.style.display = 'none';
          emptyDiv.style.display = 'flex';
          emptyDiv.querySelector('h2').textContent = 'No Orders Found';
          emptyDiv.querySelector('p').textContent = `There are no ${escapeHTML(currentFilter)} orders matching your search.`;
          return;
        } else {
          listDiv.style.display = 'flex';
          emptyDiv.style.display = 'none';
        }

        let html = '';
        filteredOrders.forEach(order => {
          let statusText = (order.status || 'pending').toUpperCase();
          let statusClass = "status-pending";
          if (statusText === 'CONFIRMED') statusClass = "status-scheduled";
          if (statusText === 'DELIVERED') statusClass = "status-completed";
          if (statusText === 'CANCELLED') statusClass = "status-completed";

          let itemsHtml = '';
          (order.order_items || []).forEach(item => {
            itemsHtml += `
              <div class="order-item-row">
                <div class="order-item-desc">
                  <span class="order-item-qty-badge">x${item.quantity}</span>
                  <span style="font-weight:600;">${escapeHTML(item.product_title)} ${item.size ? `<span class="cart-item-size-badge">${escapeHTML(item.size)}</span>` : ''}</span>
                </div>
                <span style="font-weight:700;">$${(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
            `;
          });
          
          let actionButtons = '';
          if (statusText === 'PENDING') {
            actionButtons = `<button class="admin-action-btn confirm" onclick="updateStatus('${order.id}', 'confirmed')">Confirm Order</button>
                             <button class="admin-action-btn cancel" onclick="updateStatus('${order.id}', 'cancelled')">Cancel</button>`;
          } else if (statusText === 'CONFIRMED') {
            actionButtons = `<button class="admin-action-btn deliver" onclick="updateStatus('${order.id}', 'delivered')">Mark as Delivered</button>
                             <button class="admin-action-btn cancel" onclick="updateStatus('${order.id}', 'cancelled')">Cancel</button>`;
          }

          html += `
            <div class="order-card">
              <div class="order-card-header">
                <div class="order-header-info">
                  <div class="order-meta-item">
                    <span class="order-meta-label">Order ID</span>
                    <span class="order-meta-val" style="color:var(--thulira-orange);">${escapeHTML(order.id.split('-')[0])}...</span>
                  </div>
                  <div class="order-meta-item">
                    <span class="order-meta-label">Date Placed</span>
                    <span class="order-meta-val">${escapeHTML(new Date(order.created_at).toLocaleString())}</span>
                  </div>
                  <div class="order-meta-item">
                    <span class="order-meta-label">Total Amount</span>
                    <span class="order-meta-val">$${order.total.toFixed(2)}</span>
                  </div>
                </div>
                <span class="order-status-pill ${statusClass}">${escapeHTML(statusText)}</span>
              </div>
              
              <div class="order-card-body">
                <h3 style="margin-top:0; font-size:1.05rem; text-transform:uppercase; color:var(--thulira-text-muted); font-weight:700; margin-bottom:1rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom:0.4rem;">Products</h3>
                <div class="order-items-grid">
                  ${itemsHtml}
                </div>
                
                <h3 style="margin-top:1.5rem; font-size:1.05rem; text-transform:uppercase; color:var(--thulira-text-muted); font-weight:700; margin-bottom:1rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom:0.4rem;">Shipping Details</h3>
                <div style="display:grid; grid-template-columns: 1fr; gap:0.8rem; font-size:0.95rem;">
                  <div><strong>Address:</strong> ${escapeHTML(order.shipping_address)}</div>
                  <div style="display:flex; gap:2rem; flex-wrap:wrap; color:var(--thulira-text-muted); font-size:0.9rem;">
                    <div><strong>Contact Name:</strong> ${escapeHTML(order.customer_name)}</div>
                    <div><strong>Contact Phone:</strong> ${escapeHTML(order.customer_phone)}</div>
                  </div>
                </div>
                
                <div class="admin-actions">
                    ${actionButtons}
                </div>
              </div>
            </div>
          `;
        });
        
        listDiv.innerHTML = html;
      }
      
      fetchOrders();
    });
  </script>
</body>
</html>
```

---

## src/pages/blog.html

```html
<!DOCTYPE html>

<!-- This site was created in Webflow. https://webflow.com --><!-- Last Published: Thu May 28 2026 11:30:34 GMT+0000 (Coordinated Universal Time) --><html data-wf-domain="www.thulira.com" data-wf-page="69c3b25c522c63bc80a0af71" data-wf-site="6978c74eb7a56e10b85274cb" lang="en"><head><meta charset="utf-8"/><link crossorigin="anonymous" href="https://cdn.prod.website-files.com" rel="preconnect"/><title>Blog & Insights | Thulira</title><meta content="100% Food Safe Eco-friendly Store in Singapore since 2004. High-quality eco-friendly products, painting, renovation, and flooring with up to 10-year warranties." name="description"/><meta content="Services | Thulira" property="og:title"/><meta content="100% Food Safe Eco-friendly Store in Singapore since 2004. High-quality eco-friendly products, painting, renovation, and flooring with up to 10-year warranties." property="og:description"/><meta content="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/6a0420ffaf0e855ffd198ae3_Modus%20Open%20Graph.jpg" property="og:image"/><meta content="Services | Thulira" name="twitter:title"/><meta content="100% Food Safe Eco-friendly Store in Singapore since 2004. High-quality eco-friendly products, painting, renovation, and flooring with up to 10-year warranties." name="twitter:description"/><meta content="website" property="og:type"/><meta content="summary_large_image" name="twitter:card"/><meta content="width=device-width, initial-scale=1" name="viewport"/><meta content="Webflow" name="generator"/><link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.shared.e97910e78.min.css" integrity="sha384-6XkQ54zt5ZhQdYI3Cx7JctA/Nr8ro5njqFDfYJJIYwhTuj2/ibnU3ZsiTqnERiYm" rel="stylesheet" type="text/css"/><link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.69c3b25c522c63bc80a0af71.50f6bb623.opt.min.css" integrity="sha384-UPa7YjsqNts4kuy2BsQvWreo990V28G/8UiSwCDoL6NTh4+3uQtZuUpdh4lJZK+f" rel="stylesheet" type="text/css"/><style>html.w-mod-js:not(.w-mod-ix3) :is([data-popup-overlay], [data-popup-content], button[data-popup-close], [data-floatcard-1], [data-floatcard-2], [data-floatcard-3], :not([data-no-anim]) :is(.h1, .h2, .h3, .h4, .h5, .h6):not([data-no-anim]), .floating-content__text, [data-toggle-icon], .vertical-dash, [data-menu-wrapper], [data-menu-wrapper] li, [data-menu-icon-open], [data-menu-icon-close], section:first-child, .nav__component) {visibility: hidden !important;}</style><script type="text/javascript">!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);</script><link href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/6997158e5fac364205ad5ab5_Favicon.png" rel="shortcut icon" type="image/x-icon"/><link href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/699715925c02a742c5f3854f_Webclip.png" rel="apple-touch-icon"/><link href="/blog" rel="canonical"/><script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Services",
  "url": "https://www.thulira.com/blog",
  "inLanguage": "en",
  "description": "100% Food Safe Eco-friendly Store in Singapore since 2004. High-quality eco-friendly products, painting, renovation, and flooring with up to 10-year warranties.",
  "mainEntity": {
    "@type": "Store",
    "name": "Thulira Sustainable Products",
    "description": "Premium Eco-friendly Store services in Singapore. We specialize in high-quality eco-friendly products with over 20 years of experience.",
    "provider": {
      "@type": "Organization",
      "name": "Thulira",
      "email": "info@thulira.com",
      "telephone": "+6582355452",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Singapore Island-wide Coverage",
        "addressLocality": "Singapore",
        "addressCountry": "SG"
      }
    },
    "serviceType": "Sustainable Home Products",
    "areaServed": {
      "@type": "Country",
      "name": "Singapore"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Thulira Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Store",
            "name": "Gardenware",
            "description": "Leak identification, clay tile repair, protective re-coating, and polycarbonate roof installations."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Store",
            "name": "Drinkware",
            "description": "Polyurethane (PU) injection grouting and waterpeco-friendly products membranes for roofs, balconies, and wet areas."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Store",
            "name": "Tableware",
            "description": "Interior/exterior painting, spalling concrete repair, ceiling board replacement, hacking, and demolition."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Store",
            "name": "Storage",
            "description": "Crystal floor crystallization treatment and high-quality artificial turf laying."
          }
        }
      ]
    }
  }
}
</script><link href="https://unpkg.com/lenis@1.3.17/dist/lenis.css" rel="stylesheet"/>
<script async="" src="https://plausible.io/js/pa-Sqg6vyhtWsckPaZZKPPpJ.js"></script>
<script>
  window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
  plausible.init()
</script>
<!-- Leadinfo tracking code -->
<script>
(function(l,e,a,d,i,n,f,o){if(!l[i]){l.GlobalLeadinfoNamespace=l.GlobalLeadinfoNamespace||[];
l.GlobalLeadinfoNamespace.push(i);l[i]=function(){(l[i].q=l[i].q||[]).push(arguments)};l[i].t=l[i].t||n;
l[i].q=l[i].q||[];o=e.createElement(a);f=e.getElementsByTagName(a)[0];o.async=1;o.src=d;f.parentNode.insertBefore(o,f);}
}(window,document,'script','https://cdn.leadinfo.net/ping.js','leadinfo','LI-69E624F75B59D'));
</script><link href="ecommerce.css?v=999?v=999" rel="stylesheet"/><script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script defer="" src="supabaseClient.js?v=2"></script>
<script defer="" src="cart.js?v=2"></script>
<style>
  /* Prevent Webflow scaling down interaction on the page content */
  .page__wrapper,
  .main__wrapper,
  main,
  body {
    transform: none !important;
    scale: none !important;
  }
</style>

</head><body><div class="page__wrapper"><div class="nav__component" data-nav-element=""><div class="nav__wrapper" data-nav-wrapper=""><div class="nav__flex"><div class="nav__left" style="display:flex; align-items:center;"><button class="nav__toggle" data-menu-toggle-button=""><div class="icon__24 w-embed" data-menu-icon-open=""><svg aria-hidden="true" class="iconify iconify--tabler" height="24" preserveaspectratio="xMidYMid meet" role="img" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg></div><div class="icon__24 w-embed" data-menu-icon-close=""><svg aria-hidden="true" class="iconify iconify--ic" height="24" preserveaspectratio="xMidYMid meet" role="img" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z" fill="currentColor"></path></svg></div></button></div><div class="nav__center"><a class="nav__logo w-inline-block" href="/"><img src="/thulira-transparent.png" alt="Thulira Logo" style="height: 32px; width: auto; display: block;" /></a></div><div class="nav__right"><div data-hide-landscape=""><a class="button w-inline-block" href="/shop"><div>Shop Now</div></a></div></div></div><div class="nav__menu-wrapper" data-menu-wrapper=""><nav class="nav__menu-inner"><ul class="w-list-unstyled" role="list"><li><a class="nav__menu-link" href="/">Home</a></li><li><a class="nav__menu-link" href="/shop">Shop</a></li><li><a aria-current="page" class="nav__menu-link w--current" href="/blog">Blog</a></li><li><a class="nav__menu-link" href="/about">About Us</a></li></ul></nav></div></div><div class="w-embed"><style>

  [data-z-one] {
    z-index: 5;
    position: relative;
  }

  [data-margin-none] {
    margin: 0px !important;
  }

:root {

-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;

}

  .logo-marquee__image {
    -webkit-user-drag: none;
  }


  p:last-child {
    margin-bottom: 0px !important;
  }

  .h1:first-child, .h2:first-child, .h3:first-child, .h4:first-child, .h5:first-child {
    margin-top: 0px !important;
  }

  [data-height-full] {
    height: 100%;
  }

  .h1:last-child,
  .h2:last-child,
  .h3:last-child,
  .h4:last-child,
  .h5:last-child,
  .h6:last-child,
  h1:last-child,
  h2:last-child,
  h3:last-child,
  h4:last-child,
  h5:last-child,
  h6:last-child {
    margin-bottom: 0 !important;
  }

  @media (max-width: 992px) {
  [data-hide-landscape] {
    display: none !important;
  }
}

</style></div><div class="w-condition-invisible w-embed w-script"><script>
  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('[data-nav-wrapper]');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      let bc = nav.style.borderColor;
      if (window.scrollY > 40) {
        nav.style.maxWidth = '1200px';
        nav.style.borderColor = bc;
      } else {
        nav.style.maxWidth = '';
        nav.style.borderColor = '';
      }
    });

    setTimeout(() => {
      window.scrollBy(0, 3);

      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        window.scrollBy(0, -3);
      });
    }, 250);
  });
</script></div></div><main><section class="section is__tinted"><div class="rotating-image-trail" data-trail-area=""><div class="rotating-image-trail__collection w-dyn-list" data-trail-collection=""><div class="rotating-image-trail__list w-dyn-items" role="list"><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project work 1" class="rotating-image-trail__card-img" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project work 2" class="rotating-image-trail__card-img" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project work 3" class="rotating-image-trail__card-img" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project work 4" class="rotating-image-trail__card-img" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project work 5" class="rotating-image-trail__card-img" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project work 6" class="rotating-image-trail__card-img" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project work 7" class="rotating-image-trail__card-img" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project work 8" class="rotating-image-trail__card-img" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div></div></div><div class="hide w-embed w-script"><script defer="">

function initRotatingImageTrail() {
  var area = document.querySelector("[data-trail-area]");
  if (!area) return;

  var collection = area.querySelector("[data-trail-collection]");
  if (!collection) return;

  var items = collection.querySelectorAll("[data-trail-item]");
  if (!items.length) return;

  // Distance logic
  var index = 0;
  var lastCloneX = null;
  var lastCloneY = null;

  var cardWidth = items[0].getBoundingClientRect().width;
  var stepDistance = cardWidth * 0.5;

  function spawnTrailItem(x, y) {
    var original = items[index];
    var clone = original.cloneNode(true);

    clone.style.left = x + "px";
    clone.style.top = y + "px";

    clone.setAttribute("data-trail-item", "hidden");

    area.appendChild(clone);

    void clone.getBoundingClientRect();

    clone.setAttribute("data-trail-item", "visible");

    setTimeout(function () {
      clone.setAttribute("data-trail-item", "transition-out");
    }, 400);

    setTimeout(function () {
      clone.remove();
    }, 1200);

    index = (index + 1) % items.length;
    lastCloneX = x;
    lastCloneY = y;
  }

  // Mouse movement logic
  area.addEventListener("mousemove", function (event) {
    var rect = area.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      lastCloneX = null;
      lastCloneY = null;
      return;
    }

    if (lastCloneX === null || lastCloneY === null) {
      spawnTrailItem(x, y);
      return;
    }

    var dx = x - lastCloneX;
    var dy = y - lastCloneY;
    var distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= stepDistance) {
      spawnTrailItem(x, y);
    }
  });
}

// Initialize Rotating Image Trail
document.addEventListener("DOMContentLoaded", function () {
  initRotatingImageTrail();
});

</script></div><div class="w-embed"><style>

[data-trail-item="hidden"] {
  transform: translate(-50%, -50%) scale(0) rotate(-10deg);
  position: absolute;
}

[data-trail-item="visible"] {
  transform: translate(-50%, -50%) scale(1) rotate(0.001deg);
  transition: transform 0.4s cubic-bezier(0.625, 0.05, 0, 1);
  position: absolute;
}

[data-trail-item="transition-out"] {
  transform: translate(-50%, -50%) scale(0) rotate(20deg);
  transition: transform 0.8s cubic-bezier(0.625, 0, 0.875, 0);
  position: absolute;
}

</style></div></div><div class="w-layout-blockcontainer container w-container"><div class="hero-content"><h1 class="h2">Specialized Sustainable Home Products</h1><p class="max__500">Since 2004, Thulira has set the standard for high-quality eco-friendly products, renovation, and landscaping across Singapore. We ensure product safety, transparent diagnostics, and up to 10-year warranties on sustainable products.</p></div></div></section><section class="section"><div class="w-layout-blockcontainer container w-container"><div class="row"><div class="col__1"><div class="col" id="w-node-acb125f3-0eb7-5977-fe12-a80dc73ca2af-c73ca2ab"><p>We work with leading industry-approved brands</p></div></div><div class="draggable-marquee" data-direction="left" data-draggable-marquee-init="" data-duration="35" data-multiplier="35" data-sensitivity="0.01"><div class="logo-marquee__collection w-dyn-list" data-draggable-marquee-collection=""><div class="logo-marquee__list w-dyn-items" data-draggable-marquee-list="" role="list"><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Revital" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Van Besouw" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Impuls Küchen" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Xenz" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="RIHO" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Van Rijn" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Bliss" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Schuler Keukens" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Nobilia" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Pro-line" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="IVY" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="INK" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div><div class="logo-marquee__item w-dyn-item" role="listitem"><img alt="Sanibell" class="logo-marquee__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="logo-marquee__dashes-wrapper"><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash is-highlight"></div><div class="vertical-dash"></div><div class="vertical-dash"></div><div class="vertical-dash"></div></div></div></div></div><div class="logo-marquee__fade is-left"></div><div class="logo-marquee__fade is-right"></div></div></div></div><div class="w-condition-invisible w-embed w-script"><script>
function initDraggableMarquee() {
  const wrappers = document.querySelectorAll("[data-draggable-marquee-init]");

  const getNumberAttr = (el, name, fallback) => {
    const value = parseFloat(el.getAttribute(name));
    return Number.isFinite(value) ? value : fallback;
  };

  wrappers.forEach((wrapper) => {
    if (wrapper.getAttribute("data-draggable-marquee-init") === "initialized") return;

    const collection = wrapper.querySelector("[data-draggable-marquee-collection]");
    const list = wrapper.querySelector("[data-draggable-marquee-list]");
    if (!collection || !list) return;

    const duration = getNumberAttr(wrapper, "data-duration", 20);
    const multiplier = getNumberAttr(wrapper, "data-multiplier", 40);
    const sensitivity = getNumberAttr(wrapper, "data-sensitivity", 0.01);

    const wrapperWidth = wrapper.getBoundingClientRect().width;
    const listWidth = list.scrollWidth || list.getBoundingClientRect().width;
    if (!wrapperWidth || !listWidth) return;

    // Make enough duplicates to cover screen
    const minRequiredWidth = wrapperWidth + listWidth + 2;
    while (collection.scrollWidth < minRequiredWidth) {
      const listClone = list.cloneNode(true);
      listClone.setAttribute("data-draggable-marquee-clone", "");
      listClone.setAttribute("aria-hidden", "true");
      collection.appendChild(listClone);
    }

    const wrapX = gsap.utils.wrap(-listWidth, 0);
    
    gsap.set(collection, { x: 0 });
    
    const marqueeLoop = gsap.to(collection, {
      x: -listWidth,
      duration,
      ease: "none",
      repeat: -1,
      onReverseComplete: () => marqueeLoop.progress(1),
      modifiers: {
        x: (x) => wrapX(parseFloat(x)) + "px"
      },
    });
    
    // Direction can be used for css + set initial direction on load
    const initialDirectionAttr = (wrapper.getAttribute("data-direction") || "left").toLowerCase();
    const baseDirection = initialDirectionAttr === "right" ? -1 : 1;
    
    const timeScale = { value: 1 };
    
    timeScale.value = baseDirection;
    wrapper.setAttribute("data-direction", baseDirection < 0 ? "right" : "left");
    
    if (baseDirection < 0) marqueeLoop.progress(1);
    
    function applyTimeScale() {
      marqueeLoop.timeScale(timeScale.value);
      wrapper.setAttribute("data-direction", timeScale.value < 0 ? "right" : "left");
    }
    
    applyTimeScale();

    // Drag observer
    const marqueeObserver = Observer.create({
      target: wrapper,
      type: "pointer,touch",
      preventDefault: true,
      debounce: false,
      onChangeX: (observerEvent) => {
        let velocityTimeScale = observerEvent.velocityX * -sensitivity;
        velocityTimeScale = gsap.utils.clamp(-multiplier, multiplier, velocityTimeScale);

        gsap.killTweensOf(timeScale);

        const restingDirection = velocityTimeScale < 0 ? -1 : 1;

        gsap.timeline({ onUpdate: applyTimeScale })
          .to(timeScale, { value: velocityTimeScale, duration: 0.1, overwrite: true })
          .to(timeScale, { value: restingDirection, duration: 1.0 });
      }
    });

    // Pause marquee when scrolled out of view
    ScrollTrigger.create({
      trigger: wrapper,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => { marqueeLoop.resume(); applyTimeScale(); marqueeObserver.enable(); },
      onEnterBack: () => { marqueeLoop.resume(); applyTimeScale(); marqueeObserver.enable(); },
      onLeave: () => { marqueeLoop.pause(); marqueeObserver.disable(); },
      onLeaveBack: () => { marqueeLoop.pause(); marqueeObserver.disable(); }
    });
    
    wrapper.setAttribute("data-draggable-marquee-init", "initialized");
  });
}

// Initialize Draggable Marquee (Directional)
document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger, Observer);
  initDraggableMarquee();
});
</script></div></section><section class="section"><div class="w-layout-blockcontainer container w-container"><div class="sticky-steps__collection" data-sticky-steps-init=""><div class="sticky-steps__list"><div class="sticky-steps__item" data-sticky-steps-item="" data-sticky-steps-item-status="active"><div class="sticky-steps__text" data-sticky-steps-anchor=""><h2 class="h2">Bottles</h2><p>Eco-friendly bottles for your daily hydration.</p><div class="sticky-price-tag" style="margin-top: 1rem; font-size: 1.15rem; font-weight: 800; color: var(--thulira-orange, #FFA574);">$450.00</div>
<div class="size-selector-group">
<button class="size-btn" data-size="S">S</button>
<button class="size-btn active" data-size="M">M</button>
<button class="size-btn" data-size="L">L</button>
<button class="size-btn" data-size="XL">XL</button>
</div>
<button class="add-to-cart-popup-btn" data-product-id="eco-friendly products" style="margin-top: 0.5rem; padding: 0.5rem 1.5rem;">Book Service Package</button></div><div class="sticky-steps__media"><div class="sticky-steps__sticky"><div class="sticky-steps__visual"><img alt="eco-friendly products &amp; eco-friendly product" class="sticky-steps__cover-image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div></div></div><div class="sticky-steps__item" data-sticky-steps-item="" data-sticky-steps-item-status="active"><div class="sticky-steps__text" data-sticky-steps-anchor=""><h2 class="h2">Drinkware</h2><p>Reusable cups, mugs, and bottles made from coffee husk and bamboo. Keep your drinks fresh and sustainable.</p><div class="sticky-price-tag" style="margin-top: 1rem; font-size: 1.15rem; font-weight: 800; color: var(--thulira-orange, #FFA574);">$350.00</div>
<div class="size-selector-group">
<button class="size-btn" data-size="S">S</button>
<button class="size-btn active" data-size="M">M</button>
<button class="size-btn" data-size="L">L</button>
<button class="size-btn" data-size="XL">XL</button>
</div>
<button class="add-to-cart-popup-btn" data-product-id="waterpeco-friendly products" style="margin-top: 0.5rem; padding: 0.5rem 1.5rem;">Book Service Package</button></div><div class="sticky-steps__media"><div class="sticky-steps__sticky"><div class="sticky-steps__visual"><img alt="Waterpeco-friendly products &amp; grouting" class="sticky-steps__cover-image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div></div></div></div></div></div><div class="w-condition-invisible w-embed w-script"><script defer="">
  function initStickyStepsBasic() {
  const containers = document.querySelectorAll("[data-sticky-steps-init]");
  if (!containers.length) return;

  containers.forEach((container) => {
    const items = [...container.querySelectorAll("[data-sticky-steps-item]")];
    if (!items.length) return;

    function updateSteps() {
      const viewportCenter = window.innerHeight / 2;

      let closestIndex = 0;
      let closestDistance = Infinity;

      items.forEach((item, index) => {
        const anchor = item.querySelector("[data-sticky-steps-anchor]");
        if (!anchor) return;

        const rect = anchor.getBoundingClientRect();
        const anchorCenter = rect.top + rect.height / 2;
        const distance = Math.abs(viewportCenter - anchorCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      items.forEach((item, index) => {
        let status = "active";

        if (index < closestIndex) status = "before";
        if (index > closestIndex) status = "after";

        item.setAttribute("data-sticky-steps-item-status", status);
      });
    }

    window.addEventListener("scroll", updateSteps);
    window.addEventListener("resize", updateSteps);

    requestAnimationFrame(updateSteps);
  });
}

// Initialize Sticky Steps (Basic)
document.addEventListener('DOMContentLoaded', function () {
  initStickyStepsBasic();
});
</script></div><div class="w-condition-invisible w-embed"><style>
  @media screen and (min-width: 992px) {
  [data-sticky-steps-item-status] .sticky-steps__visual {
    transition: opacity 0.5s ease-in-out, visibility 0.5s ease-in-out;
    opacity: 0;
    visibility: hidden;
  }

  [data-sticky-steps-item-status="before"] .sticky-steps__visual,
  [data-sticky-steps-item-status="active"] .sticky-steps__visual {
    opacity: 1;
    visibility: visible;
  }

  [data-sticky-steps-item-status] .sticky-steps__text {
    transition: opacity 0.5s ease-in-out;
    opacity: 0.25;
  }

  [data-sticky-steps-item-status="active"] .sticky-steps__text {
    opacity: 1;
  }
}
</style></div></section><section class="section"><div class="w-layout-blockcontainer container w-container"><div class="col__2"><div class="col"><h2 class="h2">Frequently Asked Questions</h2><p>Have a eco-friendly products, or Eco-friendly Store project in Singapore? Contact us today to discuss your requirements.</p></div><div class="col"><div class="w-dyn-list"><div class="w-dyn-items" role="list"><div class="w-dyn-item" role="listitem"><div class="toggle-item"><button class="toggle-item__header" data-toggle-header=""><h3 class="h4 margin-none">How do you handle scope changes during a project?</h3><div class="toggle-item__header-icon w-embed" data-toggle-icon=""><svg fill="none" height="100%" viewbox="0 0 16 16" width="100%" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 0H8.5V16H7.5V0Z" fill="black"></path>
<path d="M16 7.5V8.5L0 8.5L4.3714e-08 7.5L16 7.5Z" fill="black"></path>
</svg></div></button><div class="toggle-item__content"><div class="toggle-item__content-rich w-richtext"><p>Scope variations are managed dynamically. Our single-turnkey team communicates modifications in materials or specifications immediately to avoid site delays and adjust diagnostics accordingly, keeping the budget clear.</p></div></div></div></div><div class="w-dyn-item" role="listitem"><div class="toggle-item"><button class="toggle-item__header" data-toggle-header=""><h3 class="h4 margin-none">How do you ensure material and warranty reliability?</h3><div class="toggle-item__header-icon w-embed" data-toggle-icon=""><svg fill="none" height="100%" viewbox="0 0 16 16" width="100%" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 0H8.5V16H7.5V0Z" fill="black"></path>
<path d="M16 7.5V8.5L0 8.5L4.3714e-08 7.5L16 7.5Z" fill="black"></path>
</svg></div></button><div class="toggle-item__content"><div class="toggle-item__content-rich w-richtext"><p>We source directly from leading approved manufacturers to minimize third-party risks. All waterpeco-friendly products membranes and eco-friendly product materials are backed by warranties of up to 10 years, ensuring long-term durability.</p></div></div></div></div><div class="w-dyn-item" role="listitem"><div class="toggle-item"><button class="toggle-item__header" data-toggle-header=""><h3 class="h4 margin-none">What is your typical project execution process?</h3><div class="toggle-item__header-icon w-embed" data-toggle-icon=""><svg fill="none" height="100%" viewbox="0 0 16 16" width="100%" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 0H8.5V16H7.5V0Z" fill="black"></path>
<path d="M16 7.5V8.5L0 8.5L4.3714e-08 7.5L16 7.5Z" fill="black"></path>
</svg></div></button><div class="toggle-item__content"><div class="toggle-item__content-rich w-richtext"><p>We begin with a free site diagnostics inspection using thermal imaging. We then provide a turnkey design-and-build proposal, execute construction under strict BCA guidelines, and deliver post-construction warranty support.</p></div></div></div></div><div class="w-dyn-item" role="listitem"><div class="toggle-item"><button class="toggle-item__header" data-toggle-header=""><h3 class="h4 margin-none">Can you handle emergency repair or leak responses?</h3><div class="toggle-item__header-icon w-embed" data-toggle-icon=""><svg fill="none" height="100%" viewbox="0 0 16 16" width="100%" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 0H8.5V16H7.5V0Z" fill="black"></path>
<path d="M16 7.5V8.5L0 8.5L4.3714e-08 7.5L16 7.5Z" fill="black"></path>
</svg></div></button><div class="toggle-item__content"><div class="toggle-item__content-rich w-richtext"><p>Yes. We run a 24-Hour Rapid Response emergency helpline for active eco-friendly products leaks, pipe bursts, and water ingress issues, prioritizing island-wide dispatch across Singapore.</p></div></div></div></div><div class="w-dyn-item" role="listitem"><div class="toggle-item"><button class="toggle-item__header" data-toggle-header=""><h3 class="h4 margin-none">How do you collaborate with our existing subcontractors?</h3><div class="toggle-item__header-icon w-embed" data-toggle-icon=""><svg fill="none" height="100%" viewbox="0 0 16 16" width="100%" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 0H8.5V16H7.5V0Z" fill="black"></path>
<path d="M16 7.5V8.5L0 8.5L4.3714e-08 7.5L16 7.5Z" fill="black"></path>
</svg></div></button><div class="toggle-item__content"><div class="toggle-item__content-rich w-richtext"><p>We coordinate directly with your facilities management or on-site installers. Working as a single turnkey team, we ensure product integrations align with building designs and utility setups seamlessly.</p></div></div></div></div></div></div></div></div></div></section></main><footer class="footer__wrapper"><section class="footer__topper"><div class="w-layout-blockcontainer container w-container"><div class="col__1"><div class="col"><div class="z-1"><div class="center-content"><div class="max__500"><div class="mb__l"><h3 class="h3 is__bigger">Built on Trust.<br/>Proven by Results.</h3></div><a class="button w-inline-block" href="/shop"><div>Shop Now</div></a><div class="cta-people"><img alt="Thulira team consulting during a site inspection." loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="opacity__65">Get in touch today</div></div></div></div></div><img alt="Thulira project work" class="cta-image is__1" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><img alt="Thulira project work" class="cta-image is__2" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><img alt="Thulira project work" class="cta-image is__3" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div></div></section><section class="section is__dark v__footer"><div class="z-1"><div class="w-layout-blockcontainer container w-container"><div class="row"><div class="col__footer"><div class="col" id="w-node-_59d0562d-fb65-eaa0-fc67-8e3d4af3a4e3-4af3a4d1"><p class="h4">Sustainable biocomposite home products including bottles and drinkware.</p><p class="mb__m">Ethically sourced, highly durable, and 100% food-safe sustainable alternatives.</p><a class="button w-inline-block" href="/shop"><div>Shop Now</div></a></div><nav class="col"><div class="footer__text is__heading">Menu</div><ul class="w-list-unstyled" role="list"><li><a class="footer__text" href="/">Home</a></li><li><a class="footer__text" href="/about">About Us</a></li><li><a class="footer__text" href="/shop">Shop</a></li><li><a aria-current="page" class="footer__text w--current" href="/blog">Blog</a></li></ul></nav><nav class="col"><div class="footer__text is__heading">Contact</div><ul class="w-list-unstyled" role="list"><li><a class="footer__text" href="mailto:info@thulira.com">info@thulira.com</a></li><li><a class="footer__text" href="tel:+6582355452">+65 8235 5452</a></li><li><a class="footer__text" href="https://wa.me/6582355452" target="_blank">WhatsApp</a></li><li><div class="footer__text">Sustainable Materials</div></li><li><div class="footer__text">100% Food Safe</div></li><li><div class="footer__text">Island-wide Delivery</div></li></ul></nav></div><div class="col__1"><div class="col"><div class="w-embed"><div class="footer__logo-text-wrap" style="width: 100%; display: flex; justify-content: center; align-items: center; padding: 2rem 0; box-sizing: border-box;"><h2 style="font-family: 'Inter', sans-serif; font-size: calc(2rem + 3.5vw); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.06); text-align: center; margin: 0; line-height: 0.9; user-select: none;">Thulira</h2></div></div></div><div class="col__1"><div class="col"><div class="imprint__wrapper"><a class="imprint__text" href="https://www.overflow.nl">By Overflow</a></div></div></div></div></div></div><div class="footer__deco v-footer w-embed"><svg fill="none" height="100%" viewbox="0 0 151 850" width="100%" xmlns="http://www.w3.org/2000/svg">
<path d="M0 -26H6.56522L6.56522 851H0L0 -26Z" fill="url(#paint0_linear_2462_171)"></path>
<path d="M19.6957 -26H32.8261L32.8261 851H19.6957L19.6957 -26Z" fill="url(#paint1_linear_2462_171)"></path>
<path d="M45.9565 -26H65.6522L65.6522 851H45.9565L45.9565 -26Z" fill="url(#paint2_linear_2462_171)"></path>
<path d="M78.7826 -26L105.043 -26L105.043 851H78.7826L78.7826 -26Z" fill="url(#paint3_linear_2462_171)"></path>
<path d="M118.174 -26L151 -26L151 851H118.174L118.174 -26Z" fill="url(#paint4_linear_2462_171)"></path>
<defs>
<lineargradient gradientunits="userSpaceOnUse" id="paint0_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint1_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint2_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint3_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint4_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
</defs>
</svg></div></div></section></footer></div><script crossorigin="anonymous" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=6978c74eb7a56e10b85274cb" type="text/javascript"></script><script crossorigin="anonymous" integrity="sha384-eLhtiOwpAcsrjTU3szoidTK2FT4sgwN998/lRT314vxiyUJEzKSwZ02q/f+3Y8k8" src="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/js/webflow.schunk.05ab46bf443beb37.js" type="text/javascript"></script><script crossorigin="anonymous" integrity="sha384-EVx92WuQb9mkhZNxF68hHdqG3YKkx56dL/nD5M2q9oiJEb7dNT9DlzNekRovfOhz" src="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/js/webflow.5546c6e4.499238e9946a7c5f.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/gsap.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/ScrollTrigger.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/Observer.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/Draggable.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/SplitText.min.js" type="text/javascript"></script><script type="text/javascript">gsap.registerPlugin(ScrollTrigger,Observer,Draggable,SplitText);</script><script src="https://unpkg.com/lenis@1.3.17/dist/lenis.min.js"></script>
<script>
  
const lenis = new Lenis();

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000); // Convert time from seconds to milliseconds
});

gsap.ticker.lagSmoothing(0);

  
</script></body></html>
```

---

## src/pages/checkout.html

```html
<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Checkout | Thulira</title>
<meta content="Checkout your sustainable home products with Thulira." name="description"/>
<meta content="width=device-width, initial-scale=1" name="viewport"/>
<link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.shared.e97910e78.min.css" integrity="sha384-6XkQ54zt5ZhQdYI3Cx7JctA/Nr8ro5njqFDfYJJIYwhTuj2/ibnU3ZsiTqnERiYm" rel="stylesheet" type="text/css"/>
<link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.69c3b278cebe0890cc1deff6.279609e48.opt.min.css" integrity="sha384-J5YJ5IODQP3dWDCguNMeegsI+pxEg3y/1oh76z8WYZOLOF8Mz4zlr2auNzYvFebx" rel="stylesheet" type="text/css"/>
<link href="ecommerce.css?v=999?v=999" rel="stylesheet"/>
<script type="text/javascript">
    !function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);
  </script>
<link href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/6997158e5fac364205ad5ab5_Favicon.png" rel="shortcut icon" type="image/x-icon"/>
<link href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/699715925c02a742c5f3854f_Webclip.png" rel="apple-touch-icon"/>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script defer="" src="supabaseClient.js?v=2"></script>
<script defer="" src="cart.js?v=2"></script>

<style>
  /* Prevent Webflow scaling down interaction on the page content */
  .page__wrapper,
  .main__wrapper,
  main,
  body {
    transform: none !important;
    scale: none !important;
  }
</style>

</head>
<body>
<div class="page__wrapper">
<div class="nav__component" data-nav-element="">
<div class="nav__wrapper" data-nav-wrapper="">
<div class="nav__flex">
<div class="nav__left">
<a class="nav__link" href="/about">About Us</a>
<a class="nav__link" href="/blog">Blog</a>
</div>
<div class="nav__center">
<a class="nav__logo w-inline-block" href="/"><img src="/thulira-transparent.png" alt="Thulira Logo" style="height: 32px; width: auto; display: block;" /></a>
</div>
<div class="nav__right">
<div data-hide-landscape="">
<a class="button w-inline-block" href="/shop"><div>Shop Now</div></a>
</div>

</div>
</div>
<div class="nav__menu-wrapper" data-menu-wrapper="">
<nav class="nav__menu-inner">
<ul class="w-list-unstyled" role="list">
<li><a class="nav__menu-link" href="/">Home</a></li>
<li><a class="nav__menu-link" href="/shop">Shop</a></li>
<li><a class="nav__menu-link" href="/blog">Blog</a></li>
<li><a class="nav__menu-link" href="/about">About Us</a></li>

</ul>
</nav>
</div>
</div>
</div>
<main class="checkout-page-wrapper">
<div class="checkout-grid" id="checkoutContent">
<div class="checkout-panel">
<h2>Shipping Information</h2>
<form class="checkout-form" id="checkoutForm">
<div class="form-row two-cols">
<div class="form-group">
<label for="fullName">Full Name</label>
<input class="form-input" id="fullName" placeholder="First and Last Name" required="" type="text"/>
</div>
</div>
<div class="form-row two-cols">
<div class="form-group">
<label for="phoneNum">Phone Number (Singapore)</label>
<input class="form-input" id="phoneNum" pattern="^[+]*[0-9]{8,15}$" required="" type="tel"/>
</div>
<div class="form-group">
<label for="projectAddress">Shipping Address</label>
<input class="form-input" id="projectAddress" required="" type="text"/>
</div>
</div>
<button class="place-order-btn" id="placeOrderBtn" type="submit">
<span>Place COD Order</span>
</button>
</form>
</div>
<div class="checkout-panel" style="height: fit-content;">
<h2>Order Summary</h2>
<div id="checkoutSummaryItems">
</div>
<div class="order-summary-totals">
<div class="order-summary-total-row">
<span>Subtotal</span>
<span id="summarySubtotal">$0.00</span>
</div>
<div class="order-summary-total-row grand-total">
<span>Total Due on Delivery</span>
<span id="summaryGrandTotal">$0.00</span>
</div>
</div>
</div>
</div>
<div class="no-orders-box" id="emptyCheckoutBox" style="display: none; max-width: 600px; margin: 0 auto;">
<svg fill="none" height="48" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewbox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
<circle cx="9" cy="21" r="1"></circle>
<circle cx="20" cy="21" r="1"></circle>
<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
</svg>
<h2 style="color: white; margin: 0;">Your Cart is Empty</h2>
<p>Please add some sustainable products to your cart before checking out.</p>
<a class="button-link primary" href="/">Return to Home</a>
</div>
</main>
</div>
<script>
    document.addEventListener('DOMContentLoaded', () => {
      function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function renderCheckoutSummary() {
        const cartItems = JSON.parse(localStorage.getItem('thulira_cart')) || [];
        const contentDiv = document.getElementById('checkoutContent');
        const emptyDiv = document.getElementById('emptyCheckoutBox');
        
        if (cartItems.length === 0) {
          contentDiv.style.display = 'none';
          emptyDiv.style.display = 'flex';
          return;
        }

        const itemsList = document.getElementById('checkoutSummaryItems');
        let html = '';
        let subtotal = 0;
        
        cartItems.forEach(item => {
          subtotal += item.price * item.quantity;
          html += `
            <div class="order-summary-item">
              <div>
                <span class="order-summary-item-name">${escapeHTML(item.title)} <span class="cart-item-size-badge">${escapeHTML(item.variant)}</span></span>
                <span class="order-summary-item-qty">x${item.quantity}</span>
              </div>
              <span class="order-summary-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `;
        });
        
        itemsList.innerHTML = html;
        
        document.getElementById('summarySubtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('summaryGrandTotal').textContent = `$${subtotal.toFixed(2)}`;
      }

      let currentUser = null;
      
      async function enforceAuth() {
        if (!window.initSupabase) return;
        await window.initSupabase();
        
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
          if (window.openAuthModal) {
            window.openAuthModal();
          } else {
            alert('Please sign in to place an order.');
          }
        } else {
          currentUser = user;
          const phoneInput = document.getElementById('phoneNum');
          if (phoneInput) {
            phoneInput.value = user.phone;
            phoneInput.readOnly = true;
            phoneInput.style.opacity = '0.7';
            phoneInput.title = 'Phone number is locked to your verified account';
          }
        }
        
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
            currentUser = session.user;
            const phoneInput = document.getElementById('phoneNum');
            if (phoneInput) {
              phoneInput.value = session.user.phone;
              phoneInput.readOnly = true;
              phoneInput.style.opacity = '0.7';
            }
          } else {
            currentUser = null;
            if (window.openAuthModal) window.openAuthModal();
          }
        });
      }

      enforceAuth();

      renderCheckoutSummary();

      const checkoutForm = document.getElementById('checkoutForm');
      checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
          if (window.openAuthModal) window.openAuthModal();
          return;
        }

        const cartItems = JSON.parse(localStorage.getItem('thulira_cart')) || [];
        if (cartItems.length === 0) return;

        const placeBtn = document.getElementById('placeOrderBtn');
        placeBtn.disabled = true;
        placeBtn.innerHTML = `<span class="spinner"></span> <span>Placing Order...</span>`;

        const name = document.getElementById('fullName').value;
        const phone = document.getElementById('phoneNum').value;
        const address = document.getElementById('projectAddress').value;
        
        const itemsPayload = cartItems.map(item => ({
          product_id: item.id,
          product_title: item.title,
          color: item.color || null,
          size: item.variant || null,
          quantity: item.quantity,
          unit_price: item.price
        }));

        const { data: orderId, error } = await window.supabaseClient.rpc('create_order_with_items', {
          p_customer_name: name,
          p_customer_phone: phone,
          p_shipping_address: address,
          p_items: itemsPayload
        });

        if (error) {
          alert('Failed to place order: ' + error.message);
          placeBtn.disabled = false;
          placeBtn.innerHTML = `<span>Place COD Order</span>`;
        } else {
          localStorage.removeItem('thulira_cart');
          window.location.href = `order-success.html?orderId=${orderId}`;
        }
      });
    });
  </script>
</body>
</html>

```

---

## src/pages/index.html

```html
<!DOCTYPE html>

<!-- This site was created in Webflow. https://webflow.com --><!-- Last Published: Thu May 28 2026 11:30:34 GMT+0000 (Coordinated Universal Time) --><html data-wf-domain="www.thulira.com" data-wf-page="69a0ae9db5557b1569691dde" data-wf-site="6978c74eb7a56e10b85274cb" lang="en"><head><meta charset="utf-8"/><link crossorigin="anonymous" href="https://cdn.prod.website-files.com" rel="preconnect"/><title>Sustainable Home Essentials | Thulira</title><meta content="Thulira is a Sustainable bottles and drinkware made from rice husk, coffee husk, and bamboo waste." name="description"/><meta content="Class I Registered Eco-friendly Store Singapore | Thulira" property="og:title"/><meta content="Thulira is a Sustainable bottles and drinkware made from rice husk, coffee husk, and bamboo waste." property="og:description"/><meta content="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/6a0420ffaf0e855ffd198ae3_Modus%20Open%20Graph.jpg" property="og:image"/><meta content="Class I Registered Eco-friendly Store Singapore | Thulira" name="twitter:title"/><meta content="Thulira is a Sustainable bottles and drinkware made from rice husk, coffee husk, and bamboo waste." name="twitter:description"/><meta content="website" property="og:type"/><meta content="summary_large_image" name="twitter:card"/><meta content="width=device-width, initial-scale=1" name="viewport"/><meta content="Webflow" name="generator"/><link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.shared.e97910e78.min.css" integrity="sha384-6XkQ54zt5ZhQdYI3Cx7JctA/Nr8ro5njqFDfYJJIYwhTuj2/ibnU3ZsiTqnERiYm" rel="stylesheet" type="text/css"/><link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.69a0ae9db5557b1569691dde.1a2776aa3.opt.min.css" integrity="sha384-Gid2qjtFmXnjJIwkWfTAhB3OTwF02B5dXsu2M8SedHHfLMyBpXC00OwPcxNSwLOA" rel="stylesheet" type="text/css"/><style>html.w-mod-js:not(.w-mod-ix3) :is([data-popup-overlay], [data-popup-content], button[data-popup-close], [data-floatcard-1], [data-floatcard-2], [data-floatcard-3], :not([data-no-anim]) :is(.h1, .h2, .h3, .h4, .h5, .h6):not([data-no-anim]), .floating-content__text, [data-toggle-icon], .vertical-dash, [data-menu-wrapper], [data-menu-wrapper] li, [data-menu-icon-open], [data-menu-icon-close], section:first-child, .nav__component, .service-item__popup__slider-flex, :not([data-no-anim]) :is(p):not([data-no-anim]), .home-hero__wrapper .h1, .home-hero__wrapper p, .divider, .home-hero__wrapper .icon__24) {visibility: hidden !important;}</style><script type="text/javascript">!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);</script><link href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/6997158e5fac364205ad5ab5_Favicon.png" rel="shortcut icon" type="image/x-icon"/><link href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/699715925c02a742c5f3854f_Webclip.png" rel="apple-touch-icon"/><link href="/" rel="canonical"/><script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "100% Food Safe Eco-friendly Store Singapore | Thulira",
  "url": "/",
  "inLanguage": "en",
  "description": "Thulira is a Sustainable bottles and drinkware made from rice husk, coffee husk, and bamboo waste.",
  "about": {
    "@type": "Organization",
    "name": "Thulira",
    "description": "100% Food Safe Eco-friendly Store in Singapore, operating since 2004 with 20+ years of experience and over 500 completed projects.",
    "email": "info@thulira.com",
    "telephone": "+65 8235 5452",
    "sameAs": [
      "https://wa.me/6582355452"
    ],
    "areaServed": "SG",
    "serviceType": [
      "eco-friendly product & Waterpeco-friendly products",
      "Painting & Renovation",
      "Ceiling Repair & Spalling Concrete",
      "Injection Grouting & Demolition"
    ]
  },
  "mainEntity": {
    "@type": "Service",
    "name": "eco-friendly retail, eco-friendly products & Waterpeco-friendly products",
    "description": "Singapore eco-friendly retail services, island-wide coverage, up to 10-year warranty, 24-hour rapid emergency response.",
    "provider": {
      "@type": "Organization",
      "name": "Thulira"
    },
    "serviceType": "Eco-friendly Store",
    "areaServed": {
      "@type": "Country",
      "name": "Singapore"
    }
  }
}
</script><link href="https://unpkg.com/lenis@1.3.17/dist/lenis.css" rel="stylesheet"/>
<script async="" src="https://plausible.io/js/pa-Sqg6vyhtWsckPaZZKPPpJ.js"></script>
<script>
  window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
  plausible.init()
</script>
<!-- Leadinfo tracking code -->
<script>
(function(l,e,a,d,i,n,f,o){if(!l[i]){l.GlobalLeadinfoNamespace=l.GlobalLeadinfoNamespace||[];
l.GlobalLeadinfoNamespace.push(i);l[i]=function(){(l[i].q=l[i].q||[]).push(arguments)};l[i].t=l[i].t||n;
l[i].q=l[i].q||[];o=e.createElement(a);f=e.getElementsByTagName(a)[0];o.async=1;o.src=d;f.parentNode.insertBefore(o,f);}
}(window,document,'script','https://cdn.leadinfo.net/ping.js','leadinfo','LI-69E624F75B59D'));
</script><link href="ecommerce.css?v=999?v=999" rel="stylesheet"/><script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script defer="" src="supabaseClient.js?v=2"></script>
<script defer="" src="cart.js?v=2"></script>
<style>
  /* Prevent Webflow scaling down interaction on the page content */
  .page__wrapper,
  .main__wrapper,
  main,
  body {
    transform: none !important;
    scale: none !important;
  }
</style>

</head><body><div class="page__wrapper"><div class="nav__component" data-nav-element=""><div class="nav__wrapper" data-nav-wrapper=""><div class="nav__flex"><div class="nav__left" style="display:flex; align-items:center;"><button class="nav__toggle" data-menu-toggle-button=""><div class="icon__24 w-embed" data-menu-icon-open=""><svg aria-hidden="true" class="iconify iconify--tabler" height="24" preserveaspectratio="xMidYMid meet" role="img" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg></div><div class="icon__24 w-embed" data-menu-icon-close=""><svg aria-hidden="true" class="iconify iconify--ic" height="24" preserveaspectratio="xMidYMid meet" role="img" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z" fill="currentColor"></path></svg></div></button></div><div class="nav__center"><a aria-current="page" class="nav__logo w-inline-block w--current" href="/"><img src="/thulira-transparent.png" alt="Thulira Logo" style="height: 32px; width: auto; display: block;" /></a></div><div class="nav__right"><div data-hide-landscape=""><a class="button w-inline-block" href="/shop"><div>Shop Now</div></a></div></div></div><div class="nav__menu-wrapper" data-menu-wrapper=""><nav class="nav__menu-inner"><ul class="w-list-unstyled" role="list"><li><a aria-current="page" class="nav__menu-link w--current" href="/">Home</a></li><li><a class="nav__menu-link" href="/shop">Shop</a></li><li><a class="nav__menu-link" href="/blog">Blog</a></li><li><a class="nav__menu-link" href="/about">About Us</a></li></ul></nav></div></div><div class="w-embed"><style>

  [data-z-one] {
    z-index: 5;
    position: relative;
  }

  [data-margin-none] {
    margin: 0px !important;
  }

:root {

-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;

}

  .logo-marquee__image {
    -webkit-user-drag: none;
  }


  p:last-child {
    margin-bottom: 0px !important;
  }

  .h1:first-child, .h2:first-child, .h3:first-child, .h4:first-child, .h5:first-child {
    margin-top: 0px !important;
  }

  [data-height-full] {
    height: 100%;
  }

  .h1:last-child,
  .h2:last-child,
  .h3:last-child,
  .h4:last-child,
  .h5:last-child,
  .h6:last-child,
  h1:last-child,
  h2:last-child,
  h3:last-child,
  h4:last-child,
  h5:last-child,
  h6:last-child {
    margin-bottom: 0 !important;
  }

  @media (max-width: 992px) {
  [data-hide-landscape] {
    display: none !important;
  }
}

</style></div><div class="w-condition-invisible w-embed w-script"><script>
  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('[data-nav-wrapper]');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      let bc = nav.style.borderColor;
      if (window.scrollY > 40) {
        nav.style.maxWidth = '1200px';
        nav.style.borderColor = bc;
      } else {
        nav.style.maxWidth = '';
        nav.style.borderColor = '';
      }
    });

    setTimeout(() => {
      window.scrollBy(0, 3);

      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        window.scrollBy(0, -3);
      });
    }, 250);
  });
</script></div></div><main><section class="home-hero__wrapper" data-no-anim="" data-scroll-end="bottom bottom" data-scroll-start="top top" data-sequence-wrap="" id="videoWrap"><div class="home-hero__video-wrapper"><div class="image-sequence__element" data-sequence-element=""><canvas class="image-sequence__canvas" data-desktop-src="https://cdn.overflow.nl/modus-sequence-v2/frame" data-digits="3" data-filetype="jpg" data-frames="121" data-index-start="0" data-mobile-src="https://cdn.overflow.nl/modus-sequence-v2/frame" data-sequence-canvas="" data-static-src="https://cdn.overflow.nl/modus-sequence-v2/frame000.jpg"></canvas></div></div><div class="home-hero__content"><div class="w-layout-blockcontainer container is__home-hero w-container"><div class="home-hero__content-inner"><h1 class="h1 is__home" data-no-anim="">Sustainable Home Essentials,<br/><span>Made from Crop-Waste.</span></h1><div class="home-hero__content-lower"><div class="mb__l"><div class="max__600"><p class="body__l" data-no-anim="">Bottles and drinkware made from rice husk, coffee husk, and bamboo waste — durable, non-toxic, and made in India.</p></div></div><div class="icon__24 w-embed"><svg fill="none" height="24" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M20 12L18.59 10.59L13 16.17V4H11V16.17L5.42 10.58L4 12L12 20L20 12Z" fill="white"></path>
</svg></div></div></div></div></div><div class="w-condition-invisible w-embed w-script"><script defer="">
function initImageSequenceScroll() {
  const wraps = document.querySelectorAll('[data-sequence-wrap]');
  
  wraps.forEach((wrap) => {
    // Prevent double-initializing
    if (wrap.dataset.sequenceInit === 'true') return;
    wrap.dataset.sequenceInit = 'true';

    const element = wrap.querySelector('[data-sequence-element]');
    const canvas = element && element.querySelector('[data-sequence-canvas]');
    if (!element || !canvas) return;
    
    // Data attributes and their fallbacks
    const frames = parseInt(canvas.dataset.frames, 10) || 1;
    const digits = parseInt(canvas.dataset.digits, 10) || 3;
    const indexStart = parseInt(canvas.dataset.indexStart, 10) || 0;
    const desktopSrc = canvas.dataset.desktopSrc || '';
    const mobileSrc = canvas.dataset.mobileSrc || desktopSrc;
    const staticSrc = canvas.dataset.staticSrc;
    const filetype = canvas.dataset.filetype || 'webp';
    const startTrigger = wrap.dataset.scrollStart || 'top top';
    const endTrigger = wrap.dataset.scrollEnd || 'bottom top';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const baseUrl = isMobile ? mobileSrc : desktopSrc;
    const lastIndex = indexStart + frames - 1;

    // Track last rendered scroll progress so we can redraw on resize
    let lastProgress = 0;

    // Canvas setup (size to the sticky element)
    const ctx = canvas.getContext('2d');
    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    }
    resizeCanvas();

    // Image cache and loading queue
    const loaded = new Map();
    const queue = [];
    let processingQueue = false;
    let resizeTimer;

    // Draw helper (canvas equivalent of object-fit: cover)
    function drawCover(img) {
      if (!img) return;
      resizeCanvas();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height);
      const x = (canvasWidth - img.width * scale) / 2;
      const y = (canvasHeight - img.height * scale) / 2;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    }

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeCanvas();
        if (loaded.size) render(lastProgress);
        ScrollTrigger.refresh();
      }, 200);
    });

    function pad(num) {
      return String(num).padStart(digits, '0');
    }
    
    function getUrl(i) {
      return `${baseUrl}${pad(i)}.${filetype}`;
    }
    
    function loadFrame(i, onDone) {
      if (loaded.has(i) || i < indexStart || i > lastIndex) return;
      const img = new Image();
      img.src = getUrl(i);

      img.onload = () => {
        loaded.set(i, img);
        if (typeof onDone === 'function') onDone();
      };

      // Log when a frame is missing or fails to load
      img.onerror = () => {
        console.warn('[ImageSequence] Failed to load frame', {
          index: i,
          url,
          wrap: wrap
        });
      };
    }

    // Daybreak-style progressive loader (binary midpoint / "wave" fill)
    function processQueue() {
      if (processingQueue) return;
      const next = queue.shift();
      if (!next) return;
      processingQueue = true;
      const [a, b] = next;
      if (b - a <= 1) {
        processingQueue = false;
        processQueue();
        return;
      }
      const m = Math.floor((a + b) / 2);
      loadFrame(m, () => {
        queue.push([a, m], [m, b]);
        processingQueue = false;
        setTimeout(processQueue, 0);
      });
    }
    
    function startLoading() {
      loadFrame(indexStart, () => {
        drawImageAt(indexStart); // Show the first frame right away
        loadFrame(lastIndex); // Preload the last frame
        queue.push([indexStart, lastIndex]);
        processQueue();
        ScrollTrigger.refresh();
      });
    }
    
    function findNearestLoaded(i) {
      for (let r = 1; r <= 10; r++) {
        if (loaded.has(i - r)) return i - r;
        if (loaded.has(i + r)) return i + r;
      }

      const keys = Array.from(loaded.keys());
      if (keys.length === 0) return null;
      let nearest = keys[0];
      let minDiff = Math.abs(i - nearest);
      for (const k of keys) {
        const diff = Math.abs(i - k);
        if (diff < minDiff) {
          nearest = k;
          minDiff = diff;
        }
      }
      return nearest;
    }
    
    function drawImageAt(i) {
      const img = loaded.get(i);
      if (!img) return;
      drawCover(img);
    }
    
    function render(progress) {
      const relative = progress * (frames - 1);
      const index = indexStart + Math.round(relative);
      if (loaded.has(index)) {
        drawImageAt(index);
      } else {
        const nearest = findNearestLoaded(index);
        if (nearest !== null) drawImageAt(nearest);
      }
    }

    // Reduced motion: draw a single static image (or first frame fallback)
    if (reduceMotion) {
      if (staticSrc) {
        const staticImage = new Image();
        staticImage.src = staticSrc;
        staticImage.onload = () => {
          drawCover(staticImage);
        };
        staticImage.onerror = () => {};
        return;
      }
      loadFrame(indexStart, () => {
        drawImageAt(indexStart);
      });
      return;
    }
    
    // Begin loading frames in the background
    startLoading();
    
    // Set up ScrollTrigger
    const st = ScrollTrigger.create({
      trigger: wrap,
      start: startTrigger,
      end: endTrigger,
      scrub: true,
      onUpdate: (self) => {
        lastProgress = self.progress;
        render(self.progress);
      }
    });

    // Draw once immediately
    lastProgress = st.progress || 0;
    render(lastProgress);

  });
}

// Init Image Sequence on Scroll
document.addEventListener("DOMContentLoaded", () => {
  initImageSequenceScroll();
});
</script></div></section>
<style>
@media (max-width: 991px) {
  .col__3 {
    grid-template-columns: 1fr !important;
  }
}
</style>
<section class="section is__nopadding"><div class="w-layout-blockcontainer container w-container"><div class="row"><div class="col__1"><div class="col"><div class="image-trail__content"><div class="rotating-image-trail" data-trail-area=""><div class="rotating-image-trail__collection w-dyn-list" data-trail-collection=""><div class="rotating-image-trail__list w-dyn-items" role="list"><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 1" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image1.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 2" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image2.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 3" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image3.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 4" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image4.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 5" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image5.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 6" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image6.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 7" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image7.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 8" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image8.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 9" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image9.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 10" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image10.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 11" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image11.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 12" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image12.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 13" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image13.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 14" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image14.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 15" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image15.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 16" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image16.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 17" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image17.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 18" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image18.jpeg"/></div></div><div class="w-dyn-item" data-trail-item="" role="listitem"><div class="rotating-image-trail__card"><img alt="Thulira project gallery 19" class="rotating-image-trail__card-img" loading="eager" src="/gallery/image19.jpeg"/></div></div></div></div></div><div class="hide w-embed w-script"><script defer="">

function initRotatingImageTrail() {
  var area = document.querySelector("[data-trail-area]");
  if (!area) return;

  var collection = area.querySelector("[data-trail-collection]");
  if (!collection) return;

  var items = collection.querySelectorAll("[data-trail-item]");
  if (!items.length) return;

  // Distance logic
  var index = 0;
  var lastCloneX = null;
  var lastCloneY = null;

  var cardWidth = items[0].getBoundingClientRect().width;
  var stepDistance = cardWidth * 0.5;

  function spawnTrailItem(x, y) {
    var original = items[index];
    var clone = original.cloneNode(true);

    clone.style.left = x + "px";
    clone.style.top = y + "px";

    clone.setAttribute("data-trail-item", "hidden");

    area.appendChild(clone);

    void clone.getBoundingClientRect();

    clone.setAttribute("data-trail-item", "visible");

    setTimeout(function () {
      clone.setAttribute("data-trail-item", "transition-out");
    }, 400);

    setTimeout(function () {
      clone.remove();
    }, 1200);

    index = (index + 1) % items.length;
    lastCloneX = x;
    lastCloneY = y;
  }

  // Mouse movement logic
  area.addEventListener("mousemove", function (event) {
    var rect = area.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      lastCloneX = null;
      lastCloneY = null;
      return;
    }

    if (lastCloneX === null || lastCloneY === null) {
      spawnTrailItem(x, y);
      return;
    }

    var dx = x - lastCloneX;
    var dy = y - lastCloneY;
    var distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= stepDistance) {
      spawnTrailItem(x, y);
    }
  });
}

// Initialize Rotating Image Trail
document.addEventListener("DOMContentLoaded", function () {
  initRotatingImageTrail();
});

</script></div><div class="w-embed"><style>

[data-trail-item="hidden"] {
  transform: translate(-50%, -50%) scale(0) rotate(-10deg);
  position: absolute;
}

[data-trail-item="visible"] {
  transform: translate(-50%, -50%) scale(1) rotate(0.001deg);
  transition: transform 0.4s cubic-bezier(0.625, 0.05, 0, 1);
  position: absolute;
}

[data-trail-item="transition-out"] {
  transform: translate(-50%, -50%) scale(0) rotate(20deg);
  transition: transform 0.8s cubic-bezier(0.625, 0, 0.875, 0);
  position: absolute;
}

</style></div></div><div class="image-trail__content-inner" style="text-align: center; display: flex; flex-direction: column; align-items: center;"><h2 class="h2" style="text-align: center;">Made from what would\'ve been waste.</h2><div class="max__600" style="margin: 0 auto; text-align: center;"><p class="body__l" style="margin-bottom: 1rem;"><strong>Rice Husk</strong> — agricultural waste turned into sturdy, food-safe bowls, plates, and water bottles.</p><p class="body__l" style="margin-bottom: 1rem;"><strong>Coffee Husk</strong> — repurposed from your morning brew, turned into durable cups and mugs that keep the aroma alive.</p><p class="body__l"><strong>Bamboo</strong> — fast-growing and sustainable, used to create beautiful home accessories that replace plastic.</p></div><div class="touch-hint" style="margin: 2rem auto 0; justify-content: center;"><div class="icon__24 w-embed"><svg aria-hidden="true" class="iconify iconify--ic" height="24" preserveaspectratio="xMidYMid meet" role="img" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="m18.19 12.44l-3.24-1.62c1.29-1 2.12-2.56 2.12-4.32c0-3.03-2.47-5.5-5.5-5.5s-5.5 2.47-5.5 5.5c0 2.13 1.22 3.98 3 4.89v3.26c-2.15-.46-2.02-.44-2.26-.44c-.53 0-1.03.21-1.41.59L4 16.22l5.09 5.09c.43.44 1.03.69 1.65.69h6.3c.98 0 1.81-.7 1.97-1.67l.8-4.71c.22-1.3-.43-2.58-1.62-3.18m-.35 2.85l-.8 4.71h-6.3c-.09 0-.17-.04-.24-.1l-3.68-3.68l4.25.89V6.5c0-.28.22-.5.5-.5s.5.22.5.5v6h1.76l3.46 1.73c.4.2.62.63.55 1.06M8.07 6.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5c0 .95-.38 1.81-1 2.44V6.5a2.5 2.5 0 0 0-5 0v2.44c-.62-.63-1-1.49-1-2.44" fill="currentColor"></path></svg></div><div>Explore our materials</div></div></div></div></div></div></div></div></section><section class="section is__dark"><div class="z-1"><div class="w-layout-blockcontainer container w-container"><div class="col__2"><div class="col"><h2 class="h2">Featured Categories</h2><p class="max__400">Discover everyday products made from renewable crop waste. Durable, beautiful, and earth-friendly.</p><div class="w-embed"><style>

.service-item__button:hover .service-item__button-icon {
	background-color: var(--_colors---orange);
}

</style></div></div><div class="col"><div role="list"><div class="service-item__wrapper" data-wf--pop-out-element--variant="base"><a href="/shop#bottles" class="service-item__button" style="text-decoration: none; color: white;"><img alt="eco-friendly products works by Thulira" class="service-item__button-image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><h3 class="h3 is-service-item">Bottles</h3><div class="service-item__button-icon w-embed"><svg fill="none" height="100%" viewbox="0 0 40 40" width="100%" xmlns="http://www.w3.org/2000/svg">
<path d="M0 20C0 8.95431 8.95431 0 20 0C31.0457 0 40 8.95431 40 20C40 31.0457 31.0457 40 20 40C8.95431 40 0 31.0457 0 20Z" fill="white" fill-opacity="0.12"></path>
<path d="M23.17 19H13V21H23.17L19.59 24.59L21 26L28 19L21 12L19.59 13.41L23.17 19Z" fill="white"></path>
</svg></div></a><div class="service-item__popup-wrapper" data-popup-wrapper=""><div class="service-item__popup-overlay" data-popup-close="" data-popup-overlay=""></div><button class="service-item__popup-close" data-popup-close=""><div class="icon__16 w-embed"><svg fill="none" height="16" viewbox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
<path d="M12.6673 4.27337L11.7273 3.33337L8.00065 7.06004L4.27398 3.33337L3.33398 4.27337L7.06065 8.00004L3.33398 11.7267L4.27398 12.6667L8.00065 8.94004L11.7273 12.6667L12.6673 11.7267L8.94065 8.00004L12.6673 4.27337Z" fill="black"></path>
</svg></div></button><div class="service-item__popup-content" data-popup-content=""><div class="service-item__popup__slider-wrapper"><div class="service-item__popup__slider-flex"><img alt="eco-friendly products work details" class="service-item__popup__slider-image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><img alt="eco-friendly products work details" class="service-item__popup__slider-image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><img alt="eco-friendly products work details" class="service-item__popup__slider-image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div><div class="service-item__popup__slider-flex"><img alt="eco-friendly products work details" class="service-item__popup__slider-image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><img alt="eco-friendly products work details" class="service-item__popup__slider-image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><img alt="eco-friendly products work details" class="service-item__popup__slider-image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div><div class="service-item__popup-content__inner"><h4 class="h3" data-no-anim="">Bottles</h4><p class="mb__l" data-no-anim="">Eco-friendly bottles for your daily hydration.</p><div class="popup-price-tag">$450.00</div>
<div class="size-selector-group">
<button class="size-btn" data-size="S">S</button>
<button class="size-btn active" data-size="M">M</button>
<button class="size-btn" data-size="L">L</button>
<button class="size-btn" data-size="XL">XL</button>
</div>
<button class="add-to-cart-popup-btn" data-product-id="eco-friendly products">Book Service Package</button></div></div></div></div><div class="service-item__wrapper" data-wf--pop-out-element--variant="base"><a href="/shop#drinkware" class="service-item__button" style="text-decoration: none; color: white;"><img alt="Waterpeco-friendly products works by Thulira" class="service-item__button-image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><h3 class="h3 is-service-item">Drinkware</h3><div class="service-item__button-icon w-embed"><svg fill="none" height="100%" viewbox="0 0 40 40" width="100%" xmlns="http://www.w3.org/2000/svg">
<path d="M0 20C0 8.95431 8.95431 0 20 0C31.0457 0 40 8.95431 40 20C40 31.0457 31.0457 40 20 40C8.95431 40 0 31.0457 0 20Z" fill="white" fill-opacity="0.12"></path>
<path d="M23.17 19H13V21H23.17L19.59 24.59L21 26L28 19L21 12L19.59 13.41L23.17 19Z" fill="white"></path>
</svg></div></a><div class="service-item__popup-wrapper" data-popup-wrapper=""><div class="service-item__popup-overlay" data-popup-close="" data-popup-overlay=""></div><button class="service-item__popup-close" data-popup-close=""><div class="icon__16 w-embed"><svg fill="none" height="16" viewbox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
<path d="M12.6673 4.27337L11.7273 3.33337L8.00065 7.06004L4.27398 3.33337L3.33398 4.27337L7.06065 8.00004L3.33398 11.7267L4.27398 12.6667L8.00065 8.94004L11.7273 12.6667L12.6673 11.7267L8.94065 8.00004L12.6673 4.27337Z" fill="black"></path>
</svg></div></button><div class="service-item__popup-content" data-popup-content=""><div class="service-item__popup__slider-wrapper"><div class="service-item__popup__slider-flex"><img alt="Waterpeco-friendly products work details" class="service-item__popup__slider-image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><img alt="Waterpeco-friendly products work details" class="service-item__popup__slider-image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><img alt="Waterpeco-friendly products work details" class="service-item__popup__slider-image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div><div class="service-item__popup__slider-flex"><img alt="Waterpeco-friendly products work details" class="service-item__popup__slider-image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><img alt="Waterpeco-friendly products work details" class="service-item__popup__slider-image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><img alt="Waterpeco-friendly products work details" class="service-item__popup__slider-image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div><div class="service-item__popup-content__inner"><h4 class="h3" data-no-anim="">Drinkware</h4><p class="mb__l" data-no-anim="">Reusable cups, mugs, and bottles made from coffee husk and bamboo. Keep your drinks fresh and sustainable.</p><div class="popup-price-tag">$350.00</div>
<div class="size-selector-group">
<button class="size-btn" data-size="S">S</button>
<button class="size-btn active" data-size="M">M</button>
<button class="size-btn" data-size="L">L</button>
<button class="size-btn" data-size="XL">XL</button>
</div>
<button class="add-to-cart-popup-btn" data-product-id="waterpeco-friendly products">Book Service Package</button></div></div></div></div>
<path d="M151 908L144.435 908L144.435 -5.7395e-07L151 0L151 908Z" fill="url(#paint0_linear_2353_199)"></path>
<path d="M131.304 908L118.174 908L118.174 -2.86975e-06L131.304 -1.72185e-06L131.304 908Z" fill="url(#paint1_linear_2353_199)"></path>
<path d="M105.043 908L85.3478 908L85.3479 -5.7395e-06L105.044 -4.01765e-06L105.043 908Z" fill="url(#paint2_linear_2353_199)"></path>
<path d="M72.2174 908L45.9565 908L45.9565 -9.1832e-06L72.2174 -6.8874e-06L72.2174 908Z" fill="url(#paint3_linear_2353_199)"></path>
<path d="M32.826 908L-7.62939e-05 908L3.08594e-06 -1.32008e-05L32.8261 -1.03311e-05L32.826 908Z" fill="url(#paint4_linear_2353_199)"></path>
<defs>
<lineargradient gradientunits="userSpaceOnUse" id="paint0_linear_2353_199" x1="75.5002" x2="75.5017" y1="-9.07266e-05" y2="908">
<stop offset="0.149038" stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint1_linear_2353_199" x1="75.5002" x2="75.5017" y1="-9.07266e-05" y2="908">
<stop offset="0.149038" stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint2_linear_2353_199" x1="75.5002" x2="75.5017" y1="-9.07266e-05" y2="908">
<stop offset="0.149038" stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint3_linear_2353_199" x1="75.5002" x2="75.5017" y1="-9.07266e-05" y2="908">
<stop offset="0.149038" stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint4_linear_2353_199" x1="75.5002" x2="75.5017" y1="-9.07266e-05" y2="908">
<stop offset="0.149038" stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
</defs>
</div></div></div></div></div></section><section class="section" data-floatcard-section="" data-wf--usp--variant="base"><div class="w-layout-blockcontainer container w-container"><div class="row"><div class="col__1"><div class="col"><div class="center-content"><div class="max__600"><h2 class="h2">Why it matters.</h2></div></div></div></div><div class="col__3"><div class="usp-card" data-floatcard-1=""><h3 class="h4">Plastic-free alternative</h3><p>Every product is designed to replace single-use and virgin plastics in your home. By choosing biocomposites, you are actively reducing the plastic burden on our planet.</p><div class="usp-card__no">01</div><div class="usp-card__graphic w-embed"><svg fill="none" height="100%" viewbox="0 0 437 263" width="100%" xmlns="http://www.w3.org/2000/svg">
<g opacity="0.5">
<path d="M0 0H1.45086V263H0V0Z" fill="url(#paint0_linear_2427_764)"></path>
<path d="M8.41501 0H11.3167V263H8.41501V0Z" fill="url(#paint1_linear_2427_764)"></path>
<path d="M18.2809 0H22.6335V263H18.2809V0Z" fill="url(#paint2_linear_2427_764)"></path>
<path d="M29.5976 0H35.4011V263H29.5976V0Z" fill="url(#paint3_linear_2427_764)"></path>
<path d="M42.3652 0H49.6195V263H42.3652V0Z" fill="url(#paint4_linear_2427_764)"></path>
<path d="M56.5837 0H65.2888V263H56.5837V0Z" fill="url(#paint5_linear_2427_764)"></path>
<path d="M72.253 0H82.409V263H72.253V0Z" fill="url(#paint6_linear_2427_764)"></path>
<path d="M89.3732 0H100.98V263H89.3732V0Z" fill="url(#paint7_linear_2427_764)"></path>
<path d="M107.944 0H121.002V263H107.944V0Z" fill="url(#paint8_linear_2427_764)"></path>
<path d="M127.966 0H142.475V263H127.966V0Z" fill="url(#paint9_linear_2427_764)"></path>
<path d="M149.439 0H165.398V263H149.439V0Z" fill="url(#paint10_linear_2427_764)"></path>
<path d="M172.363 0H189.773V263H172.363V0Z" fill="url(#paint11_linear_2427_764)"></path>
<path d="M196.737 0H215.598V263H196.737V0Z" fill="url(#paint12_linear_2427_764)"></path>
<path d="M222.562 0H242.874V263H222.562V0Z" fill="url(#paint13_linear_2427_764)"></path>
<path d="M249.839 0H271.602V263H249.839V0Z" fill="url(#paint14_linear_2427_764)"></path>
<path d="M278.566 0H301.78V263H278.566V0Z" fill="url(#paint15_linear_2427_764)"></path>
<path d="M308.744 0H333.408V263H308.744V0Z" fill="url(#paint16_linear_2427_764)"></path>
<path d="M340.372 0H366.488V263H340.372V0Z" fill="url(#paint17_linear_2427_764)"></path>
<path d="M373.452 0H401.019V263H373.452V0Z" fill="url(#paint18_linear_2427_764)"></path>
<path d="M407.983 0H437V263H407.983V0Z" fill="url(#paint19_linear_2427_764)"></path>
</g>
<defs>
<lineargradient gradientunits="userSpaceOnUse" id="paint0_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint1_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint2_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint3_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint4_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint5_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint6_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint7_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint8_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint9_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint10_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint11_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint12_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint13_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint14_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint15_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint16_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint17_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint18_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint19_linear_2427_764" x1="218.5" x2="218.5" y1="263" y2="0">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
</defs>
</svg></div></div><div class="usp-card is__2" data-floatcard-2=""><h3 class="h4">Non-toxic &amp; Safe</h3><p>We centralize diagnostics, procurement, and active execution within a single structured workflow. Construction phases and deliveries are strictly aligned with project timelines and milestone updates. With one single point of contact, daily alignment, and active logistics, we keep your project moving forward without delays.</p><div class="usp-card__no">02</div><div class="usp-card__graphic w-embed"><svg fill="none" height="100%" viewbox="0 0 437 263" width="100%" xmlns="http://www.w3.org/2000/svg">
<mask height="263" id="mask0_2427_769" maskunits="userSpaceOnUse" style="mask-type:alpha" width="437" x="0" y="0">
<path d="M437 263L435.549 263L435.549 3.80769e-05L437 3.82038e-05L437 263Z" fill="url(#paint0_linear_2427_769)"></path>
<path d="M428.585 263L425.683 263L425.683 3.72144e-05L428.585 3.74681e-05L428.585 263Z" fill="url(#paint1_linear_2427_769)"></path>
<path d="M418.719 263L414.367 263L414.367 3.62251e-05L418.719 3.66056e-05L418.719 263Z" fill="url(#paint2_linear_2427_769)"></path>
<path d="M407.402 263L401.599 263L401.599 3.51089e-05L407.402 3.56162e-05L407.402 263Z" fill="url(#paint3_linear_2427_769)"></path>
<path d="M394.635 263L387.38 263L387.381 3.38659e-05L394.635 3.45001e-05L394.635 263Z" fill="url(#paint4_linear_2427_769)"></path>
<path d="M380.416 263L371.711 263L371.711 3.2496e-05L380.416 3.32571e-05L380.416 263Z" fill="url(#paint5_linear_2427_769)"></path>
<path d="M364.747 263L354.591 263L354.591 3.09993e-05L364.747 3.18872e-05L364.747 263Z" fill="url(#paint6_linear_2427_769)"></path>
<path d="M347.627 263L336.02 263L336.02 2.93758e-05L347.627 3.03905e-05L347.627 263Z" fill="url(#paint7_linear_2427_769)"></path>
<path d="M329.056 263L315.998 263L315.998 2.76254e-05L329.056 2.8767e-05L329.056 263Z" fill="url(#paint8_linear_2427_769)"></path>
<path d="M309.034 263L294.525 263L294.525 2.57482e-05L309.034 2.70166e-05L309.034 263Z" fill="url(#paint9_linear_2427_769)"></path>
<path d="M287.561 263L271.602 263L271.602 2.37442e-05L287.561 2.51394e-05L287.561 263Z" fill="url(#paint10_linear_2427_769)"></path>
<path d="M264.637 263L247.227 263L247.227 2.16133e-05L264.637 2.31353e-05L264.637 263Z" fill="url(#paint11_linear_2427_769)"></path>
<path d="M240.263 263L221.402 263L221.402 1.93556e-05L240.263 2.10045e-05L240.263 263Z" fill="url(#paint12_linear_2427_769)"></path>
<path d="M214.438 263L194.126 263L194.126 1.6971e-05L214.438 1.87467e-05L214.438 263Z" fill="url(#paint13_linear_2427_769)"></path>
<path d="M187.161 263L165.398 263L165.398 1.44596e-05L187.161 1.63622e-05L187.161 263Z" fill="url(#paint14_linear_2427_769)"></path>
<path d="M158.434 263L135.22 263L135.22 1.18213e-05L158.434 1.38508e-05L158.434 263Z" fill="url(#paint15_linear_2427_769)"></path>
<path d="M128.256 263L103.592 263L103.592 9.05627e-06L128.256 1.12125e-05L128.256 263Z" fill="url(#paint16_linear_2427_769)"></path>
<path d="M96.6275 263L70.512 263L70.512 6.16435e-06L96.6275 8.44744e-06L96.6275 263Z" fill="url(#paint17_linear_2427_769)"></path>
<path d="M63.5478 263L35.9814 263L35.9814 3.1456e-06L63.5478 5.55553e-06L63.5478 263Z" fill="url(#paint18_linear_2427_769)"></path>
<path d="M29.0173 263L0 263L2.29922e-05 0L29.0173 2.53677e-06L29.0173 263Z" fill="url(#paint19_linear_2427_769)"></path>
</mask>
<g mask="url(#mask0_2427_769)">
<circle cx="218" cy="247" fill="#D9D9D9" opacity="0.5" r="247" transform="rotate(-180 218 247)"></circle>
</g>
<defs>
<lineargradient gradientunits="userSpaceOnUse" id="paint0_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint1_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint2_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint3_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint4_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint5_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint6_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint7_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint8_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint9_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint10_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint11_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint12_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint13_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint14_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint15_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint16_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint17_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint18_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint19_linear_2427_769" x1="218.5" x2="218.5" y1="1.91019e-05" y2="263">
<stop stop-color="#FFA574"></stop>
<stop offset="0.947115" stop-color="#FFA574" stop-opacity="0"></stop>
</lineargradient>
</defs>
</svg></div></div><div class="usp-card is__3" data-floatcard-3=""><h3 class="h4">Maximum Reliability</h3><p>Thanks to our long-standing relationships with certified sub-contractors, supply chains, and strong material procurement networks in Singapore, we guarantee reliability across all projects.<br/>This proactive planning mitigates risks and ensures completion dates are met on time.</p><div class="usp-card__no">03</div><div class="usp-card__graphic w-embed"><svg fill="none" height="100%" viewbox="0 0 438 318" width="100%" xmlns="http://www.w3.org/2000/svg">
<mask height="318" id="mask0_2427_780" maskunits="userSpaceOnUse" style="mask-type:alpha" width="529" x="-28" y="0">
<path d="M-27.666 0L-25.9117 0L-25.9117 318H-27.666L-27.666 0Z" fill="url(#paint0_linear_2427_780)"></path>
<path d="M-17.4912 0L-13.9827 0L-13.9827 318H-17.4912L-17.4912 0Z" fill="url(#paint1_linear_2427_780)"></path>
<path d="M-5.56214 0L-0.299316 0L-0.299316 318H-5.56214L-5.56214 0Z" fill="url(#paint2_linear_2427_780)"></path>
<path d="M8.1212 0L15.1383 0L15.1383 318H8.1212L8.1212 0Z" fill="url(#paint3_linear_2427_780)"></path>
<path d="M23.5588 0L32.3302 0L32.3302 318H23.5588L23.5588 0Z" fill="url(#paint4_linear_2427_780)"></path>
<path d="M40.7507 0L51.2764 0L51.2764 318H40.7507L40.7507 0Z" fill="url(#paint5_linear_2427_780)"></path>
<path d="M59.6969 0L71.9768 0L71.9768 318H59.6969L59.6969 0Z" fill="url(#paint6_linear_2427_780)"></path>
<path d="M80.3974 0L94.4316 0L94.4316 318H80.3974L80.3974 0Z" fill="url(#paint7_linear_2427_780)"></path>
<path d="M102.852 0L118.641 0L118.641 318H102.852L102.852 0Z" fill="url(#paint8_linear_2427_780)"></path>
<path d="M127.061 0L144.604 0L144.604 318H127.061L127.061 0Z" fill="url(#paint9_linear_2427_780)"></path>
<path d="M153.024 0L172.321 0L172.321 318H153.024L153.024 0Z" fill="url(#paint10_linear_2427_780)"></path>
<path d="M180.742 0L201.793 0L201.793 318H180.742L180.742 0Z" fill="url(#paint11_linear_2427_780)"></path>
<path d="M210.214 0L233.019 0L233.019 318H210.214L210.214 0Z" fill="url(#paint12_linear_2427_780)"></path>
<path d="M241.44 0L266 0L266 318H241.44L241.44 0Z" fill="url(#paint13_linear_2427_780)"></path>
<path d="M274.42 0L300.734 0L300.734 318H274.42L274.42 0Z" fill="url(#paint14_linear_2427_780)"></path>
<path d="M309.155 0L337.223 0L337.223 318H309.155L309.155 0Z" fill="url(#paint15_linear_2427_780)"></path>
<path d="M345.644 0L375.467 0L375.467 318H345.644L345.644 0Z" fill="url(#paint16_linear_2427_780)"></path>
<path d="M383.887 0L415.464 0L415.464 318H383.887L383.887 0Z" fill="url(#paint17_linear_2427_780)"></path>
<path d="M423.885 0L457.216 0L457.216 318H423.885L423.885 0Z" fill="url(#paint18_linear_2427_780)"></path>
<path d="M465.636 0L500.722 0V318H465.636L465.636 0Z" fill="url(#paint19_linear_2427_780)"></path>
</mask>
<g mask="url(#mask0_2427_780)">
<path d="M-52.7091 154.764L528.82 -1.05579L372.999 580.473L-52.7091 154.764Z" fill="url(#paint20_linear_2427_780)" opacity="0.5"></path>
</g>
<defs>
<lineargradient gradientunits="userSpaceOnUse" id="paint0_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint1_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint2_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint3_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint4_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint5_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint6_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint7_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint8_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint9_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint10_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint11_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint12_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint13_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint14_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint15_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint16_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint17_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint18_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint19_linear_2427_780" x1="236.528" x2="236.528" y1="318" y2="0">
<stop stop-color="#0E0A0A"></stop>
<stop offset="0.947115" stop-color="white" stop-opacity="0"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint20_linear_2427_780" x1="193.334" x2="232.834" y1="97.0491" y2="273.049">
<stop stop-color="#848C8F" stop-opacity="0"></stop>
<stop offset="1" stop-color="#848C8F"></stop>
</lineargradient>
</defs>
</svg></div></div></div></div></div></section><section class="section" data-floating-content-section="" data-wf--floating-content--variant="base"><div class="w-layout-blockcontainer container w-container"><div class="col__2"><div class="col" id="w-node-_0f278562-46a9-107a-163f-6597f4ca1bea-f4ca1be7"><div class="floating-content__text"><h2 class="h2">For Property Owners &amp; Commercial Managers</h2><p class="mb__l">Thulira works directly with residential developers, commercial building managers, and homeowners who value execution safety, precision diagnostics, and reliable execution. From large commercial rooftops to luxury residential areas: we deliver.</p><div></div></div></div><div class="col" id="w-node-_0f278562-46a9-107a-163f-6597f4ca1bf0-f4ca1be7"><img alt="Thulira commercial management project" class="floating-content__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div></div></section><section class="section is__dark"><div class="w-layout-blockcontainer container w-container"><div class="row"><div class="col__1"><div class="col"><div class="center-content"><div class="max__500"><h2 class="h2">Our Featured Projects</h2><p>A showcase of our building, eco-friendly products, and waterpeco-friendly products works across Singapore.</p></div></div></div></div><div class="col__1"><div class="col"><div aria-label="Featured content" aria-roledescription="carousel" class="cascading-slider" data-cascading-slider-wrap=""><div class="cascading-slider__collection w-dyn-list"><div class="cascading-slider__list w-dyn-items" data-cascading-viewport="" role="list"><div aria-roledescription="slide" class="cascading-slider__item w-dyn-item" data-cascading-slide="" role="listitem"><div class="cascading-slider__item-inner"><div class="cascading-slider__item-bg"><img alt="Toilet &amp; Balcony Regrouting" class="cascading-slider__img" draggable="false" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div><div class="cascading-slider__item-content"><h3 class="cascading-slider__h">Toilet &amp; Balcony Regrouting</h3><p class="margin-none">Serangoon, Singapore</p></div></div></div><div aria-roledescription="slide" class="cascading-slider__item w-dyn-item" data-cascading-slide="" role="listitem"><div class="cascading-slider__item-inner"><div class="cascading-slider__item-bg"><img alt="Roof Waterpeco-friendly products &amp; Coating" class="cascading-slider__img" draggable="false" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div><div class="cascading-slider__item-content"><h3 class="cascading-slider__h">Roof Waterpeco-friendly products &amp; Coating</h3><p class="margin-none">Changi, Singapore</p></div></div></div><div aria-roledescription="slide" class="cascading-slider__item w-dyn-item" data-cascading-slide="" role="listitem"><div class="cascading-slider__item-inner"><div class="cascading-slider__item-bg"><img alt="Clay Tile eco-friendly product" class="cascading-slider__img" draggable="false" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div><div class="cascading-slider__item-content"><h3 class="cascading-slider__h">Clay Tile eco-friendly product</h3><p class="margin-none">Orchard Road, Singapore</p></div></div></div><div aria-roledescription="slide" class="cascading-slider__item w-dyn-item" data-cascading-slide="" role="listitem"><div class="cascading-slider__item-inner"><div class="cascading-slider__item-bg"><img alt="Toilet &amp; Balcony Regrouting" class="cascading-slider__img" draggable="false" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div><div class="cascading-slider__item-content"><h3 class="cascading-slider__h">Toilet &amp; Balcony Regrouting</h3><p class="margin-none">Tampines, Singapore</p></div></div></div><div aria-roledescription="slide" class="cascading-slider__item w-dyn-item" data-cascading-slide="" role="listitem"><div class="cascading-slider__item-inner"><div class="cascading-slider__item-bg"><img alt="Roof Waterpeco-friendly products &amp; Coating" class="cascading-slider__img" draggable="false" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div><div class="cascading-slider__item-content"><h3 class="cascading-slider__h">Roof Waterpeco-friendly products &amp; Coating</h3><p class="margin-none">Tuas, Singapore</p></div></div></div><div aria-roledescription="slide" class="cascading-slider__item w-dyn-item" data-cascading-slide="" role="listitem"><div class="cascading-slider__item-inner"><div class="cascading-slider__item-bg"><img alt="Clay Tile eco-friendly product" class="cascading-slider__img" draggable="false" loading="eager" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div><div class="cascading-slider__item-content"><h3 class="cascading-slider__h">Clay Tile eco-friendly product</h3><p class="margin-none">Bukit Timah, Singapore</p></div></div></div></div></div><nav aria-label="slider navigation" class="cascading-slider__nav"><button aria-label="previous slide" class="cascading-slider__button" data-cascading-slider-prev=""><svg class="cascading-slider__button-arrow is--prev" fill="none" viewbox="0 0 24 24" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M14 19L21 12L14 5" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.5"></path><path d="M21 12H2" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.5"></path></svg></button><button aria-label="next slide" class="cascading-slider__button" data-cascading-slider-next=""><svg class="cascading-slider__button-arrow" fill="none" viewbox="0 0 24 24" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M14 19L21 12L14 5" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.5"></path><path d="M21 12H2" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.5"></path></svg></button></nav></div></div></div></div></div><div class="w-embed"><style>

[data-cascading-viewport] {
  --gap: 0.5em;
}

[data-cascading-slide] {
  --clip: 0;
  --radius: 0.25rem;
}

[data-cascading-slide][data-status="active"] {
  cursor: default;
}

[data-cascading-slide] .cascading-slider__h {
  transition-delay: 0ms;
}

[data-cascading-slide][data-status="active"] .cascading-slider__h {
  transition-delay: 400ms;
  opacity: 1;
  transform: translate(0px, 0em);
}

.wf-design-mode [data-cascading-viewport] {
  display: flex;
  flex-direction: row;
  gap: 1em;
  overflow: auto;
}

.wf-design-mode [data-cascading-slide] {
  position: relative;
  width: 60%;
  flex: 0 0 auto;
}

.wf-design-mode .cascading-slider__h {
  opacity: 1;
  transform: translate(0px, 0em);
}

</style></div><div class="hide w-embed w-script"><script defer="">

function initCascadingSlider() {

  const duration = 0.65;
  const ease = 'power3.inOut';

  const breakpoints = [
    { maxWidth: 479, activeWidth: 0.78, siblingWidth: 0.08 },
    { maxWidth: 767, activeWidth: 0.70, siblingWidth: 0.10 },
    { maxWidth: 991, activeWidth: 0.60, siblingWidth: 0.10 },
    { maxWidth: Infinity, activeWidth: 0.60, siblingWidth: 0.13 },
  ];

  const wrappers = document.querySelectorAll('[data-cascading-slider-wrap]');
  wrappers.forEach(setupInstance);

  function setupInstance(wrapper) {
    const viewport = wrapper.querySelector('[data-cascading-viewport]');
    const prevButton = wrapper.querySelector('[data-cascading-slider-prev]');
    const nextButton = wrapper.querySelector('[data-cascading-slider-next]');
    const slides = Array.from(viewport.querySelectorAll('[data-cascading-slide]'));
    let totalSlides = slides.length;

    if (totalSlides === 0) return;

    if (totalSlides < 9) {
      const originalSlides = slides.slice();
      while (slides.length < 9) {
        originalSlides.forEach(function(original) {
          const clone = original.cloneNode(true);
          clone.setAttribute('data-clone', '');
          viewport.appendChild(clone);
          slides.push(clone);
        });
      }
      totalSlides = slides.length;
    }

    let activeIndex = 0;
    let isAnimating = false;
    let slideWidth = 0;
    let slotCenters = {};
    let slotWidths = {};

    function readGap() {
      const raw = getComputedStyle(viewport).getPropertyValue('--gap').trim();
      if (!raw) return 0;
      const temp = document.createElement('div');
      temp.style.width = raw;
      temp.style.position = 'absolute';
      temp.style.visibility = 'hidden';
      viewport.appendChild(temp);
      const px = temp.offsetWidth;
      viewport.removeChild(temp);
      return px;
    }

    function getSettings() {
      const windowWidth = window.innerWidth;
      for (let i = 0; i < breakpoints.length; i++) {
        if (windowWidth <= breakpoints[i].maxWidth) return breakpoints[i];
      }
      return breakpoints[breakpoints.length - 1];
    }

    function getOffset(slideIndex, fromIndex) {
      if (fromIndex === undefined) fromIndex = activeIndex;
      let distance = slideIndex - fromIndex;
      const half = totalSlides / 2;
      if (distance > half) distance -= totalSlides;
      if (distance < -half) distance += totalSlides;
      return distance;
    }

    function measure() {
      const settings = getSettings();
      const viewportWidth = viewport.offsetWidth;
      const gap = readGap();

      const activeSlideWidth = viewportWidth * settings.activeWidth;
      const siblingSlideWidth = viewportWidth * settings.siblingWidth;
      const farSlideWidth = Math.max(0, (viewportWidth - activeSlideWidth - 2 * siblingSlideWidth - 4 * gap) / 2);

      slideWidth = activeSlideWidth;

      const visibleSlots = [
        { slot: -2, width: farSlideWidth },
        { slot: -1, width: siblingSlideWidth },
        { slot: 0, width: activeSlideWidth },
        { slot: 1, width: siblingSlideWidth },
        { slot: 2, width: farSlideWidth },
      ];

      let x = 0;
      visibleSlots.forEach(function(def, i) {
        slotCenters[String(def.slot)] = x + def.width / 2;
        slotWidths[String(def.slot)] = def.width;
        if (i < visibleSlots.length - 1) x += def.width + gap;
      });

      slotCenters['-3'] = slotCenters['-2'] - farSlideWidth / 2 - gap - farSlideWidth / 2;
      slotWidths['-3'] = farSlideWidth;
      slotCenters['3'] = slotCenters['2'] + farSlideWidth / 2 + gap + farSlideWidth / 2;
      slotWidths['3'] = farSlideWidth;

      slides.forEach(function(slide) {
        slide.style.width = slideWidth + 'px';
      });
    }

    function getSlideProps(offset) {
      const clamped = Math.max(-3, Math.min(3, offset));
      const slotWidth = slotWidths[String(clamped)];
      const clipAmount = Math.max(0, (slideWidth - slotWidth) / 2);
      const translateX = slotCenters[String(clamped)] - slideWidth / 2;

      return {
        x: translateX,
        '--clip': clipAmount,
        zIndex: 10 - Math.abs(clamped),
      };
    }

    function layout(animate, previousIndex) {
      slides.forEach(function(slide, index) {
        const offset = getOffset(index);

        if (offset < -3 || offset > 3) {
          if (animate && previousIndex !== undefined) {
            const previousOffset = getOffset(index, previousIndex);
            if (previousOffset >= -2 && previousOffset <= 2) {
              const exitSlot = previousOffset < 0 ? -3 : 3;
              gsap.to(slide, Object.assign({}, getSlideProps(exitSlot), {
                duration: duration,
                ease: ease,
                overwrite: true,
              }));
              return;
            }
          }

          const parkSlot = offset < 0 ? -3 : 3;
          gsap.set(slide, getSlideProps(parkSlot));
          return;
        }

        const props = getSlideProps(offset);
        slide.setAttribute('data-status', offset === 0 ? 'active' : 'inactive');

        if (animate) {
          gsap.to(slide, Object.assign({}, props, {
            duration: duration,
            ease: ease,
            overwrite: true,
          }));
        } else {
          gsap.set(slide, props);
        }
      });
    }

    function goTo(targetIndex) {
      const normalizedTarget = ((targetIndex % totalSlides) + totalSlides) % totalSlides;
      if (isAnimating || normalizedTarget === activeIndex) return;
      isAnimating = true;

      const previousIndex = activeIndex;
      const travelDirection = getOffset(normalizedTarget, previousIndex) > 0 ? 1 : -1;

      slides.forEach(function(slide, index) {
        const currentOffset = getOffset(index, previousIndex);
        const nextOffset = getOffset(index, normalizedTarget);
        const wasInRange = currentOffset >= -3 && currentOffset <= 3;
        const willBeVisible = nextOffset >= -2 && nextOffset <= 2;

        if (!wasInRange && willBeVisible) {
          const entrySlot = travelDirection > 0 ? 3 : -3;
          gsap.set(slide, getSlideProps(entrySlot));
        }

        const wasInvisible = Math.abs(currentOffset) >= 3;
        const willBeStaging = Math.abs(nextOffset) === 3;
        const crossesSides = currentOffset * nextOffset < 0;
        if (wasInvisible && willBeStaging && crossesSides) {
          gsap.set(slide, getSlideProps(nextOffset > 0 ? 3 : -3));
        }
      });

      activeIndex = normalizedTarget;
      layout(true, previousIndex);
      gsap.delayedCall(duration + 0.05, function() { isAnimating = false; });
    }

    if (prevButton) prevButton.addEventListener('click', function() { goTo(activeIndex - 1); });
    if (nextButton) nextButton.addEventListener('click', function() { goTo(activeIndex + 1); });

    slides.forEach(function(slide, index) {
      slide.addEventListener('click', function() {
        if (index !== activeIndex) goTo(index);
      });
    });

    document.addEventListener('keydown', function(event) {
      if (event.key === 'ArrowLeft') goTo(activeIndex - 1);
      if (event.key === 'ArrowRight') goTo(activeIndex + 1);
    });

    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        measure();
        layout(false);
      }, 100);
    });

    measure();
    layout(false);
  }
}

// Initialize Cascading Slider
document.addEventListener('DOMContentLoaded', function() {
  initCascadingSlider();
});

</script></div><section class="section" data-floating-content-section="" data-wf--floating-content--variant="switch"><div class="w-layout-blockcontainer container w-container"><div class="col__2"><div class="col" id="w-node-_0f278562-46a9-107a-163f-6597f4ca1bea-f4ca1be7"><div class="floating-content__text"><h2 class="h2">A Trusted Construction Partner</h2><p class="mb__l">Thulira is specialized in premium building, eco-friendly products works in Singapore. We work on a turnkey basis with strict safety standards. Our strengths:</p><div><div class="check-item"><div class="icon__24 w-embed"><svg fill="none" height="24" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M11.0001 16.1698L7.53015 12.6998C7.34317 12.5129 7.08957 12.4078 6.82515 12.4078C6.56072 12.4078 6.30712 12.5129 6.12015 12.6998C5.93317 12.8868 5.82812 13.1404 5.82812 13.4048C5.82813 13.5358 5.85391 13.6654 5.90402 13.7864C5.95412 13.9073 6.02756 14.0173 6.12015 14.1098L10.3001 18.2898C10.6901 18.6798 11.3201 18.6798 11.7101 18.2898L22.2901 7.70983C22.4771 7.52286 22.5822 7.26926 22.5822 7.00483C22.5822 6.74041 22.4771 6.48681 22.2901 6.29983C22.1032 6.11286 21.8496 6.00781 21.5851 6.00781C21.3207 6.00781 21.0671 6.11286 20.8801 6.29983L11.0001 16.1698Z" fill="black"></path>
</svg></div><p>Clear Diagnostics &amp; Timelines</p></div><div class="check-item"><div class="icon__24 w-embed"><svg fill="none" height="24" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M11.0001 16.1698L7.53015 12.6998C7.34317 12.5129 7.08957 12.4078 6.82515 12.4078C6.56072 12.4078 6.30712 12.5129 6.12015 12.6998C5.93317 12.8868 5.82812 13.1404 5.82812 13.4048C5.82813 13.5358 5.85391 13.6654 5.90402 13.7864C5.95412 13.9073 6.02756 14.0173 6.12015 14.1098L10.3001 18.2898C10.6901 18.6798 11.3201 18.6798 11.7101 18.2898L22.2901 7.70983C22.4771 7.52286 22.5822 7.26926 22.5822 7.00483C22.5822 6.74041 22.4771 6.48681 22.2901 6.29983C22.1032 6.11286 21.8496 6.00781 21.5851 6.00781C21.3207 6.00781 21.0671 6.11286 20.8801 6.29983L11.0001 16.1698Z" fill="black"></path>
</svg></div><p>Constant Quality Assurance</p></div><div class="check-item"><div class="icon__24 w-embed"><svg fill="none" height="24" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M11.0001 16.1698L7.53015 12.6998C7.34317 12.5129 7.08957 12.4078 6.82515 12.4078C6.56072 12.4078 6.30712 12.5129 6.12015 12.6998C5.93317 12.8868 5.82812 13.1404 5.82812 13.4048C5.82813 13.5358 5.85391 13.6654 5.90402 13.7864C5.95412 13.9073 6.02756 14.0173 6.12015 14.1098L10.3001 18.2898C10.6901 18.6798 11.3201 18.6798 11.7101 18.2898L22.2901 7.70983C22.4771 7.52286 22.5822 7.26926 22.5822 7.00483C22.5822 6.74041 22.4771 6.48681 22.2901 6.29983C22.1032 6.11286 21.8496 6.00781 21.5851 6.00781C21.3207 6.00781 21.0671 6.11286 20.8801 6.29983L11.0001 16.1698Z" fill="black"></path>
</svg></div><p>Up to 10-Year Warranty</p></div></div></div></div><div class="col w-variant-d62a4a43-e6a5-9028-32fe-1a4b4f65e535" id="w-node-_0f278562-46a9-107a-163f-6597f4ca1bf0-f4ca1be7"><img alt="Thulira project work" class="floating-content__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div></div></section></section></main><footer class="footer__wrapper"><section class="footer__topper"><div class="w-layout-blockcontainer container w-container"><div class="col__1"><div class="col"><div class="z-1"><div class="center-content"><div class="max__500"><div class="mb__l"><h3 class="h3 is__bigger">Built on Trust.<br/>Proven by Results.</h3></div><a class="button w-inline-block" href="/shop"><div>Shop Now</div></a><div class="cta-people"><img alt="Thulira team consulting during a site inspection." loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="opacity__65">Get in touch today</div></div></div></div></div><img alt="Thulira project work" class="cta-image is__1" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><img alt="Thulira project work" class="cta-image is__2" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><img alt="Thulira project work" class="cta-image is__3" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div></div></section><section class="section is__dark v__footer"><div class="z-1"><div class="w-layout-blockcontainer container w-container"><div class="row"><div class="col__footer"><div class="col" id="w-node-_59d0562d-fb65-eaa0-fc67-8e3d4af3a4e3-4af3a4d1"><p class="h4">Sustainable biocomposite home products including bottles and drinkware.</p><p class="mb__m">Ethically sourced, highly durable, and 100% food-safe sustainable alternatives.</p><a class="button w-inline-block" href="/shop"><div>Shop Now</div></a></div><nav class="col"><div class="footer__text is__heading">Menu</div><ul class="w-list-unstyled" role="list"><li><a aria-current="page" class="footer__text w--current" href="/">Home</a></li><li><a class="footer__text" href="/about">About Us</a></li><li><a class="footer__text" href="/shop">Shop</a></li><li><a class="footer__text" href="/blog">Blog</a></li></ul></nav><nav class="col"><div class="footer__text is__heading">Contact</div><ul class="w-list-unstyled" role="list"><li><a class="footer__text" href="mailto:info@thulira.com">info@thulira.com</a></li><li><a class="footer__text" href="tel:+6582355452">+65 8235 5452</a></li><li><a class="footer__text" href="https://wa.me/6582355452" target="_blank">WhatsApp</a></li><li><div class="footer__text">Sustainable Materials</div></li><li><div class="footer__text">100% Food Safe</div></li><li><div class="footer__text">Island-wide Delivery</div></li></ul></nav></div><div class="col__1"><div class="col"><div class="w-embed"><div class="footer__logo-text-wrap" style="width: 100%; display: flex; justify-content: center; align-items: center; padding: 2rem 0; box-sizing: border-box;"><h2 style="font-family: 'Inter', sans-serif; font-size: calc(2rem + 3.5vw); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.06); text-align: center; margin: 0; line-height: 0.9; user-select: none;">Thulira</h2></div></div></div><div class="col__1"><div class="col"><div class="imprint__wrapper"><a class="imprint__text" href="https://www.overflow.nl">By Overflow</a></div></div></div></div></div></div><div class="footer__deco v-footer w-embed"><svg fill="none" height="100%" viewbox="0 0 151 850" width="100%" xmlns="http://www.w3.org/2000/svg">00/svg"&gt;
<path d="M0 -26H6.56522L6.56522 851H0L0 -26Z" fill="url(#paint0_linear_2462_171)"></path>
<path d="M19.6957 -26H32.8261L32.8261 851H19.6957L19.6957 -26Z" fill="url(#paint1_linear_2462_171)"></path>
<path d="M45.9565 -26H65.6522L65.6522 851H45.9565L45.9565 -26Z" fill="url(#paint2_linear_2462_171)"></path>
<path d="M78.7826 -26L105.043 -26L105.043 851H78.7826L78.7826 -26Z" fill="url(#paint3_linear_2462_171)"></path>
<path d="M118.174 -26L151 -26L151 851H118.174L118.174 -26Z" fill="url(#paint4_linear_2462_171)"></path>
<defs>
<lineargradient gradientunits="userSpaceOnUse" id="paint0_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint1_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint2_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint3_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint4_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
</defs>
</svg></div></div></section></footer></div><script crossorigin="anonymous" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=6978c74eb7a56e10b85274cb" type="text/javascript"></script><script crossorigin="anonymous" integrity="sha384-eLhtiOwpAcsrjTU3szoidTK2FT4sgwN998/lRT314vxiyUJEzKSwZ02q/f+3Y8k8" src="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/js/webflow.schunk.05ab46bf443beb37.js" type="text/javascript"></script><script crossorigin="anonymous" integrity="sha384-r/0aJtxyik6X2Bcs01kwYuDwVfLbqN6fLwWBO/TorW7UUz3L+QbPbV9iJPGrCct5" src="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/js/webflow.04afb2dd.b8ca743d6a44ff0f.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/gsap.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/ScrollTrigger.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/Observer.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/Draggable.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/SplitText.min.js" type="text/javascript"></script><script type="text/javascript">gsap.registerPlugin(ScrollTrigger,Observer,Draggable,SplitText);</script><script src="https://unpkg.com/lenis@1.3.17/dist/lenis.min.js"></script>
<script>
  
const lenis = new Lenis();

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000); // Convert time from seconds to milliseconds
});

gsap.ticker.lagSmoothing(0);

  
</script></body></html>
```

---

## src/pages/order-success.html

```html
<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Order Confirmed | Thulira</title>
<meta content="Order success and transaction summary." name="description"/>
<meta content="width=device-width, initial-scale=1" name="viewport"/>
<link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.shared.e97910e78.min.css" integrity="sha384-6XkQ54zt5ZhQdYI3Cx7JctA/Nr8ro5njqFDfYJJIYwhTuj2/ibnU3ZsiTqnERiYm" rel="stylesheet" type="text/css"/>
<link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.69c3b278cebe0890cc1deff6.279609e48.opt.min.css" integrity="sha384-J5YJ5IODQP3dWDCguNMeegsI+pxEg3y/1oh76z8WYZOLOF8Mz4zlr2auNzYvFebx" rel="stylesheet" type="text/css"/>
<link href="ecommerce.css?v=999?v=999" rel="stylesheet"/>
<script type="text/javascript">
    !function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);
  </script>
<link href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/6997158e5fac364205ad5ab5_Favicon.png" rel="shortcut icon" type="image/x-icon"/>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script defer="" src="supabaseClient.js?v=2"></script>
<script defer="" src="cart.js?v=2"></script>

<style>
  /* Prevent Webflow scaling down interaction on the page content */
  .page__wrapper,
  .main__wrapper,
  main,
  body {
    transform: none !important;
    scale: none !important;
  }
</style>

</head>
<body>
<div class="page__wrapper">
<div class="nav__component" data-nav-element="">
<div class="nav__wrapper" data-nav-wrapper="">
<div class="nav__flex">
<div class="nav__left">
<a class="nav__link" href="/about">About Us</a>
<a class="nav__link" href="/blog">Blog</a>
</div>
<div class="nav__center">
<a class="nav__logo w-inline-block" href="/"><img src="/thulira-transparent.png" alt="Thulira Logo" style="height: 32px; width: auto; display: block;" /></a>
</div>
<div class="nav__right">
<div data-hide-landscape="">
<a class="button w-inline-block" href="/shop"><div>Shop Now</div></a>
</div>

</div>
</div>
<div class="nav__menu-wrapper" data-menu-wrapper="">
<nav class="nav__menu-inner">
<ul class="w-list-unstyled" role="list">
<li><a class="nav__menu-link" href="/">Home</a></li>
<li><a class="nav__menu-link" href="/shop">Shop</a></li>
<li><a class="nav__menu-link" href="/blog">Blog</a></li>
<li><a class="nav__menu-link" href="/about">About Us</a></li>

</ul>
</nav>
</div>
</div>
</div>
<main style="min-height: 80vh; background: var(--thulira-bg-dark); display: flex; align-items: center; justify-content: center; padding: 2rem 1rem;">
<div class="success-page-container">
<div class="success-icon-wrapper">
<svg fill="none" height="40" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewbox="0 0 24 24" width="40" xmlns="http://www.w3.org/2000/svg">
<polyline points="20 6 9 17 4 12"></polyline>
</svg>
</div>
<h1>Your order is placed and our team will contact you</h1>
<p style="color: var(--thulira-text-muted);">Thank you for choosing Thulira. Our operations team will contact you via phone shortly to confirm delivery dates and COD details.</p>
<div class="success-details-card" id="successDetailsCard">
<div class="success-detail-row">
<span class="success-detail-label">Order ID</span>
<span class="success-detail-val" id="orderIdVal">Loading...</span>
</div>
</div>
<div class="success-actions">
<a class="button-link primary" href="/">Return to Home</a>
<a class="button-link secondary" href="/orders">View My Orders</a>
</div>
</div>
</main>
</div>
<script>
    document.addEventListener('DOMContentLoaded', async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('orderId');
      
      const card = document.getElementById('successDetailsCard');
      
      if (!orderId) {
        card.innerHTML = `
          <div style="text-align: center; color: var(--thulira-text-muted); padding: 1rem;">
            No order details found. Please navigate from the checkout screen.
          </div>
        `;
        return;
      }
      
      if (window.initSupabase) await window.initSupabase();
      
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      if (!user) {
        card.innerHTML = `
          <div style="text-align: center; color: var(--thulira-text-muted); padding: 1rem;">
            Please sign in to view this order confirmation.
          </div>
        `;
        return;
      }
      
      // Query the order to verify ownership via RLS
      const { data: order, error } = await window.supabaseClient
        .from('orders')
        .select('id')
        .eq('id', orderId)
        .maybeSingle();
        
      if (error || !order) {
        card.innerHTML = `
          <div style="text-align: center; color: #ef4444; padding: 1rem; font-weight: 600;">
            Order not found or access denied.
          </div>
        `;
        return;
      }
      
      document.getElementById('orderIdVal').textContent = orderId;
    });
  </script>
</body>
</html>

```

---

## src/pages/orders.html

```html
<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="utf-8"/>
<title>My Orders | Thulira</title>
<meta content="View your general contractor booking history with Thulira Singapore." name="description"/>
<meta content="width=device-width, initial-scale=1" name="viewport"/>
<link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.shared.e97910e78.min.css" integrity="sha384-6XkQ54zt5ZhQdYI3Cx7JctA/Nr8ro5njqFDfYJJIYwhTuj2/ibnU3ZsiTqnERiYm" rel="stylesheet" type="text/css"/>
<link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.69c3b278cebe0890cc1deff6.279609e48.opt.min.css" integrity="sha384-J5YJ5IODQP3dWDCguNMeegsI+pxEg3y/1oh76z8WYZOLOF8Mz4zlr2auNzYvFebx" rel="stylesheet" type="text/css"/>
<link href="ecommerce.css?v=999?v=999" rel="stylesheet"/>
<script type="text/javascript">
    !function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);
  </script>
<link href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/6997158e5fac364205ad5ab5_Favicon.png" rel="shortcut icon" type="image/x-icon"/>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script defer="" src="supabaseClient.js?v=2"></script>
<script defer="" src="cart.js?v=2"></script>

<style>
  /* Prevent Webflow scaling down interaction on the page content */
  .page__wrapper,
  .main__wrapper,
  main,
  body {
    transform: none !important;
    scale: none !important;
  }
</style>

</head>
<body>
<div class="page__wrapper">
<!-- Navbar Component -->
<div class="nav__component" data-nav-element="">
<div class="nav__wrapper" data-nav-wrapper="">
<div class="nav__flex">
<div class="nav__left">
<a class="nav__link" href="/about">About Us</a>
<a class="nav__link" href="/blog">Blog</a>
</div>
<div class="nav__center">
<a class="nav__logo w-inline-block" href="/"><img src="/thulira-transparent.png" alt="Thulira Logo" style="height: 32px; width: auto; display: block;" /></a>
</div>
<div class="nav__right">
<div data-hide-landscape="">
<a class="button w-inline-block" href="/shop"><div>Shop Now</div></a>
</div>

</div>
</div>
<div class="nav__menu-wrapper" data-menu-wrapper="">
<nav class="nav__menu-inner">
<ul class="w-list-unstyled" role="list">
<li><a class="nav__menu-link" href="/">Home</a></li>
<li><a class="nav__menu-link" href="/shop">Shop</a></li>
<li><a class="nav__menu-link" href="/blog">Blog</a></li>
<li><a class="nav__menu-link" href="/about">About Us</a></li>

</ul>
</nav>
</div>
</div>
</div>
<!-- Core History Panel -->
<main style="min-height: 85vh; background: var(--thulira-bg-dark); padding-top: 6rem;">
<div class="orders-page-container">
<div class="orders-page-header">
<h1>Booking History</h1>
</div>
<div class="orders-list" id="ordersList">
<!-- Dynamic Order cards -->
</div>
<div class="no-orders-box" id="emptyOrdersBox" style="display: none;">
<svg fill="none" height="48" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewbox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
<rect height="18" rx="2" ry="2" width="18" x="3" y="4"></rect>
<line x1="16" x2="16" y1="2" y2="6"></line>
<line x1="8" x2="8" y1="2" y2="6"></line>
<line x1="3" x2="21" y1="10" y2="10"></line>
</svg>
<h2 style="color: white; margin:0;">No Bookings Found</h2>
<p>You haven't booked any Sustainable Home Products yet.</p>
<a class="button-link primary" href="/">Browse Services</a>
</div>
</div>
</main>
</div>
<script>
    document.addEventListener('DOMContentLoaded', async () => {
      if (window.initSupabase) await window.initSupabase();
      
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      if (!user) {
        window.location.href = 'index.html';
        return;
      }
      
      const { data: orders, error } = await window.supabaseClient
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      const listDiv = document.getElementById('ordersList');
      const emptyDiv = document.getElementById('emptyOrdersBox');
      
      if (error || !orders || orders.length === 0) {
        listDiv.style.display = 'none';
        emptyDiv.style.display = 'flex';
        return;
      }
      
      let html = '';

      function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
      
      orders.forEach(order => {
        let statusText = order.status.toUpperCase();
        let statusClass = order.status === 'pending' ? 'status-pending' :
                          order.status === 'confirmed' ? 'status-scheduled' :
                          order.status === 'delivered' ? 'status-completed' : 'status-cancelled';
        
        let dateString = new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

        let itemsHtml = '';
        if (order.order_items) {
          order.order_items.forEach(item => {
            itemsHtml += `
              <div class="order-item-row">
                <div class="order-item-desc">
                  <span class="order-item-qty-badge">x${item.quantity}</span>
                  <span style="font-weight:600;">${escapeHTML(item.product_title)}</span>
                  ${item.size ? `<span class="cart-item-size-badge" style="margin-left:5px;">${escapeHTML(item.size)}</span>` : ''}
                </div>
                <span style="font-weight:700;">$${(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
            `;
          });
        }

        html += `
          <div class="order-card">
            <div class="order-card-header">
              <div class="order-header-info">
                <div class="order-meta-item">
                  <span class="order-meta-label">Order ID</span>
                  <span class="order-meta-val" style="color:var(--thulira-orange);">${escapeHTML(order.id.split('-')[0])}...</span>
                </div>
                <div class="order-meta-item">
                  <span class="order-meta-label">Date Placed</span>
                  <span class="order-meta-val">${escapeHTML(dateString)}</span>
                </div>
                <div class="order-meta-item">
                  <span class="order-meta-label">Total Amount</span>
                  <span class="order-meta-val">$${order.total.toFixed(2)}</span>
                </div>
              </div>
              <span class="order-status-pill ${statusClass}">${escapeHTML(statusText)}</span>
            </div>
            
            <div class="order-card-body">
              <h3 style="margin-top:0; font-size:1.05rem; text-transform:uppercase; color:var(--thulira-text-muted); font-weight:700; margin-bottom:1rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom:0.4rem;">Items Ordered</h3>
              <div class="order-items-grid">
                ${itemsHtml}
              </div>
              
              <h3 style="margin-top:1.5rem; font-size:1.05rem; text-transform:uppercase; color:var(--thulira-text-muted); font-weight:700; margin-bottom:1rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom:0.4rem;">Delivery Details</h3>
              <div style="display:grid; grid-template-columns: 1fr; gap:0.8rem; font-size:0.95rem;">
                <div><strong>Address:</strong> ${escapeHTML(order.shipping_address)}</div>
                <div style="display:flex; gap:2rem; flex-wrap:wrap; color:var(--thulira-text-muted); font-size:0.9rem;">
                  <div><strong>Contact Name:</strong> ${escapeHTML(order.customer_name)}</div>
                  <div><strong>Contact Phone:</strong> ${escapeHTML(order.customer_phone)}</div>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      
      listDiv.innerHTML = html;
    });
  </script>
</body>
</html>

```

---

## src/pages/product.html

```html
<!DOCTYPE html>

<!-- This site was created in Webflow. https://webflow.com --><!-- Last Published: Thu May 28 2026 11:30:34 GMT+0000 (Coordinated Universal Time) --><html data-wf-domain="www.thulira.com" data-wf-page="69c3b26a9ac8fa345e30eaaf" data-wf-site="6978c74eb7a56e10b85274cb" lang="en"><head><meta charset="utf-8"/><link crossorigin="anonymous" href="https://cdn.prod.website-files.com" rel="preconnect"/><title>Shop | Thulira</title><meta content="Read our latest updates on sustainability, tips for plastic-free living, and the impact of biocomposite materials." name="description"/><meta content="Projects | Thulira" property="og:title"/><meta content="Read our latest updates on sustainability, tips for plastic-free living, and the impact of biocomposite materials." property="og:description"/><meta content="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/6a0420ffaf0e855ffd198ae3_Modus%20Open%20Graph.jpg" property="og:image"/><meta content="Projects | Thulira" name="twitter:title"/><meta content="Read our latest updates on sustainability, tips for plastic-free living, and the impact of biocomposite materials." name="twitter:description"/><meta content="website" property="og:type"/><meta content="summary_large_image" name="twitter:card"/><meta content="width=device-width, initial-scale=1" name="viewport"/><meta content="Webflow" name="generator"/><link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.shared.e97910e78.min.css" integrity="sha384-6XkQ54zt5ZhQdYI3Cx7JctA/Nr8ro5njqFDfYJJIYwhTuj2/ibnU3ZsiTqnERiYm" rel="stylesheet" type="text/css"/><link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.69c3b26a9ac8fa345e30eaaf.c25eeabc9.opt.min.css" integrity="sha384-wl7qvJ2VDYtjNkf9oDRb8AAWd7e5aX/K/Dk+aTHeBByF0TeKWGuIDmgE02eQZ6T1" rel="stylesheet" type="text/css"/><style>html.w-mod-js:not(.w-mod-ix3) :is([data-popup-overlay], [data-popup-content], button[data-popup-close], [data-floatcard-1], [data-floatcard-2], [data-floatcard-3], :not([data-no-anim]) :is(.h1, .h2, .h3, .h4, .h5, .h6):not([data-no-anim]), .floating-content__text, [data-toggle-icon], .vertical-dash, [data-menu-wrapper], [data-menu-wrapper] li, [data-menu-icon-open], [data-menu-icon-close], section:first-child, .nav__component) {visibility: hidden !important;}</style><script type="text/javascript">!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);</script><link href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/6997158e5fac364205ad5ab5_Favicon.png" rel="shortcut icon" type="image/x-icon"/><link href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/699715925c02a742c5f3854f_Webclip.png" rel="apple-touch-icon"/><link href="/shop" rel="canonical"/><script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Projects",
  "description": "Explore our portfolio of eco-friendly retail, waterpeco-friendly products, and eco-friendly products projects completed across Singapore.",
  "url": "https://www.thulira.com/shop",
  "inLanguage": "en",
  "about": {
    "@type": "Organization",
    "name": "Thulira",
    "description": "100% Food Safe Eco-friendly Store in Singapore specializing in eco-friendly products.",
    "email": "info@thulira.com",
    "telephone": "+65 8235 5452",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Singapore",
      "addressCountry": "SG"
    },
    "sameAs": [
      "https://wa.me/6582355452"
    ]
  },
  "hasPart": [
    {
      "@type": "CreativeWork",
      "name": "The Journey of Rice Husk",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.thulira.com/shop"
      }
    },
    {
      "@type": "CreativeWork",
      "name": "Why We Chose eha",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.thulira.com/shop"
      }
    },
    {
      "@type": "CreativeWork",
      "name": "5 Tips for a Plastic-Free Kitchen",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.thulira.com/shop"
      }
    },
    {
      "@type": "CreativeWork",
      "name": "The Problem with Melamine",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.thulira.com/shop"
      }
    },
    {
      "@type": "CreativeWork",
      "name": "Supporting Local Farmers",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.thulira.com/shop"
      }
    },
    {
      "@type": "CreativeWork",
      "name": "Coffee Husk: Beyond the Brew",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.thulira.com/shop"
      }
    }
  ]
}
</script><link href="https://unpkg.com/lenis@1.3.17/dist/lenis.css" rel="stylesheet"/>
<script async="" src="https://plausible.io/js/pa-Sqg6vyhtWsckPaZZKPPpJ.js"></script>
<script>
  window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
  plausible.init()
</script>
<!-- Leadinfo tracking code -->
<script>
(function(l,e,a,d,i,n,f,o){if(!l[i]){l.GlobalLeadinfoNamespace=l.GlobalLeadinfoNamespace||[];
l.GlobalLeadinfoNamespace.push(i);l[i]=function(){(l[i].q=l[i].q||[]).push(arguments)};l[i].t=l[i].t||n;
l[i].q=l[i].q||[];o=e.createElement(a);f=e.getElementsByTagName(a)[0];o.async=1;o.src=d;f.parentNode.insertBefore(o,f);}
}(window,document,'script','https://cdn.leadinfo.net/ping.js','leadinfo','LI-69E624F75B59D'));
</script><link href="ecommerce.css?v=999?v=999" rel="stylesheet"/><script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script defer="" src="supabaseClient.js?v=2"></script>
<script defer="" src="cart.js?v=2"></script>
<style>
  .sticky-steps__item {
    display: flex !important;
    flex-direction: row-reverse !important;
    gap: 4rem;
  }
  .sticky-steps__text, .sticky-steps__media {
    flex: 1 !important;
    width: 50% !important;
  }
  @media (max-width: 991px) {
    .sticky-steps__item {
      flex-direction: column-reverse !important;
    }
    .sticky-steps__text, .sticky-steps__media {
      width: 100% !important;
    }
  }

  /* Process scrolling section styling */
  .process__scroll-pin {
    position: relative;
  }
  .process__stick {
    height: 100vh;
    padding-top: var(--_sizing---l);
    padding-bottom: var(--_sizing---l);
    flex-flow: column;
    justify-content: center;
    align-items: stretch;
    padding-left: 50%;
    display: flex;
    position: relative;
  }
  .process__item-content {
    grid-column-gap: 16px;
    grid-row-gap: 16px;
    grid-template-rows: auto;
    grid-template-columns: 1fr 1fr;
    grid-auto-columns: 1fr;
    display: flex;
    position: relative;
  }
  .process__item-image {
    border-top-left-radius: var(--_sizing---3xs);
    border-top-right-radius: var(--_sizing---3xs);
    border-bottom-left-radius: var(--_sizing---3xs);
    border-bottom-right-radius: var(--_sizing---3xs);
    object-fit: cover;
    width: 45%;
    height: calc(100% - 10rem);
    position: absolute;
    inset: 8rem auto 0% 0%;
  }
  .process__item-text {
    left: 50%;
    top: var(--_sizing---m);
    z-index: 10;
    grid-column-gap: var(--_sizing---s);
    grid-row-gap: var(--_sizing---s);
    opacity: 0;
    width: 50%;
    display: flex;
    position: absolute;
  }
  .process__item-heading {
    width: 50%;
    padding-top: var(--_sizing---1xs);
    padding-bottom: var(--_sizing---1xs);
    grid-column-gap: var(--_sizing---2xs);
    grid-row-gap: var(--_sizing---2xs);
    flex: none;
    justify-content: flex-start;
    align-items: center;
    display: flex;
  }
  .process__stick-line {
    background-image: linear-gradient(180deg, #0000, var(--_colors---light-grey) 15%, var(--_colors---light-grey) 85%, #0000);
    width: 1px;
    margin-left: 2px;
    position: absolute;
    inset: 10% auto 10% 75%;
  }
  .process__item-icon {
    width: var(--_sizing---l);
    height: var(--_sizing---l);
    flex: none;
  }

  @media screen and (max-width: 991px) {
    .process__stick {
      margin-top: 7rem;
      margin-bottom: var(--_sizing---m);
      padding-top: var(--_sizing---m);
      padding-right: var(--_sizing---m);
      padding-bottom: var(--_sizing---m);
      padding-left: var(--_sizing---m);
      justify-content: flex-start;
      align-items: flex-start;
      height: calc(100vh - 8.5rem);
    }
    .process__item-content {
      position: static;
    }
    .process__item-image {
      top: var(--_sizing---none);
      bottom: var(--_sizing---none);
      z-index: -1;
      filter: brightness(65%);
      width: 100%;
      height: 100%;
    }
    .process__item-text {
      width: auto;
      padding: var(--_sizing---m);
      inset: auto 0% 0%;
    }
    .process__item-wrapper {
      color: var(--_colors---white);
    }
    .process__stick-line {
      display: none;
    }
    .process__item-icon {
      flex: none;
    }
  }

  @media screen and (max-width: 767px) {
    .process__item-heading {
      width: auto;
    }
  }
</style>


<style>
  /* Prevent Webflow scaling down interaction on the page content */
  .page__wrapper,
  .main__wrapper,
  main,
  body {
    transform: none !important;
    scale: none !important;
  }
</style>

</head><body><div class="page__wrapper"><div class="nav__component" data-nav-element=""><div class="nav__wrapper" data-nav-wrapper=""><div class="nav__flex"><div class="nav__left" style="display:flex; align-items:center;"><button class="nav__toggle" data-menu-toggle-button=""><div class="icon__24 w-embed" data-menu-icon-open=""><svg aria-hidden="true" class="iconify iconify--tabler" height="24" preserveaspectratio="xMidYMid meet" role="img" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg></div><div class="icon__24 w-embed" data-menu-icon-close=""><svg aria-hidden="true" class="iconify iconify--ic" height="24" preserveaspectratio="xMidYMid meet" role="img" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z" fill="currentColor"></path></svg></div></button></div><div class="nav__center"><a class="nav__logo w-inline-block" href="/"><img src="/thulira-transparent.png" alt="Thulira Logo" style="height: 32px; width: auto; display: block;" /></a></div><div class="nav__right"><div data-hide-landscape=""><a class="button w-inline-block" href="/shop"><div>Shop Now</div></a></div></div></div><div class="nav__menu-wrapper" data-menu-wrapper=""><nav class="nav__menu-inner"><ul class="w-list-unstyled" role="list"><li><a class="nav__menu-link" href="/">Home</a></li><li><a aria-current="page" class="nav__menu-link w--current" href="/shop">Shop</a></li><li><a class="nav__menu-link" href="/blog">Blog</a></li><li><a class="nav__menu-link" href="/about">About Us</a></li></ul></nav></div></div><div class="w-embed"><style>

  [data-z-one] {
    z-index: 5;
    position: relative;
  }

  [data-margin-none] {
    margin: 0px !important;
  }

:root {

-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;

}

  .logo-marquee__image {
    -webkit-user-drag: none;
  }


  p:last-child {
    margin-bottom: 0px !important;
  }

  .h1:first-child, .h2:first-child, .h3:first-child, .h4:first-child, .h5:first-child {
    margin-top: 0px !important;
  }

  [data-height-full] {
    height: 100%;
  }

  .h1:last-child,
  .h2:last-child,
  .h3:last-child,
  .h4:last-child,
  .h5:last-child,
  .h6:last-child,
  h1:last-child,
  h2:last-child,
  h3:last-child,
  h4:last-child,
  h5:last-child,
  h6:last-child {
    margin-bottom: 0 !important;
  }

  @media (max-width: 992px) {
  [data-hide-landscape] {
    display: none !important;
  }
}

</style></div><div class="w-condition-invisible w-embed w-script"><script>
  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('[data-nav-wrapper]');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      let bc = nav.style.borderColor;
      if (window.scrollY > 40) {
        nav.style.maxWidth = '1200px';
        nav.style.borderColor = bc;
      } else {
        nav.style.maxWidth = '';
        nav.style.borderColor = '';
      }
    });

    setTimeout(() => {
      window.scrollBy(0, 3);

      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        window.scrollBy(0, -3);
      });
    }, 250);
  });
</script></div></div><main style="min-height: 80vh; display: flex; align-items: center; padding: 10rem 0 4rem 0;">
  <div class="w-layout-blockcontainer container w-container" id="product-container">
    <div style="text-align: center; padding: 5rem 0;">
      <h2 class="h2">Loading Product...</h2>
    </div>
  </div>

<script>
document.addEventListener('DOMContentLoaded', async () => {
    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
    }

    // We wait a bit for cart.js to fetch products if it hasn't already.
    // cart.js calls fetchProducts() on DOMContentLoaded.
    // Let's ensure fetchProducts is called.
    if (typeof fetchProducts === 'function') {
        await fetchProducts();
    }
    
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const container = document.getElementById('product-container');
    
    if (!productId || !PRODUCTS[productId]) {
        container.innerHTML = `
            <div style="text-align: center; padding: 5rem 0;">
                <h2 class="h2" style="margin-bottom: 2rem;">Product Not Found</h2>
                <a href="/shop" class="button w-inline-block"><div>Back to Shop</div></a>
            </div>
        `;
        return;
    }
    
    const product = PRODUCTS[productId];
    
    let variantsHtml = '';
    if (product.variants && product.variants.length > 0) {
        product.variants.forEach((v, idx) => {
            const activeClass = idx === 0 ? 'active' : '';
            variantsHtml += `<button class="size-btn ${activeClass}" data-variant="${escapeHTML(v)}" onclick="this.parentElement.querySelectorAll('.size-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="margin-right: 0.5rem; margin-bottom: 0.5rem; padding: 0.5rem 1rem; border: 1px solid #ccc; background: ${idx === 0 ? 'var(--thulira-orange)' : 'white'}; cursor: pointer;">${escapeHTML(v)}</button>`;
        });
    }

    container.innerHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 4rem; justify-content: center; align-items: stretch; max-width: 1200px; margin: 0 auto;">
            <!-- Left Side: Thumbnails and Main Image -->
            <div style="flex: 1; min-width: 300px; max-width: 600px; display: flex; gap: 1rem;">
                <div style="display: flex; flex-direction: column; gap: 1rem; width: 80px;">
                    <div class="thumbnail-btn active" style="width: 100%; aspect-ratio: 1; background: #f5f5f5; border-radius: 8px; cursor: pointer; border: 2px solid var(--thulira-orange); overflow: hidden;">
                        <img src="${escapeHTML(product.image_url) || 'https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder'}" style="width: 100%; height: 100%; object-fit: cover;"/>
                    </div>
                    <div class="thumbnail-btn" style="width: 100%; aspect-ratio: 1; background: #f5f5f5; border-radius: 8px; cursor: pointer; border: 2px solid transparent; opacity: 0.6; overflow: hidden; transition: opacity 0.2s;">
                        <img src="https://placehold.co/800x600/e0e0e0/555555?text=Angle+2" style="width: 100%; height: 100%; object-fit: cover;"/>
                    </div>
                    <div class="thumbnail-btn" style="width: 100%; aspect-ratio: 1; background: #f5f5f5; border-radius: 8px; cursor: pointer; border: 2px solid transparent; opacity: 0.6; overflow: hidden; transition: opacity 0.2s;">
                        <img src="https://placehold.co/800x600/e0e0e0/555555?text=Angle+3" style="width: 100%; height: 100%; object-fit: cover;"/>
                    </div>
                </div>
                <div style="flex: 1; padding-top: 100%; position: relative; border-radius: 12px; overflow: hidden; background: #f5f5f5;">
                    <img id="main-product-image" src="${escapeHTML(product.image_url) || 'https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder'}" alt="${escapeHTML(product.name)}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s ease;"/>
                </div>
            </div>
            
            <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; justify-content: center;">
                <div style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 1rem;">${escapeHTML(product.category)}</div>
                <h1 class="h2" style="margin-bottom: 1.5rem; font-size: 3rem;">${escapeHTML(product.name)}</h1>
                <div style="font-size: 2rem; font-weight: 800; color: var(--thulira-orange); margin-bottom: 2rem;">$${escapeHTML(product.price)}</div>
                
                <p style="font-size: 1.1rem; line-height: 1.6; color: #444; margin-bottom: 2.5rem;">${escapeHTML(product.description)}</p>
                
                ${variantsHtml ? `
                <div style="margin-bottom: 1.5rem;">
                    <div style="font-weight: 700; margin-bottom: 0.75rem; font-size: 1.1rem;">Select Size / Variant</div>
                    <div style="display: flex; flex-wrap: wrap;" id="product-variants-container">
                        ${variantsHtml}
                    </div>
                </div>
                ` : ''}
                
                <!-- Color Selector -->
                <div style="margin-bottom: 2rem;">
                    <div style="font-weight: 700; margin-bottom: 0.75rem; font-size: 1.1rem;">Select Color</div>
                    <div style="display: flex; gap: 1rem;" id="product-colors-container">
                        <div class="color-btn active" style="width: 36px; height: 36px; border-radius: 50%; background-color: #333333; cursor: pointer; border: 2px solid white; box-shadow: 0 0 0 2px var(--thulira-orange);"></div>
                        <div class="color-btn" style="width: 36px; height: 36px; border-radius: 50%; background-color: #f5f5dc; cursor: pointer; border: 2px solid white; box-shadow: 0 0 0 2px transparent; transition: box-shadow 0.2s;"></div>
                        <div class="color-btn" style="width: 36px; height: 36px; border-radius: 50%; background-color: #8f9779; cursor: pointer; border: 2px solid white; box-shadow: 0 0 0 2px transparent; transition: box-shadow 0.2s;"></div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 2rem;">
                    <button onclick="
                        const activeSize = document.getElementById('product-variants-container') ? document.getElementById('product-variants-container').querySelector('.size-btn.active') : null;
                        const variant = activeSize ? activeSize.getAttribute('data-variant') : 'Standard';
                        addToCart('${product.id}', variant, 1);
                        openCartDrawer();
                    " class="button" style="flex: 1; font-size: 1.2rem; padding: 1.25rem; display: flex; justify-content: center; align-items: center;">
                        Add to Cart
                    </button>
                </div>



                
                <div style="border-top: 1px solid #eaeaea; padding-top: 2rem;">
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                        <span style="font-weight: 600;">Sustainable Materials</span>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <span style="font-weight: 600;">100% Food Safe</span>
                    </div>
                </div>
            </div>
        </div>
    `;



    // Add logic to style the variant buttons
    const variantBtns = container.querySelectorAll('.size-btn');
    variantBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            variantBtns.forEach(b => {
                b.style.background = 'white';
                b.style.color = 'black';
            });
            this.style.background = 'var(--thulira-orange)';
            this.style.color = 'white';
        });
    });
    
    // Set initial active state correctly
    const activeBtn = container.querySelector('.size-btn.active');
    if(activeBtn) {
        activeBtn.style.background = 'var(--thulira-orange)';
        activeBtn.style.color = 'white';
    }
    
    // Thumbnail clicking logic
    const thumbnails = container.querySelectorAll('.thumbnail-btn');
    const mainImage = document.getElementById('main-product-image');
    thumbnails.forEach(thumb => {
        thumb.addEventListener('mouseover', function() {
            if(!this.classList.contains('active')) this.style.opacity = '1';
        });
        thumb.addEventListener('mouseout', function() {
            if(!this.classList.contains('active')) this.style.opacity = '0.6';
        });
        
        thumb.addEventListener('click', function() {
            thumbnails.forEach(t => {
                t.classList.remove('active');
                t.style.borderColor = 'transparent';
                t.style.opacity = '0.6';
            });
            this.classList.add('active');
            this.style.borderColor = 'var(--thulira-orange)';
            this.style.opacity = '1';
            
            // Swap image source
            const img = this.querySelector('img');
            if(img && mainImage) {
                mainImage.style.opacity = '0.5';
                setTimeout(() => {
                    mainImage.src = img.src;
                    mainImage.style.opacity = '1';
                }, 150);
            }
        });
    });
    
    // Color selector clicking logic
    const colorBtns = container.querySelectorAll('.color-btn');
    colorBtns.forEach(cbtn => {
        cbtn.addEventListener('click', function() {
            colorBtns.forEach(cb => {
                cb.classList.remove('active');
                cb.style.boxShadow = '0 0 0 2px transparent';
            });
            this.classList.add('active');
            this.style.boxShadow = '0 0 0 2px var(--thulira-orange)';
        });
    });
});
</script>

</main>



<section class="section"><div class="w-layout-blockcontainer container w-container"><div class="row"><div class="col__1"><div class="col"><div class="center-content"><h2 class="h1">Our Proven<br/>Process</h2></div></div></div><div class="process__scroll-pin" data-process-pin=""><div class="process__stick" data-process-stick=""><div class="process__item-wrapper" data-proces-item=""><img alt="Hand wijst met pen op architectuurplattegronden op een bureau met laptop, telefoon en een kop koffie." class="process__item-image" data-process-image="" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="process__item-content"><div class="process__item-heading" data-process-heading=""><div class="process__item-icon w-embed" data-process-icon=""><svg aria-hidden="true" height="32" viewbox="0 0 40 40" width="32">
<circle cx="20" cy="20" fill="none" opacity="0.15" r="16" stroke="currentColor" stroke-width="3"></circle>
<circle cx="20" cy="20" data-process-ring="" fill="none" r="16" stroke="currentColor" stroke-linecap="round" stroke-width="3" transform="rotate(-90 20 20)"></circle>
</svg></div><h3 class="h3" data-margin-none="">Diagnostics &amp; Site Inspection</h3></div><div class="process__item-text" data-process-content=""><div class="vertical-dash is-highlight"></div><p>We begin with a thorough thermal imaging and moisture diagnostics inspection of your site to identify current product vulnerabilities and outline accurate builder requirements.</p></div></div></div><div class="process__item-wrapper" data-proces-item=""><img alt="Twee mannen bekijken tegelstalen in een showroom, met een rek vol verschillende kleuren en texturen tegels." class="process__item-image" data-process-image="" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="process__item-content"><div class="process__item-heading" data-process-heading=""><div class="process__item-icon w-embed" data-process-icon=""><svg aria-hidden="true" height="32" viewbox="0 0 40 40" width="32">
<circle cx="20" cy="20" fill="none" opacity="0.15" r="16" stroke="currentColor" stroke-width="3"></circle>
<circle cx="20" cy="20" data-process-ring="" fill="none" r="16" stroke="currentColor" stroke-linecap="round" stroke-width="3" transform="rotate(-90 20 20)"></circle>
</svg></div><h3 class="h3" data-margin-none="">Integrated Design &amp; Build</h3></div><div class="process__item-text" data-process-content=""><div class="vertical-dash is-highlight"></div><p>Our in-house design and engineering teams develop a customized proposal, selecting appropriate waterpeco-friendly products membranes, UV materials, and product materials.</p></div></div></div><div class="process__item-wrapper" data-proces-item=""><img alt="Hand tekent op een projectplanning met een pen naast markeerstiften and papieren op een bureau." class="process__item-image" data-process-image="" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="process__item-content"><div class="process__item-heading" data-process-heading=""><div class="process__item-icon w-embed" data-process-icon=""><svg aria-hidden="true" height="32" viewbox="0 0 40 40" width="32">
<circle cx="20" cy="20" fill="none" opacity="0.15" r="16" stroke="currentColor" stroke-width="3"></circle>
<circle cx="20" cy="20" data-process-ring="" fill="none" r="16" stroke="currentColor" stroke-linecap="round" stroke-width="3" transform="rotate(-90 20 20)"></circle>
</svg></div><h3 class="h3" data-margin-none="">Safety &amp; Quality Execution</h3></div><div class="process__item-text" data-process-content=""><div class="vertical-dash is-highlight"></div><p>Our licensed, safety-certified builders execute construction under strict BCA Class I guidelines, ensuring maximum safety, quality control, and regulatory compliance.</p></div></div></div><div class="process__item-wrapper" data-proces-item=""><img alt="Stapel dozen verpakt in plastic op een metalen kar met vier wielen in een magazijn, met een label 'Sanitair Bouwnummer 24'." class="process__item-image" data-process-image="" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="process__item-content"><div class="process__item-heading" data-process-heading=""><div class="process__item-icon w-embed" data-process-icon=""><svg aria-hidden="true" height="32" viewbox="0 0 40 40" width="32">
<circle cx="20" cy="20" fill="none" opacity="0.15" r="16" stroke="currentColor" stroke-width="3"></circle>
<circle cx="20" cy="20" data-process-ring="" fill="none" r="16" stroke="currentColor" stroke-linecap="round" stroke-width="3" transform="rotate(-90 20 20)"></circle>
</svg></div><h3 class="h3" data-margin-none="">Warranty &amp; Support</h3></div><div class="process__item-text" data-process-content=""><div class="vertical-dash is-highlight"></div><p>We provide up to a 10-year warranty on selected works, backed by our 24-hour rapid response emergency hotline for immediate assistance with any product defects.</p></div></div></div><div class="process__stick-line"></div></div></div></div><div class="w-condition-invisible w-embed w-script"><script>
document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const section = document.querySelector(".process__scroll-pin");
  const stick = section?.querySelector(".process__stick");
  const items = stick ? gsap.utils.toArray(stick.querySelectorAll("[data-proces-item]")) : [];

  if (!section || !stick || !items.length) return;

  gsap.set(stick, { clearProps: "position,top" });

  const ICON_SIZE = 32;
  const INACTIVE_HEADING_OPACITY = 0.25;

  const states = items.map((item, index) => {
    const image = item.querySelector("[data-process-image]");
    const content = item.querySelector("[data-process-content]");
    const heading = item.querySelector("[data-process-heading]");
    const iconWrap = item.querySelector("[data-process-icon]");

    if (!image || !content || !heading || !iconWrap) return null;

    iconWrap.innerHTML = `
      <svg viewBox="0 0 40 40" width="32" height="32" aria-hidden="true">
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          opacity="0.15"
        />
        <circle
          data-process-ring
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          transform="rotate(-90 20 20)"
        />
      </svg>
    `;

    const ring = iconWrap.querySelector("[data-process-ring]");
    const circumference = 2 * Math.PI * 16;

    gsap.set(ring, {
      strokeDasharray: circumference,
      strokeDashoffset: circumference
    });

    gsap.set(iconWrap, {
      width: index === 0 ? ICON_SIZE : 0,
      opacity: index === 0 ? 1 : 0,
      overflow: "hidden",
      flexShrink: 0,
      display: "inline-flex"
    });

    return {
      item,
      image,
      content,
      heading,
      iconWrap,
      ring,
      circumference,
      index
    };
  }).filter(Boolean);

  let currentIndex = 0;
  let isAnimating = false;

  function setRingProgress(state, progress) {
    const clamped = gsap.utils.clamp(0, 1, progress);
    const offset = state.circumference * (1 - clamped);
    gsap.set(state.ring, { strokeDashoffset: offset });
  }

  function setInitialState() {
    states.forEach((state, index) => {
      gsap.set(state.image, { opacity: index === 0 ? 1 : 0 });
      gsap.set(state.content, { opacity: index === 0 ? 1 : 0 });
      gsap.set(state.heading, {
        opacity: index === 0 ? 1 : INACTIVE_HEADING_OPACITY
      });
      setRingProgress(state, 0);
    });
  }

  function showItem(newIndex, direction = "forward") {
    if (newIndex === currentIndex || isAnimating) return;
    if (newIndex < 0 || newIndex >= states.length) return;

    isAnimating = true;

    const current = states[currentIndex];
    const next = states[newIndex];

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        currentIndex = newIndex;
        isAnimating = false;
      }
    });

    // hide current
    tl.to(current.image, { opacity: 0, duration: 0.35 }, 0);
    tl.to(current.content, { opacity: 0, duration: 0.35 }, 0);
    tl.to(current.heading, { opacity: INACTIVE_HEADING_OPACITY, duration: 0.35 }, 0);
    tl.to(current.iconWrap, {
      width: 0,
      opacity: 0,
      duration: 0.3
    }, 0);

    // show next
    tl.to(next.image, { opacity: 1, duration: 0.35 }, 0);
    tl.to(next.content, { opacity: 1, duration: 0.35 }, 0);
    tl.to(next.heading, { opacity: 1, duration: 0.35 }, 0);

    tl.set(next.iconWrap, { opacity: 1 }, 0.12);
    tl.to(next.iconWrap, {
      width: ICON_SIZE,
      duration: 0.3
    }, 0.12);

    tl.set(next.ring, { strokeDashoffset: next.circumference }, 0.12);
  }

  setInitialState();

  const stepSize = () => window.innerHeight;
  const totalScroll = () => window.innerHeight * states.length;

  ScrollTrigger.create({
    trigger: section,
    pin: stick,
    start: "top top",
    end: () => `+=${totalScroll()}`,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true
  });

  for (let i = 1; i < states.length; i++) {
    ScrollTrigger.create({
      trigger: section,
      start: () => `top top-=${stepSize() * i}`,
      end: () => `top top-=${stepSize() * i + 1}`,
      onEnter: () => showItem(i, "forward"),
      onLeaveBack: () => showItem(i - 1, "backward"),
      invalidateOnRefresh: true
    });
  }

  states.forEach((state, index) => {
    ScrollTrigger.create({
      trigger: section,
      start: () => `top top-=${stepSize() * index}`,
      end: () => `top top-=${stepSize() * (index + 1)}`,
      onUpdate: (self) => {
        if (currentIndex !== index) return;
        setRingProgress(state, self.progress);
      },
      onEnter: () => {
        if (currentIndex === index) {
          gsap.set(state.iconWrap, { opacity: 1, width: ICON_SIZE });
          gsap.set(state.heading, { opacity: 1 });
          setRingProgress(state, 0);
        }
      },
      onEnterBack: () => {
        if (currentIndex === index) {
          gsap.set(state.iconWrap, { opacity: 1, width: ICON_SIZE });
          gsap.set(state.heading, { opacity: 1 });
          setRingProgress(state, 1);
        }
      },
      onLeave: () => {
        if (currentIndex === index) {
          setRingProgress(state, 1);
        }
      },
      onLeaveBack: () => {
        if (currentIndex === index) {
          setRingProgress(state, 0);
        }
      },
      invalidateOnRefresh: true
    });
  });

  ScrollTrigger.refresh();
});
</script></div></section><section class="section is__dark v__footer"><div class="z-1"><div class="w-layout-blockcontainer container w-container"><div class="row"><div class="col__footer"><div class="col" id="w-node-_59d0562d-fb65-eaa0-fc67-8e3d4af3a4e3-4af3a4d1"><p class="h4">Sustainable biocomposite home products including bottles and drinkware.</p><p class="mb__m">Ethically sourced, highly durable, and 100% food-safe sustainable alternatives.</p><a class="button w-inline-block" href="/shop"><div>Shop Now</div></a></div><nav class="col"><div class="footer__text is__heading">Menu</div><ul class="w-list-unstyled" role="list"><li><a class="footer__text" href="/">Home</a></li><li><a class="footer__text" href="/about">About Us</a></li><li><a aria-current="page" class="footer__text w--current" href="/shop">Shop</a></li><li><a class="footer__text" href="/blog">Blog</a></li></ul></nav><nav class="col"><div class="footer__text is__heading">Contact</div><ul class="w-list-unstyled" role="list"><li><a class="footer__text" href="mailto:info@thulira.com">info@thulira.com</a></li><li><a class="footer__text" href="tel:+6582355452">+65 8235 5452</a></li><li><a class="footer__text" href="https://wa.me/6582355452" target="_blank">WhatsApp</a></li><li><div class="footer__text">Sustainable Materials</div></li><li><div class="footer__text">100% Food Safe</div></li><li><div class="footer__text">Island-wide Delivery</div></li></ul></nav></div><div class="col__1"><div class="col"><div class="w-embed"><div class="footer__logo-text-wrap" style="width: 100%; display: flex; justify-content: center; align-items: center; padding: 2rem 0; box-sizing: border-box;"><h2 style="font-family: 'Inter', sans-serif; font-size: calc(2rem + 3.5vw); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.06); text-align: center; margin: 0; line-height: 0.9; user-select: none;">Thulira</h2></div></div></div><div class="col__1"><div class="col"><div class="imprint__wrapper"><a class="imprint__text" href="https://www.overflow.nl">By Overflow</a></div></div></div></div></div></div><div class="footer__deco v-footer w-embed"><svg fill="none" height="100%" viewbox="0 0 151 850" width="100%" xmlns="http://www.w3.org/2000/svg">
<path d="M0 -26H6.56522L6.56522 851H0L0 -26Z" fill="url(#paint0_linear_2462_171)"></path>
<path d="M19.6957 -26H32.8261L32.8261 851H19.6957L19.6957 -26Z" fill="url(#paint1_linear_2462_171)"></path>
<path d="M45.9565 -26H65.6522L65.6522 851H45.9565L45.9565 -26Z" fill="url(#paint2_linear_2462_171)"></path>
<path d="M78.7826 -26L105.043 -26L105.043 851H78.7826L78.7826 -26Z" fill="url(#paint3_linear_2462_171)"></path>
<path d="M118.174 -26L151 -26L151 851H118.174L118.174 -26Z" fill="url(#paint4_linear_2462_171)"></path>
<defs>
<lineargradient gradientunits="userSpaceOnUse" id="paint0_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint1_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint2_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint3_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint4_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
</defs>
</svg></div></div></section></footer></div><script crossorigin="anonymous" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=6978c74eb7a56e10b85274cb" type="text/javascript"></script><script crossorigin="anonymous" integrity="sha384-eLhtiOwpAcsrjTU3szoidTK2FT4sgwN998/lRT314vxiyUJEzKSwZ02q/f+3Y8k8" src="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/js/webflow.schunk.05ab46bf443beb37.js" type="text/javascript"></script><script crossorigin="anonymous" integrity="sha384-EVx92WuQb9mkhZNxF68hHdqG3YKkx56dL/nD5M2q9oiJEb7dNT9DlzNekRovfOhz" src="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/js/webflow.5546c6e4.499238e9946a7c5f.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/gsap.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/ScrollTrigger.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/Observer.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/Draggable.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/SplitText.min.js" type="text/javascript"></script><script type="text/javascript">gsap.registerPlugin(ScrollTrigger,Observer,Draggable,SplitText);</script><script src="https://unpkg.com/lenis@1.3.17/dist/lenis.min.js"></script>
<script>
  
const lenis = new Lenis();

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000); // Convert time from seconds to milliseconds
});

gsap.ticker.lagSmoothing(0);

  
</script></body></html>
```

---

## src/pages/shop.html

```html
<!DOCTYPE html>

<!-- This site was created in Webflow. https://webflow.com --><!-- Last Published: Thu May 28 2026 11:30:34 GMT+0000 (Coordinated Universal Time) --><html data-wf-domain="www.thulira.com" data-wf-page="69c3b26a9ac8fa345e30eaaf" data-wf-site="6978c74eb7a56e10b85274cb" lang="en"><head><meta charset="utf-8"/><link crossorigin="anonymous" href="https://cdn.prod.website-files.com" rel="preconnect"/><title>Shop | Thulira</title><meta content="Read our latest updates on sustainability, tips for plastic-free living, and the impact of biocomposite materials." name="description"/><meta content="Projects | Thulira" property="og:title"/><meta content="Read our latest updates on sustainability, tips for plastic-free living, and the impact of biocomposite materials." property="og:description"/><meta content="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/6a0420ffaf0e855ffd198ae3_Modus%20Open%20Graph.jpg" property="og:image"/><meta content="Projects | Thulira" name="twitter:title"/><meta content="Read our latest updates on sustainability, tips for plastic-free living, and the impact of biocomposite materials." name="twitter:description"/><meta content="website" property="og:type"/><meta content="summary_large_image" name="twitter:card"/><meta content="width=device-width, initial-scale=1" name="viewport"/><meta content="Webflow" name="generator"/><link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.shared.e97910e78.min.css" integrity="sha384-6XkQ54zt5ZhQdYI3Cx7JctA/Nr8ro5njqFDfYJJIYwhTuj2/ibnU3ZsiTqnERiYm" rel="stylesheet" type="text/css"/><link crossorigin="anonymous" href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/css/modus-projects-6db04b.webflow.69c3b26a9ac8fa345e30eaaf.c25eeabc9.opt.min.css" integrity="sha384-wl7qvJ2VDYtjNkf9oDRb8AAWd7e5aX/K/Dk+aTHeBByF0TeKWGuIDmgE02eQZ6T1" rel="stylesheet" type="text/css"/><style>html.w-mod-js:not(.w-mod-ix3) :is([data-popup-overlay], [data-popup-content], button[data-popup-close], [data-floatcard-1], [data-floatcard-2], [data-floatcard-3], :not([data-no-anim]) :is(.h1, .h2, .h3, .h4, .h5, .h6):not([data-no-anim]), .floating-content__text, [data-toggle-icon], .vertical-dash, [data-menu-wrapper], [data-menu-wrapper] li, [data-menu-icon-open], [data-menu-icon-close], section:first-child, .nav__component) {visibility: hidden !important;}</style><script type="text/javascript">!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);</script><link href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/6997158e5fac364205ad5ab5_Favicon.png" rel="shortcut icon" type="image/x-icon"/><link href="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/699715925c02a742c5f3854f_Webclip.png" rel="apple-touch-icon"/><link href="/shop" rel="canonical"/><script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Projects",
  "description": "Explore our portfolio of eco-friendly retail, waterpeco-friendly products, and eco-friendly products projects completed across Singapore.",
  "url": "https://www.thulira.com/shop",
  "inLanguage": "en",
  "about": {
    "@type": "Organization",
    "name": "Thulira",
    "description": "100% Food Safe Eco-friendly Store in Singapore specializing in eco-friendly products.",
    "email": "info@thulira.com",
    "telephone": "+65 8235 5452",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Singapore",
      "addressCountry": "SG"
    },
    "sameAs": [
      "https://wa.me/6582355452"
    ]
  },
  "hasPart": [
    {
      "@type": "CreativeWork",
      "name": "The Journey of Rice Husk",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.thulira.com/shop"
      }
    },
    {
      "@type": "CreativeWork",
      "name": "Why We Chose eha",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.thulira.com/shop"
      }
    },
    {
      "@type": "CreativeWork",
      "name": "5 Tips for a Plastic-Free Kitchen",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.thulira.com/shop"
      }
    },
    {
      "@type": "CreativeWork",
      "name": "The Problem with Melamine",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.thulira.com/shop"
      }
    },
    {
      "@type": "CreativeWork",
      "name": "Supporting Local Farmers",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.thulira.com/shop"
      }
    },
    {
      "@type": "CreativeWork",
      "name": "Coffee Husk: Beyond the Brew",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.thulira.com/shop"
      }
    }
  ]
}
</script><link href="https://unpkg.com/lenis@1.3.17/dist/lenis.css" rel="stylesheet"/>
<script async="" src="https://plausible.io/js/pa-Sqg6vyhtWsckPaZZKPPpJ.js"></script>
<script>
  window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
  plausible.init()
</script>
<!-- Leadinfo tracking code -->
<script>
(function(l,e,a,d,i,n,f,o){if(!l[i]){l.GlobalLeadinfoNamespace=l.GlobalLeadinfoNamespace||[];
l.GlobalLeadinfoNamespace.push(i);l[i]=function(){(l[i].q=l[i].q||[]).push(arguments)};l[i].t=l[i].t||n;
l[i].q=l[i].q||[];o=e.createElement(a);f=e.getElementsByTagName(a)[0];o.async=1;o.src=d;f.parentNode.insertBefore(o,f);}
}(window,document,'script','https://cdn.leadinfo.net/ping.js','leadinfo','LI-69E624F75B59D'));
</script><link href="ecommerce.css?v=999?v=999" rel="stylesheet"/><script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script defer="" src="supabaseClient.js?v=2"></script>
<script defer="" src="cart.js?v=2"></script>
<style>
  /* Prevent Webflow scaling down interaction on the page content */
  .page__wrapper,
  .main__wrapper,
  main,
  body {
    transform: none !important;
    scale: none !important;
  }
</style>

</head><body><div class="page__wrapper"><div class="nav__component" data-nav-element=""><div class="nav__wrapper" data-nav-wrapper=""><div class="nav__flex"><div class="nav__left" style="display:flex; align-items:center;"><button class="nav__toggle" data-menu-toggle-button=""><div class="icon__24 w-embed" data-menu-icon-open=""><svg aria-hidden="true" class="iconify iconify--tabler" height="24" preserveaspectratio="xMidYMid meet" role="img" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg></div><div class="icon__24 w-embed" data-menu-icon-close=""><svg aria-hidden="true" class="iconify iconify--ic" height="24" preserveaspectratio="xMidYMid meet" role="img" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z" fill="currentColor"></path></svg></div></button></div><div class="nav__center"><a class="nav__logo w-inline-block" href="/"><img src="/thulira-transparent.png" alt="Thulira Logo" style="height: 32px; width: auto; display: block;" /></a></div><div class="nav__right"><div data-hide-landscape=""><a class="button w-inline-block" href="/shop"><div>Shop Now</div></a></div></div></div><div class="nav__menu-wrapper" data-menu-wrapper=""><nav class="nav__menu-inner"><ul class="w-list-unstyled" role="list"><li><a class="nav__menu-link" href="/">Home</a></li><li><a aria-current="page" class="nav__menu-link w--current" href="/shop">Shop</a></li><li><a class="nav__menu-link" href="/blog">Blog</a></li><li><a class="nav__menu-link" href="/about">About Us</a></li></ul></nav></div></div><div class="w-embed"><style>

  [data-z-one] {
    z-index: 5;
    position: relative;
  }

  [data-margin-none] {
    margin: 0px !important;
  }

:root {

-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;

}

  .logo-marquee__image {
    -webkit-user-drag: none;
  }


  p:last-child {
    margin-bottom: 0px !important;
  }

  .h1:first-child, .h2:first-child, .h3:first-child, .h4:first-child, .h5:first-child {
    margin-top: 0px !important;
  }

  [data-height-full] {
    height: 100%;
  }

  .h1:last-child,
  .h2:last-child,
  .h3:last-child,
  .h4:last-child,
  .h5:last-child,
  .h6:last-child,
  h1:last-child,
  h2:last-child,
  h3:last-child,
  h4:last-child,
  h5:last-child,
  h6:last-child {
    margin-bottom: 0 !important;
  }

  @media (max-width: 992px) {
  [data-hide-landscape] {
    display: none !important;
  }
}

</style></div><div class="w-condition-invisible w-embed w-script"><script>
  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('[data-nav-wrapper]');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      let bc = nav.style.borderColor;
      if (window.scrollY > 40) {
        nav.style.maxWidth = '1200px';
        nav.style.borderColor = bc;
      } else {
        nav.style.maxWidth = '';
        nav.style.borderColor = '';
      }
    });

    setTimeout(() => {
      window.scrollBy(0, 3);

      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        window.scrollBy(0, -3);
      });
    }, 250);
  });
</script></div></div><main><section class="section is__dark v-hero"><div class="w-layout-blockcontainer container w-container"><div class="col__1"><div class="col" id="w-node-cb64a828-d545-806e-cd02-0c2eb11bcbb1-5e30eaaf"><div><div class="center-content"><h1 class="h1">Insights &amp;<br/>Stories.</h1><p class="max__400">Read our latest updates on sustainability, tips for plastic-free living, and the impact of biocomposite materials on local farming.</p></div></div></div></div></div></section><section class="section">
<div class="w-layout-blockcontainer container w-container">
<div id="bottles" style="margin-bottom: 2rem; scroll-margin-top: 120px;">
  <h2 class="h2">Bottles</h2>
</div>
<div class="col__1">
  <div class="col w-dyn-list">
    <div id="bottlesGrid" class="projecten__grid w-dyn-items" role="list">
    </div>
  </div>
</div>
<div id="drinkware" style="margin-top: 5rem; margin-bottom: 2rem; scroll-margin-top: 120px;">
  <h2 class="h2">Drinkware</h2>
</div>
<div class="col__1">
  <div class="col w-dyn-list">
    <div id="drinkwareGrid" class="projecten__grid w-dyn-items" role="list">
    </div>
  </div>
</div>
</div>
</section><div class="w-layout-blockcontainer container w-container"><div class="divider"></div></div><section class="section data-floating-content-section="" data-wf--floating-content--variant="switch"><div class="w-layout-blockcontainer container w-container"><div class="col__2"><div class="col" id="w-node-_0f278562-46a9-107a-163f-6597f4ca1bea-f4ca1be7"><div class="floating-content__text"><h2 class="h2">A Trusted Sustainability Partner</h2><p class="mb__l">Thulira delivers curated excellence across all sustainable products. We focus on durability, safety, and transparent sourcing. Our key strengths include:</p><div><div class="check-item"><div class="icon__24 w-embed"><svg fill="none" height="24" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M11.0001 16.1698L7.53015 12.6998C7.34317 12.5129 7.08957 12.4078 6.82515 12.4078C6.56072 12.4078 6.30712 12.5129 6.12015 12.6998C5.93317 12.8868 5.82812 13.1404 5.82812 13.4048C5.82813 13.5358 5.85391 13.6654 5.90402 13.7864C5.95412 13.9073 6.02756 14.0173 6.12015 14.1098L10.3001 18.2898C10.6901 18.6798 11.3201 18.6798 11.7101 18.2898L22.2901 7.70983C22.4771 7.52286 22.5822 7.26926 22.5822 7.00483C22.5822 6.74041 22.4771 6.48681 22.2901 6.29983C22.1032 6.11286 21.8496 6.00781 21.5851 6.00781C21.3207 6.00781 21.0671 6.11286 20.8801 6.29983L11.0001 16.1698Z" fill="black"></path>
</svg></div><p>100% Food Safe</p></div><div class="check-item"><div class="icon__24 w-embed"><svg fill="none" height="24" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M11.0001 16.1698L7.53015 12.6998C7.34317 12.5129 7.08957 12.4078 6.82515 12.4078C6.56072 12.4078 6.30712 12.5129 6.12015 12.6998C5.93317 12.8868 5.82812 13.1404 5.82812 13.4048C5.82813 13.5358 5.85391 13.6654 5.90402 13.7864C5.95412 13.9073 6.02756 14.0173 6.12015 14.1098L10.3001 18.2898C10.6901 18.6798 11.3201 18.6798 11.7101 18.2898L22.2901 7.70983C22.4771 7.52286 22.5822 7.26926 22.5822 7.00483C22.5822 6.74041 22.4771 6.48681 22.2901 6.29983C22.1032 6.11286 21.8496 6.00781 21.5851 6.00781C21.3207 6.00781 21.0671 6.11286 20.8801 6.29983L11.0001 16.1698Z" fill="black"></path>
</svg></div><p>Highly Durable</p></div><div class="check-item"><div class="icon__24 w-embed"><svg fill="none" height="24" viewbox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M11.0001 16.1698L7.53015 12.6998C7.34317 12.5129 7.08957 12.4078 6.82515 12.4078C6.56072 12.4078 6.30712 12.5129 6.12015 12.6998C5.93317 12.8868 5.82812 13.1404 5.82812 13.4048C5.82813 13.5358 5.85391 13.6654 5.90402 13.7864C5.95412 13.9073 6.02756 14.0173 6.12015 14.1098L10.3001 18.2898C10.6901 18.6798 11.3201 18.6798 11.7101 18.2898L22.2901 7.70983C22.4771 7.52286 22.5822 7.26926 22.5822 7.00483C22.5822 6.74041 22.4771 6.48681 22.2901 6.29983C22.1032 6.11286 21.8496 6.00781 21.5851 6.00781C21.3207 6.00781 21.0671 6.11286 20.8801 6.29983L11.0001 16.1698Z" fill="black"></path>
</svg></div><p>Locally Sourced</p></div></div></div></div><div class="col w-variant-d62a4a43-e6a5-9028-32fe-1a4b4f65e535" id="w-node-_0f278562-46a9-107a-163f-6597f4ca1bf0-f4ca1be7"><img alt="Moderne slaapkamer met beige muren, hangende witte nachtkast en een dubbele wastafel met ovale spiegels en gouden kranen." class="floating-content__image" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div></div></section></main><footer class="footer__wrapper"><section class="footer__topper"><div class="w-layout-blockcontainer container w-container"><div class="col__1"><div class="col"><div class="z-1"><div class="center-content"><div class="max__500"><div class="mb__l"><h3 class="h3 is__bigger">Built on Trust.<br/>Proven by Results.</h3></div><a class="button w-inline-block" href="/shop"><div>Shop Now</div></a><div class="cta-people"><img alt="Thulira team consulting during a site inspection." loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><div class="opacity__65">Get in touch today</div></div></div></div></div><img alt="Modern wastafel met een houten kast met verticale lijnen, een metalen kraan, en twee tandenborstels in een roze glazen houder tegen een lichte terrazzo muur." class="cta-image is__1" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><img alt="Zwarte vrijstaande badkraan naast een wit bad en een beige gevlochten poef met een witte handdoek in een moderne badkamer." class="cta-image is__2" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/><img alt="Minimalistisch badkamerinterieur met hangende houten wastafel, asymmetrische verlichte spiegel en vrijstaand wit bad met mand voor handdoeken." class="cta-image is__3" loading="lazy" src="https://placehold.co/800x600/e0e0e0/555555?text=Image+Placeholder"/></div></div></div></section><section class="section is__dark v__footer"><div class="z-1"><div class="w-layout-blockcontainer container w-container"><div class="row"><div class="col__footer"><div class="col" id="w-node-_59d0562d-fb65-eaa0-fc67-8e3d4af3a4e3-4af3a4d1"><p class="h4">Sustainable biocomposite home products including bottles and drinkware.</p><p class="mb__m">Ethically sourced, highly durable, and 100% food-safe sustainable alternatives.</p><a class="button w-inline-block" href="/shop"><div>Shop Now</div></a></div><nav class="col"><div class="footer__text is__heading">Menu</div><ul class="w-list-unstyled" role="list"><li><a class="footer__text" href="/">Home</a></li><li><a class="footer__text" href="/about">About Us</a></li><li><a aria-current="page" class="footer__text w--current" href="/shop">Shop</a></li><li><a class="footer__text" href="/blog">Blog</a></li></ul></nav><nav class="col"><div class="footer__text is__heading">Contact</div><ul class="w-list-unstyled" role="list"><li><a class="footer__text" href="mailto:info@thulira.com">info@thulira.com</a></li><li><a class="footer__text" href="tel:+6582355452">+65 8235 5452</a></li><li><a class="footer__text" href="https://wa.me/6582355452" target="_blank">WhatsApp</a></li><li><div class="footer__text">Sustainable Materials</div></li><li><div class="footer__text">100% Food Safe</div></li><li><div class="footer__text">Island-wide Delivery</div></li></ul></nav></div><div class="col__1"><div class="col"><div class="w-embed"><div class="footer__logo-text-wrap" style="width: 100%; display: flex; justify-content: center; align-items: center; padding: 2rem 0; box-sizing: border-box;"><h2 style="font-family: 'Inter', sans-serif; font-size: calc(2rem + 3.5vw); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.06); text-align: center; margin: 0; line-height: 0.9; user-select: none;">Thulira</h2></div></div></div><div class="col__1"><div class="col"><div class="imprint__wrapper"><a class="imprint__text" href="https://www.overflow.nl">By Overflow</a></div></div></div></div></div></div><div class="footer__deco v-footer w-embed"><svg fill="none" height="100%" viewbox="0 0 151 850" width="100%" xmlns="http://www.w3.org/2000/svg">
<path d="M0 -26H6.56522L6.56522 851H0L0 -26Z" fill="url(#paint0_linear_2462_171)"></path>
<path d="M19.6957 -26H32.8261L32.8261 851H19.6957L19.6957 -26Z" fill="url(#paint1_linear_2462_171)"></path>
<path d="M45.9565 -26H65.6522L65.6522 851H45.9565L45.9565 -26Z" fill="url(#paint2_linear_2462_171)"></path>
<path d="M78.7826 -26L105.043 -26L105.043 851H78.7826L78.7826 -26Z" fill="url(#paint3_linear_2462_171)"></path>
<path d="M118.174 -26L151 -26L151 851H118.174L118.174 -26Z" fill="url(#paint4_linear_2462_171)"></path>
<defs>
<lineargradient gradientunits="userSpaceOnUse" id="paint0_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint1_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint2_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint3_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
<lineargradient gradientunits="userSpaceOnUse" id="paint4_linear_2462_171" x1="75.5001" x2="75.5016" y1="-25.9999" y2="851">
<stop stop-color="#FFA574" stop-opacity="0"></stop>
<stop offset="1" stop-color="#FFA574"></stop>
</lineargradient>
</defs>
</svg></div></div></section></footer></div><script crossorigin="anonymous" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=6978c74eb7a56e10b85274cb" type="text/javascript"></script><script crossorigin="anonymous" integrity="sha384-eLhtiOwpAcsrjTU3szoidTK2FT4sgwN998/lRT314vxiyUJEzKSwZ02q/f+3Y8k8" src="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/js/webflow.schunk.05ab46bf443beb37.js" type="text/javascript"></script><script crossorigin="anonymous" integrity="sha384-EVx92WuQb9mkhZNxF68hHdqG3YKkx56dL/nD5M2q9oiJEb7dNT9DlzNekRovfOhz" src="https://cdn.prod.website-files.com/6978c74eb7a56e10b85274cb/js/webflow.5546c6e4.499238e9946a7c5f.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/gsap.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/ScrollTrigger.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/Observer.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/Draggable.min.js" type="text/javascript"></script><script src="https://cdn.prod.website-files.com/gsap/3.15.0/SplitText.min.js" type="text/javascript"></script><script type="text/javascript">gsap.registerPlugin(ScrollTrigger,Observer,Draggable,SplitText);</script><script src="https://unpkg.com/lenis@1.3.17/dist/lenis.min.js"></script>
<script>
  
const lenis = new Lenis();

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000); // Convert time from seconds to milliseconds
});

gsap.ticker.lagSmoothing(0);

  
</script></body></html>
```

---

## supabase/migrations/20260703100000_initial_schema.sql

```sql
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

```

---

## supabase/migrations/20260703100001_seed_products.sql

```sql
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

```

---

## supabase/migrations/20260703100002_secure_create_order.sql

```sql
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

```

---

## supabase/migrations/20260703100003_restrict_direct_inserts.sql

```sql
-- Drop the insert policies on public.orders and public.order_items.
-- This forces clients to go through the security definer RPC function,
-- preventing any direct INSERT requests that bypass price calculation.
drop policy if exists "Users can insert own orders" on public.orders;
drop policy if exists "Users can insert own order items" on public.order_items;

```

---

## functions/api/admin/orders.js

```javascript
import { createClient } from '@supabase/supabase-js';

// Ensure proper response headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Verify Supabase JWT and Admin authorization
async function verifyAdmin(request, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error("SUPABASE_URL or SUPABASE_ANON_KEY is missing in env.");
    return null;
  }

  const adminEmailsEnv = env.ADMIN_EMAILS;
  if (!adminEmailsEnv) {
    console.error("ADMIN_EMAILS is missing in env.");
    return null;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;
  
  const [scheme, token] = authHeader.split(' ');
  if (scheme.toLowerCase() !== 'bearer' || !token) return null;

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    const adminEmails = adminEmailsEnv
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.includes(user.email.toLowerCase())) {
      return user;
    }
  } catch (e) {
    console.error('Error verifying admin token:', e);
  }

  return null;
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet({ request, env }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Server configuration error (missing Supabase credentials).' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const user = await verifyAdmin(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized access. Admins only.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return new Response(JSON.stringify(orders), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPatch({ request, env }) {
  return new Response(JSON.stringify({ error: "Use /[id] endpoint for PATCH status updates" }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

```

---

## functions/api/admin/orders/[id].js

```javascript
import { createClient } from '@supabase/supabase-js';

// Ensure proper response headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Verify Supabase JWT and Admin authorization
async function verifyAdmin(request, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error("SUPABASE_URL or SUPABASE_ANON_KEY is missing in env.");
    return null;
  }

  const adminEmailsEnv = env.ADMIN_EMAILS;
  if (!adminEmailsEnv) {
    console.error("ADMIN_EMAILS is missing in env.");
    return null;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;
  
  const [scheme, token] = authHeader.split(' ');
  if (scheme.toLowerCase() !== 'bearer' || !token) return null;

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    const adminEmails = adminEmailsEnv
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.includes(user.email.toLowerCase())) {
      return user;
    }
  } catch (e) {
    console.error('Error verifying admin token:', e);
  }

  return null;
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPatch({ request, params, env }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Server configuration error (missing Supabase credentials).' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const user = await verifyAdmin(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized access. Admins only.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const orderId = params.id;
  if (!orderId) {
    return new Response(JSON.stringify({ error: 'Order ID is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { status } = body;
  if (!['pending', 'confirmed', 'delivered', 'cancelled'].includes(status)) {
    return new Response(JSON.stringify({ error: 'Invalid status value' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    let updates = { status };
    if (status === 'confirmed') updates.confirmed_at = new Date().toISOString();
    if (status === 'delivered') updates.delivered_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, status, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

```

---

