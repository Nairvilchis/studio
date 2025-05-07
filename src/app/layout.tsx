import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

// The imported GeistSans and GeistMono are already font objects.
// They are not functions to be called.
// Their .variable property provides a className that sets up the CSS variables
// (e.g., --font-geist-sans, --font-geist-mono) which are used in globals.css.

export const metadata: Metadata = {
  title: 'Elegance Aesthetics',
  description: 'Salón de belleza y estética. Uñas, cabello, microblading y tratamientos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark"> {/* Apply dark class by default */}
      {/* Next.js handles <head> injection.
          Ensure no extra whitespace nodes are children of <html> before <body>. */}
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
