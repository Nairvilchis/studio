
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

// Importación de tipos de datos.
import type {
  UserRole as UserRoleType,
  Empleado,
  SystemUserCredentials,
  Order,
  NewOrderData,
  UpdateOrderData,
  MarcaVehiculo,
  NewMarcaData,
  UpdateMarcaData,
  ModeloVehiculo,
  Aseguradora,
  NewAseguradoraData,
  UpdateAseguradoraData,
  Ajustador,
  Cliente,
} from '@/lib/types';
import { UserRole } from '@/lib/types'; // Enum para usar sus valores.

// Acciones del servidor.
import {
  getAllOrdersAction,
  createOrderAction,
  updateOrderAction,
  deleteOrderAction,
  getOrderByIdAction,
  getAsesores,
  getValuadores,
  getEmployeesByPosition,
  getAjustadoresForSelectByAseguradoraAction, 
} from './service-orders/actions';

import {
  getAllMarcasAction,
  createMarcaAction,
  updateMarcaAction,
  deleteMarcaAction,
  addModeloToMarcaAction,
  updateModeloInMarcaAction,
  removeModeloFromMarcaAction,
  getMarcaByIdAction as getMarcaForModelosAction, // Renombrada para claridad
} from './admin/marcas/actions';

import {
  getAllAseguradorasAction,
  createAseguradoraAction,
  updateAseguradoraAction,
  deleteAseguradoraAction,
  addAjustadorToAseguradoraAction,
  updateAjustadorInAseguradoraAction,
  removeAjustadorFromAseguradoraAction,
  getAseguradoraByIdAction as getAseguradoraForAjustadoresAction, // Renombrada
} from './admin/aseguradoras/actions';

import { getClients } from './admin/clients/actions';

import {
  getAllEmpleadosAction,
  createEmpleadoAction,
  getEmpleadoByIdAction as getEmpleadoForEditAction, // Renombrada
  updateEmpleadoAction,
  deleteEmpleadoAction,
  removeSystemUserFromEmpleadoAction,
} from './admin/empleados/actions';

// Tipos de datos para los formularios.

/**
 * Tipo de datos para el formulario de creación/edición de Órdenes de Servicio.
 * Omitimos campos generados automáticamente o gestionados internamente (_id, idOrder, fechaRegistro, log).
 * Los IDs de entidades relacionadas son strings (MongoDB _id o ObjectId strings).
 */
type OrderFormDataType = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'log'>> & {
  // idMarca, idAseguradora, idCliente, etc. ya son string? en Order
  idModelo?: string; // ObjectId string
  ajustador?: string; // ObjectId string (Ajustador.idAjustador)
  año?: number | string;
  deducible?: number | string;
  kilometraje?: string;
};

/** Tipo de datos para el formulario de creación/edición de Marcas de Vehículos. Se omite _id. */
type MarcaFormDataType = Partial<Omit<MarcaVehiculo, '_id' | 'modelos'>>;
/** Tipo de datos para el formulario de creación/edición de Modelos. Se omite idModelo para creación. */
type ModeloFormDataType = Partial<Omit<ModeloVehiculo, 'idModelo'>> & { idModelo_to_edit?: string }; // Para pasar el id al editar


/** Tipo de datos para el formulario de creación/edición de Aseguradoras. Se omite _id. */
type AseguradoraFormDataType = Partial<Omit<Aseguradora, '_id' | 'ajustadores'>>;
/** Tipo de datos para el formulario de creación/edición de Ajustadores. Se omite idAjustador para creación. */
type AjustadorFormDataType = Partial<Omit<Ajustador, 'idAjustador'>> & { idAjustador_to_edit?: string }; // Para pasar el id al editar

/** Tipo de datos para el formulario de creación de Empleados. */
type EmpleadoFormDataType = Omit<Empleado, '_id' | 'fechaRegistro' | 'user'> & {
  createSystemUser?: boolean;
  systemUserUsuario?: string;
  systemUserContraseña?: string;
  systemUserConfirmContraseña?: string;
  systemUserRol?: UserRoleType;
};

/** Tipo de datos para el formulario de edición de Empleados. */
type EditEmpleadoFormDataType = Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>> & {
  systemUserUsuario?: string;
  systemUserRol?: UserRoleType;
  newSystemUserContraseña?: string;
  newSystemUserConfirmContraseña?: string;
  createSystemUser?: boolean;
};

/**
 * Componente principal de la página del Dashboard.
 */
export default function DashboardPage() {
  console.log("DashboardPage: Renderizando componente...");
  const router = useRouter();
  const { toast } = useToast();

  // --- Estados de Sesión y Usuario ---
  const [userName, setUserName] = useState<string | null>(null);
  const [empleadoId, setEmpleadoId] = useState<string | null>(null); // _id del empleado logueado
  const [userRole, setUserRole] = useState<UserRoleType | null>(null);

  // --- Estados para Órdenes de Servicio ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false);
  const [isDeleteOrderDialogOpen, setIsDeleteOrderDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null); // _id (string)
  const [availableAjustadoresForOrder, setAvailableAjustadoresForOrder] = useState<{idAjustador: string, nombre: string}[]>([]);

  const initialNewOrderData: OrderFormDataType = {
    proceso: 'pendiente', piso: false, grua: false,
  };
  const [newOrderData, setNewOrderData] = useState<OrderFormDataType>(initialNewOrderData);
  const [editOrderData, setEditOrderData] = useState<OrderFormDataType>({});

  // Datos para Selects de Órdenes
  const [clients, setClients] = useState<Cliente[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [asesores, setAsesores] = useState<{ _id: string; nombre: string }[]>([]);
  const [isLoadingAsesores, setIsLoadingAsesores] = useState(true); 
  const [valuadores, setValuadores] = useState<{ _id: string; nombre: string }[]>([]);
  const [hojalateros, setHojalateros] = useState<{ _id: string; nombre: string }[]>([]);
  const [pintores, setPintores] = useState<{ _id: string; nombre: string }[]>([]);

  // --- Estados para Administración: Marcas y Modelos ---
  const [marcas, setMarcas] = useState<MarcaVehiculo[]>([]); // Marcas cargadas de la DB.
  const [isLoadingMarcas, setIsLoadingMarcas] = useState(true); // Indicador de carga para marcas.
  const [isCreateMarcaDialogOpen, setIsCreateMarcaDialogOpen] = useState(false); // Controla diálogo de creación de marca.
  const [isEditMarcaDialogOpen, setIsEditMarcaDialogOpen] = useState(false); // Controla diálogo de edición de marca.
  const [isDeleteMarcaDialogOpen, setIsDeleteMarcaDialogOpen] = useState(false); // Controla diálogo de eliminación de marca.
  const [currentMarca, setCurrentMarca] = useState<MarcaVehiculo | null>(null); // Marca seleccionada para editar o gestionar modelos.
  const [marcaToDeleteId, setMarcaToDeleteId] = useState<string | null>(null); // _id (string) de la marca a eliminar.
  const [newMarcaData, setNewMarcaData] = useState<MarcaFormDataType>({ marca: '' }); // Datos para el formulario de nueva marca.
  const [editMarcaData, setEditMarcaData] = useState<MarcaFormDataType>({}); // Datos para el formulario de edición de marca.

  // Estados para Modelos (subdocumentos de Marca)
  const [isManageModelosDialogOpen, setIsManageModelosDialogOpen] = useState(false); // Controla diálogo para gestionar modelos.
  const [isCreateModeloDialogOpen, setIsCreateModeloDialogOpen] = useState(false); // Controla diálogo de creación de modelo.
  const [isEditModeloDialogOpen, setIsEditModeloDialogOpen] = useState(false); // Controla diálogo de edición de modelo.
  const [currentModelo, setCurrentModelo] = useState<ModeloVehiculo | null>(null); // Modelo seleccionado para editar (contiene idModelo string ObjectId).
  const [newModeloData, setNewModeloData] = useState<Omit<ModeloVehiculo, 'idModelo'>>({ modelo: '' }); // Datos para nuevo modelo (solo nombre).
  const [editModeloData, setEditModeloData] = useState<Partial<ModeloVehiculo>>({}); // Datos para editar modelo (incluye idModelo string ObjectId).
  
  // --- Estados para Administración: Aseguradoras y Ajustadores ---
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  const [isLoadingAseguradoras, setIsLoadingAseguradoras] = useState(true);
  const [isCreateAseguradoraDialogOpen, setIsCreateAseguradoraDialogOpen] = useState(false);
  const [isEditAseguradoraDialogOpen, setIsEditAseguradoraDialogOpen] = useState(false);
  const [isDeleteAseguradoraDialogOpen, setIsDeleteAseguradoraDialogOpen] = useState(false);
  const [currentAseguradora, setCurrentAseguradora] = useState<Aseguradora | null>(null);
  const [aseguradoraToDeleteId, setAseguradoraToDeleteId] = useState<string | null>(null); // _id (string)
  const [newAseguradoraData, setNewAseguradoraData] = useState<AseguradoraFormDataType>({ nombre: '', telefono: '' });
  const [editAseguradoraData, setEditAseguradoraData] = useState<AseguradoraFormDataType>({});
  
  const [isManageAjustadoresDialogOpen, setIsManageAjustadoresDialogOpen] = useState(false);
  const [isCreateAjustadorDialogOpen, setIsCreateAjustadorDialogOpen] = useState(false);
  const [isEditAjustadorDialogOpen, setIsEditAjustadorDialogOpen] = useState(false);
  const [currentAjustador, setCurrentAjustador] = useState<Ajustador | null>(null); // currentAjustador.idAjustador es string (ObjectId)
  const [newAjustadorData, setNewAjustadorData] = useState<Omit<Ajustador, 'idAjustador'>>({ nombre: '', telefono: '', correo: '' });
  const [editAjustadorData, setEditAjustadorData] = useState<Partial<Ajustador>>({}); // Incluye idAjustador string ObjectId

  // --- Estados para Administración: Empleados ---
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
  const [empleadoToDeleteId, setEmpleadoToDeleteId] = useState<string | null>(null); // _id (string)


  /**
   * useEffect para verificar la sesión del usuario al cargar la página.
   * Si no hay sesión válida, redirige a la página de inicio.
   * Si la sesión es válida, establece los datos del usuario y carga los datos iniciales.
   */
  useEffect(() => {
    console.log("Dashboard useEffect: Verificando sesión...");
    const loggedIn = localStorage.getItem('isLoggedIn');
    const storedUserName = localStorage.getItem('username');
    const storedEmpleadoId = localStorage.getItem('empleadoId'); // Este es el _id del empleado (string)
    const storedUserRole = localStorage.getItem('userRole') as UserRoleType | null;

    console.log("Dashboard useEffect: Valores RAW de localStorage:", {
      loggedIn, storedUserName, storedEmpleadoId, storedUserRole
    });
    
    const isEmpleadoIdValid = storedEmpleadoId && storedEmpleadoId.trim() !== '' && storedEmpleadoId !== 'null' && storedEmpleadoId !== 'undefined';
    const isUserRoleValid = storedUserRole && storedUserRole.trim() !== '' && storedUserRole !== 'null' && storedUserRole !== 'undefined' && Object.values(UserRole).includes(storedUserRole as UserRole);

    console.log("Dashboard useEffect: Validaciones de sesión:", {
        isLoggedIn: loggedIn === 'true',
        isUserNamePresent: !!storedUserName,
        isEmpleadoIdValid,
        isUserRoleValid
    });
    
    if (loggedIn === 'true' && storedUserName && isEmpleadoIdValid && isUserRoleValid) {
      console.log("Dashboard useEffect: Usuario logueado. Configurando estado y cargando datos iniciales.");
      setUserName(storedUserName);
      setEmpleadoId(storedEmpleadoId);
      setUserRole(storedUserRole as UserRoleType);

      if (storedUserRole === UserRole.ASESOR) {
        console.log("Dashboard useEffect: Rol Asesor. Pre-llenando idAsesor con Empleado._id:", storedEmpleadoId);
        setNewOrderData(prev => ({ ...prev, idAsesor: storedEmpleadoId }));
      }
      fetchInitialData(storedUserRole as UserRoleType, storedEmpleadoId);
    } else {
      console.log("Dashboard useEffect: Sesión inválida o datos faltantes. Redirigiendo a /. Detalles:", { loggedIn, storedUserName, storedEmpleadoId, storedUserRole });
      router.replace('/');
    }
  }, [router]);

  /**
   * Carga todos los datos iniciales necesarios para el dashboard.
   * @param {UserRoleType | null} role Rol del usuario actual.
   * @param {string | null} currentEmpleadoLogId _id (string) del empleado actual.
   */
  const fetchInitialData = async (role: UserRoleType | null, currentEmpleadoLogId: string | null) => {
    console.log("fetchInitialData: Iniciando carga de datos...", { role, currentEmpleadoId: currentEmpleadoLogId });
    
    setNewOrderData(prev => ({ 
        ...initialNewOrderData, 
        idAsesor: role === UserRole.ASESOR && currentEmpleadoLogId ? currentEmpleadoLogId : undefined,
    }));

    setIsLoadingOrders(true); setIsLoadingMarcas(true); setIsLoadingAseguradoras(true);
    setIsLoadingClients(true); setIsLoadingAsesores(true);
    if (role === UserRole.ADMIN) setIsLoadingEmpleadosList(true);

    try {
      await Promise.all([
        fetchOrders(), fetchMarcas(), fetchAseguradoras(), fetchClients(),
        fetchAsesores(), fetchValuadores(), fetchHojalateros(), fetchPintores(),
        role === UserRole.ADMIN ? fetchEmpleados() : Promise.resolve(),
      ]);
      console.log("fetchInitialData: Todos los datos cargados.");
    } catch (error) {
      console.error("fetchInitialData: Error al cargar datos iniciales:", error);
      toast({ title: "Error Crítico", description: "No se pudieron cargar los datos iniciales del dashboard.", variant: "destructive" });
    }
  };

  // --- Funciones de Carga de Datos Específicas (fetchers) ---
  const fetchValuadores = async () => { /* ... (sin cambios, solo logging) ... */ };
  const fetchHojalateros = async () => { /* ... (sin cambios, solo logging) ... */ };
  const fetchPintores = async () => { /* ... (sin cambios, solo logging) ... */ };
  const fetchClients = async () => { /* ... (sin cambios, solo logging) ... */ };
  const fetchAsesores = async () => { /* ... (sin cambios, solo logging) ... */ };
  const fetchOrders = async () => { /* ... (sin cambios, solo logging) ... */ };
  const fetchMarcas = async () => {
    console.log("fetchMarcas: Iniciando...");
    setIsLoadingMarcas(true);
    try {
      const result = await getAllMarcasAction();
      console.log("fetchMarcas: Resultado:", result);
      if (result.success && result.data) setMarcas(result.data);
      else toast({ title: "Error Marcas", description: result.error || "No se pudieron cargar las marcas.", variant: "destructive" });
    } catch (error) { console.error("fetchMarcas: Error:", error); toast({ title: "Error Crítico Marcas", description: "Fallo al obtener marcas.", variant: "destructive" });
    } finally { setIsLoadingMarcas(false); }
  };
  const fetchAseguradoras = async () => { /* ... (sin cambios, solo logging) ... */ };
  const fetchEmpleados = async () => { /* ... (sin cambios, solo logging) ... */ };
  
  /** Maneja el cierre de sesión del usuario. */
  const handleLogout = () => { /* ... (sin cambios) ... */ };

  /**
   * Manejador genérico para cambios en inputs, textareas y checkboxes.
   * @param e Evento de cambio o objeto sintético.
   * @param setState Función para actualizar el estado del formulario.
   */
  const handleInputChangeGeneric = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any; type?: string } },
    setState: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const target = e.target as { name: string; value: any; type?: string; checked?: boolean };
    const { name, value } = target;
    let processedValue: any;
  
    if (target.type === 'checkbox') {
      processedValue = value; // Valor booleano 'checked' ya viene en 'value'
    } else if (target.type === 'number') {
      processedValue = value === '' ? undefined : Number(value); 
    } else {
      processedValue = value;
    }
    
    setState((prev: any) => ({ ...prev, [name]: processedValue }));
  };

  /**
   * Manejador genérico para cambios en componentes Select.
   * @param name Nombre del campo en el estado del formulario.
   * @param value Nuevo valor seleccionado.
   * @param setState Función para actualizar el estado del formulario.
   */
  const handleSelectChangeGeneric = (
    name: string, value: string | undefined,
    setState: React.Dispatch<React.SetStateAction<any>>
  ) => { setState((prev: any) => ({ ...prev, [name]: value === 'null_value_placeholder' ? undefined : value })); };

  // --- Funciones de Gestión de Órdenes de Servicio ---
  const handleOrderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formType: 'new' | 'edit') => { /* ... (sin cambios) ... */ };
  const handleOrderSelectChange = async (name: keyof OrderFormDataType, value: string | undefined, formType: 'new' | 'edit') => { /* ... (sin cambios) ... */ };
  const handleCreateOrder = async () => { /* ... (adaptado a nueva estructura de Order y empleadoId) ... */ };
  const openEditOrderDialog = async (orderId: string) => { /* ... (adaptado a nueva estructura de Order) ... */ };
  const handleUpdateOrder = async () => { /* ... (adaptado a nueva estructura de Order y empleadoId) ... */ };
  const openViewOrderDialog = async (orderId: string) => { /* ... (sin cambios) ... */ };
  const openDeleteOrderDialog = (orderId: string) => { /* ... (sin cambios) ... */ };
  const handleDeleteOrder = async () => { /* ... (sin cambios) ... */ };

  // --- Funciones de Gestión de Marcas (Administración) ---
  /** Maneja la creación de una nueva marca. Valida que el nombre no esté vacío. */
  const handleCreateMarca = async () => {
    if (!newMarcaData.marca?.trim()) {
      toast({ title: "Error", description: "El nombre de la marca es obligatorio.", variant: "destructive" }); return;
    }
    // NewMarcaData ahora es Omit<MarcaVehiculo, '_id'>
    const result = await createMarcaAction({ marca: newMarcaData.marca!, modelos: [] }); // Pasar modelos vacíos
    if (result.success) {
      toast({ title: "Éxito", description: `Marca "${newMarcaData.marca}" creada.` });
      setIsCreateMarcaDialogOpen(false); fetchMarcas(); setNewMarcaData({ marca: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear la marca.", variant: "destructive" });
    }
  };
  /** Abre el diálogo para editar una marca. Pre-llena el formulario con datos de la marca. */
  const openEditMarcaDialog = (marca: MarcaVehiculo) => { 
    setCurrentMarca(marca); 
    setEditMarcaData({ marca: marca.marca }); // Solo nombre es editable para la marca en sí.
    setIsEditMarcaDialogOpen(true); 
  };
  /** Maneja la actualización de una marca. Valida datos y llama a la acción del servidor. */
  const handleUpdateMarca = async () => {
    if (!currentMarca || !currentMarca._id || !editMarcaData.marca?.trim()) {
      toast({ title: "Error", description: "Datos inválidos para actualizar marca.", variant: "destructive" }); return;
    }
    // currentMarca._id es string (MongoDB _id). UpdateMarcaData es Partial<Omit<MarcaVehiculo, '_id'>>
    const result = await updateMarcaAction(currentMarca._id, { marca: editMarcaData.marca! });
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsEditMarcaDialogOpen(false); fetchMarcas(); setCurrentMarca(null); setEditMarcaData({ marca: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar la marca.", variant: "destructive" });
    }
  };
  /** Abre el diálogo de confirmación para eliminar una marca. */
  const openDeleteMarcaDialog = (marcaId: string) => { setMarcaToDeleteId(marcaId); setIsDeleteMarcaDialogOpen(true); }; // marcaId es _id (string).
  /** Confirma y ejecuta la eliminación de una marca. */
  const handleDeleteMarca = async () => {
    if (!marcaToDeleteId) return;
    const result = await deleteMarcaAction(marcaToDeleteId);
    if (result.success) { toast({ title: "Éxito", description: result.message }); fetchMarcas(); }
    else { toast({ title: "Error", description: result.error || "Error al eliminar", variant: "destructive" }); }
    setIsDeleteMarcaDialogOpen(false); setMarcaToDeleteId(null);
  };

  // --- Funciones de Gestión de Modelos (Administración) ---
  /** Abre el diálogo para gestionar los modelos de una marca. */
  const openManageModelosDialog = (marca: MarcaVehiculo) => { setCurrentMarca(marca); setIsManageModelosDialogOpen(true); };
  /** Maneja la creación de un nuevo modelo para la marca actual. Valida nombre. */
  const handleCreateModelo = async () => {
    if (!currentMarca?._id || !newModeloData.modelo?.trim()) {
      toast({ title: "Error", description: "Nombre del Modelo es requerido.", variant: "destructive" }); return;
    }
    // Omit<ModeloVehiculo, 'idModelo'> es lo que espera addModeloToMarcaAction
    const result = await addModeloToMarcaAction(currentMarca._id, { modelo: newModeloData.modelo! });
    if (result.success && result.data) {
      toast({ title: "Éxito", description: "Modelo añadido." });
      const marcaRes = await getMarcaForModelosAction(currentMarca._id);
      if (marcaRes.success && marcaRes.data) setCurrentMarca(marcaRes.data);
      else fetchMarcas();
      setNewModeloData({ modelo: '' });
      setIsCreateModeloDialogOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el modelo.", variant: "destructive" });
    }
  };
  /** Abre el diálogo para editar un modelo. */
  const openEditModeloDialog = (modelo: ModeloVehiculo) => { 
    setCurrentModelo(modelo); // modelo.idModelo es string (ObjectId)
    setEditModeloData({ idModelo: modelo.idModelo, modelo: modelo.modelo }); 
    setIsEditModeloDialogOpen(true); 
  };
  /** Maneja la actualización de un modelo. Valida datos y llama a la acción. */
  const handleUpdateModelo = async () => {
    if (!currentMarca?._id || !currentModelo?.idModelo || !editModeloData.modelo?.trim()) {
      toast({ title: "Error", description: "Datos de modelo inválidos.", variant: "destructive" }); return;
    }
    // currentModelo.idModelo es string. modeloUpdateData es Partial<Omit<ModeloVehiculo, 'idModelo'>>
    const result = await updateModeloInMarcaAction(currentMarca._id, currentModelo.idModelo, { modelo: editModeloData.modelo });
    if (result.success) {
      toast({ title: "Éxito", description: "Modelo actualizado." });
      const marcaRes = await getMarcaForModelosAction(currentMarca._id);
      if (marcaRes.success && marcaRes.data) setCurrentMarca(marcaRes.data);
      else fetchMarcas();
      setIsEditModeloDialogOpen(false); setCurrentModelo(null);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar el modelo.", variant: "destructive" });
    }
  };
  /** Maneja la eliminación de un modelo de la marca actual. */
  const handleDeleteModelo = async (idModelo: string) => { // idModelo es string (ObjectId)
    if (!currentMarca?._id) return;
    const result = await removeModeloFromMarcaAction(currentMarca._id, idModelo);
    if (result.success) {
      toast({ title: "Éxito", description: "Modelo eliminado." });
      const marcaRes = await getMarcaForModelosAction(currentMarca._id);
      if (marcaRes.success && marcaRes.data) setCurrentMarca(marcaRes.data);
      else fetchMarcas();
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar el modelo.", variant: "destructive" });
    }
  };

  // --- Funciones de Gestión de Aseguradoras (Administración) ---
  const handleCreateAseguradora = async () => { /* ... (ya adaptado a _id) ... */ };
  const openEditAseguradoraDialog = (aseguradora: Aseguradora) => { /* ... (ya adaptado a _id) ... */ };
  const handleUpdateAseguradora = async () => { /* ... (ya adaptado a _id) ... */ };
  const openDeleteAseguradoraDialog = (aseguradoraId: string) => { /* ... (ya adaptado a _id) ... */ };
  const handleDeleteAseguradora = async () => { /* ... (ya adaptado a _id) ... */ };

  // --- Funciones de Gestión de Ajustadores (Administración) ---
  const openManageAjustadoresDialog = (aseguradora: Aseguradora) => { /* ... (ya adaptado a idAjustador string) ... */ };
  const handleCreateAjustador = async () => { /* ... (ya adaptado a idAjustador string) ... */ };
  const openEditAjustadorDialog = (ajustador: Ajustador) => { /* ... (ya adaptado a idAjustador string) ... */ };
  const handleUpdateAjustador = async () => { /* ... (ya adaptado a idAjustador string) ... */ };
  const handleDeleteAjustador = async (idAjustador: string) => { /* ... (ya adaptado a idAjustador string) ... */ };

  // --- Funciones de Gestión de Empleados (Administración) ---
  const handleCreateEmpleado = async () => { /* ... (sin cambios directos, pero usa EmpleadoFormDataType) ... */ };
  const openEditEmpleadoDialog = async (empleadoIdToEdit: string) => { /* ... (sin cambios directos) ... */ };
  const handleUpdateEmpleado = async () => { /* ... (sin cambios directos) ... */ };
  const openDeleteEmpleadoDialog = (empleadoIdToDelete: string) => { /* ... (sin cambios directos) ... */ };
  const handleDeleteEmpleado = async () => { /* ... (sin cambios directos) ... */ };
  const handleRemoveSystemUser = async (empleadoIdToRemoveAccess: string) => { /* ... (sin cambios directos) ... */ };

  // --- Funciones Auxiliares de Formateo ---
  const formatDate = (dateInput?: Date | string | number): string => { /* ... (sin cambios) ... */ };
  const formatDateTime = (dateInput?: Date | string | number): string => { /* ... (sin cambios) ... */ };
  const getProcesoVariant = (proceso?: Order['proceso']): "default" | "secondary" | "outline" | "destructive" => { /* ... (sin cambios) ... */ };
  const procesoOptions: { value: Order['proceso']; label: string }[] = [ /* ... (sin cambios) ... */ ];
  const userRoleOptions = Object.values(UserRole).map(role => ({ value: role, label: role.charAt(0).toUpperCase() + role.slice(1) }));
  
  /** Función genérica para renderizar campos de formulario en diálogos. */
  const renderDialogField = (
      label: string, name: any, type: string = "text", placeholder?: string,
      formType: 'newOrder' | 'editOrder' | 'newMarca' | 'editMarca' | 'newModelo' | 'editModelo' | 'newAseguradora' | 'editAseguradora' | 'newAjustador' | 'editAjustador' | 'newEmpleado' | 'editEmpleado' = 'newOrder',
      options?: { value: string | number; label: string }[], isCheckbox?: boolean, isTextarea?: boolean, isDisabled?: boolean, isRequired?: boolean
    ) => { /* ... (sin cambios) ... */ };

  // --- Lógica de Renderizado del Componente ---
  if (!userName || !userRole || (userRole && !Object.values(UserRole).includes(userRole))) {
    console.log("DashboardPage: userName o userRole faltan o son inválidos. Mostrando 'Cargando...' Detalles:", { userName, userRole });
    return <div className="flex min-h-screen items-center justify-center bg-background"><p>Cargando...</p></div>;
  }

  const dummyCitas = [ /* ... (sin cambios) ... */ ];
  const inventoryItems = [ /* ... (sin cambios) ... */ ];
  const mainTabsListClassName = userRole === UserRole.ADMIN /* ... (sin cambios) ... */ ;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 dark:bg-muted/10">
      {/* Encabezado */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 shadow-sm">
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Panel del Taller Automotriz</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Bienvenido, <span className="font-medium text-foreground">{userName} (_id Emp: {empleadoId?.substring(0,8)}, Rol: {userRole})</span>
            </span>
            <Button onClick={handleLogout} variant="outline" size="sm"><LogOut className="mr-2 h-4 w-4" />Cerrar Sesión</Button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <Tabs defaultValue="ordenes" className="w-full">
          <TabsList className={mainTabsListClassName}>
            {/* ... Pestañas Citas, Órdenes, Almacén (sin cambios) ... */}
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

          {/* Contenido de Pestañas Citas, Órdenes, Almacén (sin cambios significativos aquí) ... */}
          <TabsContent value="citas">{/* ... */}</TabsContent>
          <TabsContent value="ordenes">{/* ... */}</TabsContent>
          <TabsContent value="almacen">{/* ... */}</TabsContent>

          {/* Contenido de la Pestaña "Admin" */}
          {userRole === UserRole.ADMIN && (
            <TabsContent value="admin">
              <Tabs defaultValue="empleados" className="w-full"> 
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-4 rounded-md p-1 bg-muted/70">
                  <TabsTrigger value="marcas" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Car className="mr-2 h-4 w-4" />Marcas/Modelos</TabsTrigger>
                  <TabsTrigger value="aseguradoras" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Shield className="mr-2 h-4 w-4"/>Aseguradoras</TabsTrigger>
                  <TabsTrigger value="empleados" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Users className="mr-2 h-4 w-4"/>Empleados</TabsTrigger>
                </TabsList>
                
                {/* Contenido de Admin -> Marcas/Modelos */}
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
                            <TableHeader><TableRow><TableHead>ID Marca (_id)</TableHead><TableHead>Nombre Marca</TableHead><TableHead>Modelos</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {marcas.map((marca) => (
                                <TableRow key={marca._id}>
                                  <TableCell>{marca._id.substring(0, 8)}...</TableCell> {/* Mostrar parte del _id */}
                                  <TableCell className="font-medium">{marca.marca}</TableCell>
                                  <TableCell>{marca.modelos?.length || 0}</TableCell>
                                  <TableCell className="text-right space-x-1">
                                    <Button variant="outline" size="sm" onClick={() => openManageModelosDialog(marca)}>Modelos</Button>
                                    <Button variant="ghost" size="icon" onClick={() => openEditMarcaDialog(marca)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => openDeleteMarcaDialog(marca._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Contenido de Admin -> Aseguradoras (sin cambios aquí) ... */}
                <TabsContent value="aseguradoras">{/* ... */}</TabsContent>
                {/* Contenido de Admin -> Empleados (sin cambios aquí) ... */}
                <TabsContent value="empleados">{/* ... */}</TabsContent>
              </Tabs>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* --- Diálogos para Órdenes de Servicio (sin cambios aquí) --- */}
      {/* ... */}

      {/* --- Diálogos para Marcas (Admin) --- */}
      <Dialog open={isCreateMarcaDialogOpen} onOpenChange={setIsCreateMarcaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nueva Marca</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">{renderDialogField("Nombre Marca", "marca", "text", "Ej: Toyota", "newMarca",undefined,false,false,false,true)}</div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateMarca}>Crear Marca</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditMarcaDialogOpen} onOpenChange={(open) => { setIsEditMarcaDialogOpen(open); if (!open) setCurrentMarca(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Marca: {currentMarca?.marca}</DialogTitle></DialogHeader>
          {currentMarca && <div className="space-y-4 py-4">{renderDialogField("Nombre Marca", "marca", "text", "Ej: Toyota", "editMarca",undefined,false,false,false,true)}</div>}
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateMarca}>Actualizar Marca</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteMarcaDialogOpen} onOpenChange={setIsDeleteMarcaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Seguro que deseas eliminar la marca {marcas.find(m=>m._id === marcaToDeleteId)?.marca}? Se eliminarán también sus modelos.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteMarca}>Eliminar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Gestionar Modelos de una Marca */}
      <Dialog open={isManageModelosDialogOpen} onOpenChange={(open) => { setIsManageModelosDialogOpen(open); if (!open) setCurrentMarca(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Gestionar Modelos para: {currentMarca?.marca}</DialogTitle></DialogHeader>
          <div className="my-4"><Button size="sm" onClick={() => { setNewModeloData({ modelo: ''}); setIsCreateModeloDialogOpen(true);}}><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Modelo</Button></div>
          {currentMarca?.modelos && currentMarca.modelos.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>ID Modelo (ObjectId)</TableHead><TableHead>Nombre Modelo</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {currentMarca.modelos.map(modelo => (
                  <TableRow key={modelo.idModelo}><TableCell>{modelo.idModelo.substring(0,8)}...</TableCell><TableCell>{modelo.modelo}</TableCell>
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
      {/* Diálogo para Crear Nuevo Modelo */}
      <Dialog open={isCreateModeloDialogOpen} onOpenChange={(open) => {setIsCreateModeloDialogOpen(open); if(!open) setNewModeloData({ modelo: '' });}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Añadir Nuevo Modelo a {currentMarca?.marca}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              {/* idModelo se genera en backend, no se pide en el formulario */}
              {renderDialogField("Nombre Modelo", "modelo", "text", "Ej: Corolla", "newModelo",undefined,false,false,false,true)}
            </div>
            <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateModelo}>Añadir Modelo</Button></DialogFooter>
          </DialogContent>
      </Dialog>
      {/* Diálogo para Editar Modelo */}
      <Dialog open={isEditModeloDialogOpen} onOpenChange={(open) => { setIsEditModeloDialogOpen(open); if (!open) setCurrentModelo(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Editar Modelo: {currentModelo?.modelo}</DialogTitle></DialogHeader>
            {/* idModelo no es editable, se usa para identificar el modelo. */}
            {currentModelo && (<div className="space-y-4 py-4">{renderDialogField("Nombre Modelo", "modelo", "text", "Ej: Corolla", "editModelo",undefined,false,false,false,true)}</div>)}
            <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateModelo}>Actualizar Modelo</Button></DialogFooter>
          </DialogContent>
      </Dialog>

      {/* --- Diálogos para Aseguradoras y Ajustadores (sin cambios aquí) --- */}
      {/* ... */}
      {/* --- Diálogos para Empleados (sin cambios aquí) --- */}
      {/* ... */}
    </div>
  );
}
