
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogOut, CalendarDays, Wrench, Package, PlusCircle, Edit, Trash2, EyeIcon, Car, Shield, Users, Settings, Building, UserX } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

import type {
  UserRole as UserRoleType,
  Empleado,
  SystemUserCredentials,
  Order,
  NewOrderData,
  UpdateOrderData,
  MarcaVehiculo,
  NewMarcaData,
  ModeloVehiculo,
  Aseguradora,
  NewAseguradoraData,
  Ajustador,
  Cliente,
} from '@/lib/types';
import { UserRole } from '@/lib/types';


import {
  getAllOrdersAction,
  createOrderAction,
  updateOrderAction,
  deleteOrderAction,
  getOrderByIdAction,
  getAsesores,
  getValuadores,
  getEmployeesByPosition,
} from './service-orders/actions';

import {
  getAllMarcasAction,
  createMarcaAction,
  updateMarcaAction,
  deleteMarcaAction,
  addModeloToMarcaAction,
  updateModeloInMarcaAction,
  removeModeloFromMarcaAction,
  getMarcaByIdAction as getMarcaForModelosAction,
} from './admin/marcas/actions';

import {
  getAllAseguradorasAction,
  createAseguradoraAction,
  updateAseguradoraAction,
  deleteAseguradoraAction,
  addAjustadorToAseguradoraAction,
  updateAjustadorInAseguradoraAction,
  removeAjustadorFromAseguradoraAction,
  getAseguradoraByIdAction as getAseguradoraForAjustadoresAction,
} from './admin/aseguradoras/actions';

import { getClients } from './admin/clients/actions';

import {
  getAllEmpleadosAction,
  createEmpleadoAction,
  getEmpleadoByIdAction as getEmpleadoForEditAction,
  updateEmpleadoAction,
  deleteEmpleadoAction,
  removeSystemUserFromEmpleadoAction,
} from './admin/empleados/actions';

type OrderFormDataType = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'log'>> & {
  // IDs from related collections will be strings (MongoDB _id)
  idMarca?: string;
  idAseguradora?: string;
  idCliente?: string; 
  idValuador?: string; 
  idAsesor?: string; 
  idHojalatero?: string; 
  idPintor?: string; 
  idPresupuesto?: string; 
  // Numeric specific IDs within those related documents (if applicable)
  idModelo?: number | string; // string from input, number for DB
  ajustador?: number | string; // string from input, number for DB
  // Other fields that might be numbers but come from text inputs
  año?: number | string;
  deducible?: number | string;
  kilometraje?: string; // Keep as string as it might contain "km"
};

type MarcaFormDataType = Partial<Omit<MarcaVehiculo, '_id' | 'idMarca' | 'modelos'>>;
type ModeloFormDataType = Partial<ModeloVehiculo>;
type AseguradoraFormDataType = Partial<Omit<Aseguradora, '_id' | 'idAseguradora' | 'ajustadores'>>;
type AjustadorFormDataType = Partial<Ajustador>;

type EmpleadoFormDataType = Omit<Empleado, '_id' | 'fechaRegistro' | 'user'> & {
  createSystemUser?: boolean;
  systemUserUsuario?: string;
  systemUserContraseña?: string;
  systemUserConfirmContraseña?: string;
  systemUserRol?: UserRoleType;
};
type EditEmpleadoFormDataType = Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>> & {
  systemUserUsuario?: string;
  systemUserRol?: UserRoleType;
  newSystemUserContraseña?: string;
  newSystemUserConfirmContraseña?: string;
  createSystemUser?: boolean; 
};


export default function DashboardPage() {
  console.log("DashboardPage: Renderizando componente...");
  const router = useRouter();
  const { toast } = useToast();
  const [userName, setUserName] = useState<string | null>(null);
  const [empleadoId, setEmpleadoId] = useState<string | null>(null); // This is Empleado._id
  const [userRole, setUserRole] = useState<UserRoleType | null>(null);


  // --- Orders State ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false);
  const [isDeleteOrderDialogOpen, setIsDeleteOrderDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null);

  const initialNewOrderData: OrderFormDataType = {
    proceso: 'pendiente',
    piso: false,
    grua: false,
  };
  const [newOrderData, setNewOrderData] = useState<OrderFormDataType>(initialNewOrderData);
  const [editOrderData, setEditOrderData] = useState<OrderFormDataType>({});

  const [clients, setClients] = useState<Cliente[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [asesores, setAsesores] = useState<{ _id: string; nombre: string }[]>([]);
  const [isLoadingAsesores, setIsLoadingAsesores] = useState(true); 
  const [valuadores, setValuadores] = useState<{ _id: string; nombre: string }[]>([]);
  const [hojalateros, setHojalateros] = useState<{ _id: string; nombre: string }[]>([]);
  const [pintores, setPintores] = useState<{ _id: string; nombre: string }[]>([]);


  // --- Admin: Marcas State ---
  const [marcas, setMarcas] = useState<MarcaVehiculo[]>([]);
  const [isLoadingMarcas, setIsLoadingMarcas] = useState(true);
  const [isCreateMarcaDialogOpen, setIsCreateMarcaDialogOpen] = useState(false);
  const [isEditMarcaDialogOpen, setIsEditMarcaDialogOpen] = useState(false);
  const [isDeleteMarcaDialogOpen, setIsDeleteMarcaDialogOpen] = useState(false);
  const [currentMarca, setCurrentMarca] = useState<MarcaVehiculo | null>(null);
  const [marcaToDeleteId, setMarcaToDeleteId] = useState<string | null>(null);
  const [newMarcaData, setNewMarcaData] = useState<MarcaFormDataType>({ marca: '' });
  const [editMarcaData, setEditMarcaData] = useState<MarcaFormDataType>({});

  // --- Admin: Modelos State (related to a currentMarca) ---
  const [isManageModelosDialogOpen, setIsManageModelosDialogOpen] = useState(false);
  const [isCreateModeloDialogOpen, setIsCreateModeloDialogOpen] = useState(false);
  const [isEditModeloDialogOpen, setIsEditModeloDialogOpen] = useState(false);
  const [currentModelo, setCurrentModelo] = useState<ModeloVehiculo | null>(null);
  const [newModeloData, setNewModeloData] = useState<ModeloFormDataType>({ idModelo: undefined, modelo: '' });
  const [editModeloData, setEditModeloData] = useState<ModeloFormDataType>({});

  // --- Admin: Aseguradoras State ---
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  const [isLoadingAseguradoras, setIsLoadingAseguradoras] = useState(true);
  const [isCreateAseguradoraDialogOpen, setIsCreateAseguradoraDialogOpen] = useState(false);
  const [isEditAseguradoraDialogOpen, setIsEditAseguradoraDialogOpen] = useState(false);
  const [isDeleteAseguradoraDialogOpen, setIsDeleteAseguradoraDialogOpen] = useState(false);
  const [currentAseguradora, setCurrentAseguradora] = useState<Aseguradora | null>(null);
  const [aseguradoraToDeleteId, setAseguradoraToDeleteId] = useState<string | null>(null);
  const [newAseguradoraData, setNewAseguradoraData] = useState<AseguradoraFormDataType>({ nombre: '', telefono: '' });
  const [editAseguradoraData, setEditAseguradoraData] = useState<AseguradoraFormDataType>({});

  // --- Admin: Ajustadores State (related to currentAseguradora) ---
  const [isManageAjustadoresDialogOpen, setIsManageAjustadoresDialogOpen] = useState(false);
  const [isCreateAjustadorDialogOpen, setIsCreateAjustadorDialogOpen] = useState(false);
  const [isEditAjustadorDialogOpen, setIsEditAjustadorDialogOpen] = useState(false);
  const [currentAjustador, setCurrentAjustador] = useState<Ajustador | null>(null);
  const [newAjustadorData, setNewAjustadorData] = useState<AjustadorFormDataType>({ nombre: '', telefono: '', correo: '' });
  const [editAjustadorData, setEditAjustadorData] = useState<AjustadorFormDataType>({});

  // --- Admin: Empleados State ---
  const [empleadosList, setEmpleadosList] = useState<Empleado[]>([]);
  const [isLoadingEmpleadosList, setIsLoadingEmpleadosList] = useState(true);
  const [isCreateEmpleadoDialogOpen, setIsCreateEmpleadoDialogOpen] = useState(false);
  const [isEditEmpleadoDialogOpen, setIsEditEmpleadoDialogOpen] = useState(false);
  const [isDeleteEmpleadoDialogOpen, setIsDeleteEmpleadoDialogOpen] = useState(false);
  const [currentEmpleadoToEdit, setCurrentEmpleadoToEdit] = useState<Empleado | null>(null);
  const initialNewEmpleadoData: EmpleadoFormDataType = {
    nombre: '', puesto: '', createSystemUser: false, systemUserUsuario: '', systemUserContraseña: '', systemUserConfirmContraseña: '', systemUserRol: UserRole.ASESOR,
  };
  const [newEmpleadoData, setNewEmpleadoData] = useState<EmpleadoFormDataType>(initialNewEmpleadoData);
  const [editEmpleadoData, setEditEmpleadoData] = useState<EditEmpleadoFormDataType>({
    nombre: '', puesto: '', createSystemUser: false 
  });
  const [empleadoToDeleteId, setEmpleadoToDeleteId] = useState<string | null>(null);


  useEffect(() => {
    console.log("Dashboard useEffect: Verificando sesión...");
    const loggedIn = localStorage.getItem('isLoggedIn');
    const storedUserName = localStorage.getItem('username'); // This is Empleado.user.usuario
    const storedEmpleadoId = localStorage.getItem('empleadoId'); // This is Empleado._id
    const storedUserRole = localStorage.getItem('userRole') as UserRoleType | null; // This is Empleado.user.rol

    console.log("Dashboard useEffect: Valores RAW de localStorage:", {
      loggedIn,
      storedUserName,
      storedEmpleadoId,
      storedUserRole
    });

    const isEmpleadoIdValid = storedEmpleadoId && storedEmpleadoId !== 'null' && storedEmpleadoId !== 'undefined' && storedEmpleadoId.trim() !== '';
    const isUserRoleValid = storedUserRole && storedUserRole !== 'null' && storedUserRole !== 'undefined' && Object.values(UserRole).includes(storedUserRole as UserRole);

    console.log("Dashboard useEffect: Validaciones de sesión:", {
        isLoggedIn: loggedIn === 'true',
        isUserNamePresent: !!storedUserName,
        isEmpleadoIdValid,
        isUserRoleValid
    });
    
    if (loggedIn === 'true' && storedUserName && isEmpleadoIdValid && isUserRoleValid) {
      console.log("Dashboard useEffect: Usuario logueado y datos válidos. Configurando estado y cargando datos iniciales.");
      setUserName(storedUserName);
      setEmpleadoId(storedEmpleadoId); 
      setUserRole(storedUserRole as UserRoleType);

      if (storedUserRole === UserRole.ASESOR) {
        console.log("Dashboard useEffect: Es ASESOR. Pre-llenando idAsesor en newOrderData con Empleado._id:", storedEmpleadoId);
        setNewOrderData(prev => ({ ...prev, idAsesor: storedEmpleadoId }));
      }
      console.log("Dashboard useEffect: Llamando a fetchInitialData...");
      fetchInitialData(storedUserRole as UserRoleType, storedEmpleadoId);
      console.log("Dashboard useEffect: fetchInitialData llamado.");
    } else {
      console.log("Dashboard useEffect: Sesión inválida o datos faltantes. Redirigiendo a /. Detalles:", { loggedIn, storedUserName, storedEmpleadoId, storedUserRole });
      router.replace('/');
    }
  }, [router]);

  const fetchInitialData = async (role: UserRoleType | null, currentEmpleadoLogId: string | null) => {
    console.log("fetchInitialData: Iniciando carga de datos...", { role, currentEmpleadoId: currentEmpleadoLogId });
    
    setNewOrderData(prev => ({ 
        ...initialNewOrderData, // Reset to initial defaults
        idAsesor: role === UserRole.ASESOR && currentEmpleadoLogId ? currentEmpleadoLogId : undefined,
    }));

    setIsLoadingOrders(true);
    setIsLoadingMarcas(true);
    setIsLoadingAseguradoras(true);
    setIsLoadingClients(true);
    setIsLoadingAsesores(true); 
    if (role === UserRole.ADMIN) setIsLoadingEmpleadosList(true);

    try {
      await Promise.all([
        fetchOrders(),
        fetchMarcas(),
        fetchAseguradoras(),
        fetchClients(),
        fetchAsesores(),
        fetchValuadores(),
        fetchHojalateros(),
        fetchPintores(),
        role === UserRole.ADMIN ? fetchEmpleados() : Promise.resolve(),
      ]);
      console.log("fetchInitialData: Todos los datos cargados.");
    } catch (error) {
      console.error("fetchInitialData: Error al cargar datos iniciales:", error);
      toast({ title: "Error Crítico", description: "No se pudieron cargar los datos iniciales del dashboard.", variant: "destructive" });
    }
  };

  const fetchValuadores = async () => {
    console.log("fetchValuadores: Iniciando...");
    try {
      const result = await getValuadores();
      console.log("fetchValuadores: Resultado:", result);
      if (result.success && result.data) setValuadores(result.data);
      else toast({ title: "Error Valuadores", description: result.error || "No se pudieron cargar valuadores.", variant: "destructive" });
    } catch (error) {
      console.error("fetchValuadores: Error en la acción o al procesar:", error);
      toast({ title: "Error Crítico Valuadores", description: "Fallo al obtener valuadores.", variant: "destructive" });
    }
  };

  const fetchHojalateros = async () => {
    console.log("fetchHojalateros: Iniciando...");
    try {
      const result = await getEmployeesByPosition('Hojalatero');
      console.log("fetchHojalateros: Resultado:", result);
      if (result.success && result.data) setHojalateros(result.data);
      else toast({ title: "Error Hojalateros", description: result.error || "No se pudieron cargar hojalateros.", variant: "destructive" });
    } catch (error) {
      console.error("fetchHojalateros: Error en la acción o al procesar:", error);
      toast({ title: "Error Crítico Hojalateros", description: "Fallo al obtener hojalateros.", variant: "destructive" });
    }
  };

  const fetchPintores = async () => {
    console.log("fetchPintores: Iniciando...");
    try {
      const result = await getEmployeesByPosition('Pintor');
      console.log("fetchPintores: Resultado:", result);
      if (result.success && result.data) setPintores(result.data);
      else toast({ title: "Error Pintores", description: result.error || "No se pudieron cargar pintores.", variant: "destructive" });
    } catch (error) {
      console.error("fetchPintores: Error en la acción o al procesar:", error);
      toast({ title: "Error Crítico Pintores", description: "Fallo al obtener pintores.", variant: "destructive" });
    }
  };

  const fetchClients = async () => {
    console.log("fetchClients: Iniciando...");
    try {
      const result = await getClients();
      console.log("fetchClients: Resultado:", result);
      if (result.success && result.data) {
        setClients(result.data);
      } else {
        toast({ title: "Error Clientes", description: result.error || "No se pudo cargar clientes.", variant: "destructive" });
        setClients([]);
      }
    } catch (error) {
      console.error("fetchClients: Error en la acción o al procesar:", error);
      toast({ title: "Error Crítico Clientes", description: "Fallo al obtener clientes.", variant: "destructive" });
    } finally {
      setIsLoadingClients(false);
    }
  };

  const fetchAsesores = async () => {
    console.log("fetchAsesores: Iniciando...");
    try {
      const result = await getAsesores();
      console.log("fetchAsesores: Resultado:", result);
      if (result.success && result.data) setAsesores(result.data);
      else toast({ title: "Error Asesores", description: result.error || "No se pudieron cargar asesores.", variant: "destructive" });
    } catch (error) {
      console.error("fetchAsesores: Error en la acción o al procesar:", error);
      toast({ title: "Error Crítico Asesores", description: "Fallo al obtener asesores.", variant: "destructive" });
    } finally {
      setIsLoadingAsesores(false);
    }
  };

  const fetchOrders = async () => {
    console.log("fetchOrders: Iniciando...");
    try {
      const result = await getAllOrdersAction();
      console.log("fetchOrders: Resultado de getAllOrdersAction:", result);
      if (result.success && result.data) setOrders(result.data);
      else toast({ title: "Error Órdenes", description: result.error || "No se pudieron cargar las órdenes.", variant: "destructive" });
    } catch (error) {
      console.error("fetchOrders: Error en la acción o al procesar:", error);
      toast({ title: "Error Crítico Órdenes", description: "Fallo al obtener órdenes.", variant: "destructive" });
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchMarcas = async () => {
    console.log("fetchMarcas: Iniciando...");
    try {
      const result = await getAllMarcasAction();
      console.log("fetchMarcas: Resultado:", result);
      if (result.success && result.data) setMarcas(result.data);
      else toast({ title: "Error Marcas", description: result.error || "No se pudieron cargar las marcas.", variant: "destructive" });
    } catch (error) {
      console.error("fetchMarcas: Error en la acción o al procesar:", error);
      toast({ title: "Error Crítico Marcas", description: "Fallo al obtener marcas.", variant: "destructive" });
    } finally {
      setIsLoadingMarcas(false);
    }
  };

  const fetchAseguradoras = async () => {
    console.log("fetchAseguradoras: Iniciando...");
    try {
      const result = await getAllAseguradorasAction();
      console.log("fetchAseguradoras: Resultado:", result);
      if (result.success && result.data) setAseguradoras(result.data);
      else toast({ title: "Error Aseguradoras", description: result.error || "No se pudieron cargar las aseguradoras.", variant: "destructive" });
    } catch (error) {
      console.error("fetchAseguradoras: Error en la acción o al procesar:", error);
      toast({ title: "Error Crítico Aseguradoras", description: "Fallo al obtener aseguradoras.", variant: "destructive" });
    } finally {
      setIsLoadingAseguradoras(false);
    }
  };

  const fetchEmpleados = async () => {
    console.log("fetchEmpleados: Iniciando...");
    try {
      const result = await getAllEmpleadosAction();
      console.log("fetchEmpleados: Resultado:", result);
      if (result.success && result.data) setEmpleadosList(result.data);
      else toast({ title: "Error Empleados", description: result.error || "No se pudieron cargar los empleados.", variant: "destructive" });
    } catch (error) {
      console.error("fetchEmpleados: Error en la acción o al procesar:", error);
      toast({ title: "Error Crítico Empleados", description: "Fallo al obtener empleados.", variant: "destructive" });
    } finally {
      setIsLoadingEmpleadosList(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('empleadoId');
    localStorage.removeItem('userRole');
    router.replace('/');
  };

  const handleInputChangeGeneric = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any; type: string } },
    setState: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const target = e.target as { name: string; value: any; type: string }; // Simplified target type based on usage
    const { name, value, type } = target;
    let processedValue: any;
  
    if (type === 'checkbox') {
      processedValue = value; // `value` is already the boolean state for checkboxes from our synthetic event passed by renderDialogField
    } else if (type === 'number') {
      // For number inputs, we store the string value, or undefined if empty.
      // Conversion to actual Number type happens during form submission.
      processedValue = value === '' ? undefined : value; 
    } else {
      processedValue = value;
    }
    
    setState((prev: any) => ({ ...prev, [name]: processedValue }));
  };

  const handleSelectChangeGeneric = (
    name: string, value: string | undefined,
    setState: React.Dispatch<React.SetStateAction<any>>
  ) => {
    setState((prev: any) => ({ ...prev, [name]: value }));
  };

  // --- Order Management Functions ---
  const handleOrderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formType: 'new' | 'edit') => {
    handleInputChangeGeneric(e, formType === 'new' ? setNewOrderData : setEditOrderData);
  };
  const handleOrderSelectChange = (name: keyof OrderFormDataType, value: string | undefined, formType: 'new' | 'edit') => {
    handleSelectChangeGeneric(name as string, value, formType === 'new' ? setNewOrderData : setEditOrderData);
  };

  const handleCreateOrder = async () => {
    if (!newOrderData.placas || !newOrderData.idCliente) {
      toast({ title: "Error de Validación", description: "Placas y Cliente son obligatorios.", variant: "destructive" });
      return;
    }

    const currentEmpleadoLogId = empleadoId; 
    if (!currentEmpleadoLogId) {
        toast({ title: "Error de Autenticación", description: "No se pudo identificar al usuario para el registro de log.", variant: "destructive" });
        return;
    }

    const orderToCreate: NewOrderData = {
      // IDs from Selects (already strings or undefined)
      idCliente: newOrderData.idCliente,
      idMarca: newOrderData.idMarca,
      idAseguradora: newOrderData.idAseguradora,
      idValuador: newOrderData.idValuador,
      idAsesor: newOrderData.idAsesor,
      idHojalatero: newOrderData.idHojalatero,
      idPintor: newOrderData.idPintor,
      idPresupuesto: newOrderData.idPresupuesto,

      // Numeric fields from string inputs (convert or pass undefined)
      idModelo: newOrderData.idModelo ? Number(newOrderData.idModelo) : undefined,
      año: newOrderData.año ? Number(newOrderData.año) : undefined,
      ajustador: newOrderData.ajustador ? Number(newOrderData.ajustador) : undefined,
      deducible: newOrderData.deducible ? Number(newOrderData.deducible) : undefined,
      
      // String fields
      vin: newOrderData.vin,
      placas: newOrderData.placas,
      color: newOrderData.color,
      kilometraje: newOrderData.kilometraje,
      siniestro: newOrderData.siniestro,
      poliza: newOrderData.poliza,
      folio: newOrderData.folio,
      urlArchivos: newOrderData.urlArchivos,

      // Enum/Boolean fields
      aseguradoTercero: newOrderData.aseguradoTercero as Order['aseguradoTercero'],
      piso: !!newOrderData.piso,
      grua: !!newOrderData.grua,
      proceso: newOrderData.proceso as Order['proceso'] || 'pendiente',

      // Date fields (convert from string 'YYYY-MM-DD' or pass undefined)
      fechaValuacion: newOrderData.fechaValuacion ? new Date(newOrderData.fechaValuacion as string) : undefined,
      fechaRengreso: newOrderData.fechaRengreso ? new Date(newOrderData.fechaRengreso as string) : undefined,
      fechaEntrega: newOrderData.fechaEntrega ? new Date(newOrderData.fechaEntrega as string) : undefined,
      fechaPromesa: newOrderData.fechaPromesa ? new Date(newOrderData.fechaPromesa as string) : undefined,
    };

    const result = await createOrderAction(orderToCreate, currentEmpleadoLogId);
    if (result.success && result.data) {
      toast({ title: "Éxito", description: `Orden OT-${String(result.data.customOrderId || '').padStart(4, '0')} creada.` });
      setIsCreateOrderDialogOpen(false); 
      fetchOrders(); 
      setNewOrderData({ 
        ...initialNewOrderData, 
        idAsesor: userRole === UserRole.ASESOR && empleadoId ? empleadoId : undefined,
      });
    } else {
      toast({ title: "Error al Crear", description: result.error || "No se pudo crear la orden.", variant: "destructive" });
    }
  };

  const openEditOrderDialog = async (orderId: string) => {
    const result = await getOrderByIdAction(orderId);
    if (result.success && result.data) {
      const order = result.data;
      setCurrentOrder(order);

      const formatDateForInput = (date?: Date | string): string | undefined => {
        if (!date) return undefined;
        const d = new Date(date);
        if (isNaN(d.getTime())) return undefined;
        // Ensure it's formatted as YYYY-MM-DD for date input
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      setEditOrderData({
        // Spread all fields first
        ...order,
        // Ensure IDs are strings for Select components or inputs
        idCliente: order.idCliente?.toString(),
        idMarca: order.idMarca?.toString(),
        idAseguradora: order.idAseguradora?.toString(),
        idValuador: order.idValuador?.toString(),
        idAsesor: order.idAsesor?.toString(),
        idHojalatero: order.idHojalatero?.toString(),
        idPintor: order.idPintor?.toString(),
        idPresupuesto: order.idPresupuesto?.toString(),

        // Numeric fields likely coming from number inputs, ensure they are strings for form state
        idModelo: order.idModelo?.toString(),
        año: order.año?.toString(),
        ajustador: order.ajustador?.toString(),
        deducible: order.deducible?.toString(),
        
        // Dates need to be in 'yyyy-MM-dd' format for <input type="date">
        fechaValuacion: formatDateForInput(order.fechaValuacion),
        fechaRengreso: formatDateForInput(order.fechaRengreso),
        fechaEntrega: formatDateForInput(order.fechaEntrega),
        fechaPromesa: formatDateForInput(order.fechaPromesa),
      } as OrderFormDataType);
      setIsEditOrderDialogOpen(true);
    } else {
      toast({ title: "Error", description: "No se pudo cargar la orden para editar.", variant: "destructive" });
    }
  };

  const handleUpdateOrder = async () => {
    if (!currentOrder || !currentOrder._id) return;

    const currentEmpleadoLogId = empleadoId; 
    if (!currentEmpleadoLogId) {
        toast({ title: "Error de Autenticación", description: "No se pudo identificar al usuario para el registro de log.", variant: "destructive" });
        return;
    }

    const dataToUpdate: UpdateOrderData = {
        // IDs from Selects (will be strings or undefined)
        idCliente: editOrderData.idCliente,
        idMarca: editOrderData.idMarca,
        idAseguradora: editOrderData.idAseguradora,
        idValuador: editOrderData.idValuador,
        idAsesor: editOrderData.idAsesor,
        idHojalatero: editOrderData.idHojalatero,
        idPintor: editOrderData.idPintor,
        idPresupuesto: editOrderData.idPresupuesto,

        // Numeric fields from string inputs (convert or pass undefined)
        idModelo: editOrderData.idModelo ? Number(editOrderData.idModelo) : undefined,
        año: editOrderData.año ? Number(editOrderData.año) : undefined,
        ajustador: editOrderData.ajustador ? Number(editOrderData.ajustador) : undefined,
        deducible: editOrderData.deducible ? Number(editOrderData.deducible) : undefined,
        
        // String fields
        vin: editOrderData.vin,
        placas: editOrderData.placas,
        color: editOrderData.color,
        kilometraje: editOrderData.kilometraje,
        siniestro: editOrderData.siniestro,
        poliza: editOrderData.poliza,
        folio: editOrderData.folio,
        urlArchivos: editOrderData.urlArchivos,

        // Enum/Boolean fields
        aseguradoTercero: editOrderData.aseguradoTercero as Order['aseguradoTercero'],
        piso: !!editOrderData.piso,
        grua: !!editOrderData.grua,
        proceso: editOrderData.proceso as Order['proceso'],

        // Date fields (convert from string 'YYYY-MM-DD' or pass undefined)
        fechaValuacion: editOrderData.fechaValuacion ? new Date(editOrderData.fechaValuacion as string) : undefined,
        fechaRengreso: editOrderData.fechaRengreso ? new Date(editOrderData.fechaRengreso as string) : undefined,
        fechaEntrega: editOrderData.fechaEntrega ? new Date(editOrderData.fechaEntrega as string) : undefined,
        fechaPromesa: editOrderData.fechaPromesa ? new Date(editOrderData.fechaPromesa as string) : undefined,
    };
    
    // Clean up undefined optional string ID fields (to prevent sending empty strings if Select is cleared)
    const optionalStringIdKeys: (keyof UpdateOrderData)[] = ['idCliente', 'idMarca', 'idAseguradora', 'idValuador', 'idAsesor', 'idHojalatero', 'idPintor', 'idPresupuesto'];
    optionalStringIdKeys.forEach(key => {
      if (dataToUpdate[key] === '' || dataToUpdate[key] === 'null_value_placeholder') { // 'null_value_placeholder' is from our Select helper
        (dataToUpdate as any)[key] = undefined; 
      }
    });

    // Remove any top-level undefined properties to avoid sending them in $set
    Object.keys(dataToUpdate).forEach(keyStr => {
        const key = keyStr as keyof UpdateOrderData;
        if ((dataToUpdate as any)[key] === undefined) {
            delete (dataToUpdate as any)[key];
        }
    });


    const result = await updateOrderAction(currentOrder._id.toString(), dataToUpdate, currentEmpleadoLogId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsEditOrderDialogOpen(false); fetchOrders(); setCurrentOrder(null); setEditOrderData({});
    } else {
      toast({ title: "Error al Actualizar", description: result.error || "No se pudo actualizar.", variant: "destructive" });
    }
  };
  const openViewOrderDialog = async (orderId: string) => {
    const result = await getOrderByIdAction(orderId);
    if (result.success && result.data) { setCurrentOrder(result.data); setIsViewOrderDialogOpen(true);}
    else { toast({ title: "Error", description: "No se pudo cargar la orden.", variant: "destructive" });}
  };
  const openDeleteOrderDialog = (orderId: string) => { setOrderToDeleteId(orderId); setIsDeleteOrderDialogOpen(true); };
  const handleDeleteOrder = async () => {
    if (!orderToDeleteId) return;
    const result = await deleteOrderAction(orderToDeleteId);
    if (result.success) { toast({ title: "Éxito", description: result.message }); fetchOrders(); }
    else { toast({ title: "Error", description: result.error || "Error al eliminar", variant: "destructive" }); }
    setIsDeleteOrderDialogOpen(false); setOrderToDeleteId(null);
  };

  // --- Marca Management Functions ---
  const handleCreateMarca = async () => {
    if (!newMarcaData.marca?.trim()) {
      toast({ title: "Error", description: "El nombre de la marca es obligatorio.", variant: "destructive" }); return;
    }
    const result = await createMarcaAction(newMarcaData as NewMarcaData);
    if (result.success) {
      toast({ title: "Éxito", description: `Marca "${newMarcaData.marca}" creada.` });
      setIsCreateMarcaDialogOpen(false); fetchMarcas(); setNewMarcaData({ marca: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear la marca.", variant: "destructive" });
    }
  };
  const openEditMarcaDialog = (marca: MarcaVehiculo) => { setCurrentMarca(marca); setEditMarcaData({ marca: marca.marca }); setIsEditMarcaDialogOpen(true); };
  const handleUpdateMarca = async () => {
    if (!currentMarca || !currentMarca._id || !editMarcaData.marca?.trim()) {
      toast({ title: "Error", description: "Datos inválidos para actualizar marca.", variant: "destructive" }); return;
    }
    const result = await updateMarcaAction(currentMarca._id.toString(), editMarcaData);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsEditMarcaDialogOpen(false); fetchMarcas(); setCurrentMarca(null); setEditMarcaData({ marca: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar la marca.", variant: "destructive" });
    }
  };
  const openDeleteMarcaDialog = (marcaId: string) => { setMarcaToDeleteId(marcaId); setIsDeleteMarcaDialogOpen(true); };
  const handleDeleteMarca = async () => {
    if (!marcaToDeleteId) return;
    const result = await deleteMarcaAction(marcaToDeleteId);
    if (result.success) { toast({ title: "Éxito", description: result.message }); fetchMarcas(); }
    else { toast({ title: "Error", description: result.error || "Error al eliminar", variant: "destructive" }); }
    setIsDeleteMarcaDialogOpen(false); setMarcaToDeleteId(null);
  };

  // --- Modelo Management ---
  const openManageModelosDialog = (marca: MarcaVehiculo) => { setCurrentMarca(marca); setIsManageModelosDialogOpen(true); };
  const handleCreateModelo = async () => {
    if (!currentMarca || !currentMarca._id || newModeloData.idModelo == null || String(newModeloData.idModelo).trim() === '' || !newModeloData.modelo?.trim()) {
      toast({ title: "Error", description: "ID Modelo y Nombre son requeridos.", variant: "destructive" }); return;
    }
    const result = await addModeloToMarcaAction(currentMarca._id.toString(), { ...newModeloData, idModelo: Number(newModeloData.idModelo) } as ModeloVehiculo);
    if (result.success) {
      toast({ title: "Éxito", description: "Modelo añadido." });
      const marcaRes = await getMarcaForModelosAction(currentMarca._id.toString());
      if (marcaRes.success && marcaRes.data) setCurrentMarca(marcaRes.data);
      else fetchMarcas();
      setNewModeloData({ idModelo: undefined, modelo: '' });
      setIsCreateModeloDialogOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el modelo.", variant: "destructive" });
    }
  };
  const openEditModeloDialog = (modelo: ModeloVehiculo) => { setCurrentModelo(modelo); setEditModeloData({ idModelo: modelo.idModelo, modelo: modelo.modelo }); setIsEditModeloDialogOpen(true); };
  const handleUpdateModelo = async () => {
    if (!currentMarca?._id || currentModelo?.idModelo == null || !editModeloData.modelo?.trim()) {
      toast({ title: "Error", description: "Datos de modelo inválidos.", variant: "destructive" }); return;
    }
    const result = await updateModeloInMarcaAction(currentMarca._id.toString(), currentModelo.idModelo, { modelo: editModeloData.modelo });
    if (result.success) {
      toast({ title: "Éxito", description: "Modelo actualizado." });
      const marcaRes = await getMarcaForModelosAction(currentMarca._id.toString());
      if (marcaRes.success && marcaRes.data) setCurrentMarca(marcaRes.data);
      else fetchMarcas();
      setIsEditModeloDialogOpen(false); setCurrentModelo(null);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar el modelo.", variant: "destructive" });
    }
  };
  const handleDeleteModelo = async (modeloId: number) => {
    if (!currentMarca?._id) return;
    const result = await removeModeloFromMarcaAction(currentMarca._id.toString(), modeloId);
    if (result.success) {
      toast({ title: "Éxito", description: "Modelo eliminado." });
      const marcaRes = await getMarcaForModelosAction(currentMarca._id.toString());
      if (marcaRes.success && marcaRes.data) setCurrentMarca(marcaRes.data);
      else fetchMarcas();
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar el modelo.", variant: "destructive" });
    }
  };

  // --- Aseguradora Management Functions ---
  const handleCreateAseguradora = async () => {
    if (!newAseguradoraData.nombre?.trim()) {
      toast({ title: "Error", description: "El nombre de la aseguradora es obligatorio.", variant: "destructive" }); return;
    }
    const result = await createAseguradoraAction(newAseguradoraData as NewAseguradoraData);
    if (result.success) {
      toast({ title: "Éxito", description: `Aseguradora "${newAseguradoraData.nombre}" creada.` });
      setIsCreateAseguradoraDialogOpen(false); fetchAseguradoras(); setNewAseguradoraData({ nombre: '', telefono: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear la aseguradora.", variant: "destructive" });
    }
  };
  const openEditAseguradoraDialog = (aseguradora: Aseguradora) => { setCurrentAseguradora(aseguradora); setEditAseguradoraData({ nombre: aseguradora.nombre, telefono: aseguradora.telefono || '' }); setIsEditAseguradoraDialogOpen(true); };
  const handleUpdateAseguradora = async () => {
    if (!currentAseguradora || !currentAseguradora._id || !editAseguradoraData.nombre?.trim()) {
      toast({ title: "Error", description: "Datos inválidos para actualizar aseguradora.", variant: "destructive" }); return;
    }
    const result = await updateAseguradoraAction(currentAseguradora._id.toString(), editAseguradoraData);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsEditAseguradoraDialogOpen(false); fetchAseguradoras(); setCurrentAseguradora(null); setEditAseguradoraData({ nombre: '', telefono: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar la aseguradora.", variant: "destructive" });
    }
  };
  const openDeleteAseguradoraDialog = (aseguradoraId: string) => { setAseguradoraToDeleteId(aseguradoraId); setIsDeleteAseguradoraDialogOpen(true); };
  const handleDeleteAseguradora = async () => {
    if (!aseguradoraToDeleteId) return;
    const result = await deleteAseguradoraAction(aseguradoraToDeleteId);
    if (result.success) { toast({ title: "Éxito", description: result.message }); fetchAseguradoras(); }
    else { toast({ title: "Error", description: result.error || "Error al eliminar", variant: "destructive" }); }
    setIsDeleteAseguradoraDialogOpen(false); setAseguradoraToDeleteId(null);
  };

  // --- Ajustador Management ---
  const openManageAjustadoresDialog = (aseguradora: Aseguradora) => { setCurrentAseguradora(aseguradora); setIsManageAjustadoresDialogOpen(true); };
  const handleCreateAjustador = async () => {
    if (!currentAseguradora?._id || !newAjustadorData.nombre?.trim()) {
      toast({ title: "Error", description: "Nombre del ajustador es requerido.", variant: "destructive" }); return;
    }
    const result = await addAjustadorToAseguradoraAction(currentAseguradora._id.toString(), { nombre: newAjustadorData.nombre!, telefono: newAjustadorData.telefono, correo: newAjustadorData.correo });
    if (result.success && result.data) {
      toast({ title: "Éxito", description: "Ajustador añadido." });
      const aseguradoraRes = await getAseguradoraForAjustadoresAction(currentAseguradora._id.toString());
      if (aseguradoraRes.success && aseguradoraRes.data) setCurrentAseguradora(aseguradoraRes.data);
      else fetchAseguradoras();
      setNewAjustadorData({ nombre: '', telefono: '', correo: '' }); setIsCreateAjustadorDialogOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el ajustador.", variant: "destructive" });
    }
  };
  const openEditAjustadorDialog = (ajustador: Ajustador) => { setCurrentAjustador(ajustador); setEditAjustadorData(ajustador); setIsEditAjustadorDialogOpen(true); };
  const handleUpdateAjustador = async () => {
    if (!currentAseguradora?._id || currentAjustador?.idAjustador == null || !editAjustadorData.nombre?.trim()) {
      toast({ title: "Error", description: "Datos de ajustador inválidos.", variant: "destructive" }); return;
    }
    const result = await updateAjustadorInAseguradoraAction(currentAseguradora._id.toString(), currentAjustador.idAjustador, { nombre: editAjustadorData.nombre, telefono: editAjustadorData.telefono, correo: editAjustadorData.correo });
    if (result.success) {
      toast({ title: "Éxito", description: "Ajustador actualizado." });
      const aseguradoraRes = await getAseguradoraForAjustadoresAction(currentAseguradora._id.toString());
      if (aseguradoraRes.success && aseguradoraRes.data) setCurrentAseguradora(aseguradoraRes.data);
      else fetchAseguradoras();
      setIsEditAjustadorDialogOpen(false); setCurrentAjustador(null);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar el ajustador.", variant: "destructive" });
    }
  };
  const handleDeleteAjustador = async (idAjustador: number) => {
    if (!currentAseguradora?._id) return;
    const result = await removeAjustadorFromAseguradoraAction(currentAseguradora._id.toString(), idAjustador);
    if (result.success) {
      toast({ title: "Éxito", description: "Ajustador eliminado." });
      const aseguradoraRes = await getAseguradoraForAjustadoresAction(currentAseguradora._id.toString());
      if (aseguradoraRes.success && aseguradoraRes.data) setCurrentAseguradora(aseguradoraRes.data);
      else fetchAseguradoras();
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar el ajustador.", variant: "destructive" });
    }
  };

  // --- Empleado (Admin) Management Functions ---
  const handleCreateEmpleado = async () => {
    if (!newEmpleadoData.nombre?.trim() || !newEmpleadoData.puesto?.trim()) {
      toast({ title: "Error de Validación", description: "Nombre y Puesto son obligatorios.", variant: "destructive" });
      return;
    }

    let systemUserDetails: Omit<SystemUserCredentials, 'permisos' | '_id'> | undefined = undefined;
    if (newEmpleadoData.createSystemUser) {
      if (!newEmpleadoData.systemUserUsuario?.trim() || !newEmpleadoData.systemUserContraseña?.trim() || !newEmpleadoData.systemUserRol) {
        toast({ title: "Error de Validación de Usuario", description: "Usuario, Contraseña y Rol son obligatorios si se crea acceso al sistema.", variant: "destructive" });
        return;
      }
      if (newEmpleadoData.systemUserContraseña !== newEmpleadoData.systemUserConfirmContraseña) {
        toast({ title: "Error de Contraseña", description: "Las contraseñas no coinciden.", variant: "destructive" });
        return;
      }
      systemUserDetails = {
        usuario: newEmpleadoData.systemUserUsuario,
        contraseña: newEmpleadoData.systemUserContraseña,
        rol: newEmpleadoData.systemUserRol,
      };
    }

    const empleadoToCreate: Omit<Empleado, '_id' | 'fechaRegistro' | 'user'> = {
      nombre: newEmpleadoData.nombre,
      puesto: newEmpleadoData.puesto,
      telefono: newEmpleadoData.telefono,
      correo: newEmpleadoData.correo,
      sueldo: newEmpleadoData.sueldo ? Number(newEmpleadoData.sueldo) : undefined,
      comision: newEmpleadoData.comision ? Number(newEmpleadoData.comision) : undefined,
    };

    const result = await createEmpleadoAction(empleadoToCreate, systemUserDetails);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsCreateEmpleadoDialogOpen(false); fetchEmpleados(); setNewEmpleadoData(initialNewEmpleadoData);
    } else {
      toast({ title: "Error al Crear Empleado", description: result.error || "No se pudo crear el empleado", variant: "destructive" });
    }
  };

  const openEditEmpleadoDialog = async (empleadoId: string) => {
    const result = await getEmpleadoForEditAction(empleadoId);
    if (result.success && result.data) {
      setCurrentEmpleadoToEdit(result.data);
      setEditEmpleadoData({
        nombre: result.data.nombre,
        puesto: result.data.puesto,
        telefono: result.data.telefono,
        correo: result.data.correo,
        sueldo: result.data.sueldo,
        comision: result.data.comision,
        systemUserUsuario: result.data.user?.usuario,
        systemUserRol: result.data.user?.rol,
        newSystemUserContraseña: '',
        newSystemUserConfirmContraseña: '',
        createSystemUser: !!result.data.user 
      });
      setIsEditEmpleadoDialogOpen(true);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo cargar el empleado para editar.", variant: "destructive" });
    }
  };

  const handleUpdateEmpleado = async () => {
    if (!currentEmpleadoToEdit || !currentEmpleadoToEdit._id) return;
    if (!editEmpleadoData.nombre?.trim() || !editEmpleadoData.puesto?.trim()) {
       toast({ title: "Error de Validación", description: "Nombre y Puesto son obligatorios.", variant: "destructive" });
       return;
    }
    const empleadoDetailsToUpdate: Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>> = {
        nombre: editEmpleadoData.nombre,
        puesto: editEmpleadoData.puesto,
        telefono: editEmpleadoData.telefono,
        correo: editEmpleadoData.correo,
        sueldo: editEmpleadoData.sueldo ? Number(editEmpleadoData.sueldo) : undefined,
        comision: editEmpleadoData.comision ? Number(editEmpleadoData.comision) : undefined,
    };

    let systemUserDetailsToUpdate: Partial<Omit<SystemUserCredentials, 'permisos' | '_id'>> | undefined = undefined;

    if (editEmpleadoData.createSystemUser && !currentEmpleadoToEdit.user) { 
        if (!editEmpleadoData.systemUserUsuario?.trim() || !editEmpleadoData.newSystemUserContraseña?.trim() || !editEmpleadoData.systemUserRol) {
            toast({ title: "Error de Validación de Usuario", description: "Usuario, Nueva Contraseña y Rol son obligatorios para crear acceso al sistema.", variant: "destructive" });
            return;
        }
        if (editEmpleadoData.newSystemUserContraseña !== editEmpleadoData.newSystemUserConfirmContraseña) {
            toast({ title: "Error de Contraseña", description: "Las nuevas contraseñas no coinciden.", variant: "destructive" });
            return;
        }
        systemUserDetailsToUpdate = { 
            usuario: editEmpleadoData.systemUserUsuario,
            contraseña: editEmpleadoData.newSystemUserContraseña,
            rol: editEmpleadoData.systemUserRol,
        };
    }
    else if (currentEmpleadoToEdit.user) { 
        systemUserDetailsToUpdate = {};
        if (editEmpleadoData.systemUserUsuario && editEmpleadoData.systemUserUsuario !== currentEmpleadoToEdit.user.usuario) {
            systemUserDetailsToUpdate.usuario = editEmpleadoData.systemUserUsuario;
        }
        if (editEmpleadoData.systemUserRol && editEmpleadoData.systemUserRol !== currentEmpleadoToEdit.user.rol) {
            systemUserDetailsToUpdate.rol = editEmpleadoData.systemUserRol;
        }
        if (editEmpleadoData.newSystemUserContraseña?.trim()) {
            if (editEmpleadoData.newSystemUserContraseña !== editEmpleadoData.newSystemUserConfirmContraseña) {
                toast({ title: "Error de Contraseña", description: "Las nuevas contraseñas no coinciden.", variant: "destructive" });
                return;
            }
            systemUserDetailsToUpdate.contraseña = editEmpleadoData.newSystemUserContraseña;
        }
        if (Object.keys(systemUserDetailsToUpdate).length === 0) {
            systemUserDetailsToUpdate = undefined;
        }
    }


    const result = await updateEmpleadoAction(currentEmpleadoToEdit._id.toString(), empleadoDetailsToUpdate, systemUserDetailsToUpdate);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsEditEmpleadoDialogOpen(false); fetchEmpleados(); setCurrentEmpleadoToEdit(null); setEditEmpleadoData({});
    } else {
      toast({ title: "Error al Actualizar Empleado", description: result.error || "No se pudo actualizar", variant: "destructive" });
    }
  };

  const openDeleteEmpleadoDialog = (empleadoId: string) => {
    setEmpleadoToDeleteId(empleadoId);
    setIsDeleteEmpleadoDialogOpen(true);
  };

  const handleDeleteEmpleado = async () => {
    if (!empleadoToDeleteId) return;
    const result = await deleteEmpleadoAction(empleadoToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      fetchEmpleados();
    } else {
      toast({ title: "Error al Eliminar Empleado", description: result.error || "Error al eliminar", variant: "destructive" });
    }
    setIsDeleteEmpleadoDialogOpen(false);
    setEmpleadoToDeleteId(null);
  };

  const handleRemoveSystemUser = async (empleadoId: string) => {
    if (!empleadoId) return;
    const result = await removeSystemUserFromEmpleadoAction(empleadoId);
    if (result.success) {
        toast({title: "Éxito", description: result.message});
        fetchEmpleados(); 
        if (currentEmpleadoToEdit?._id === empleadoId) {
            setCurrentEmpleadoToEdit(prev => prev ? ({...prev, user: undefined}) : null);
            setEditEmpleadoData(prev => ({...prev, systemUserUsuario: undefined, systemUserRol: undefined, createSystemUser: false}));
        }
    } else {
        toast({title: "Error", description: result.error || "No se pudo remover el acceso.", variant: "destructive"});
    }
  };


  const formatDate = (dateInput?: Date | string | number): string => {
    if (!dateInput) return 'N/A';
    let date: Date;

    if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'string') {
        // Handles 'YYYY-MM-DD' or full ISO string by ensuring it's treated as UTC then formatted
        const parts = dateInput.split('T')[0].split('-');
        if (parts.length === 3) {
            date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
        } else {
            date = new Date(dateInput); // Fallback for other string formats
        }
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
        return 'Tipo de Fecha Inválido';
    }

    if (isNaN(date.getTime())) {
      return 'Fecha Inválida';
    }
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
  };

  const formatDateTime = (dateInput?: Date | string | number): string => {
    if (!dateInput) return 'N/A';
    let date: Date;
    if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        date = new Date(dateInput); // Standard Date constructor handles ISO strings and timestamps
    } else {
        return 'Tipo de Fecha/Hora Inválido';
    }
    if (isNaN(date.getTime())) return 'Fecha/Hora Inválida';
    // Display in local time, assuming server stores in UTC. For display, toLocaleString without timeZone uses browser local.
    // If you want to force display in a specific zone, add timeZone: 'America/Mexico_City' or similar.
    // For consistency with how dates might be stored/retrieved, often UTC is preferred.
    return date.toLocaleString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  };

  const getProcesoVariant = (proceso?: Order['proceso']): "default" | "secondary" | "outline" | "destructive" => {
    switch (proceso) {
      case 'entregado': case 'facturado': case 'listo_entrega': return 'default';
      case 'hojalateria': case 'pintura': case 'mecanica': case 'armado': case 'detallado_lavado': case 'refacciones_listas': case 'preparacion_pintura': case 'control_calidad': return 'secondary';
      case 'espera_refacciones': case 'valuacion': case 'garantia': case 'pendiente': return 'outline';
      case 'cancelado': return 'destructive';
      default: return 'secondary';
    }
  };
  const procesoOptions: { value: Order['proceso']; label: string }[] = [
    { value: 'pendiente', label: 'Pendiente' }, { value: 'valuacion', label: 'Valuación' },
    { value: 'espera_refacciones', label: 'Espera Refacciones' }, { value: 'refacciones_listas', label: 'Refacciones Listas' },
    { value: 'hojalateria', label: 'Hojalatería' }, { value: 'preparacion_pintura', label: 'Preparación Pintura' },
    { value: 'pintura', label: 'Pintura' }, { value: 'mecanica', label: 'Mecánica' },
    { value: 'armado', label: 'Armado' }, { value: 'detallado_lavado', label: 'Detallado y Lavado' },
    { value: 'control_calidad', label: 'Control de Calidad' }, { value: 'listo_entrega', label: 'Listo para Entrega' },
    { value: 'entregado', label: 'Entregado' }, { value: 'facturado', label: 'Facturado' },
    { value: 'garantia', label: 'Garantía' }, { value: 'cancelado', label: 'Cancelado' }
  ];
  const userRoleOptions = Object.values(UserRole).map(role => ({ value: role, label: role.charAt(0).toUpperCase() + role.slice(1) }));


  const renderDialogField = (
      label: string, name: any, type: string = "text", placeholder?: string,
      formType: 'newOrder' | 'editOrder' | 'newMarca' | 'editMarca' | 'newModelo' | 'editModelo' | 'newAseguradora' | 'editAseguradora' | 'newAjustador' | 'editAjustador' | 'newEmpleado' | 'editEmpleado' = 'newOrder',
      options?: { value: string | number; label: string }[], isCheckbox?: boolean, isTextarea?: boolean, isDisabled?: boolean, isRequired?: boolean
    ) => {
    let data: any;
    let handler: any;
    let selectHandler: any;

    switch (formType) {
        case 'newOrder': data = newOrderData; handler = (e:any) => handleOrderInputChange(e, 'new'); selectHandler = (n:any,v:any) => handleOrderSelectChange(n,v, 'new'); break;
        case 'editOrder': data = editOrderData; handler = (e:any) => handleOrderInputChange(e, 'edit'); selectHandler = (n:any,v:any) => handleOrderSelectChange(n,v, 'edit'); break;
        case 'newMarca': data = newMarcaData; handler = (e:any) => handleInputChangeGeneric(e, setNewMarcaData); break;
        case 'editMarca': data = editMarcaData; handler = (e:any) => handleInputChangeGeneric(e, setEditMarcaData); break;
        case 'newModelo': data = newModeloData; handler = (e:any) => handleInputChangeGeneric(e, setNewModeloData); break;
        case 'editModelo': data = editModeloData; handler = (e:any) => handleInputChangeGeneric(e, setEditModeloData); break;
        case 'newAseguradora': data = newAseguradoraData; handler = (e:any) => handleInputChangeGeneric(e, setNewAseguradoraData); break;
        case 'editAseguradora': data = editAseguradoraData; handler = (e:any) => handleInputChangeGeneric(e, setEditAseguradoraData); break;
        case 'newAjustador': data = newAjustadorData; handler = (e:any) => handleInputChangeGeneric(e, setNewAjustadorData); break;
        case 'editAjustador': data = editAjustadorData; handler = (e:any) => handleInputChangeGeneric(e, setEditAjustadorData); break;
        case 'newEmpleado': data = newEmpleadoData; handler = (e:any) => handleInputChangeGeneric(e, setNewEmpleadoData); selectHandler = (n:any,v:any) => handleSelectChangeGeneric(n,v, setNewEmpleadoData); break;
        case 'editEmpleado': data = editEmpleadoData; handler = (e:any) => handleInputChangeGeneric(e, setEditEmpleadoData); selectHandler = (n:any,v:any) => handleSelectChangeGeneric(n,v, setEditEmpleadoData); break;

        default: data = {}; handler = () => {}; selectHandler = () => {};
    }
    const value = data[name] as any;

    if (isCheckbox) {
      return (
        <div className="flex items-center space-x-2 py-1">
          <Checkbox 
            id={`${formType}_${name}`} 
            name={name} 
            checked={!!value} 
            onCheckedChange={(checked) => handler({ target: { name, value: checked, type: 'checkbox' } })} 
            disabled={isDisabled} />
          <Label htmlFor={`${formType}_${name}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}{isRequired && <span className="text-destructive">*</span>}</Label>
        </div>
      );
    }
    if (isTextarea) {
      return (
        <div className="space-y-1">
          <Label htmlFor={`${formType}_${name}`}>{label}{isRequired && <span className="text-destructive">*</span>}</Label>
          <Textarea id={`${formType}_${name}`} name={name} value={value || ''} onChange={handler} className="w-full" placeholder={placeholder} disabled={isDisabled} />
        </div>
      );
    }
    if (options) { // This is for Select component
      return (
        <div className="space-y-1">
          <Label htmlFor={`${formType}_${name}`}>{label}{isRequired && <span className="text-destructive">*</span>}</Label>
          <Select 
            name={name} 
            value={String(value || '')} // Ensure value is a string for Select
            onValueChange={(val) => selectHandler(name, val === 'null_value_placeholder' ? undefined : val )} 
            disabled={isDisabled}>
            <SelectTrigger className="w-full"><SelectValue placeholder={placeholder || "Seleccionar..."} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="null_value_placeholder" className="text-muted-foreground italic">-- {placeholder || "Seleccionar..."} --</SelectItem>
              {options.map(opt => <SelectItem key={String(opt.value)} value={String(opt.value)}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    }
    // Default to Input component
    return (
      <div className="space-y-1">
        <Label htmlFor={`${formType}_${name}`}>{label}{isRequired && <span className="text-destructive">*</span>}</Label>
        <Input id={`${formType}_${name}`} name={name} type={type}
          value={type === 'date' ? (value || '') : (value ?? '')} // Ensure date inputs handle undefined/null correctly
          onChange={handler}
          className="w-full" placeholder={placeholder}
          disabled={isDisabled }
          required={isRequired} // Add native required attribute if specified
        />
      </div>
    );
  };


  if (!userName || !userRole || (userRole && !Object.values(UserRole).includes(userRole))) {
    console.log("DashboardPage: userName o userRole faltan o son inválidos. Mostrando 'Cargando...' Detalles:", { userName, userRole });
    return <div className="flex min-h-screen items-center justify-center bg-background"><p>Cargando...</p></div>;
  }

  const dummyCitas = [
    { id: 'CITA-001', cliente: 'Ana Pérez', vehiculo: 'Toyota Corolla (ABC-123)', fecha: '2024-07-28 10:00', servicio: 'Mantenimiento General', estado: 'Confirmada' },
    { id: 'CITA-002', cliente: 'Luis Gómez', vehiculo: 'Honda CRV (XYZ-789)', fecha: '2024-07-28 14:00', servicio: 'Revisión Frenos', estado: 'Pendiente' },
  ];
  const inventoryItems = [
    { id: 'INV-001', name: 'Filtro de Aceite', quantity: 50, category: 'Filtros', supplier: 'Proveedor A', price: 150.00 },
    { id: 'INV-002', name: 'Balatas Delanteras', quantity: 30, category: 'Frenos', supplier: 'Proveedor B', price: 750.00 },
    { id: 'INV-003', name: 'Líquido Refrigerante (1L)', quantity: 20, category: 'Fluidos', supplier: 'Proveedor A', price: 120.00 },
  ];

 const mainTabsListClassName = userRole === UserRole.ADMIN
    ? "grid w-full grid-cols-2 sm:grid-cols-4 mb-6 rounded-lg p-1 bg-muted"
    : "grid w-full grid-cols-1 sm:grid-cols-3 mb-6 rounded-lg p-1 bg-muted";


  return (
    <div className="flex min-h-screen flex-col bg-muted/30 dark:bg-muted/10">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 shadow-sm">
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Panel del Taller Automotriz</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Bienvenido, <span className="font-medium text-foreground">{userName} (ID Emp: {empleadoId}, Rol: {userRole})</span>
            </span>
            <Button onClick={handleLogout} variant="outline" size="sm"><LogOut className="mr-2 h-4 w-4" />Cerrar Sesión</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <Tabs defaultValue="ordenes" className="w-full">
          <TabsList className={mainTabsListClassName}>
            <TabsTrigger value="citas" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <CalendarDays className="h-5 w-5" /> Citas
            </TabsTrigger>
            <TabsTrigger value="ordenes" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Wrench className="h-5 w-5" /> Órdenes
            </TabsTrigger>
            <TabsTrigger value="almacen" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Package className="h-5 w-5" /> Almacén
            </TabsTrigger>
            {userRole === UserRole.ADMIN && (
              <TabsTrigger value="admin" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Settings className="h-5 w-5" /> Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="citas">
            <Card className="shadow-lg border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div><CardTitle className="text-xl">Gestión de Citas</CardTitle><CardDescription>Programa y visualiza las citas de servicio.</CardDescription></div>
                <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Nueva Cita</Button>
              </CardHeader>
              <CardContent>
                <div className="mt-4 flex h-60 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50">
                    <p className="text-muted-foreground">Calendario de citas (Próximamente).</p>
                </div>
                 <Table>
                    <TableCaption>Listado de próximas citas.</TableCaption>
                    <TableHeader><TableRow><TableHead>ID Cita</TableHead><TableHead>Cliente</TableHead><TableHead>Vehículo</TableHead><TableHead>Fecha y Hora</TableHead><TableHead>Servicio</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                    <TableBody>
                    {dummyCitas.map((cita) => (
                        <TableRow key={cita.id}>
                        <TableCell className="font-medium">{cita.id}</TableCell>
                        <TableCell>{cita.cliente}</TableCell>
                        <TableCell>{cita.vehiculo}</TableCell>
                        <TableCell>{cita.fecha}</TableCell>
                        <TableCell>{cita.servicio}</TableCell>
                        <TableCell><Badge variant={cita.estado === 'Confirmada' ? 'default' : 'outline'}>{cita.estado}</Badge></TableCell>
                        <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon"><EyeIcon className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="ordenes">
             <Card className="shadow-lg border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div><CardTitle className="text-xl">Órdenes de Servicio</CardTitle><CardDescription>Administra todas las órdenes de trabajo.</CardDescription></div>
                    <Button size="sm" onClick={() => { 
                        setNewOrderData({
                            ...initialNewOrderData, 
                            idAsesor: userRole === UserRole.ASESOR && empleadoId ? empleadoId : undefined
                        }); 
                        setIsCreateOrderDialogOpen(true);
                    }}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Nueva Orden
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoadingOrders ? <p>Cargando órdenes...</p> : orders.length === 0 ?
                    <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay órdenes de servicio registradas.</p></div>
                    : (
                    <Table>
                        <TableCaption>Listado de órdenes de servicio.</TableCaption>
                        <TableHeader><TableRow><TableHead>OT</TableHead><TableHead>Cliente</TableHead><TableHead>Placas</TableHead><TableHead>Proceso</TableHead><TableHead>Registro</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order._id?.toString()}>
                            <TableCell className="font-medium">OT-{String(order.idOrder).padStart(4, '0')}</TableCell>
                            <TableCell>{clients.find(c => c._id === order.idCliente)?.nombre || clients.find(c => c._id === order.idCliente)?.razonSocial || order.idCliente || 'N/A'}</TableCell>
                            <TableCell>{order.placas || 'N/A'}</TableCell>
                            <TableCell><Badge variant={getProcesoVariant(order.proceso)}>{procesoOptions.find(p=>p.value === order.proceso)?.label || order.proceso || 'N/A'}</Badge></TableCell>
                            <TableCell>{formatDate(order.fechaRegistro)}</TableCell>
                            <TableCell className="text-right space-x-1">
                                <Button variant="outline" size="sm" onClick={() => openViewOrderDialog(order._id!.toString())}><EyeIcon className="mr-1 h-4 w-4" />Ver</Button>
                                <Button variant="ghost" size="icon" onClick={() => openEditOrderDialog(order._id!.toString())}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => openDeleteOrderDialog(order._id!.toString())}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
                    <div><CardTitle className="text-xl">Gestión de Almacén</CardTitle><CardDescription>Control de inventario de refacciones y consumibles.</CardDescription></div>
                    <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Artículo</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableCaption>Listado de artículos en almacén.</TableCaption>
                        <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Nombre</TableHead><TableHead>Categoría</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead>Proveedor</TableHead><TableHead className="text-right">Precio Unit.</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {inventoryItems.map((item) => (
                            <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.id}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell>{item.supplier}</TableCell>
                            <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right space-x-1">
                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>

          {userRole === UserRole.ADMIN && (
            <TabsContent value="admin">
              <Tabs defaultValue="empleados" className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-4 rounded-md p-1 bg-muted/70">
                  <TabsTrigger value="marcas" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Car className="mr-2 h-4 w-4" />Marcas/Modelos</TabsTrigger>
                  <TabsTrigger value="aseguradoras" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Shield className="mr-2 h-4 w-4"/>Aseguradoras</TabsTrigger>
                  <TabsTrigger value="empleados" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Users className="mr-2 h-4 w-4"/>Empleados</TabsTrigger>
                </TabsList>
                <TabsContent value="marcas">
                  <Card className="shadow-lg border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <div><CardTitle className="text-xl">Gestión de Marcas y Modelos</CardTitle></div>
                      <Button size="sm" onClick={() => { setNewMarcaData({marca: ''}); setIsCreateMarcaDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Nueva Marca</Button>
                    </CardHeader>
                    <CardContent>
                      {isLoadingMarcas ? <p>Cargando marcas...</p> : marcas.length === 0 ?
                        <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay marcas registradas.</p></div>
                        : (
                          <Table>
                            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Nombre Marca</TableHead><TableHead>Modelos</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {marcas.map((marca) => (
                                <TableRow key={marca._id?.toString()}>
                                  <TableCell>{marca.idMarca}</TableCell>
                                  <TableCell className="font-medium">{marca.marca}</TableCell>
                                  <TableCell>{marca.modelos?.length || 0}</TableCell>
                                  <TableCell className="text-right space-x-1">
                                    <Button variant="outline" size="sm" onClick={() => openManageModelosDialog(marca)}>Modelos</Button>
                                    <Button variant="ghost" size="icon" onClick={() => openEditMarcaDialog(marca)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => openDeleteMarcaDialog(marca._id!.toString())}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="aseguradoras">
                    <Card className="shadow-lg border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div><CardTitle className="text-xl">Gestión de Aseguradoras</CardTitle></div>
                        <Button size="sm" onClick={() => { setNewAseguradoraData({nombre: '', telefono: ''}); setIsCreateAseguradoraDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Nueva Aseguradora</Button>
                        </CardHeader>
                        <CardContent>
                        {isLoadingAseguradoras ? <p>Cargando aseguradoras...</p> : aseguradoras.length === 0 ?
                            <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay aseguradoras registradas.</p></div>
                            : (
                            <Table>
                                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>Ajustadores</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                                <TableBody>
                                {aseguradoras.map((aseg) => (
                                    <TableRow key={aseg._id?.toString()}>
                                    <TableCell>{aseg.idAseguradora}</TableCell>
                                    <TableCell className="font-medium">{aseg.nombre}</TableCell>
                                    <TableCell>{aseg.telefono || 'N/A'}</TableCell>
                                    <TableCell>{aseg.ajustadores?.length || 0}</TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="outline" size="sm" onClick={() => openManageAjustadoresDialog(aseg)}>Ajustadores</Button>
                                        <Button variant="ghost" size="icon" onClick={() => openEditAseguradoraDialog(aseg)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => openDeleteAseguradoraDialog(aseg._id!.toString())}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="empleados">
                    <Card className="shadow-lg border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div><CardTitle className="text-xl">Gestión de Empleados</CardTitle></div>
                        <Button size="sm" onClick={() => { setNewEmpleadoData(initialNewEmpleadoData); setIsCreateEmpleadoDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Empleado</Button>
                        </CardHeader>
                        <CardContent>
                        {isLoadingEmpleadosList ? <p>Cargando empleados...</p> : empleadosList.length === 0 ?
                            <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay empleados registrados.</p></div>
                            : (
                            <Table>
                                <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Puesto</TableHead><TableHead>Usuario Sistema</TableHead><TableHead>Rol Sistema</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                                <TableBody>
                                {empleadosList.map((emp) => (
                                    <TableRow key={emp._id?.toString()}>
                                    <TableCell>{emp.nombre}</TableCell>
                                    <TableCell>{emp.puesto || 'N/A'}</TableCell>
                                    <TableCell className="font-medium">{emp.user?.usuario || 'No tiene'}</TableCell>
                                    <TableCell>{emp.user?.rol || 'N/A'}</TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="icon" onClick={() => openEditEmpleadoDialog(emp._id!.toString())}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => openDeleteEmpleadoDialog(emp._id!.toString())}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* --- Order Dialogs --- */}
      <Dialog open={isCreateOrderDialogOpen} onOpenChange={setIsCreateOrderDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear Nueva Orden de Servicio</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <h3 className="font-semibold text-lg border-b pb-2 mb-2">Datos del Cliente y Vehículo</h3>
            {renderDialogField("Cliente", "idCliente", "select", isLoadingClients ? "Cargando..." : "Seleccionar cliente", "newOrder", clients.map(c => ({ value: c._id!, label: c.nombre || c.razonSocial || `ID: ${c._id}` })), false, false, false, true)}
            {renderDialogField("Placas", "placas", "text", "Ej: ABC-123", "newOrder", undefined, false, false, false, true)}
            {renderDialogField("VIN", "vin", "text", "Número de Identificación Vehicular", "newOrder")}
            {renderDialogField("Marca", "idMarca", "select", isLoadingMarcas ? "Cargando..." : "Seleccionar marca", "newOrder", marcas.map(m => ({ value: m._id!, label: m.marca })))}
            {renderDialogField("ID Modelo", "idModelo", "number", "ID numérico del modelo", "newOrder")}
            {renderDialogField("Año", "año", "number", "Ej: 2020", "newOrder")}
            {renderDialogField("Color", "color", "text", "Ej: Rojo", "newOrder")}
            {renderDialogField("Kilometraje", "kilometraje", "text", "Ej: 55000 km", "newOrder")}

            <h3 className="font-semibold text-lg border-b pb-2 mb-2 mt-4">Datos de Aseguradora (Opcional)</h3>
            {renderDialogField("Aseguradora", "idAseguradora", "select", isLoadingAseguradoras? "Cargando..." : "Seleccionar aseguradora", "newOrder", aseguradoras.map(a => ({ value: a._id!, label: a.nombre })))}
            {renderDialogField("ID Ajustador", "ajustador", "number", "ID numérico del ajustador", "newOrder")}
            {renderDialogField("Siniestro", "siniestro", "text", "No. Siniestro", "newOrder")}
            {renderDialogField("Póliza", "poliza", "text", "No. Póliza", "newOrder")}
            {renderDialogField("Folio", "folio", "text", "Folio dictamen/pase", "newOrder")}
            {renderDialogField("Deducible", "deducible", "number", "Monto deducible", "newOrder")}
            {renderDialogField("Tipo Cliente Aseguradora", "aseguradoTercero", "select", "Tipo de cliente", "newOrder", [{value: 'asegurado', label: 'Asegurado'}, {value: 'tercero', label: 'Tercero'}])}

            <h3 className="font-semibold text-lg border-b pb-2 mb-2 mt-4">Detalles Adicionales y Asignaciones</h3>
            {renderDialogField("¿Es de piso?", "piso", "checkbox", "", "newOrder", undefined, true)}
            {renderDialogField("¿Llegó en grúa?", "grua", "checkbox", "", "newOrder", undefined, true)}
            {renderDialogField("URL Archivos", "urlArchivos", "text", "Link a carpeta de archivos", "newOrder")}
            {renderDialogField("Proceso Inicial", "proceso", "select", "Seleccionar proceso", "newOrder", procesoOptions.map(p => ({value: p.value, label: p.label})), false, false, false, false)}
            {renderDialogField("Valuador", "idValuador", "select", valuadores.length === 0 && isLoadingAsesores ? "Cargando..." : "Seleccionar valuador", "newOrder", valuadores.map(v => ({ value: v._id, label: v.nombre })))}
            {renderDialogField("Asesor", "idAsesor", "select", asesores.length === 0 && isLoadingAsesores ? "Cargando..." : "Seleccionar asesor", "newOrder", asesores.map(a => ({ value: a._id, label: a.nombre })), undefined, false, false, userRole === UserRole.ASESOR && !!empleadoId)}
            {renderDialogField("Hojalatero", "idHojalatero", "select", hojalateros.length === 0 && isLoadingAsesores ? "Cargando..." : "Seleccionar hojalatero", "newOrder", hojalateros.map(h => ({ value: h._id, label: h.nombre })))}
            {renderDialogField("Pintor", "idPintor", "select", pintores.length === 0 && isLoadingAsesores ? "Cargando..." : "Seleccionar pintor", "newOrder", pintores.map(p => ({ value: p._id, label: p.nombre })))}
            {renderDialogField("ID Presupuesto", "idPresupuesto", "text", "ID del presupuesto asociado", "newOrder")}

            <h3 className="font-semibold text-lg border-b pb-2 mb-2 mt-4">Fechas Importantes (Opcional)</h3>
            {renderDialogField("Fecha Valuación", "fechaValuacion", "date", "", "newOrder")}
            {renderDialogField("Fecha Reingreso", "fechaRengreso", "date", "", "newOrder")}
            {renderDialogField("Fecha Promesa Entrega", "fechaPromesa", "date", "", "newOrder")}
            {renderDialogField("Fecha Entrega Final", "fechaEntrega", "date", "", "newOrder")}
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateOrder}>Crear Orden</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditOrderDialogOpen} onOpenChange={(open) => { setIsEditOrderDialogOpen(open); if (!open) setCurrentOrder(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Orden: OT-{String(currentOrder?.idOrder || '').padStart(4, '0')}</DialogTitle></DialogHeader>
          {currentOrder && <div className="grid gap-4 py-4">
            <h3 className="font-semibold text-lg border-b pb-2 mb-2">Datos del Cliente y Vehículo</h3>
            {renderDialogField("Cliente", "idCliente", "select", isLoadingClients ? "Cargando..." : "Seleccionar cliente", "editOrder", clients.map(c => ({ value: c._id!, label: c.nombre || c.razonSocial || `ID: ${c._id}` })), false, false, false, true)}
            {renderDialogField("Placas", "placas", "text", "Ej: ABC-123", "editOrder", undefined, false, false, false, true)}
            {renderDialogField("VIN", "vin", "text", "Número de Identificación Vehicular", "editOrder")}
            {renderDialogField("Marca", "idMarca", "select", isLoadingMarcas ? "Cargando..." : "Seleccionar marca", "editOrder", marcas.map(m => ({ value: m._id!, label: m.marca })))}
            {renderDialogField("ID Modelo", "idModelo", "number", "ID numérico del modelo", "editOrder")}
            {renderDialogField("Año", "año", "number", "Ej: 2020", "editOrder")}
            {renderDialogField("Color", "color", "text", "Ej: Rojo", "editOrder")}
            {renderDialogField("Kilometraje", "kilometraje", "text", "Ej: 55000 km", "editOrder")}

            <h3 className="font-semibold text-lg border-b pb-2 mb-2 mt-4">Datos de Aseguradora</h3>
            {renderDialogField("Aseguradora", "idAseguradora", "select", isLoadingAseguradoras? "Cargando..." : "Seleccionar aseguradora", "editOrder", aseguradoras.map(a => ({ value: a._id!, label: a.nombre })))}
            {renderDialogField("ID Ajustador", "ajustador", "number", "ID numérico del ajustador", "editOrder")}
            {renderDialogField("Siniestro", "siniestro", "text", "No. Siniestro", "editOrder")}
            {renderDialogField("Póliza", "poliza", "text", "No. Póliza", "editOrder")}
            {renderDialogField("Folio", "folio", "text", "Folio dictamen/pase", "editOrder")}
            {renderDialogField("Deducible", "deducible", "number", "Monto deducible", "editOrder")}
            {renderDialogField("Tipo Cliente Aseguradora", "aseguradoTercero", "select", "Tipo de cliente", "editOrder", [{value: 'asegurado', label: 'Asegurado'}, {value: 'tercero', label: 'Tercero'}])}

            <h3 className="font-semibold text-lg border-b pb-2 mb-2 mt-4">Detalles Adicionales y Asignaciones</h3>
            {renderDialogField("¿Es de piso?", "piso", "checkbox", "", "editOrder", undefined, true)}
            {renderDialogField("¿Llegó en grúa?", "grua", "checkbox", "", "editOrder", undefined, true)}
            {renderDialogField("URL Archivos", "urlArchivos", "text", "Link a carpeta de archivos", "editOrder")}
            {renderDialogField("Proceso Actual", "proceso", "select", "Seleccionar proceso", "editOrder", procesoOptions.map(p => ({value: p.value, label: p.label})))}
            {renderDialogField("Valuador", "idValuador", "select", valuadores.length === 0 && isLoadingAsesores ? "Cargando..." : "Seleccionar valuador", "editOrder", valuadores.map(v => ({ value: v._id, label: v.nombre })))}
            {renderDialogField("Asesor", "idAsesor", "select", asesores.length === 0 && isLoadingAsesores ? "Cargando..." : "Seleccionar asesor", "editOrder", asesores.map(a => ({ value: a._id, label: a.nombre })), undefined, false, false, true)}
            {renderDialogField("Hojalatero", "idHojalatero", "select", hojalateros.length === 0 && isLoadingAsesores ? "Cargando..." : "Seleccionar hojalatero", "editOrder", hojalateros.map(h => ({ value: h._id, label: h.nombre })))}
            {renderDialogField("Pintor", "idPintor", "select", pintores.length === 0 && isLoadingAsesores ? "Cargando..." : "Seleccionar pintor", "editOrder", pintores.map(p => ({ value: p._id, label: p.nombre })))}
            {renderDialogField("ID Presupuesto", "idPresupuesto", "text", "ID presupuesto asociado", "editOrder")}

            <h3 className="font-semibold text-lg border-b pb-2 mb-2 mt-4">Fechas Importantes</h3>
            {renderDialogField("Fecha Valuación", "fechaValuacion", "date", "", "editOrder")}
            {renderDialogField("Fecha Reingreso", "fechaRengreso", "date", "", "editOrder")}
            {renderDialogField("Fecha Promesa Entrega", "fechaPromesa", "date", "", "editOrder")}
            {renderDialogField("Fecha Entrega Final", "fechaEntrega", "date", "", "editOrder")}
          </div>}
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateOrder}>Actualizar Orden</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isViewOrderDialogOpen} onOpenChange={(open) => { setIsViewOrderDialogOpen(open); if (!open) setCurrentOrder(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de Orden: OT-{String(currentOrder?.idOrder || '').padStart(4, '0')}</DialogTitle>
              <DialogDescription>Proceso actual: <Badge variant={getProcesoVariant(currentOrder?.proceso)}>{procesoOptions.find(p=>p.value === currentOrder?.proceso)?.label || currentOrder?.proceso || 'N/A'}</Badge></DialogDescription>
            </DialogHeader>
            {currentOrder && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm py-4">
                    <div className="col-span-1 md:col-span-2 mb-2 border-b pb-2"> <p className="font-semibold text-base">Vehículo:</p></div>
                    <p><span className="font-medium">Placas:</span> {currentOrder.placas}</p>
                    <p><span className="font-medium">VIN:</span> {currentOrder.vin || 'N/A'}</p>
                    <p><span className="font-medium">Marca:</span> {marcas.find(m => m._id === currentOrder.idMarca)?.marca || currentOrder.idMarca || 'N/A'}</p>
                    <p><span className="font-medium">Modelo ID:</span> {currentOrder.idModelo || 'N/A'}</p>
                    <p><span className="font-medium">Año:</span> {currentOrder.año || 'N/A'}</p>
                    <p><span className="font-medium">Color:</span> {currentOrder.color || 'N/A'}</p>
                    <p><span className="font-medium">Kilometraje:</span> {currentOrder.kilometraje || 'N/A'}</p>

                    <div className="col-span-1 md:col-span-2 mt-3 mb-2 border-b pb-2"> <p className="font-semibold text-base">Cliente:</p></div>
                    <p><span className="font-medium">Cliente:</span> {clients.find(c => c._id === currentOrder.idCliente)?.nombre || clients.find(c => c._id === currentOrder.idCliente)?.razonSocial || currentOrder.idCliente || 'N/A'}</p>

                    {currentOrder.idAseguradora && (<>
                        <div className="col-span-1 md:col-span-2 mt-3 mb-2 border-b pb-2"> <p className="font-semibold text-base">Aseguradora:</p></div>
                        <p><span className="font-medium">Aseguradora:</span> {aseguradoras.find(a => a._id === currentOrder.idAseguradora)?.nombre || currentOrder.idAseguradora}</p>
                        <p><span className="font-medium">ID Ajustador:</span> {currentOrder.ajustador || 'N/A'}</p>
                        <p><span className="font-medium">Siniestro:</span> {currentOrder.siniestro || 'N/A'}</p>
                        <p><span className="font-medium">Póliza:</span> {currentOrder.poliza || 'N/A'}</p>
                        <p><span className="font-medium">Folio:</span> {currentOrder.folio || 'N/A'}</p>
                        <p><span className="font-medium">Deducible:</span> {currentOrder.deducible != null ? `$${currentOrder.deducible.toFixed(2)}` : 'N/A'}</p>
                        <p><span className="font-medium">Tipo Cliente Aseguradora:</span> {currentOrder.aseguradoTercero || 'N/A'}</p>
                    </>)}

                    <div className="col-span-1 md:col-span-2 mt-3 mb-2 border-b pb-2"> <p className="font-semibold text-base">Detalles y Fechas:</p></div>
                    <p><span className="font-medium">De Piso:</span> {currentOrder.piso ? 'Sí' : 'No'}</p>
                    <p><span className="font-medium">En Grúa:</span> {currentOrder.grua ? 'Sí' : 'No'}</p>
                    <p><span className="font-medium">URL Archivos:</span> {currentOrder.urlArchivos || 'N/A'}</p>
                    <p><span className="font-medium">Fecha Registro:</span> {formatDateTime(currentOrder.fechaRegistro)}</p>
                    <p><span className="font-medium">Fecha Valuación:</span> {formatDate(currentOrder.fechaValuacion)}</p>
                    <p><span className="font-medium">Fecha Reingreso:</span> {formatDate(currentOrder.fechaRengreso)}</p>
                    <p><span className="font-medium">Fecha Promesa:</span> {formatDate(currentOrder.fechaPromesa)}</p>
                    <p><span className="font-medium">Fecha Entrega:</span> {formatDate(currentOrder.fechaEntrega)}</p>

                    <div className="col-span-1 md:col-span-2 mt-3 mb-2 border-b pb-2"> <p className="font-semibold text-base">Personal Asignado:</p></div>
                    <p><span className="font-medium">Valuador:</span> {valuadores.find(v => v._id === currentOrder.idValuador)?.nombre || currentOrder.idValuador || 'N/A'}</p>
                    <p><span className="font-medium">Asesor:</span> {asesores.find(a => a._id === currentOrder.idAsesor)?.nombre || currentOrder.idAsesor || 'N/A'}</p>
                    <p><span className="font-medium">Hojalatero:</span> {hojalateros.find(h => h._id === currentOrder.idHojalatero)?.nombre || currentOrder.idHojalatero || 'N/A'}</p>
                    <p><span className="font-medium">Pintor:</span> {pintores.find(p => p._id === currentOrder.idPintor)?.nombre || currentOrder.idPintor || 'N/A'}</p>

                    <div className="col-span-1 md:col-span-2 mt-3 mb-2 border-b pb-2"> <p className="font-semibold text-base">Presupuesto:</p></div>
                    <p><span className="font-medium">ID Presupuesto:</span> {currentOrder.idPresupuesto || 'N/A'}</p>

                    <div className="col-span-1 md:col-span-2 mt-3 mb-2 border-b pb-2"> <p className="font-semibold text-base">Log de Cambios:</p></div>
                    <div className="col-span-1 md:col-span-2 max-h-32 overflow-y-auto bg-muted/50 p-2 rounded-md">
                        {currentOrder.log && currentOrder.log.length > 0 ? currentOrder.log.map((entry, index) => (
                            <p key={index} className="text-xs mb-1">
                                <span className="font-medium">{formatDateTime(entry.timestamp)}</span> (Usr: {empleadosList.find(e => e._id === entry.userId)?.nombre || entry.userId || 'Sis'}): {entry.action} {entry.details && `- ${entry.details}`}
                            </p>
                        )) : <p className="text-xs text-muted-foreground">No hay logs.</p>}
                    </div>
                </div>
            )}
            <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteOrderDialogOpen} onOpenChange={setIsDeleteOrderDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Seguro que deseas eliminar la orden OT-{String(orders.find(o=>o._id === orderToDeleteId)?.idOrder || '').padStart(4, '0')}? Esta acción eliminará la orden de forma permanente.</DialogDescription></DialogHeader>
            <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteOrder}>Eliminar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Marca Dialogs --- */}
      <Dialog open={isCreateMarcaDialogOpen} onOpenChange={setIsCreateMarcaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nueva Marca</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">{renderDialogField("Nombre Marca", "marca", "text", "Ej: Toyota", "newMarca",undefined,false,false,false,true)}</div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateMarca}>Crear Marca</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditMarcaDialogOpen} onOpenChange={(open) => { setIsEditMarcaDialogOpen(open); if (!open) setCurrentMarca(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Marca: {currentMarca?.marca}</DialogTitle></DialogHeader>
          {currentMarca && <div className="grid gap-4 py-4">{renderDialogField("Nombre Marca", "marca", "text", "Ej: Toyota", "editMarca",undefined,false,false,false,true)}</div>}
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateMarca}>Actualizar Marca</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteMarcaDialogOpen} onOpenChange={setIsDeleteMarcaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Seguro que deseas eliminar la marca {marcas.find(m=>m._id === marcaToDeleteId)?.marca}? Se eliminarán también sus modelos.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteMarca}>Eliminar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isManageModelosDialogOpen} onOpenChange={(open) => { setIsManageModelosDialogOpen(open); if (!open) setCurrentMarca(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Gestionar Modelos para: {currentMarca?.marca}</DialogTitle></DialogHeader>
          <div className="my-4"><Button size="sm" onClick={() => { setNewModeloData({idModelo: undefined, modelo: ''}); setIsCreateModeloDialogOpen(true);}}><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Modelo</Button></div>
          {currentMarca?.modelos && currentMarca.modelos.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>ID Modelo</TableHead><TableHead>Nombre Modelo</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {currentMarca.modelos.map(modelo => (
                  <TableRow key={modelo.idModelo}><TableCell>{modelo.idModelo}</TableCell><TableCell>{modelo.modelo}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditModeloDialog(modelo)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteModelo(modelo.idModelo)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-sm text-muted-foreground text-center py-4">No hay modelos para esta marca.</p>}
          <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isCreateModeloDialogOpen} onOpenChange={(open) => {setIsCreateModeloDialogOpen(open); if(!open) setNewModeloData({ idModelo: undefined, modelo: '' });}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Añadir Nuevo Modelo a {currentMarca?.marca}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              {renderDialogField("ID Modelo", "idModelo", "number", "Ej: 101", "newModelo",undefined,false,false,false,true)}
              {renderDialogField("Nombre Modelo", "modelo", "text", "Ej: Corolla", "newModelo",undefined,false,false,false,true)}
            </div>
            <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateModelo}>Añadir Modelo</Button></DialogFooter>
          </DialogContent>
      </Dialog>
      <Dialog open={isEditModeloDialogOpen} onOpenChange={(open) => { setIsEditModeloDialogOpen(open); if (!open) setCurrentModelo(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Editar Modelo: {currentModelo?.modelo}</DialogTitle></DialogHeader>
            {currentModelo && (<div className="space-y-4 py-4">{renderDialogField("Nombre Modelo", "modelo", "text", "Ej: Corolla", "editModelo",undefined,false,false,false,true)}</div>)}
            <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateModelo}>Actualizar Modelo</Button></DialogFooter>
          </DialogContent>
      </Dialog>

      {/* --- Aseguradora Dialogs --- */}
      <Dialog open={isCreateAseguradoraDialogOpen} onOpenChange={setIsCreateAseguradoraDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nueva Aseguradora</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre Aseguradora", "nombre", "text", "Ej: GNP Seguros", "newAseguradora",undefined,false,false,false,true)}
            {renderDialogField("Teléfono", "telefono", "text", "Ej: 5512345678", "newAseguradora")}
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateAseguradora}>Crear Aseguradora</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditAseguradoraDialogOpen} onOpenChange={(open) => { setIsEditAseguradoraDialogOpen(open); if (!open) setCurrentAseguradora(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Aseguradora: {currentAseguradora?.nombre}</DialogTitle></DialogHeader>
          {currentAseguradora &&
            <div className="space-y-4 py-4">
              {renderDialogField("Nombre Aseguradora", "nombre", "text", "Ej: GNP Seguros", "editAseguradora",undefined,false,false,false,true)}
              {renderDialogField("Teléfono", "telefono", "text", "Ej: 5512345678", "editAseguradora")}
            </div>
          }
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateAseguradora}>Actualizar Aseguradora</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteAseguradoraDialogOpen} onOpenChange={setIsDeleteAseguradoraDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Seguro que deseas eliminar la aseguradora {aseguradoras.find(a=>a._id === aseguradoraToDeleteId)?.nombre}? Se eliminarán también sus ajustadores.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteAseguradora}>Eliminar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isManageAjustadoresDialogOpen} onOpenChange={(open) => { setIsManageAjustadoresDialogOpen(open); if (!open) setCurrentAseguradora(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Gestionar Ajustadores para: {currentAseguradora?.nombre}</DialogTitle></DialogHeader>
          <div className="my-4"><Button size="sm" onClick={() => { setNewAjustadorData({nombre: '', telefono: '', correo: ''}); setIsCreateAjustadorDialogOpen(true);}}><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Ajustador</Button></div>
          {currentAseguradora?.ajustadores && currentAseguradora.ajustadores.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>Correo</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {currentAseguradora.ajustadores.map(aj => (
                  <TableRow key={aj.idAjustador}><TableCell>{aj.idAjustador}</TableCell><TableCell>{aj.nombre}</TableCell><TableCell>{aj.telefono || 'N/A'}</TableCell><TableCell>{aj.correo || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditAjustadorDialog(aj)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAjustador(aj.idAjustador)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-sm text-muted-foreground text-center py-4">No hay ajustadores para esta aseguradora.</p>}
          <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isCreateAjustadorDialogOpen} onOpenChange={(open) => { setIsCreateAjustadorDialogOpen(open); if (!open) setNewAjustadorData({ nombre: '', telefono: '', correo: ''}); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Añadir Nuevo Ajustador a {currentAseguradora?.nombre}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              {renderDialogField("Nombre Ajustador", "nombre", "text", "Ej: Juan Pérez", "newAjustador",undefined,false,false,false,true)}
              {renderDialogField("Teléfono", "telefono", "text", "Ej: 5587654321", "newAjustador")}
              {renderDialogField("Correo", "correo", "email", "Ej: juan.perez@email.com", "newAjustador")}
            </div>
            <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateAjustador}>Añadir Ajustador</Button></DialogFooter>
          </DialogContent>
      </Dialog>
      <Dialog open={isEditAjustadorDialogOpen} onOpenChange={(open) => { setIsEditAjustadorDialogOpen(open); if (!open) setCurrentAjustador(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Editar Ajustador: {currentAjustador?.nombre}</DialogTitle></DialogHeader>
            {currentAjustador && (
              <div className="space-y-4 py-4">
                {renderDialogField("Nombre Ajustador", "nombre", "text", "Ej: Juan Pérez", "editAjustador",undefined,false,false,false,true)}
                {renderDialogField("Teléfono", "telefono", "text", "Ej: 5587654321", "editAjustador")}
                {renderDialogField("Correo", "correo", "email", "Ej: juan.perez@email.com", "editAjustador")}
              </div>
            )}
            <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateAjustador}>Actualizar Ajustador</Button></DialogFooter>
          </DialogContent>
      </Dialog>


      {/* --- Empleado (Admin) Dialogs --- */}
      <Dialog open={isCreateEmpleadoDialogOpen} onOpenChange={setIsCreateEmpleadoDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear Nuevo Empleado</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
                {renderDialogField("Nombre Completo", "nombre", "text", "Ej: Juan Pérez García", "newEmpleado",undefined,false,false,false,true)}
            </div>
            <div className="space-y-1">
                {renderDialogField("Puesto", "puesto", "text", "Ej: Hojalatero Líder", "newEmpleado",undefined,false,false,false,true)}
            </div>
            <div className="space-y-1">
                {renderDialogField("Teléfono", "telefono", "tel", "Ej: 5512345678", "newEmpleado")}
            </div>
            <div className="space-y-1">
                {renderDialogField("Correo", "correo", "email", "Ej: juan.perez@taller.com", "newEmpleado")}
            </div>
            <div className="space-y-1">
                {renderDialogField("Sueldo", "sueldo", "number", "Ej: 15000", "newEmpleado")}
            </div>
            <div className="space-y-1">
                {renderDialogField("Comisión (%)", "comision", "number", "Ej: 5", "newEmpleado")}
            </div>
            
            <div className="my-2 border-t pt-4">
                {renderDialogField("Crear acceso al sistema", "createSystemUser", "checkbox", "", "newEmpleado", undefined, true)}
            </div>

            {newEmpleadoData.createSystemUser && (
                <>
                    <div className="space-y-1">
                        {renderDialogField("Nombre de Usuario", "systemUserUsuario", "text", "Ej: juan.perez", "newEmpleado",undefined,false,false,false,true)}
                    </div>
                    <div className="space-y-1">
                        {renderDialogField("Contraseña", "systemUserContraseña", "password", "Mínimo 6 caracteres", "newEmpleado",undefined,false,false,false,true)}
                    </div>
                    <div className="space-y-1">
                        {renderDialogField("Confirmar Contraseña", "systemUserConfirmContraseña", "password", "Repetir contraseña", "newEmpleado",undefined,false,false,false,true)}
                    </div>
                    <div className="space-y-1">
                        {renderDialogField("Rol en Sistema", "systemUserRol", "select", "Seleccionar rol", "newEmpleado", userRoleOptions,undefined,false,false,true)}
                    </div>
                </>
            )}
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateEmpleado}>Crear Empleado</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditEmpleadoDialogOpen} onOpenChange={(open) => { setIsEditEmpleadoDialogOpen(open); if (!open) setCurrentEmpleadoToEdit(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Empleado: {currentEmpleadoToEdit?.nombre}</DialogTitle></DialogHeader>
          {currentEmpleadoToEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                {renderDialogField("Nombre Completo", "nombre", "text", "", "editEmpleado",undefined,false,false,false,true)}
              </div>
              <div className="space-y-1">
                {renderDialogField("Puesto", "puesto", "text", "", "editEmpleado",undefined,false,false,false,true)}
              </div>
              <div className="space-y-1">
                {renderDialogField("Teléfono", "telefono", "tel", "", "editEmpleado")}
              </div>
              <div className="space-y-1">
                {renderDialogField("Correo", "correo", "email", "", "editEmpleado")}
              </div>
              <div className="space-y-1">
                {renderDialogField("Sueldo", "sueldo", "number", "", "editEmpleado")}
              </div>
              <div className="space-y-1">
                {renderDialogField("Comisión (%)", "comision", "number", "", "editEmpleado")}
              </div>

              <div className="my-2 border-t pt-4">
                <h4 className="font-medium mb-2 text-base">Acceso al Sistema</h4>
                {!currentEmpleadoToEdit.user && !editEmpleadoData.createSystemUser && ( 
                     renderDialogField("Crear nuevo acceso al sistema", "createSystemUser", "checkbox", "", "editEmpleado", undefined, true)
                )}
                
                {(currentEmpleadoToEdit.user || editEmpleadoData.createSystemUser) && ( 
                    <>
                        <div className="space-y-1">
                        {renderDialogField("Nombre de Usuario", "systemUserUsuario", "text", "Ej: juan.perez", "editEmpleado", undefined, false, false, !!(currentEmpleadoToEdit.user && !editEmpleadoData.createSystemUser), true)}
                        </div>
                        <div className="space-y-1">
                        {renderDialogField("Rol en Sistema", "systemUserRol", "select", "Seleccionar rol", "editEmpleado", userRoleOptions, false, false, !!(currentEmpleadoToEdit.user && !editEmpleadoData.createSystemUser), true)}
                        </div>
                        
                        <h5 className="font-medium mt-3 text-sm">{(currentEmpleadoToEdit.user && !editEmpleadoData.createSystemUser) ? 'Cambiar Contraseña (Opcional)' : 'Establecer Contraseña*'}</h5>
                        <div className="space-y-1">
                        {renderDialogField("Nueva Contraseña", "newSystemUserContraseña", "password", "Dejar en blanco para no cambiar", "editEmpleado", undefined, false, false, false, editEmpleadoData.createSystemUser && !currentEmpleadoToEdit.user)}
                        </div>
                        <div className="space-y-1">
                        {renderDialogField("Confirmar Nueva Contraseña", "newSystemUserConfirmContraseña", "password", "", "editEmpleado", undefined, false, false, false, editEmpleadoData.createSystemUser && !currentEmpleadoToEdit.user)}
                        </div>
                        
                        {currentEmpleadoToEdit.user && !editEmpleadoData.createSystemUser && (
                            <div className="mt-2 text-right">
                                <Button variant="destructive" size="sm" onClick={() => handleRemoveSystemUser(currentEmpleadoToEdit._id!)}>
                                    <UserX className="mr-2 h-4 w-4"/>Remover Acceso al Sistema
                                </Button>
                            </div>
                        )}
                    </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateEmpleado}>Actualizar Empleado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteEmpleadoDialogOpen} onOpenChange={(open) => { setIsDeleteEmpleadoDialogOpen(open); if(!open) setEmpleadoToDeleteId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Seguro que deseas eliminar al empleado {empleadosList.find(e => e._id === empleadoToDeleteId)?.nombre}? Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteEmpleado}>Eliminar Empleado</Button></DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

