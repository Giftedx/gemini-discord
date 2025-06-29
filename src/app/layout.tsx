import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gemini Collaborative Suite for Discord - Backend',
  description: 'Backend services for enhanced Discord collaboration with Gemini AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        {children}
      </body>
    </html>
  );
}
