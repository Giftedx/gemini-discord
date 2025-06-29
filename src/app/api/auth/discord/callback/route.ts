import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  try {
    const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, NEXT_PUBLIC_BASE_URL } = process.env;

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_REDIRECT_URI || !NEXT_PUBLIC_BASE_URL) {
      console.error('A required environment variable for Discord OAuth is missing.');
      return NextResponse.json({ error: 'Server is missing required configuration.' }, { status: 500 });
    }
    
    // 1. Exchange authorization code for an access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Discord token exchange failed:', errorText);
        throw new Error(`Error fetching Discord access token: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // 2. Use the access token to fetch the user's Discord profile
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('Failed to fetch Discord user profile:', errorText);
        throw new Error(`Failed to fetch user profile from Discord: ${userResponse.status} ${errorText}`);
    }

    const userData = await userResponse.json();

    // 3. Mint a custom Firebase token using the Discord user ID as the UID
    const customToken = await admin.auth().createCustomToken(userData.id);

    // 4. Redirect to a frontend page with the custom token
    const redirectUrl = new URL('/auth/verify', NEXT_PUBLIC_BASE_URL);
    redirectUrl.searchParams.set('token', customToken);

    return NextResponse.redirect(redirectUrl.toString());

  } catch (error: any) {
    console.error('Discord callback error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
