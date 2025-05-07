import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
// import { GeistMono } from 'geist/font/mono'; // Ensure GeistMono is not used if not available
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

// The imported GeistSans is already a font object.
// Its .variable property provides a className that sets up the CSS variables
// (e.g., --font-geist-sans) which are used in globals.css.

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
    <html lang="es" className="dark">
      {/*
        Next.js automatically injects the <head> tag.
        The 'dark' class on <html> sets the default theme.
        Font variables like GeistSans.variable are applied to the <body>.
        It's crucial to avoid any direct child whitespace text nodes within <html>
        (before <head> or <body>) to prevent hydration errors.
      */}
      <body className={`${GeistSans.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
