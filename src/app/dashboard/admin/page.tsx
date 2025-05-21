// In src/app/dashboard/admin/page.tsx or a similar admin dashboard component

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <h1 className="text-lg font-semibold md:text-2xl">Panel de Administración</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Existing admin links/cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gestionar Empleados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/users" className="text-blue-500 hover:underline"> {/* Keep the old path for now */}
              Ir a Gestión de Usuarios
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gestionar Aseguradoras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/aseguradoras" className="text-blue-500 hover:underline">
              Ir a Gestión de Aseguradoras
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gestionar Marcas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/marcas" className="text-blue-500 hover:underline">
              Ir a Gestión de Marcas
            </Link>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}