import { defineConfig } from 'astro/config';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

export default defineConfig({
  vite: {
    plugins: [{
      name: 'mock-otp-plugin',
      configureServer(server) {
        const mockOtps = {};
        
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/auth/mock-otp-request' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const { phone } = JSON.parse(body);
                if (!phone) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Phone number is required' }));
                  return;
                }

                const code = String(Math.floor(100000 + Math.random() * 900000));
                mockOtps[phone] = code;
                
                console.log(`\n==================================================`);
                console.log(`[MOCK OTP] Phone Number: ${phone}`);
                console.log(`[MOCK OTP] OTP Verification Code: ${code}`);
                console.log(`==================================================\n`);
                
                const url = process.env.SUPABASE_URL;
                const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
                const email = `${phone.replace(/\D/g, '')}@mock-phone-login.thulira.com`;

                if (url && serviceRole) {
                  const supabase = createClient(url, serviceRole);
                  const defaultPassword = 'thuliraMockPassword123!';
                  
                  // Ensure mock user exists in Supabase
                  const { error: createError } = await supabase.auth.admin.createUser({
                    email: email,
                    phone: phone,
                    password: defaultPassword,
                    email_confirm: true,
                    phone_confirm: true
                  });
                  
                  if (createError && (createError.message.includes('already exists') || createError.status === 422)) {
                    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
                    if (!listError && users) {
                      const existingUser = users.find(u => u.email === email);
                      if (existingUser) {
                        await supabase.auth.admin.updateUserById(existingUser.id, {
                          password: defaultPassword,
                          email_confirm: true,
                          phone_confirm: true
                        });
                      }
                    }
                  }
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Mock OTP code generated' }));
              } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
          
          if (req.url === '/api/auth/mock-otp-verify' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { phone, otp } = JSON.parse(body);
                const expected = mockOtps[phone];
                console.log(`[MOCK OTP VERIFY] Received phone: "${phone}", otp: "${otp}" (type: ${typeof otp}). Expected: "${expected}" (type: ${typeof expected}). Current store:`, mockOtps);
                if (expected && String(otp).trim() === String(expected).trim()) {
                  delete mockOtps[phone];
                  const email = `${phone.replace(/\D/g, '')}@mock-phone-login.thulira.com`;
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true, email: email, password: 'thuliraMockPassword123!' }));
                } else {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Invalid verification code' }));
                }
              } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
          
          next();
        });
      }
    }]
  }
});
