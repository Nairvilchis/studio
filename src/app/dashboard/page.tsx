
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

// Import Server Actions
import { 
  getAllServiceOrdersAction, 
  createServiceOrderAction, 
  updateServiceOrderAction,
  deleteServiceOrderAction,
  getServiceOrderByIdAction
} from './service-orders/actions';
import type { ServiceOrder } from '@/serviceOrderManager'; // Import the interface

// Define the type for a new service order, excluding MongoDB specific fields
type NewServiceOrderData = Omit<ServiceOrder, '_id' | 'creationDate' | 'orderIdSequence' | 'status'>;
type EditableServiceOrderData = Partial<Omit<ServiceOrder, '_id' | 'orderIdSequence' | 'creationDate'>>;


export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userName, setUserName] = useState<string | null>(null);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [currentOrder, setCurrentOrder] = useState<ServiceOrder | null>(null);
  const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null);

  const [newOrderData, setNewOrderData] = useState<NewServiceOrderData>({
    clientName: '',
    vehicleModel: '',
    vehicleLicensePlate: '',
    issueDescription: '',
    // status will be set to 'Pendiente' by default in backend
  });

  const [editOrderData, setEditOrderData] = useState<EditableServiceOrderData>({});


  const fetchServiceOrders = async () => {
    setIsLoading(true);
    const result = await getAllServiceOrdersAction();
    if (result.success && result.data) {
      setServiceOrders(result.data);
    } else {
      toast({
        title: "Error",
        description: result.error || "No se pudieron cargar las órdenes de servicio.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('username');
    if (loggedIn !== 'true' || !storedUser) {
      router.replace('/');
    } else {
      setUserName(storedUser);
      fetchServiceOrders();
    }
  }, [router]);


  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    router.replace('/');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (isEditOrderDialogOpen && currentOrder) {
        setEditOrderData(prev => ({ ...prev, [name]: value }));
    } else {
        setNewOrderData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: keyof NewServiceOrderData | keyof EditableServiceOrderData, value: string) => {
    if (isEditOrderDialogOpen && currentOrder) {
      setEditOrderData(prev => ({ ...prev, [name as keyof EditableServiceOrderData]: value }));
    } else {
      setNewOrderData(prev => ({ ...prev, [name as keyof NewServiceOrderData]: value }));
    }
  };
  
  const handleCreateOrder = async () => {
    if (!newOrderData.clientName || !newOrderData.vehicleModel || !newOrderData.vehicleLicensePlate || !newOrderData.issueDescription) {
      toast({ title: "Error", description: "Por favor, complete todos los campos obligatorios.", variant: "destructive" });
      return;
    }
    const result = await createServiceOrderAction(newOrderData);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsCreateOrderDialogOpen(false);
      fetchServiceOrders(); // Refresh list
      setNewOrderData({ clientName: '', vehicleModel: '', vehicleLicensePlate: '', issueDescription: '' }); // Reset form
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const openEditDialog = async (orderId: string) => {
    if (!orderId) return;
    const result = await getServiceOrderByIdAction(orderId);
    if (result.success && result.data) {
      setCurrentOrder(result.data);
      setEditOrderData({
        clientName: result.data.clientName,
        vehicleModel: result.data.vehicleModel,
        vehicleLicensePlate: result.data.vehicleLicensePlate,
        issueDescription: result.data.issueDescription,
        status: result.data.status,
        assignedMechanic: result.data.assignedMechanic || '',
        notes: result.data.notes || '',
        estimatedCompletionDate: result.data.estimatedCompletionDate ? new Date(result.data.estimatedCompletionDate).toISOString().split('T')[0] as any : undefined,
      });
      setIsEditOrderDialogOpen(true);
    } else {
      toast({ title: "Error", description: "No se pudo cargar la orden para editar.", variant: "destructive" });
    }
  };

  const handleUpdateOrder = async () => {
    if (!currentOrder || !currentOrder._id) return;

    // Ensure estimatedCompletionDate is a Date object if provided, otherwise undefined
    const dataToUpdate: EditableServiceOrderData = { ...editOrderData };
    if (dataToUpdate.estimatedCompletionDate && typeof dataToUpdate.estimatedCompletionDate === 'string') {
        const dateParts = dataToUpdate.estimatedCompletionDate.split('-');
        if (dateParts.length === 3) {
            dataToUpdate.estimatedCompletionDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        } else {
            delete dataToUpdate.estimatedCompletionDate; // remove if invalid
        }
    } else if (!dataToUpdate.estimatedCompletionDate) {
        delete dataToUpdate.estimatedCompletionDate; // Ensure it's not an empty string
    }


    const result = await updateServiceOrderAction(currentOrder._id.toString(), dataToUpdate);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsEditOrderDialogOpen(false);
      fetchServiceOrders(); // Refresh list
      setCurrentOrder(null);
      setEditOrderData({});
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };
  
  const openViewDialog = async (orderId: string) => {
    if (!orderId) return;
    const result = await getServiceOrderByIdAction(orderId);
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
    const result = await deleteServiceOrderAction(orderToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      fetchServiceOrders(); // Refresh list
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsDeleteDialogOpen(false);
    setOrderToDeleteId(null);
  };


  if (!userName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Cargando...</p>
      </div>
    );
  }

  const inventoryItems = [
    { id: 'INV-001', name: 'Filtro de Aceite', quantity: 50, category: 'Filtros' },
    { id: 'INV-002', name: 'Pastillas de Freno (Del.)', quantity: 30, category: 'Frenos' },
    { id: 'INV-003', name: 'Aceite Motor 10W-40 (Litro)', quantity: 100, category: 'Lubricantes' },
  ];

  const getStatusVariant = (status: ServiceOrder['status']) => {
    switch (status) {
      case 'Completado':
        return 'default'; 
      case 'En Progreso':
        return 'secondary';
      case 'Pendiente':
        return 'outline';
      case 'Cancelado':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateInput?: Date | string): string => {
    if (!dateInput) return 'N/A';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Fecha Inválida';
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
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
        <Tabs defaultValue="ordenes" className="w-full">
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
                 <Button size="sm" variant="default" onClick={() => setIsCreateOrderDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Nueva Orden
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Cargando órdenes de servicio...</p>
                ) : serviceOrders.length === 0 ? (
                   <div className="mt-4 flex h-60 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50">
                     <p className="text-muted-foreground">No hay órdenes de servicio registradas. ¡Crea una nueva!</p>
                   </div>
                ) : (
                <Table>
                  <TableCaption>Listado de las órdenes de servicio recientes.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID Orden</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vehículo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceOrders.map((order) => (
                      <TableRow key={order._id?.toString()}>
                        <TableCell className="font-medium">SO-{String(order.orderIdSequence || '').padStart(3, '0')}</TableCell>
                        <TableCell>{order.clientName}</TableCell>
                        <TableCell>{order.vehicleModel} ({order.vehicleLicensePlate})</TableCell>
                        <TableCell>
                           <Badge variant={getStatusVariant(order.status) as any}>{order.status}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(order.creationDate)}</TableCell>
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

      {/* Create Service Order Dialog */}
      <Dialog open={isCreateOrderDialogOpen} onOpenChange={setIsCreateOrderDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear Nueva Orden de Servicio</DialogTitle>
            <DialogDescription>Complete los detalles de la nueva orden.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientName" className="text-right">Cliente</Label>
              <Input id="clientName" name="clientName" value={newOrderData.clientName} onChange={handleInputChange} className="col-span-3" placeholder="Nombre del cliente"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehicleModel" className="text-right">Vehículo</Label>
              <Input id="vehicleModel" name="vehicleModel" value={newOrderData.vehicleModel} onChange={handleInputChange} className="col-span-3" placeholder="Marca y Modelo"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehicleLicensePlate" className="text-right">Matrícula</Label>
              <Input id="vehicleLicensePlate" name="vehicleLicensePlate" value={newOrderData.vehicleLicensePlate} onChange={handleInputChange} className="col-span-3" placeholder="ABC-123"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="issueDescription" className="text-right">Descripción</Label>
              <Textarea id="issueDescription" name="issueDescription" value={newOrderData.issueDescription} onChange={handleInputChange} className="col-span-3" placeholder="Describa el problema o servicio requerido"/>
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

      {/* Edit Service Order Dialog */}
      <Dialog open={isEditOrderDialogOpen} onOpenChange={(open) => { setIsEditOrderDialogOpen(open); if (!open) setCurrentOrder(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Orden de Servicio (SO-{String(currentOrder?.orderIdSequence || '').padStart(3, '0')})</DialogTitle>
            <DialogDescription>Actualice los detalles de la orden.</DialogDescription>
          </DialogHeader>
          {currentOrder && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_clientName" className="text-right">Cliente</Label>
                <Input id="edit_clientName" name="clientName" value={editOrderData.clientName || ''} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_vehicleModel" className="text-right">Vehículo</Label>
                <Input id="edit_vehicleModel" name="vehicleModel" value={editOrderData.vehicleModel || ''} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_vehicleLicensePlate" className="text-right">Matrícula</Label>
                <Input id="edit_vehicleLicensePlate" name="vehicleLicensePlate" value={editOrderData.vehicleLicensePlate || ''} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_issueDescription" className="text-right">Descripción</Label>
                <Textarea id="edit_issueDescription" name="issueDescription" value={editOrderData.issueDescription || ''} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_status" className="text-right">Estado</Label>
                <Select name="status" value={editOrderData.status || ''} onValueChange={(value) => handleSelectChange('status', value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccione un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="En Progreso">En Progreso</SelectItem>
                    <SelectItem value="Completado">Completado</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_assignedMechanic" className="text-right">Mecánico</Label>
                <Input id="edit_assignedMechanic" name="assignedMechanic" value={editOrderData.assignedMechanic || ''} onChange={handleInputChange} className="col-span-3" placeholder="Nombre del mecánico"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_estimatedCompletionDate" className="text-right">Fecha Estimada</Label>
                <Input id="edit_estimatedCompletionDate" name="estimatedCompletionDate" type="date" value={editOrderData.estimatedCompletionDate ? new Date(editOrderData.estimatedCompletionDate).toISOString().split('T')[0] : ''} onChange={handleInputChange} className="col-span-3"/>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_notes" className="text-right">Notas</Label>
                <Textarea id="edit_notes" name="notes" value={editOrderData.notes || ''} onChange={handleInputChange} className="col-span-3" placeholder="Notas adicionales"/>
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

      {/* View Service Order Dialog */}
      <Dialog open={isViewOrderDialogOpen} onOpenChange={(open) => { setIsViewOrderDialogOpen(open); if (!open) setCurrentOrder(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles de Orden de Servicio (SO-{String(currentOrder?.orderIdSequence || '').padStart(3, '0')})</DialogTitle>
          </DialogHeader>
          {currentOrder && (
            <div className="grid gap-3 py-4 text-sm">
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Cliente:</span> <span>{currentOrder.clientName}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Vehículo:</span> <span>{currentOrder.vehicleModel} ({currentOrder.vehicleLicensePlate})</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Fecha Creación:</span> <span>{formatDate(currentOrder.creationDate)}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Estado:</span> <Badge variant={getStatusVariant(currentOrder.status) as any}>{currentOrder.status}</Badge></div>
              <div className="flex flex-col space-y-1 mt-2">
                <span className="font-medium text-muted-foreground">Descripción del Problema:</span>
                <p className="p-2 bg-muted/50 rounded-md">{currentOrder.issueDescription}</p>
              </div>
              {currentOrder.assignedMechanic && <div className="flex justify-between"><span className="font-medium text-muted-foreground">Mecánico Asignado:</span> <span>{currentOrder.assignedMechanic}</span></div>}
              {currentOrder.estimatedCompletionDate && <div className="flex justify-between"><span className="font-medium text-muted-foreground">Fecha Estim. Finalización:</span> <span>{formatDate(currentOrder.estimatedCompletionDate)}</span></div>}
              {currentOrder.notes && (
                <div className="flex flex-col space-y-1 mt-2">
                  <span className="font-medium text-muted-foreground">Notas Adicionales:</span>
                  <p className="p-2 bg-muted/50 rounded-md">{currentOrder.notes}</p>
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
              ¿Estás seguro de que deseas eliminar la orden de servicio SO-{String(serviceOrders.find(o => o._id?.toString() === orderToDeleteId)?.orderIdSequence || '').padStart(3, '0')}? Esta acción no se puede deshacer.
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

    