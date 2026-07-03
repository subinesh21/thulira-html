import { mockOtps } from './_store.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost({ request }) {
  try {
    const { phone, otp } = await request.json();
    if (!phone || !otp) {
      return new Response(JSON.stringify({ error: 'Phone and OTP are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const expectedCode = mockOtps[phone];
    if (expectedCode && String(otp).trim() === String(expectedCode).trim()) {
      delete mockOtps[phone];
      const email = `${phone.replace(/\D/g, '')}@mock-phone-login.thulira.com`;
      return new Response(JSON.stringify({ success: true, email: email, password: 'thuliraMockPassword123!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid verification code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
