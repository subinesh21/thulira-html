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
