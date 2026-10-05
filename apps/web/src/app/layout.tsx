import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { NavRail } from '../components/NavRail';
import { Header } from '../components/Header';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'VedaSphere – Trusted Daily City Brief',
  description:
    'One calm screen answering what you need to know today in your city — advice, not just data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-ink antialiased">
        <Providers>
          {/* Skip-to-content for keyboard users */}
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>

          {/* Global nav rail (mobile bottom bar / desktop sidebar) */}
          <NavRail />

          {/* Sticky top header (city picker + theme toggle) */}
          <Header />

          {/* Page content */}
          <div
            id="main-content"
            className="
              min-h-screen
              lg:max-w-3xl lg:mx-auto
              px-4 pt-2 pb-8
            "
          >
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
