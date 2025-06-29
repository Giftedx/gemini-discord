import { NextResponse } from 'next/server';

export async function GET() {
  const discordApiUrl = 'https://discord.com/api/oauth2/authorize';

  if (!process.env.DISCORD_CLIENT_ID || !process.env.NEXT_PUBLIC_BASE_URL) {
      console.error("Missing DISCORD_CLIENT_ID or NEXT_PUBLIC_BASE_URL environment variables.");
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/discord/callback`,
    response_type: 'code',
    scope: 'identify email',
  });

  const redirectUrl = `${discordApiUrl}?${params.toString()}`;
  return NextResponse.redirect(redirectUrl);
}
