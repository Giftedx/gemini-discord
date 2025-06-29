import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  try {
    // 1. Exchange authorization code for an access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/discord/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Discord token exchange failed:', tokenData);
      throw new Error('Failed to exchange authorization code for token.');
    }

    const { access_token } = tokenData;

    // 2. Use the access token to fetch the user's Discord profile
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
        console.error('Failed to fetch Discord user profile:', userData);
        throw new Error('Failed to fetch user profile from Discord.');
    }

    // 3. Log the user profile to verify success (as per instructions)
    console.log('Successfully fetched Discord user profile:', userData);

    // In a future step, we will mint a Firebase custom token here.
    // For now, return a success message.
    return NextResponse.json({
        status: 'success',
        message: 'Successfully fetched user profile from Discord. Check server logs.',
        userProfile: userData
    });

  } catch (error: any) {
    console.error('Discord callback error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
