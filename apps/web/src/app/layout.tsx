import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'VedaSphere - Trusted Daily City Brief',
  description: 'One calm screen answering what you need to know today in your city with advice, not just data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
