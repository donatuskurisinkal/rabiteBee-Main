
import { corsHeaders } from '../_shared/cors.ts'

interface PushNotificationRequest {
  token?: string;
  tokens?: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  image?: string;
  click_action?: string;
}

// Function to convert PEM to ArrayBuffer
function pemToArrayBuffer(pem: string): ArrayBuffer {
  // Remove the header, footer, and whitespace
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");

  // Decode base64
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Function to generate JWT for Firebase authentication
async function generateJWT(privateKey: string, clientEmail: string, projectId: string): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600 // 1 hour
  };

  // Base64URL encode
  const base64UrlEncode = (obj: any) => {
    return btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const data = `${encodedHeader}.${encodedPayload}`;

  try {
    // Convert PEM to ArrayBuffer
    const keyData = pemToArrayBuffer(privateKey);
    
    // Import private key
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      keyData,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

    // Sign the data
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      new TextEncoder().encode(data)
    );

    // Convert signature to base64url
    const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return `${data}.${base64Signature}`;
  } catch (error) {
    console.error('Error in JWT generation:', error);
    throw new Error(`JWT generation failed: ${error.message}`);
  }
}

// Function to get OAuth2 access token
async function getAccessToken(): Promise<string> {
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
  const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');
  const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase configuration. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.');
  }

  console.log('Using Firebase project:', projectId);
  console.log('Using client email:', clientEmail);

  try {
    const jwt = await generateJWT(privateKey, clientEmail, projectId);
    console.log('JWT generated successfully');
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OAuth2 error response:', errorText);
      throw new Error(`OAuth2 authentication failed: ${response.status} - ${errorText}`);
    }

    const tokenData = await response.json();
    console.log('Access token obtained successfully');
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw new Error(`Failed to get access token: ${error.message}`);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const requestData: PushNotificationRequest = await req.json();
    
    if (!requestData.title || !requestData.body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!requestData.token && !requestData.tokens) {
      return new Response(
        JSON.stringify({ error: 'Either token or tokens array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending push notification:', { title: requestData.title, body: requestData.body });

    // Get OAuth2 access token
    const accessToken = await getAccessToken();
    console.log('Successfully obtained access token');

    // Prepare notification payload for FCM v1 API
    const notification = {
      title: requestData.title,
      body: requestData.body,
      ...(requestData.image && { image: requestData.image })
    };

    const android = {
      notification: {
        sound: 'default',
        ...(requestData.click_action && { click_action: requestData.click_action })
      }
    };

    const apns = {
      payload: {
        aps: {
          sound: 'default'
        }
      }
    };

    const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
    let results = [];

    if (requestData.token) {
      // Send to single device using FCM v1 API
      const message = {
        token: requestData.token,
        notification,
        data: requestData.data || {},
        android,
        apns
      };

      console.log('Making FCM v1 request with message:', JSON.stringify(message));

      const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      console.log('FCM response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('FCM API error response:', errorText);
        throw new Error(`FCM API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      results.push(result);
      console.log('FCM single send result:', result);
    }

    if (requestData.tokens && requestData.tokens.length > 0) {
      // For multiple tokens, send individual requests
      for (const token of requestData.tokens) {
        const message = {
          token,
          notification,
          data: requestData.data || {},
          android,
          apns
        };

        console.log('Making FCM v1 batch request with message:', JSON.stringify(message));

        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message })
        });

        console.log('FCM batch response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('FCM API batch error response:', errorText);
          results.push({ error: `Failed to send to token ${token}: ${errorText}` });
          continue;
        }

        const result = await response.json();
        results.push(result);
        console.log('FCM batch send result:', result);
      }
    }

    // Check for errors in results
    const hasErrors = results.some(result => result.error);

    if (hasErrors) {
      console.error('Some notifications failed to send:', results);
    }

    const successCount = results.filter(result => !result.error).length;
    const failureCount = results.filter(result => result.error).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        total_sent: successCount,
        total_failed: failureCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending push notification:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send push notification', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
