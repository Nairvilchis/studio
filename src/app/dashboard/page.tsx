
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogOut, CalendarDays, Wrench, Package, PlusCircle, Edit, Trash2, EyeIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";

import { 
  getAllOrdersAction, 
  createOrderAction, 
  updateOrderAction,
  deleteOrderAction,
  getOrderByIdAction,
  // updateOrderProcesoAction // Not currently used directly in simplified UI
} from './service-orders/actions';
import type { Order, NewOrderData, UpdateOrderData } from '@/serviceOrderManager';

// Simplified form types - These need significant updates for the new Order structure
type TempNewOrderForm = Pick<NewOrderData, 'vin' | 'placas' | 'idCliente' | 'idMarca'> & { 
  clientName?: string; // Temporary, should be replaced by idCliente lookup
  vehicleModel?: string; // Temporary, should be replaced by idMarca/idModelo lookup
  issueDescription?: string; // Maps to 'siniestro'
};

type TempEditOrderForm = Partial<Pick<Order, 'vin' | 'placas' | 'proceso' | 'idCliente' | 'idMarca' | 'idModelo' | 'año' | 'color' | 'kilometraje' | 'idAsesor' | 'idValuador'>> & { 
  clientName?: string; 
  vehicleModel?: string; 
  issueDescription?: string; // Maps to 'siniestro'
  estimatedCompletionDate?: string; // Maps to 'fechaPromesa'
};


export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userName, setUserName] = useState<string | null>(null);
  const [userIdEmpleado, setUserIdEmpleado] = useState<number | null>(null); // User's own ID
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null);

  const [newOrderData, setNewOrderData] = useState<TempNewOrderForm>({
    vin: '',
    placas: '',
    clientName: '', 
    vehicleModel: '',
    issueDescription: '',
    // Placeholder default values for required fields in NewOrderData not in TempNewOrderForm
    idCliente: 0, // Placeholder, actual ID should come from client selection
    idMarca: 0,   // Placeholder, actual ID should come from brand selection
  });

  const [editOrderData, setEditOrderData] = useState<TempEditOrderForm>({});

  const fetchOrders = async () => {
    setIsLoading(true);
    const result = await getAllOrdersAction();
    if (result.success && result.data) {
      setOrders(result.data);
    } else {
      toast({
        title: "Error",
        description: result.error || "No se pudieron cargar las órdenes.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('username');
    const storedIdEmpleado = localStorage.getItem('idEmpleado');

    if (loggedIn !== 'true' || !storedUser) {
      router.replace('/');
    } else {
      setUserName(storedUser);
      if (storedIdEmpleado) {
        setUserIdEmpleado(parseInt(storedIdEmpleado, 10));
      }
      fetchOrders();
    }
  }, [router]);


  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('idEmpleado');
    router.replace('/');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (isEditOrderDialogOpen && currentOrder) {
        setEditOrderData(prev => ({ ...prev, [name]: value }));
    } else {
        setNewOrderData(prev => ({ ...prev, [name]: value as any }));
    }
  };

  const handleSelectChange = (name: keyof TempNewOrderForm | keyof TempEditOrderForm, value: string) => {
    if (isEditOrderDialogOpen && currentOrder) {
      setEditOrderData(prev => ({ ...prev, [name as keyof TempEditOrderForm]: value as any }));
    } else {
      setNewOrderData(prev => ({ ...prev, [name as keyof TempNewOrderForm]: value as any }));
    }
  };
  
  const handleCreateOrder = async () => {
    if (!newOrderData.clientName || !newOrderData.vehicleModel || !newOrderData.placas || !newOrderData.issueDescription) {
      toast({ title: "Error", description: "Por favor, complete los campos obligatorios (Cliente, Vehículo, Placas, Descripción).", variant: "destructive" });
      return;
    }
    
    // Map temporary form data to NewOrderData structure.
    // This is a VERY simplified mapping and needs to be comprehensive.
    const orderToCreate: NewOrderData = {
      idCliente: newOrderData.idCliente || Date.now(), // Placeholder - needs actual client ID
      idMarca: newOrderData.idMarca || Date.now(), // Placeholder - needs actual brand ID
      vin: newOrderData.vin || `VIN-${Date.now()}`,
      placas: newOrderData.placas,
      siniestro: newOrderData.issueDescription, 
      // Other fields from NewOrderData will use defaults or be undefined if not optional
    };

    const result = await createOrderAction(orderToCreate, userIdEmpleado || undefined);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsCreateOrderDialogOpen(false);
      fetchOrders(); 
      setNewOrderData({ 
        clientName: '', vehicleModel: '', placas: '', issueDescription: '', vin: '',
        idCliente: 0, idMarca: 0 // Reset placeholders
      }); 
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const openEditDialog = async (orderId: string) => {
    if (!orderId) return;
    const result = await getOrderByIdAction(orderId);
    if (result.success && result.data) {
      const order = result.data;
      setCurrentOrder(order);
      setEditOrderData({
        vin: order.vin,
        placas: order.placas,
        proceso: order.proceso,
        issueDescription: order.siniestro,
        estimatedCompletionDate: order.fechaPromesa ? new Date(order.fechaPromesa).toISOString().split('T')[0] : '',
        // Map other relevant fields from order to editOrderData
        // Example: clientName should involve a lookup for the client's actual name based on order.idCliente
      });
      setIsEditOrderDialogOpen(true);
    } else {
      toast({ title: "Error", description: "No se pudo cargar la orden para editar.", variant: "destructive" });
    }
  };

  const handleUpdateOrder = async () => {
    if (!currentOrder || !currentOrder._id) return;

    const dataToUpdate: UpdateOrderData = {
      vin: editOrderData.vin,
      placas: editOrderData.placas,
      proceso: editOrderData.proceso,
      siniestro: editOrderData.issueDescription,
      // Map other fields from editOrderData to UpdateOrderData
    };
    if (editOrderData.estimatedCompletionDate) {
        try {
            dataToUpdate.fechaPromesa = new Date(editOrderData.estimatedCompletionDate);
        } catch (e) {
            console.error("Invalid date for fechaPromesa", e);
            toast({ title: "Error", description: "Fecha promesa inválida.", variant: "destructive" });
        }
    }

    const result = await updateOrderAction(currentOrder._id.toString(), dataToUpdate, userIdEmpleado || undefined);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsEditOrderDialogOpen(false);
      fetchOrders(); 
      setCurrentOrder(null);
      setEditOrderData({});
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };
  
  const openViewDialog = async (orderId: string) => {
    if (!orderId) return;
    const result = await getOrderByIdAction(orderId);
    if (result.success && result.data) {
      setCurrentOrder(result.data);
      setIsViewOrderDialogOpen(true);
    } else {
      toast({ title: "Error", description: "No se pudo cargar la orden para visualizar.", variant: "destructive" });
    }
  };

  const openDeleteDialog = (orderId: string) => {
    setOrderToDeleteId(orderId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDeleteId) return;
    const result = await deleteOrderAction(orderToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      fetchOrders(); 
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsDeleteDialogOpen(false);
    setOrderToDeleteId(null);
  };

  // Helper to format date (handles undefined and potential string input)
  const formatDate = (dateInput?: Date | string): string => {
    if (!dateInput) return 'N/A';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Fecha Inválida';
    // Ensure date is treated as UTC to avoid timezone shifts if it's just a date string
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    return utcDate.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' });
  };

  if (!userName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Cargando...</p>
      </div>
    );
  }

  // Dummy data for inventory, could be fetched or managed elsewhere
  const inventoryItems = [
    { id: 'INV-001', name: 'Filtro de Aceite', quantity: 50, category: 'Filtros' },
    { id: 'INV-002', name: 'Pastillas de Freno (Del.)', quantity: 30, category: 'Frenos' },
    { id: 'INV-003', name: 'Aceite Motor 10W-40 (Litro)', quantity: 100, category: 'Lubricantes' },
  ];
  
  // Helper to determine Badge variant based on 'proceso'
  const getProcesoVariant = (proceso?: Order['proceso']) => {
    switch (proceso) {
      case 'entregado':
      case 'facturado':
        return 'default'; 
      case 'listo_entrega':
        return 'default'; 
      case 'hojalateria':
      case 'pintura':
      case 'mecanica':
      case 'armado':
      case 'detallado_lavado':
      case 'control_calidad':
      case 'refacciones_listas':
        return 'secondary'; 
      case 'espera_refacciones':
      case 'valuacion':
        return 'outline'; 
      case 'pendiente': 
        return 'outline';
      case 'cancelado': 
        return 'destructive'; 
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
              Bienvenido, <span className="font-medium text-foreground">{userName} (ID: {userIdEmpleado})</span>!
            </span>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <Tabs defaultValue="ordenes" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 md:max-w-lg mb-6 rounded-lg p-1 bg-muted">
            <TabsTrigger value="citas" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <CalendarDays className="h-5 w-5" /> Citas
            </TabsTrigger>
            <TabsTrigger value="ordenes" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Wrench className="h-5 w-5" /> Órdenes
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
                  <CardTitle className="text-xl">Órdenes de Trabajo</CardTitle>
                  <CardDescription>Crea, visualiza y actualiza las órdenes.</CardDescription>
                </div>
                 <Button size="sm" variant="default" onClick={() => setIsCreateOrderDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Nueva Orden
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Cargando órdenes...</p>
                ) : orders.length === 0 ? (
                   <div className="mt-4 flex h-60 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50">
                     <p className="text-muted-foreground">No hay órdenes registradas. ¡Crea una nueva!</p>
                   </div>
                ) : (
                <Table>
                  <TableCaption>Listado de las órdenes recientes.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID Orden</TableHead>
                      <TableHead>Cliente (ID)</TableHead>
                      <TableHead>Vehículo (Placas)</TableHead>
                      <TableHead>Proceso</TableHead>
                      <TableHead>Fecha Registro</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order._id?.toString()}>
                        <TableCell className="font-medium">OT-{String(order.idOrder || '').padStart(4, '0')}</TableCell>
                        <TableCell>{order.idCliente || 'N/A'}</TableCell>
                        <TableCell>{order.placas || 'N/A'} ({order.idMarca ? `Marca ${order.idMarca}` : 'Vehículo Desc.'})</TableCell>
                        <TableCell>
                           <Badge variant={getProcesoVariant(order.proceso) as any}>{order.proceso}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(order.fechaRegistro)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => openViewDialog(order._id!.toString())} aria-label="Ver Detalles">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(order._id!.toString())} aria-label="Editar Orden">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(order._id!.toString())} aria-label="Eliminar Orden">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
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

      {/* Create Order Dialog - VERY SIMPLIFIED, NEEDS FULL UPDATE FOR NEW 'Order' STRUCTURE */}
      <Dialog open={isCreateOrderDialogOpen} onOpenChange={setIsCreateOrderDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear Nueva Orden</DialogTitle>
            <DialogDescription>Complete los detalles básicos. Más campos disponibles al editar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientName" className="text-right">Cliente (Nombre Temp)</Label>
              <Input id="clientName" name="clientName" value={newOrderData.clientName || ''} onChange={handleInputChange} className="col-span-3" placeholder="Nombre del cliente"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehicleModel" className="text-right">Vehículo (Modelo Temp)</Label>
              <Input id="vehicleModel" name="vehicleModel" value={newOrderData.vehicleModel || ''} onChange={handleInputChange} className="col-span-3" placeholder="Marca y Modelo"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="placas" className="text-right">Placas</Label>
              <Input id="placas" name="placas" value={newOrderData.placas || ''} onChange={handleInputChange} className="col-span-3" placeholder="ABC-123"/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vin" className="text-right">VIN</Label>
              <Input id="vin" name="vin" value={newOrderData.vin || ''} onChange={handleInputChange} className="col-span-3" placeholder="Número de Identificación Vehicular"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="issueDescription" className="text-right">Siniestro/Problema</Label>
              <Textarea id="issueDescription" name="issueDescription" value={newOrderData.issueDescription || ''} onChange={handleInputChange} className="col-span-3" placeholder="Describa el problema o servicio requerido"/>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleCreateOrder}>Crear Orden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog - VERY SIMPLIFIED, NEEDS FULL UPDATE */}
      <Dialog open={isEditOrderDialogOpen} onOpenChange={(open) => { setIsEditOrderDialogOpen(open); if (!open) setCurrentOrder(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Orden (OT-{String(currentOrder?.idOrder || '').padStart(4, '0')})</DialogTitle>
            <DialogDescription>Actualice los detalles de la orden.</DialogDescription>
          </DialogHeader>
          {currentOrder && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_placas" className="text-right">Placas</Label>
                <Input id="edit_placas" name="placas" value={editOrderData.placas || ''} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_vin" className="text-right">VIN</Label>
                <Input id="edit_vin" name="vin" value={editOrderData.vin || ''} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_issueDescription" className="text-right">Siniestro/Problema</Label>
                <Textarea id="edit_issueDescription" name="issueDescription" value={editOrderData.issueDescription || ''} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_proceso" className="text-right">Proceso</Label>
                <Select name="proceso" value={editOrderData.proceso || ''} onValueChange={(value) => handleSelectChange('proceso' as any, value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccione un proceso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="valuacion">Valuación</SelectItem>
                    <SelectItem value="espera_refacciones">Espera Refacciones</SelectItem>
                    <SelectItem value="refacciones_listas">Refacciones Listas</SelectItem>
                    <SelectItem value="hojalateria">Hojalatería</SelectItem>
                    <SelectItem value="preparacion_pintura">Preparación Pintura</SelectItem>
                    <SelectItem value="pintura">Pintura</SelectItem>
                    <SelectItem value="mecanica">Mecánica</SelectItem>
                    <SelectItem value="armado">Armado</SelectItem>
                    <SelectItem value="detallado_lavado">Detallado y Lavado</SelectItem>
                    <SelectItem value="control_calidad">Control de Calidad</SelectItem>
                    <SelectItem value="listo_entrega">Listo para Entrega</SelectItem>
                    <SelectItem value="entregado">Entregado</SelectItem>
                    <SelectItem value="facturado">Facturado</SelectItem>
                    <SelectItem value="garantia">Garantía</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_estimatedCompletionDate" className="text-right">Fecha Promesa</Label>
                <Input id="edit_estimatedCompletionDate" name="estimatedCompletionDate" type="date" value={editOrderData.estimatedCompletionDate || ''} onChange={handleInputChange} className="col-span-3"/>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleUpdateOrder}>Actualizar Orden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog - NEEDS FULL UPDATE FOR NEW 'Order' STRUCTURE */}
      <Dialog open={isViewOrderDialogOpen} onOpenChange={(open) => { setIsViewOrderDialogOpen(open); if (!open) setCurrentOrder(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles de Orden (OT-{String(currentOrder?.idOrder || '').padStart(4, '0')})</DialogTitle>
          </DialogHeader>
          {currentOrder && (
            <div className="grid gap-3 py-4 text-sm">
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">ID Cliente:</span> <span>{currentOrder.idCliente || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Vehículo (Placas):</span> <span>{currentOrder.placas || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">VIN:</span> <span>{currentOrder.vin || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Fecha Registro:</span> <span>{formatDate(currentOrder.fechaRegistro)}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Proceso:</span> <Badge variant={getProcesoVariant(currentOrder.proceso) as any}>{currentOrder.proceso}</Badge></div>
              <div className="flex flex-col space-y-1 mt-2">
                <span className="font-medium text-muted-foreground">Siniestro/Problema:</span>
                <p className="p-2 bg-muted/50 rounded-md">{currentOrder.siniestro || 'No especificado'}</p>
              </div>
              {currentOrder.fechaPromesa && <div className="flex justify-between"><span className="font-medium text-muted-foreground">Fecha Promesa:</span> <span>{formatDate(currentOrder.fechaPromesa)}</span></div>}
              {currentOrder.idAsesor && <div className="flex justify-between"><span className="font-medium text-muted-foreground">ID Asesor:</span> <span>{currentOrder.idAsesor}</span></div>}
              {currentOrder.log && currentOrder.log.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium text-muted-foreground mb-1">Historial:</h4>
                  <ul className="list-disc list-inside text-xs space-y-1 max-h-32 overflow-y-auto bg-muted/30 p-2 rounded-md">
                    {currentOrder.log.map((entry, index) => (
                      <li key={index}>
                        {formatDate(entry.timestamp)} por {entry.userId || 'Sistema'}: {entry.action}{entry.details ? ` (${entry.details})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la orden OT-{String(orders.find(o => o._id?.toString() === orderToDeleteId)?.idOrder || '').padStart(4, '0')}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={handleDeleteOrder}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
