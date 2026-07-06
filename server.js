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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
