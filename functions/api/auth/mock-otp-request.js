import { createClient } from '@supabase/supabase-js';
import { mockOtps } from './_store.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost({ request, env }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Server configuration error (missing Supabase credentials).' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { phone } = await request.json();
    if (!phone) {
      return new Response(JSON.stringify({ error: 'Phone number is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate 6-digit OTP code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    mockOtps[phone] = code;

    // Print the code to the terminal/Wrangler logs!
    console.log(`\n==================================================`);
    console.log(`[MOCK OTP] Phone Number: ${phone}`);
    console.log(`[MOCK OTP] OTP Verification Code: ${code}`);
    console.log(`==================================================\n`);

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const defaultPassword = 'thuliraMockPassword123!';
    const email = `thulira.${phone.replace(/\D/g, '')}@gmail.com`;

    // Ensure the user exists in Supabase Auth
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      phone: phone,
      password: defaultPassword,
      email_confirm: true,
      phone_confirm: true
    });

    if (createError) {
      if (createError.message.includes('already exists') || createError.status === 422) {
        // Find the user to update their password
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (!listError && users) {
          const existingUser = users.find(u => u.email === email);
          if (existingUser) {
            const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
              password: defaultPassword,
              email_confirm: true,
              phone_confirm: true
            });
            if (updateError) {
              console.error('[MOCK OTP] Error updating user password:', updateError.message);
            }
          }
        }
      } else {
        console.error('[MOCK OTP] Error creating mock user:', createError.message);
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Mock OTP code generated' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[MOCK OTP] Serverless exception:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
