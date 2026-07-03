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
