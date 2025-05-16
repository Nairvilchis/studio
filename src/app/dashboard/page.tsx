
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

import { 
  getAllOrdersAction, 
  createOrderAction, 
  updateOrderAction,
  deleteOrderAction,
  getOrderByIdAction,
} from './service-orders/actions';
import type { Order, NewOrderData, UpdateOrderData } from '@/serviceOrderManager';

// Form types aligned more closely with Order structure
// For NewOrderData, many fields are optional or have defaults set by the manager
type OrderFormDataType = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'log'>>;


export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userName, setUserName] = useState<string | null>(null);
  const [userIdEmpleado, setUserIdEmpleado] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null);

  const initialNewOrderData: OrderFormDataType = {
    vin: '',
    placas: '',
    idCliente: undefined, // Example: will be number
    idMarca: undefined,
    idModelo: undefined,
    año: undefined,
    color: '',
    kilometraje: '',
    idAseguradora: undefined,
    siniestro: '',
    poliza: '',
    folio: '',
    deducible: undefined,
    aseguradoTercero: undefined,
    piso: false,
    grua: false,
    fechaValuacion: undefined,
    fechaRengreso: undefined,
    fechaEntrega: undefined,
    fechaPromesa: undefined,
    idValuador: undefined,
    idAsesor: undefined,
    idHojalatero: undefined,
    idPintor: undefined,
    idPresupuesto: undefined,
    proceso: 'pendiente', // Default for new orders
  };

  const [newOrderData, setNewOrderData] = useState<OrderFormDataType>(initialNewOrderData);
  const [editOrderData, setEditOrderData] = useState<OrderFormDataType>({});

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
        const parsedId = parseInt(storedIdEmpleado, 10);
        setUserIdEmpleado(parsedId);
        // Set default asesor to current user when creating new order
        setNewOrderData(prev => ({ ...prev, idAsesor: parsedId }));
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formType: 'new' | 'edit') => {
    const { name, value, type } = e.target;
    let processedValue: any = value;
    if (type === 'number') {
      processedValue = value === '' ? undefined : parseFloat(value);
    }
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }
    if (type === 'date') {
      processedValue = value ? new Date(value) : undefined;
    }
    
    const setState = formType === 'new' ? setNewOrderData : setEditOrderData;
    setState(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSelectChange = (name: keyof OrderFormDataType, value: string, formType: 'new' | 'edit') => {
    const setState = formType === 'new' ? setNewOrderData : setEditOrderData;
    setState(prev => ({ ...prev, [name]: value as any }));
  };
  
  const handleCreateOrder = async () => {
    // Add more robust validation as needed
    if (!newOrderData.placas || !newOrderData.idCliente) {
      toast({ title: "Error", description: "Placas e ID Cliente son obligatorios.", variant: "destructive" });
      return;
    }
    
    const orderToCreate: NewOrderData = {
      ...newOrderData,
      // Ensure numeric fields are numbers or undefined
      idCliente: Number(newOrderData.idCliente) || undefined,
      idMarca: Number(newOrderData.idMarca) || undefined,
      idModelo: Number(newOrderData.idModelo) || undefined,
      año: Number(newOrderData.año) || undefined,
      idAseguradora: Number(newOrderData.idAseguradora) || undefined,
      deducible: Number(newOrderData.deducible) || undefined,
      idValuador: Number(newOrderData.idValuador) || undefined,
      idAsesor: Number(newOrderData.idAsesor) || userIdEmpleado || undefined, // Default to current user if not set
      idHojalatero: Number(newOrderData.idHojalatero) || undefined,
      idPintor: Number(newOrderData.idPintor) || undefined,
      idPresupuesto: Number(newOrderData.idPresupuesto) || undefined,
    };

    // Remove undefined fields to avoid sending them if not set
    Object.keys(orderToCreate).forEach(key => {
      if (orderToCreate[key as keyof NewOrderData] === undefined) {
        delete orderToCreate[key as keyof NewOrderData];
      }
    });


    const result = await createOrderAction(orderToCreate, userIdEmpleado || undefined);
    if (result.success && result.data) {
      toast({ title: "Éxito", description: `Orden OT-${String(result.data.customOrderId || '').padStart(4, '0')} creada.` });
      setIsCreateOrderDialogOpen(false);
      fetchOrders(); 
      setNewOrderData(initialNewOrderData); 
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear la orden.", variant: "destructive" });
    }
  };

  const openEditDialog = async (orderId: string) => {
    if (!orderId) return;
    const result = await getOrderByIdAction(orderId);
    if (result.success && result.data) {
      const order = result.data;
      setCurrentOrder(order);
      setEditOrderData({
        ...order,
        // Convert Date objects to string for date inputs
        fechaValuacion: order.fechaValuacion ? new Date(order.fechaValuacion).toISOString().split('T')[0] : undefined,
        fechaRengreso: order.fechaRengreso ? new Date(order.fechaRengreso).toISOString().split('T')[0] : undefined,
        fechaEntrega: order.fechaEntrega ? new Date(order.fechaEntrega).toISOString().split('T')[0] : undefined,
        fechaPromesa: order.fechaPromesa ? new Date(order.fechaPromesa).toISOString().split('T')[0] : undefined,
      } as any); // Cast to any because date inputs expect strings
      setIsEditOrderDialogOpen(true);
    } else {
      toast({ title: "Error", description: "No se pudo cargar la orden para editar.", variant: "destructive" });
    }
  };

  const handleUpdateOrder = async () => {
    if (!currentOrder || !currentOrder._id) return;

    const dataToUpdate: UpdateOrderData = {
        ...editOrderData,
        // Ensure numeric fields are numbers or undefined
        idCliente: Number(editOrderData.idCliente) || undefined,
        idMarca: Number(editOrderData.idMarca) || undefined,
        idModelo: Number(editOrderData.idModelo) || undefined,
        año: Number(editOrderData.año) || undefined,
        idAseguradora: Number(editOrderData.idAseguradora) || undefined,
        deducible: Number(editOrderData.deducible) || undefined,
        idValuador: Number(editOrderData.idValuador) || undefined,
        idAsesor: Number(editOrderData.idAsesor) || undefined,
        idHojalatero: Number(editOrderData.idHojalatero) || undefined,
        idPintor: Number(editOrderData.idPintor) || undefined,
        idPresupuesto: Number(editOrderData.idPresupuesto) || undefined,
        // Convert date strings back to Date objects or undefined
        fechaValuacion: editOrderData.fechaValuacion ? new Date(editOrderData.fechaValuacion as string) : undefined,
        fechaRengreso: editOrderData.fechaRengreso ? new Date(editOrderData.fechaRengreso as string) : undefined,
        fechaEntrega: editOrderData.fechaEntrega ? new Date(editOrderData.fechaEntrega as string) : undefined,
        fechaPromesa: editOrderData.fechaPromesa ? new Date(editOrderData.fechaPromesa as string) : undefined,
    };
    
    // Remove undefined fields to avoid sending them if not explicitly set by user
    Object.keys(dataToUpdate).forEach(key => {
        if (dataToUpdate[key as keyof UpdateOrderData] === undefined) {
            delete dataToUpdate[key as keyof UpdateOrderData];
        }
    });


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

  const formatDate = (dateInput?: Date | string): string => {
    if (!dateInput) return 'N/A';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Fecha Inválida';
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: userTimeZone });
  };
  
  const formatDateTime = (dateInput?: Date | string): string => {
    if (!dateInput) return 'N/A';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Fecha Inválida';
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return date.toLocaleString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: userTimeZone });
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
  
  const getProcesoVariant = (proceso?: Order['proceso']) => {
    switch (proceso) {
      case 'entregado': case 'facturado': return 'default'; 
      case 'listo_entrega': return 'default'; 
      case 'hojalateria': case 'pintura': case 'mecanica': case 'armado': case 'detallado_lavado': case 'control_calidad': case 'refacciones_listas': return 'secondary'; 
      case 'espera_refacciones': case 'valuacion': return 'outline'; 
      case 'pendiente': return 'outline';
      case 'cancelado': return 'destructive'; 
      default: return 'secondary';
    }
  };

  const procesoOptions: Order['proceso'][] = [
    'pendiente', 'valuacion', 'espera_refacciones', 'refacciones_listas', 
    'hojalateria', 'preparacion_pintura', 'pintura', 'mecanica', 'armado', 
    'detallado_lavado', 'control_calidad', 'listo_entrega', 'entregado', 
    'facturado', 'garantia', 'cancelado'
  ];

  // Helper function to render dialog fields consistently
  const renderDialogField = (label: string, name: keyof OrderFormDataType, type: string = "text", placeholder?: string, formType: 'new' | 'edit' = 'new', options?: { value: string; label: string }[], isCheckbox?: boolean, isTextarea?: boolean) => {
    const data = formType === 'new' ? newOrderData : editOrderData;
    const value = data[name] as any;

    if (isCheckbox) {
      return (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={`${formType}_${name}`} className="text-right">{label}</Label>
          <Checkbox
            id={`${formType}_${name}`}
            name={name}
            checked={!!value}
            onCheckedChange={(checked) => handleInputChange({ target: { name, value: checked, type: 'checkbox' } } as any, formType)}
            className="col-span-3"
          />
        </div>
      );
    }
    if (isTextarea) {
        return (
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={`${formType}_${name}`} className="text-right">{label}</Label>
                <Textarea
                    id={`${formType}_${name}`}
                    name={name}
                    value={value || ''}
                    onChange={(e) => handleInputChange(e, formType)}
                    className="col-span-3"
                    placeholder={placeholder}
                />
            </div>
        );
    }
    if (options) {
      return (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={`${formType}_${name}`} className="text-right">{label}</Label>
          <Select name={name} value={value || ''} onValueChange={(val) => handleSelectChange(name, val, formType)}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={placeholder || `Seleccione ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${formType}_${name}`} className="text-right">{label}</Label>
        <Input
          id={`${formType}_${name}`}
          name={name}
          type={type}
          value={type === 'date' && value instanceof Date ? value.toISOString().split('T')[0] : value || ''}
          onChange={(e) => handleInputChange(e, formType)}
          className="col-span-3"
          placeholder={placeholder}
        />
      </div>
    );
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
                      <TableHead>Placas</TableHead>
                      <TableHead>Proceso</TableHead>
                      <TableHead>Fecha Registro</TableHead>
                      <TableHead>Asesor (ID)</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order._id?.toString()}>
                        <TableCell className="font-medium">OT-{String(order.idOrder || '').padStart(4, '0')}</TableCell>
                        <TableCell>{order.idCliente || 'N/A'}</TableCell>
                        <TableCell>{order.placas || 'N/A'}</TableCell>
                        <TableCell>
                           <Badge variant={getProcesoVariant(order.proceso) as any}>{order.proceso}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(order.fechaRegistro)}</TableCell>
                        <TableCell>{order.idAsesor || 'N/A'}</TableCell>
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

      {/* Create Order Dialog */}
      <Dialog open={isCreateOrderDialogOpen} onOpenChange={setIsCreateOrderDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nueva Orden de Servicio</DialogTitle>
            <DialogDescription>Complete todos los campos requeridos para la nueva orden.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {renderDialogField("ID Cliente", "idCliente", "number", "Ej: 101", "new")}
            {renderDialogField("VIN", "vin", "text", "Número de Identificación Vehicular", "new")}
            {renderDialogField("ID Marca", "idMarca", "number", "Ej: 1 (Toyota)", "new")}
            {renderDialogField("ID Modelo", "idModelo", "number", "Ej: 5 (Corolla)", "new")}
            {renderDialogField("Año", "año", "number", "Ej: 2022", "new")}
            {renderDialogField("Placas", "placas", "text", "ABC-123", "new")}
            {renderDialogField("Color", "color", "text", "Ej: Rojo", "new")}
            {renderDialogField("Kilometraje", "kilometraje", "text", "Ej: 55000", "new")}
            {renderDialogField("ID Aseguradora", "idAseguradora", "number", "Ej: 1 (GNP)", "new")}
            {renderDialogField("Siniestro / Problema", "siniestro", "text", "Describa el problema", "new", undefined, false, true)}
            {renderDialogField("Póliza", "poliza", "text", "Número de Póliza", "new")}
            {renderDialogField("Folio", "folio", "text", "Folio de Aseguradora", "new")}
            {renderDialogField("Deducible", "deducible", "number", "Monto del deducible", "new")}
            {renderDialogField("Asegurado/Tercero", "aseguradoTercero", "select", "Seleccione tipo", "new", [{value: "asegurado", label: "Asegurado"}, {value: "tercero", label: "Tercero"}])}
            {renderDialogField("¿Es de Piso?", "piso", "checkbox", "", "new", undefined, true)}
            {renderDialogField("¿Llegó en Grúa?", "grua", "checkbox", "", "new", undefined, true)}
            {renderDialogField("Fecha Promesa", "fechaPromesa", "date", "", "new")}
            {renderDialogField("ID Valuador", "idValuador", "number", "ID del Valuador", "new")}
            {renderDialogField("ID Asesor", "idAsesor", "number", `ID Asesor (def: ${userIdEmpleado})`, "new")}
            {renderDialogField("ID Hojalatero", "idHojalatero", "number", "ID del Hojalatero", "new")}
            {renderDialogField("ID Pintor", "idPintor", "number", "ID del Pintor", "new")}
            {/* idPresupuesto se genera/asigna usualmente después */}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleCreateOrder}>Crear Orden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditOrderDialogOpen} onOpenChange={(open) => { setIsEditOrderDialogOpen(open); if (!open) setCurrentOrder(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Orden (OT-{String(currentOrder?.idOrder || '').padStart(4, '0')})</DialogTitle>
            <DialogDescription>Actualice los detalles de la orden.</DialogDescription>
          </DialogHeader>
          {currentOrder && (
            <div className="grid gap-4 py-4">
              {renderDialogField("ID Cliente", "idCliente", "number", "Ej: 101", "edit")}
              {renderDialogField("VIN", "vin", "text", "Número de Identificación Vehicular", "edit")}
              {renderDialogField("ID Marca", "idMarca", "number", "Ej: 1 (Toyota)", "edit")}
              {renderDialogField("ID Modelo", "idModelo", "number", "Ej: 5 (Corolla)", "edit")}
              {renderDialogField("Año", "año", "number", "Ej: 2022", "edit")}
              {renderDialogField("Placas", "placas", "text", "ABC-123", "edit")}
              {renderDialogField("Color", "color", "text", "Ej: Rojo", "edit")}
              {renderDialogField("Kilometraje", "kilometraje", "text", "Ej: 55000", "edit")}
              {renderDialogField("ID Aseguradora", "idAseguradora", "number", "Ej: 1 (GNP)", "edit")}
              {renderDialogField("Siniestro / Problema", "siniestro", "text", "Describa el problema", "edit", undefined, false, true)}
              {renderDialogField("Póliza", "poliza", "text", "Número de Póliza", "edit")}
              {renderDialogField("Folio", "folio", "text", "Folio de Aseguradora", "edit")}
              {renderDialogField("Deducible", "deducible", "number", "Monto del deducible", "edit")}
              {renderDialogField("Asegurado/Tercero", "aseguradoTercero", "select", "Seleccione tipo", "edit", [{value: "asegurado", label: "Asegurado"}, {value: "tercero", label: "Tercero"}])}
              {renderDialogField("¿Es de Piso?", "piso", "checkbox", "", "edit", undefined, true)}
              {renderDialogField("¿Llegó en Grúa?", "grua", "checkbox", "", "edit", undefined, true)}
              {renderDialogField("Proceso", "proceso", "select", "Seleccione proceso", "edit", procesoOptions.map(p => ({value: p, label: p.charAt(0).toUpperCase() + p.slice(1).replace(/_/g, ' ')})))}
              {renderDialogField("Fecha Valuación", "fechaValuacion", "date", "", "edit")}
              {renderDialogField("Fecha Reingreso", "fechaRengreso", "date", "", "edit")}
              {renderDialogField("Fecha Entrega", "fechaEntrega", "date", "", "edit")}
              {renderDialogField("Fecha Promesa", "fechaPromesa", "date", "", "edit")}
              {renderDialogField("ID Valuador", "idValuador", "number", "ID del Valuador", "edit")}
              {renderDialogField("ID Asesor", "idAsesor", "number", "ID del Asesor", "edit")}
              {renderDialogField("ID Hojalatero", "idHojalatero", "number", "ID del Hojalatero", "edit")}
              {renderDialogField("ID Pintor", "idPintor", "number", "ID del Pintor", "edit")}
              {renderDialogField("ID Presupuesto", "idPresupuesto", "number", "ID del Presupuesto", "edit")}
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

      {/* View Order Dialog */}
      <Dialog open={isViewOrderDialogOpen} onOpenChange={(open) => { setIsViewOrderDialogOpen(open); if (!open) setCurrentOrder(null); }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de Orden (OT-{String(currentOrder?.idOrder || '').padStart(4, '0')})</DialogTitle>
          </DialogHeader>
          {currentOrder && (
            <div className="grid gap-3 py-4 text-sm">
              <h3 className="font-semibold text-base mb-2 col-span-2">Información General y Vehículo</h3>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">ID Cliente:</span> <span>{currentOrder.idCliente || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">VIN:</span> <span>{currentOrder.vin || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Placas:</span> <span>{currentOrder.placas || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Marca (ID):</span> <span>{currentOrder.idMarca || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Modelo (ID):</span> <span>{currentOrder.idModelo || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Año:</span> <span>{currentOrder.año || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Color:</span> <span>{currentOrder.color || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Kilometraje:</span> <span>{currentOrder.kilometraje || 'N/A'}</span></div>
              
              <h3 className="font-semibold text-base mt-3 mb-2 col-span-2">Información de Aseguradora</h3>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">ID Aseguradora:</span> <span>{currentOrder.idAseguradora || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Ajustador (ID):</span> <span>{currentOrder.ajustador || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Póliza:</span> <span>{currentOrder.poliza || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Folio:</span> <span>{currentOrder.folio || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Deducible:</span> <span>{currentOrder.deducible !== undefined ? `$${currentOrder.deducible}` : 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Tipo:</span> <span className="capitalize">{currentOrder.aseguradoTercero || 'N/A'}</span></div>

              <h3 className="font-semibold text-base mt-3 mb-2 col-span-2">Detalles del Taller</h3>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Proceso Actual:</span> <Badge variant={getProcesoVariant(currentOrder.proceso) as any}>{currentOrder.proceso}</Badge></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">De Piso:</span> <span>{currentOrder.piso ? 'Sí' : 'No'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Llegó en Grúa:</span> <span>{currentOrder.grua ? 'Sí' : 'No'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">URL Archivos:</span> <span>{currentOrder.urlArchivos || 'N/A'}</span></div>
              
              <h3 className="font-semibold text-base mt-3 mb-2 col-span-2">Fechas Clave</h3>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Registro:</span> <span>{formatDate(currentOrder.fechaRegistro)}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Valuación:</span> <span>{formatDate(currentOrder.fechaValuacion)}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Reingreso:</span> <span>{formatDate(currentOrder.fechaRengreso)}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Entrega Estimada:</span> <span>{formatDate(currentOrder.fechaPromesa)}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Entrega Real:</span> <span>{formatDate(currentOrder.fechaEntrega)}</span></div>

              <h3 className="font-semibold text-base mt-3 mb-2 col-span-2">Personal Asignado (IDs)</h3>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Asesor:</span> <span>{currentOrder.idAsesor || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Valuador:</span> <span>{currentOrder.idValuador || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Hojalatero:</span> <span>{currentOrder.idHojalatero || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">Pintor:</span> <span>{currentOrder.idPintor || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-medium text-muted-foreground">ID Presupuesto:</span> <span>{currentOrder.idPresupuesto || 'N/A'}</span></div>

              <div className="flex flex-col space-y-1 mt-2 col-span-2">
                <span className="font-medium text-muted-foreground">Siniestro/Problema Detallado:</span>
                <p className="p-2 bg-muted/50 rounded-md whitespace-pre-wrap">{currentOrder.siniestro || 'No especificado'}</p>
              </div>
              
              {currentOrder.log && currentOrder.log.length > 0 && (
                <div className="mt-3 col-span-2">
                  <h4 className="font-medium text-muted-foreground mb-1">Historial de Cambios:</h4>
                  <ul className="list-disc list-inside text-xs space-y-1 max-h-40 overflow-y-auto bg-muted/30 p-2 rounded-md">
                    {currentOrder.log.map((entry, index) => (
                      <li key={index}>
                        {formatDateTime(entry.timestamp)} por {entry.userId || 'Sistema'}: {entry.action}{entry.details ? ` (${entry.details})` : ''}
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
