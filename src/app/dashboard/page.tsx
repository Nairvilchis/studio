
"use client";

import { useEffect, useState } from 'react';
import type { NextRouter } from 'next/router'; // Corrected import for NextRouter
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogOut } from 'lucide-react';

// Removed metadata export as it's not allowed in "use client" components.
// export const metadata: Metadata = {
// title: 'Dashboard - LoginEase',
// description: 'Tu panel de control personalizado en LoginEase.',
// };

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('username');
    if (loggedIn !== 'true' || !storedUser) {
      router.replace('/'); // Redirige a login si no está autenticado
    } else {
      setUserName(storedUser);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    router.replace('/');
  };

  if (!userName) {
    // Muestra un loader o nada mientras se verifica el estado de login
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4 selection:bg-primary/40 selection:text-primary-foreground">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">¡Bienvenido al Dashboard, {userName}!</CardTitle>
          <CardDescription className="pt-1 text-muted-foreground">
            Aquí podrás ver tu información y configuración.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center">
            Este es tu panel de control. ¡Más funcionalidades próximamente!
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={handleLogout} variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
