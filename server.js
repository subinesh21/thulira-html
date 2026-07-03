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

const mockOtps = {};

// Mock OTP Request Endpoint
app.post('/api/auth/mock-otp-request', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Generate 6-digit OTP code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  mockOtps[phone] = code;

  // Print the code to the terminal!
  console.log(`\n==================================================`);
  console.log(`[MOCK OTP] Phone Number: ${phone}`);
  console.log(`[MOCK OTP] OTP Verification Code: ${code}`);
  console.log(`==================================================\n`);

  try {
    const defaultPassword = 'thuliraMockPassword123!';
    const email = `${phone.replace(/\D/g, '')}@mock-phone-login.thulira.com`;

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

    res.json({ success: true, message: 'Mock OTP code generated' });
  } catch (err) {
    console.error('[MOCK OTP] Server exception:', err);
    res.status(500).json({ error: 'Internal server error processing mock OTP request' });
  }
});

// Mock OTP Verify Endpoint
app.post('/api/auth/mock-otp-verify', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  const expectedCode = mockOtps[phone];
  if (expectedCode && String(otp).trim() === String(expectedCode).trim()) {
    // Clean up used OTP
    delete mockOtps[phone];
    const email = `${phone.replace(/\D/g, '')}@mock-phone-login.thulira.com`;
    res.json({ success: true, email: email, password: 'thuliraMockPassword123!' });
  } else {
    res.status(400).json({ error: 'Invalid verification code' });
  }
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
