
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4464.8257-.618 1.2295a18.298 18.298 0 00-5.4644 0 18.5222 18.5222 0 00-.618-1.2295.0741.0741 0 00-.0785-.0371A19.7913 19.7913 0 003.683 4.3698a.0741.0741 0 00-.05.0741C3.4343 6.4173 3.3218 8.4923 3.5323 10.559a16.5224 16.5224 0 003.0645 5.5186.0741.0741 0 00.096-.0037c.3623-.243.6938-.5041.9939-.7849a.0741.0741 0 00.0238-.0861 13.941 13.941 0 01-.2231-1.9958.0741.0741 0 01.0141-.0741c.06-.051.127-.102.1881-.154a.0741.0741 0 01.096-.0047c.5945.4194 1.2372.7849 1.9023 1.0985a.0741.0741 0 00.098-.0434c.052-.1182.096-.243.1401-.3615a.0741.0741 0 00-.044-.096c-.4132-.1721-.8184-.3666-1.2052-.5855a.0741.0741 0 01-.011-.1182c.029-.0334.055-.0667.082-.101a.0741.0741 0 01.082-.0187c2.1417.841 4.4111.841 6.5528 0a.0741.0741 0 01.082.0187c.027.0343.053.0677.082.101a.0741.0741 0 01-.011.1182c-.3868.2189-.792.4134-1.2052.5855a.0741.0741 0 00-.044.096c.0441.1185.0881.2433.1401.3615a.0741.0741 0 00.098.0434c.6651-.3136 1.3078-.6791 1.9023-1.0985a.0741.0741 0 01.096.0047c.061.052.1281.103.1881.154a.0741.0741 0 01.0141-.0741 13.941 13.941 0 01-.2231 1.9958.0741.0741 0 00.0238.0861c.2991.2808.6316.5419.9939-.7849a.0741.0741 0 00.096.0037 16.5224 16.5224 0 003.0645-5.5186c.2105-2.0667.098-4.1397-.1015-6.1855a.0741.0741 0 00-.05-.0741z" />
    </svg>
)

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Gemini Collaborative Suite</CardTitle>
          <CardDescription>
            Log in to manage your server workflows and integrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Button asChild className="w-full">
              <a href="/api/auth/discord/login">
                <DiscordIcon className="mr-2 h-5 w-5" />
                Login with Discord
              </a>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
