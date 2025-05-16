
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogOut, CalendarDays, Wrench, Package, PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('username');
    if (loggedIn !== 'true' || !storedUser) {
      router.replace('/');
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Cargando...</p>
      </div>
    );
  }

  const serviceOrders = [
    { id: 'SO-001', client: 'Juan Pérez', vehicle: 'Toyota Corolla', status: 'En Progreso', date: '2024-07-28' },
    { id: 'SO-002', client: 'Ana Gómez', vehicle: 'Honda Civic', status: 'Completado', date: '2024-07-27' },
    { id: 'SO-003', client: 'Carlos López', vehicle: 'Ford Ranger', status: 'Pendiente', date: '2024-07-29' },
  ];

  const inventoryItems = [
    { id: 'INV-001', name: 'Filtro de Aceite', quantity: 50, category: 'Filtros' },
    { id: 'INV-002', name: 'Pastillas de Freno (Del.)', quantity: 30, category: 'Frenos' },
    { id: 'INV-003', name: 'Aceite Motor 10W-40 (Litro)', quantity: 100, category: 'Lubricantes' },
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Completado':
        return 'default'; // Primary color (e.g., green if theme is set up that way)
      case 'En Progreso':
        return 'secondary'; // Secondary color (e.g., blue or gray)
      case 'Pendiente':
        return 'outline'; // Outline style (e.g., yellow or orange if themed)
      default:
        return 'secondary';
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 dark:bg-muted/10">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 shadow-sm">
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">
            Panel del Taller Automotriz
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Bienvenido, <span className="font-medium text-foreground">{userName}</span>!
            </span>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <Tabs defaultValue="citas" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 md:max-w-lg mb-6 rounded-lg p-1 bg-muted">
            <TabsTrigger value="citas" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <CalendarDays className="h-5 w-5" /> Citas
            </TabsTrigger>
            <TabsTrigger value="ordenes" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Wrench className="h-5 w-5" /> Órdenes de Servicio
            </TabsTrigger>
            <TabsTrigger value="almacen" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Package className="h-5 w-5" /> Almacén
            </TabsTrigger>
          </TabsList>

          <TabsContent value="citas">
            <Card className="shadow-lg border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-xl">Gestión de Citas</CardTitle>
                  <CardDescription>Programa y administra las citas de los clientes.</CardDescription>
                </div>
                <Button size="sm" variant="default">
                  <PlusCircle className="mr-2 h-4 w-4" /> Nueva Cita
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Aquí se mostrará el calendario de citas y el listado de próximas citas.
                </p>
                <div className="mt-4 flex h-80 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50">
                  <p className="text-muted-foreground">Calendario de Citas Próximamente</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ordenes">
            <Card className="shadow-lg border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-xl">Órdenes de Servicio</CardTitle>
                  <CardDescription>Crea, visualiza y actualiza las órdenes de trabajo.</CardDescription>
                </div>
                 <Button size="sm" variant="default">
                  <PlusCircle className="mr-2 h-4 w-4" /> Nueva Orden
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>Listado de las órdenes de servicio recientes.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID Orden</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vehículo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.client}</TableCell>
                        <TableCell>{order.vehicle}</TableCell>
                        <TableCell>
                           <Badge variant={getStatusVariant(order.status) as any}>{order.status}</Badge>
                        </TableCell>
                        <TableCell>{order.date}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">Ver Detalles</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="almacen">
            <Card className="shadow-lg border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-xl">Gestión de Almacén</CardTitle>
                  <CardDescription>Controla el inventario de repuestos y materiales.</CardDescription>
                </div>
                 <Button size="sm" variant="default">
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Artículo
                </Button>
              </CardHeader>
              <CardContent>
                 <Table>
                  <TableCaption>Listado de artículos en el almacén.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID Artículo</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                       <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">Editar</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

    