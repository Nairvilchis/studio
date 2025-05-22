import type { ReactNode } from 'react';
// Using a generic icon for branding that fits the "elegant" theme
import { Sparkles } from 'lucide-react'; 

interface AuthLayoutProps {
  title?: string; // Made title optional
  description?: string;
  children: ReactNode;
}

export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4 selection:bg-primary/40 selection:text-primary-foreground">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-xl bg-primary/10 p-4 shadow-md">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
          {/* Conditionally render the H1 tag if title is provided */}
          {title && (
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              {title}
            </h1>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
