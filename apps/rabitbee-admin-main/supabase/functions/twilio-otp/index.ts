
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { 
      auth: { persistSession: false } 
    });

    // Get Twilio credentials from environment variables
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const verifySid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !verifySid) {
      console.error('Missing Twilio credentials');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing Twilio credentials' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Safely parse the request body
    let body;
    try {
      // Improved body parsing for React Native
      if (req.body === null) {
        console.error("Request body is null");
        return new Response(
          JSON.stringify({ error: 'Empty request body' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const contentType = req.headers.get('content-type') || '';
      console.log("Content-Type:", contentType);
      
      // Read the raw content
      const raw = await req.text();
      console.log("Raw request body:", raw);
      
      if (!raw || raw.trim() === '') {
        console.error("Empty request body");
        return new Response(
          JSON.stringify({ error: 'Empty request body' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // If the body is already a stringified JSON (from React Native)
      try {
        body = JSON.parse(raw);
        console.log("Successfully parsed request body:", body);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON format', details: parseError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    } catch (err) {
      console.error("Error processing request body:", err);
      return new Response(
        JSON.stringify({ error: 'Failed to process request body', details: err.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Extract action and parameters
    const { action, phone, otp, firstName, lastName } = body || {};
    console.log("Parsed action:", action);
    console.log("Parsed phone:", phone);

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: action' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Sending OTP
    if (action === 'send') {
      if (!phone) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameter: phone' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      console.log(`Sending OTP to phone: ${phone}`);

      // Format phone number to E.164 format if not already
      const formattedPhone = formatPhoneNumber(phone);
      
      // Create verification
      const twilioResponse = await fetch(`https://verify.twilio.com/v2/Services/${verifySid}/Verifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`
        },
        body: new URLSearchParams({
          'To': formattedPhone,
          'Channel': 'sms'
        })
      });

      if (!twilioResponse.ok) {
        const errorText = await twilioResponse.text();
        console.error('Twilio API error response:', errorText);
        let twilioError;
        try {
          twilioError = JSON.parse(errorText);
        } catch (e) {
          twilioError = { message: errorText || 'Unknown Twilio error' };
        }
        
        return new Response(
          JSON.stringify({ error: twilioError.message || 'Failed to send OTP' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: twilioResponse.status }
        );
      }

      const twilioData = await twilioResponse.json();
      console.log('Twilio send OTP response:', twilioData);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent successfully',
          status: twilioData.status,
          to: formattedPhone
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Verifying OTP
    if (action === 'verify') {
      if (!phone || !otp) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters: phone and otp' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      console.log(`Verifying OTP for phone: ${phone}, OTP: ${otp}`);

      // Format phone number to E.164 format if not already
      const formattedPhone = formatPhoneNumber(phone);
      
      // Check verification
      const twilioResponse = await fetch(`https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`
        },
        body: new URLSearchParams({
          'To': formattedPhone,
          'Code': otp
        })
      });

      if (!twilioResponse.ok) {
        const errorText = await twilioResponse.text();
        console.error('Twilio API error response:', errorText);
        let twilioError;
        try {
          twilioError = JSON.parse(errorText);
        } catch (e) {
          twilioError = { message: errorText || 'Unknown Twilio error' };
        }
        
        return new Response(
          JSON.stringify({ error: twilioError.message || 'Failed to verify OTP' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: twilioResponse.status }
        );
      }

      const twilioData = await twilioResponse.json();
      console.log('Twilio verify OTP response:', twilioData);

      const isValid = twilioData.status === 'approved';
      
      if (!isValid) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            valid: false,
            status: twilioData.status,
            message: 'Invalid OTP'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // If verification is successful, handle user creation/login
      try {
        // Check if a user with this phone number already exists
        const { data: existingUsers, error: queryError } = await supabaseAdmin
          .from('users')
          .select('id, username')
          .eq('phone', formattedPhone)
          .limit(1);
          
        if (queryError) {
          console.error('Error checking for existing user:', queryError);
          throw queryError;
        }

        let userId = null;
        let username = null;
        let token = null;
        let refreshToken = null;
        
        // If user exists, generate token for them
        if (existingUsers && existingUsers.length > 0) {
          userId = existingUsers[0].id;
          username = existingUsers[0].username;
          console.log(`User with phone ${formattedPhone} already exists with ID ${userId}`);
          
          // Update the existing user as verified
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ is_verified: true })
            .eq('id', userId);
            
          if (updateError) {
            console.error('Error updating existing user as verified:', updateError);
          }
          
          // Generate a session for the existing user
          // Using signInWithPhone method instead of createSession
          const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
            email: `${username}@example.com`,
            password: generateRandomPassword(12) // This won't be used but is required
          });
          
          if (signInError) {
            console.error('Error signing in user:', signInError);
            
            // Create a new session directly
            const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.getSession();
            
            if (tokenError) {
              console.error('Error creating token:', tokenError);
              throw tokenError;
            }
            
            token = tokenData.session?.access_token;
            refreshToken = tokenData.session?.refresh_token;
          } else {
            token = signInData.session?.access_token;
            refreshToken = signInData.session?.refresh_token;
          }
          
          console.log("Created session for existing user:", userId);
        } else {
          // Get the Customer role ID
          const { data: roleData, error: roleError } = await supabaseAdmin
            .from('roles')
            .select('id')
            .eq('name', 'Customer')
            .limit(1);

          if (roleError || !roleData || roleData.length === 0) {
            console.error('Error fetching Customer role ID:', roleError);
            throw new Error('Failed to get Customer role ID');
          }

          const customerRoleId = roleData[0].id;
          
          // Create a random username based on timestamp
          const timestamp = new Date().getTime();
          const randomUsername = `user_${timestamp}`;
          
          // Create auth user with a generated password
          const password = generateRandomPassword(12);
          console.log(`Creating new user with username: ${randomUsername} and generated password`);
          
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: `${randomUsername}@example.com`,
            password: password,
            email_confirm: true,
            user_metadata: {
              first_name: firstName || '',
              last_name: lastName || '',
              phone: formattedPhone
            }
          });

          if (authError) {
            console.error('Error creating auth user:', authError);
            throw authError;
          }

          userId = authData.user.id;
          username = randomUsername;
          
          // Create user record in users table
          const { error: userError } = await supabaseAdmin
            .from('users')
            .insert({
              id: userId,
              username: randomUsername,
              first_name: firstName || '',
              last_name: lastName || '',
              phone: formattedPhone,
              is_verified: true,
              role_id: customerRoleId,
              role: 'Customer',
              isActive: true
            });

          if (userError) {
            console.error('Error creating user record:', userError);
            throw userError;
          }
          
          // Sign in to generate a session
          const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
            email: `${randomUsername}@example.com`,
            password: password
          });
          
          if (signInError) {
            console.error('Error signing in new user:', signInError);
            throw signInError;
          }
          
          token = signInData.session?.access_token;
          refreshToken = signInData.session?.refresh_token;
          
          console.log(`Successfully created new user with ID: ${userId} and created session`);
        }
        
        // Return the tokens along with user data
        return new Response(
          JSON.stringify({ 
            success: true, 
            valid: true,
            status: twilioData.status,
            message: 'OTP verified successfully',
            userId: userId,
            user: {
              id: userId,
              username: username,
              phone: formattedPhone
            },
            session: {
              access_token: token,
              refresh_token: refreshToken,
              user: {
                id: userId
              }
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
        
      } catch (err) {
        console.error('Exception in user processing:', err);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'OTP verified but failed to process user: ' + (err.message || String(err))
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "send" or "verify"' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Error in twilio-otp function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function to format phone number to E.164 format
function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  let digits = phone.replace(/\D/g, '');

  // If the number doesn't start with +, add the + sign
  if (!phone.startsWith('+')) {
    // If the number doesn't have a country code (assuming India +91 as default)
    // Check if it's a 10-digit number without country code
    if (digits.length === 10) {
      digits = '91' + digits; // Add India country code
    }
    return '+' + digits;
  }
  
  return phone;
}

// Helper function to generate a random password
function generateRandomPassword(length: number): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}
