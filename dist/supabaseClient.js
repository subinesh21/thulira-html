let supabaseClient = null;

async function initSupabase() {
  if (supabaseClient) return supabaseClient;

  // Connecting to the remote Supabase project provided by the user
  const url = 'https://lquxbtekcyjwfbnlzfvq.supabase.co';
  const key = 'sb_publishable_4TC1BPxU62Go6uuafSmPow_JrL3-akv';

  try {
    if (typeof supabase !== 'undefined') {
      supabaseClient = supabase.createClient(url, key);
      window.supabaseClient = supabaseClient;
    } else {
      console.warn("Supabase library not loaded. Running in offline/mock mode.");
    }
  } catch (err) {
    console.error("Error creating Supabase client:", err);
  }
  
  return supabaseClient;
}

window.initSupabase = initSupabase;
