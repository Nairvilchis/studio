
"use client";
/**
 * @fileOverview Página principal del Dashboard para el Taller Automotriz.
 * Gestiona la visualización y interacción con Citas, Órdenes de Servicio, Almacén y
 * secciones de Administración (Marcas, Aseguradoras, Empleados, Clientes, Configuración General).
 * Utiliza localStorage para la gestión básica de sesión y roles.
 * Realiza llamadas a Server Actions para interactuar con el backend.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Para redirección
// Componentes UI de ShadCN
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
// Iconos de Lucide React
import {
  LogOut, CalendarDays, Wrench, Package, PlusCircle, Edit, Trash2, EyeIcon, Car, Shield, Users, Settings, Building, UserX, AlertTriangle, UserPlus, Briefcase, Trash, Activity, ListChecks, Palette, ChevronsUpDown, Check, UserCircle
} from 'lucide-react';
// Hooks y utilidades
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Importación de tipos de datos.
import type {
  UserRole as UserRoleType, // Se usa como tipo
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
  NewClienteData,
  UpdateClienteData, // Añadido para editar cliente
  LogEntry,
  PresupuestoItem,
  Puesto,
  NewPuestoData,
  UpdatePuestoData,
  ColorVehiculo,
  NewColorVehiculoData,
  UpdateColorVehiculoData
} from '@/lib/types';
import { UserRole } from '@/lib/types'; // Enum para usar sus valores (ej. UserRole.ADMIN).

// --- Acciones del Servidor ---
// Órdenes de Servicio
import {
  getAllOrdersAction,
  createOrderAction,
  updateOrderAction,
  deleteOrderAction,
  getOrderByIdAction,
  getAjustadoresByAseguradora,
} from './service-orders/actions';
// Marcas y Modelos
import {
  getAllMarcasAction,
  createMarcaAction,
  updateMarcaAction,
  deleteMarcaAction,
  addModeloToMarcaAction,
  updateModeloInMarcaAction,
  removeModeloFromMarcaAction,
  getMarcaByIdAction as getMarcaForModelosAction, // Para obtener marca con sus modelos
  getModelosByMarcaAction, // Para poblar select de modelos
} from './admin/marcas/actions';
// Aseguradoras y Ajustadores
import {
  getAllAseguradorasAction,
  createAseguradoraAction,
  updateAseguradoraAction,
  deleteAseguradoraAction,
  addAjustadorToAseguradoraAction,
  updateAjustadorInAseguradoraAction,
  removeAjustadorFromAseguradoraAction,
  getAseguradoraByIdAction as getAseguradoraForAjustadoresAction, // Para obtener aseguradora con sus ajustadores
} from './admin/aseguradoras/actions';
// Clientes
import {
  getAllClientsAction,
  createClienteAction,
  getClienteByIdAction, // Para editar cliente
  updateClienteAction,   // Para editar cliente
  deleteClienteAction    // Para eliminar cliente
} from './admin/clients/actions';
// Empleados
import {
  getAllEmpleadosAction,
  createEmpleadoAction,
  getEmpleadoByIdAction as getEmpleadoForEditAction, // Para editar empleado
  updateEmpleadoAction,
  deleteEmpleadoAction,
  removeSystemUserFromEmpleadoAction,
  getEmpleadosByRolAction,
  getEmpleadosByPuestoAction,
} from './admin/empleados/actions';
// Puestos
import {
  getAllPuestosAction,
  createPuestoAction,
  updatePuestoAction,
  deletePuestoAction,
} from './admin/puestos/actions';
// Colores de Vehículo
import {
  getAllColoresVehiculoAction,
  createColorVehiculoAction,
  updateColorVehiculoAction,
  deleteColorVehiculoAction,
} from './admin/colores/actions';

// --- Tipos de Datos para Formularios ---

/** Tipo de datos para el formulario de creación/edición de Órdenes de Servicio. */
type OrderFormDataType = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'Log' | 'presupuestos' | 'aseguradoTercero'>> & {
  año?: string;
  deducible?: string;
  aseguradoTerceroString?: 'true' | 'false' | string;
  fechaValuacion?: string;
  fechaReingreso?: string;
  fechaEntrega?: string;
  fechaPromesa?: string;
  fechaBaja?: string;
};

/** Tipo de datos para el formulario de creación/edición de Marcas de Vehículos. */
type MarcaFormDataType = Partial<Omit<MarcaVehiculo, '_id' | 'modelos'>>;
/** Tipo de datos para el formulario de creación/edición de Modelos. */
type ModeloFormDataType = Partial<Omit<ModeloVehiculo, 'idModelo'>>;

/** Tipo de datos para el formulario de creación/edición de Aseguradoras. */
type AseguradoraFormDataType = Partial<Omit<Aseguradora, '_id' | 'ajustadores'>>;
/** Tipo de datos para el formulario de creación/edición de Ajustadores. */
type AjustadorFormDataType = Partial<Omit<Ajustador, 'idAjustador'>>;

/** Tipo de datos para el formulario de creación de Empleados. */
type EmpleadoFormDataType = Omit<Empleado, '_id' | 'fechaRegistro' | 'user' | 'sueldo' | 'comision'> & {
  sueldo?: string;
  comision?: string;
  createSystemUser?: boolean;
  systemUserUsuario?: string;
  systemUserContraseña?: string;
  systemUserConfirmContraseña?: string;
  systemUserRol?: UserRoleType;
};
/** Tipo de datos para el formulario de edición de Empleados. */
type EditEmpleadoFormDataType = Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user' | 'sueldo' | 'comision'>> & {
  sueldo?: string;
  comision?: string;
  createSystemUser?: boolean;
  systemUserUsuario?: string;
  systemUserRol?: UserRoleType;
  newSystemUserContraseña?: string;
  newSystemUserConfirmContraseña?: string;
};

/** Tipo de datos para el formulario de creación/edición de Clientes. */
type ClienteFormDataType = Partial<NewClienteData>; // Usaremos NewClienteData como base, ya que los campos son los mismos.

/** Tipo de datos para el formulario de creación/edición de Puestos. */
type PuestoFormDataType = Partial<NewPuestoData>;
/** Tipo de datos para el formulario de creación/edición de Colores de Vehículo. */
type ColorVehiculoFormDataType = Partial<NewColorVehiculoData>;


/**
 * Componente principal de la página del Dashboard.
 * Gestiona estados, carga de datos y diálogos para las diferentes secciones del taller.
 */
export default function DashboardPage() {
  console.log("DashboardPage: Renderizando componente...");
  const router = useRouter();
  const { toast } = useToast();

  // --- Estados de Sesión y Usuario ---
  const [userName, setUserName] = useState<string | null>(null);
  const [userIdEmpleado, setUserIdEmpleado] = useState<string | null>(null); // _id (string) del Empleado logueado
  const [userRole, setUserRole] = useState<UserRoleType | null>(null);

  // --- Estados para Órdenes de Servicio ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false);
  const [isDeleteOrderDialogOpen, setIsDeleteOrderDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null);
  const [availableAjustadoresForOrder, setAvailableAjustadoresForOrder] = useState<Pick<Ajustador, 'idAjustador' | 'nombre'>[]>([]);
  const [availableModelosForOrder, setAvailableModelosForOrder] = useState<Pick<ModeloVehiculo, 'idModelo' | 'modelo'>[]>([]);
  const initialNewOrderData: OrderFormDataType = {
    proceso: 'pendiente', piso: false, grua: false, aseguradoTerceroString: 'true',
  };
  const [newOrderData, setNewOrderData] = useState<OrderFormDataType>(initialNewOrderData);
  const [editOrderData, setEditOrderData] = useState<OrderFormDataType>({});
  const [isNewOrderClientComboboxOpen, setIsNewOrderClientComboboxOpen] = useState(false);
  const [isEditOrderClientComboboxOpen, setIsEditOrderClientComboboxOpen] = useState(false);

  // --- Estados para poblar Selects en formularios ---
  const [clients, setClients] = useState<Cliente[]>([]); // Lista de clientes para Selects/Combobox
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [asesores, setAsesores] = useState<{ _id: string; nombre: string }[]>([]); // Empleados con rol Asesor
  const [isLoadingAsesores, setIsLoadingAsesores] = useState(true);
  const [valuadores, setValuadores] = useState<{ _id: string; nombre: string }[]>([]); // Empleados con rol Valuador
  const [isLoadingValuadores, setIsLoadingValuadores] = useState(true);
  const [hojalateros, setHojalateros] = useState<{ _id: string; nombre: string }[]>([]); // Empleados con puesto Hojalatero
  const [isLoadingHojalateros, setIsLoadingHojalateros] = useState(true);
  const [pintores, setPintores] = useState<{ _id: string; nombre: string }[]>([]); // Empleados con puesto Pintor
  const [isLoadingPintores, setIsLoadingPintores] = useState(true);

  // --- Estados para Administración: Marcas y Modelos ---
  const [marcas, setMarcas] = useState<MarcaVehiculo[]>([]);
  const [isLoadingMarcas, setIsLoadingMarcas] = useState(true);
  const [isCreateMarcaDialogOpen, setIsCreateMarcaDialogOpen] = useState(false);
  const [isEditMarcaDialogOpen, setIsEditMarcaDialogOpen] = useState(false);
  const [isDeleteMarcaDialogOpen, setIsDeleteMarcaDialogOpen] = useState(false);
  const [currentMarca, setCurrentMarca] = useState<MarcaVehiculo | null>(null);
  const [marcaToDeleteId, setMarcaToDeleteId] = useState<string | null>(null);
  const [newMarcaData, setNewMarcaData] = useState<MarcaFormDataType>({ marca: '' });
  const [editMarcaData, setEditMarcaData] = useState<MarcaFormDataType>({});
  const [isManageModelosDialogOpen, setIsManageModelosDialogOpen] = useState(false);
  const [isCreateModeloDialogOpen, setIsCreateModeloDialogOpen] = useState(false);
  const [isEditModeloDialogOpen, setIsEditModeloDialogOpen] = useState(false);
  const [currentModelo, setCurrentModelo] = useState<ModeloVehiculo | null>(null);
  const [newModeloData, setNewModeloData] = useState<Omit<ModeloVehiculo, 'idModelo'>>({ modelo: '' });
  const [editModeloData, setEditModeloData] = useState<Partial<ModeloVehiculo>>({});

  // --- Estados para Administración: Aseguradoras y Ajustadores ---
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  const [isLoadingAseguradoras, setIsLoadingAseguradoras] = useState(true);
  const [isCreateAseguradoraDialogOpen, setIsCreateAseguradoraDialogOpen] = useState(false);
  const [isEditAseguradoraDialogOpen, setIsEditAseguradoraDialogOpen] = useState(false);
  const [isDeleteAseguradoraDialogOpen, setIsDeleteAseguradoraDialogOpen] = useState(false);
  const [currentAseguradora, setCurrentAseguradora] = useState<Aseguradora | null>(null);
  const [aseguradoraToDeleteId, setAseguradoraToDeleteId] = useState<string | null>(null);
  const [newAseguradoraData, setNewAseguradoraData] = useState<AseguradoraFormDataType>({ nombre: '', telefono: '' });
  const [editAseguradoraData, setEditAseguradoraData] = useState<AseguradoraFormDataType>({});
  const [isManageAjustadoresDialogOpen, setIsManageAjustadoresDialogOpen] = useState(false);
  const [isCreateAjustadorDialogOpen, setIsCreateAjustadorDialogOpen] = useState(false);
  const [isEditAjustadorDialogOpen, setIsEditAjustadorDialogOpen] = useState(false);
  const [currentAjustador, setCurrentAjustador] = useState<Ajustador | null>(null);
  const [newAjustadorData, setNewAjustadorData] = useState<Omit<Ajustador, 'idAjustador'>>({ nombre: '', telefono: '', correo: '' });
  const [editAjustadorData, setEditAjustadorData] = useState<Partial<Ajustador>>({});

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
  const [editEmpleadoData, setEditEmpleadoData] = useState<EditEmpleadoFormDataType>({});
  const [empleadoToDeleteId, setEmpleadoToDeleteId] = useState<string | null>(null);

  // --- Estados para Administración: Clientes (Gestión Completa y Creación Rápida) ---
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false); // Reutilizado para creación desde Admin y Órdenes
  const [newClientData, setNewClientData] = useState<ClienteFormDataType>({ nombre: '', telefono: '', correo: ''}); // Para creación
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false); // Para editar cliente desde Admin
  const [currentClientToEdit, setCurrentClientToEdit] = useState<Cliente | null>(null); // Cliente para editar
  const [editClientData, setEditClientData] = useState<ClienteFormDataType>({}); // Datos del formulario de edición de cliente
  const [isDeleteClientDialogOpen, setIsDeleteClientDialogOpen] = useState(false); // Para confirmar eliminación
  const [clientToDeleteId, setClientToDeleteId] = useState<string | null>(null); // ID del cliente a eliminar

  // --- ESTADOS PARA CONFIGURACIÓN GENERAL (Admin): PUESTOS ---
  const [puestosList, setPuestosList] = useState<Puesto[]>([]);
  const [isLoadingPuestos, setIsLoadingPuestos] = useState(true);
  const [isCreatePuestoDialogOpen, setIsCreatePuestoDialogOpen] = useState(false);
  const [newPuestoData, setNewPuestoData] = useState<PuestoFormDataType>({ nombre: '' });
  const [isEditPuestoDialogOpen, setIsEditPuestoDialogOpen] = useState(false);
  const [currentPuestoToEdit, setCurrentPuestoToEdit] = useState<Puesto | null>(null);
  const [editPuestoData, setEditPuestoData] = useState<PuestoFormDataType>({});
  const [isDeletePuestoDialogOpen, setIsDeletePuestoDialogOpen] = useState(false);
  const [puestoToDeleteId, setPuestoToDeleteId] = useState<string | null>(null);

  // --- ESTADOS PARA CONFIGURACIÓN GENERAL (Admin): COLORES DE VEHÍCULO ---
  const [coloresList, setColoresList] = useState<ColorVehiculo[]>([]);
  const [isLoadingColores, setIsLoadingColores] = useState(true);
  const [isCreateColorDialogOpen, setIsCreateColorDialogOpen] = useState(false);
  const [newColorData, setNewColorData] = useState<ColorVehiculoFormDataType>({ nombre: '' });
  const [isEditColorDialogOpen, setIsEditColorDialogOpen] = useState(false);
  const [currentColorToEdit, setCurrentColorToEdit] = useState<ColorVehiculo | null>(null);
  const [editColorData, setEditColorData] = useState<ColorVehiculoFormDataType>({});
  const [isDeleteColorDialogOpen, setIsDeleteColorDialogOpen] = useState(false);
  const [colorToDeleteId, setColorToDeleteId] = useState<string | null>(null);

  /**
   * useEffect principal para verificar la sesión del usuario al cargar el componente.
   * Si el usuario no está logueado o faltan datos esenciales (username, empleadoId, userRole),
   * redirige a la página de inicio.
   * Si está logueado, configura los estados de usuario y carga los datos iniciales del dashboard.
   */
  useEffect(() => {
    console.log("Dashboard useEffect: Verificando sesión...");
    const loggedIn = localStorage.getItem('isLoggedIn');
    const storedUserName = localStorage.getItem('username');
    const storedEmpleadoId = localStorage.getItem('empleadoId');
    const storedUserRole = localStorage.getItem('userRole') as UserRoleType | null;

    console.log("Dashboard useEffect: Valores RAW de localStorage:", {
      loggedIn, storedUserName, storedEmpleadoId, storedUserRole
    });
    
    const isSessionValid =
        loggedIn === 'true' &&
        storedUserName && storedUserName.trim() !== '' &&
        storedEmpleadoId && storedEmpleadoId.trim() !== '' && storedEmpleadoId !== 'null' && storedEmpleadoId !== 'undefined' &&
        storedUserRole && Object.values(UserRole).includes(storedUserRole as UserRole);

    console.log("Dashboard useEffect: Validaciones de sesión:", {
      isLoggedIn: loggedIn === 'true',
      isUserNamePresent: !!storedUserName,
      isEmpleadoIdValid: !!(storedEmpleadoId && storedEmpleadoId.trim() !== '' && storedEmpleadoId !== 'null' && storedEmpleadoId !== 'undefined'),
      isUserRoleValid: !!(storedUserRole && Object.values(UserRole).includes(storedUserRole as UserRole)),
      overallSessionValid: isSessionValid
    });

    if (isSessionValid) {
      console.log("Dashboard useEffect: Usuario logueado. Configurando estado y cargando datos iniciales.");
      setUserName(storedUserName);
      setUserIdEmpleado(storedEmpleadoId); // Este es el _id del Empleado (string)
      setUserRole(storedUserRole);
      fetchInitialData(storedUserRole, storedEmpleadoId);
    } else {
      console.log("Dashboard useEffect: Sesión inválida o datos faltantes. Redirigiendo a /. Detalles:",
        { loggedIn, storedUserName, storedEmpleadoId, storedUserRole }
      );
      if (typeof window !== 'undefined') {
        router.replace('/');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);


  /**
   * Función de callback para cargar todos los datos iniciales necesarios para el dashboard.
   * Se llama después de que la sesión del usuario ha sido verificada y es válida.
   * @param {UserRoleType | null} role - Rol del usuario actual.
   * @param {string | null} currentUserIdEmpleado - _id (string ObjectId) del empleado logueado.
   */
  const fetchInitialData = useCallback(async (role: UserRoleType | null, currentUserIdEmpleado: string | null) => {
    console.log("fetchInitialData: Iniciando carga de datos...", { role, currentUserIdEmpleado });
     setNewOrderData(prev => ({
      ...initialNewOrderData,
      idAsesor: role === UserRole.ASESOR && currentUserIdEmpleado ? currentUserIdEmpleado : undefined,
    }));

    setIsLoadingOrders(true); setIsLoadingMarcas(true); setIsLoadingAseguradoras(true);
    setIsLoadingClients(true); setIsLoadingAsesores(true); setIsLoadingValuadores(true);
    setIsLoadingHojalateros(true); setIsLoadingPintores(true);
    setIsLoadingEmpleadosList(true); setIsLoadingPuestos(true); setIsLoadingColores(true);

    try {
      await Promise.all([
        fetchOrders(), fetchMarcas(), fetchAseguradoras(), fetchClients(),
        fetchAsesores(), fetchValuadores(), fetchHojalateros(), fetchPintores(),
        fetchEmpleados(), fetchPuestos(), fetchColores(),
      ]);
      console.log("fetchInitialData: Todos los datos cargados exitosamente.");
    } catch (error) {
      console.error("fetchInitialData: Error crítico al cargar datos iniciales:", error);
      toast({ title: "Error Crítico de Carga", description: "No se pudieron cargar los datos iniciales del dashboard. Intente recargar la página.", variant: "destructive" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // --- Funciones de Carga de Datos Específicas (fetchers) ---
  const fetchOrders = async () => { /* ... */ };
  const fetchMarcas = async () => { /* ... */ };
  const fetchAseguradoras = async () => { /* ... */ };
  const fetchClients = async () => {
    console.log("fetchClients: Iniciando...");
    setIsLoadingClients(true);
    try {
      const result = await getAllClientsAction();
      console.log("fetchClients: Resultado:", result.data ? `${result.data.length} clientes obtenidos` : result.error);
      if (result.success && result.data) {
        setClients(result.data);
      } else {
        toast({ title: "Error al Cargar Clientes", description: result.error || "No se pudieron cargar los clientes.", variant: "destructive" });
        setClients([]);
      }
    } catch (error) {
      console.error("fetchClients: Error crítico:", error);
      toast({ title: "Error Crítico de Clientes", description: "Fallo al obtener clientes.", variant: "destructive" });
      setClients([]);
    } finally {
      setIsLoadingClients(false);
    }
  };
  const fetchAsesores = async () => { /* ... */ };
  const fetchValuadores = async () => { /* ... */ };
  const fetchHojalateros = async () => { /* ... */ };
  const fetchPintores = async () => { /* ... */ };
  const fetchEmpleados = async () => { /* ... */ };
  const fetchPuestos = async () => { /* ... */ };
  const fetchColores = async () => { /* ... */ };

  const handleLogout = () => { /* ... */ };
  const handleInputChangeGeneric = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, setState: React.Dispatch<React.SetStateAction<any>>) => { /* ... */ };
  const handleCheckboxChangeGeneric = (name: string, checked: boolean, setState: React.Dispatch<React.SetStateAction<any>>) => { /* ... */ };
  const handleSelectChangeGeneric = (name: string, value: string | undefined, setState: React.Dispatch<React.SetStateAction<any>>) => { /* ... */ };

  // --- Funciones de Gestión de Órdenes de Servicio ---
  const handleOrderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formType: 'new' | 'edit') => { /* ... */ };
  const handleOrderCheckboxChange = (name: keyof OrderFormDataType, checked: boolean, formType: 'new' | 'edit') => { /* ... */ };
  const handleOrderSelectChange = async (name: keyof OrderFormDataType, value: string | undefined, formType: 'new' | 'edit') => { /* ... */ };
  const handleCreateOrder = async () => { /* ... */ };
  const openEditOrderDialog = async (orderId: string) => { /* ... */ };
  const handleUpdateOrder = async () => { /* ... */ };
  const openViewOrderDialog = async (orderId: string) => { /* ... */ };
  const openDeleteOrderDialog = (orderId: string) => { /* ... */ };
  const handleDeleteOrder = async () => { /* ... */ };

  // --- Funciones de Gestión de Marcas (Administración) ---
  const handleCreateMarca = async () => { /* ... */ };
  const openEditMarcaDialog = (marca: MarcaVehiculo) => { /* ... */ };
  const handleUpdateMarca = async () => { /* ... */ };
  const openDeleteMarcaDialog = (marcaId: string) => { /* ... */ };
  const handleDeleteMarca = async () => { /* ... */ };

  // --- Funciones de Gestión de Modelos (Administración) ---
  const openManageModelosDialog = async (marca: MarcaVehiculo) => { /* ... */ };
  const handleCreateModelo = async () => { /* ... */ };
  const openEditModeloDialog = (modelo: ModeloVehiculo) => { /* ... */ };
  const handleUpdateModelo = async () => { /* ... */ };
  const handleDeleteModelo = async (idModelo: string) => { /* ... */ };

  // --- Funciones de Gestión de Aseguradoras (Administración) ---
  const handleCreateAseguradora = async () => { /* ... */ };
  const openEditAseguradoraDialog = (aseguradora: Aseguradora) => { /* ... */ };
  const handleUpdateAseguradora = async () => { /* ... */ };
  const openDeleteAseguradoraDialog = (aseguradoraId: string) => { /* ... */ };
  const handleDeleteAseguradora = async () => { /* ... */ };

  // --- Funciones de Gestión de Ajustadores (Administración) ---
  const openManageAjustadoresDialog = async (aseguradora: Aseguradora) => { /* ... */ };
  const handleCreateAjustador = async () => { /* ... */ };
  const openEditAjustadorDialog = (ajustador: Ajustador) => { /* ... */ };
  const handleUpdateAjustador = async () => { /* ... */ };
  const handleDeleteAjustador = async (idAjustador: string) => { /* ... */ };

  // --- Funciones de Gestión de Empleados (Administración) ---
  const handleCreateEmpleado = async () => { /* ... */ };
  const openEditEmpleadoDialog = async (empleadoIdToEdit: string) => { /* ... */ };
  const handleUpdateEmpleado = async () => { /* ... */ };
  const openDeleteEmpleadoDialog = (empleadoIdToDelete: string) => { /* ... */ };
  const handleDeleteEmpleado = async () => { /* ... */ };
  const handleRemoveSystemUser = async (empleadoIdToRemoveAccess: string) => { /* ... */ };

  // --- Funciones de Gestión de Clientes ---
  /**
   * Abre el diálogo para crear un nuevo cliente.
   * Este se usa tanto desde la sección Admin/Clientes como desde el formulario de Órdenes.
   */
  const openCreateClientDialog = () => {
    console.log("openCreateClientDialog: Abriendo diálogo para crear cliente.");
    setNewClientData({ nombre: '', telefono: '', correo: '', rfc: '' }); // Resetear formulario
    setIsCreateClientDialogOpen(true);
  };

  /**
   * Maneja la creación de un nuevo cliente.
   * Llama a `createClienteAction` y actualiza el estado local.
   * Si se crea desde el formulario de una orden, intenta preseleccionar el nuevo cliente.
   */
  const handleCreateClient = async () => {
    console.log("handleCreateClient: Intentando crear cliente con datos:", newClientData);
    if (!newClientData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre del cliente es obligatorio.", variant: "destructive" });
      return;
    }
    const result = await createClienteAction({
        nombre: newClientData.nombre!,
        telefono: newClientData.telefono,
        correo: newClientData.correo,
        rfc: newClientData.rfc,
    });

    if (result.success && result.data?.clienteId && result.data.nuevoCliente) {
      toast({ title: "Éxito", description: `Cliente "${result.data.nuevoCliente.nombre}" creado.` });
      fetchClients(); // Recargar la lista global de clientes
      setIsCreateClientDialogOpen(false);
      // Si algún formulario de orden está abierto, intentar preseleccionar este cliente
      if (isCreateOrderDialogOpen) {
        console.log("handleCreateClient: Preseleccionando nuevo cliente en formulario de NUEVA orden:", result.data.clienteId);
        setNewOrderData(prev => ({ ...prev, idCliente: result.data!.clienteId! }));
      } else if (isEditOrderDialogOpen) {
        console.log("handleCreateClient: Preseleccionando nuevo cliente en formulario de EDITAR orden:", result.data.clienteId);
        setEditOrderData(prev => ({ ...prev, idCliente: result.data!.clienteId! }));
      }
      setNewClientData({ nombre: '', telefono: '', correo: '', rfc: ''}); // Resetear formulario
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el cliente.", variant: "destructive" });
    }
  };

  /**
   * Abre el diálogo para editar un cliente.
   * Carga los datos del cliente en el formulario de edición.
   * @param {Cliente} client - El objeto cliente a editar.
   */
  const openEditClientDialog = (client: Cliente) => {
    console.log("openEditClientDialog: Abriendo diálogo para editar cliente:", client._id);
    setCurrentClientToEdit(client);
    setEditClientData({ // Pre-llenar el formulario de edición
      nombre: client.nombre,
      telefono: client.telefono,
      correo: client.correo,
      rfc: client.rfc,
    });
    setIsEditClientDialogOpen(true);
  };

  /**
   * Maneja la actualización de un cliente existente.
   * Llama a `updateClienteAction`.
   */
  const handleUpdateClient = async () => {
    if (!currentClientToEdit || !currentClientToEdit._id) {
      toast({ title: "Error", description: "No hay cliente seleccionado para actualizar.", variant: "destructive" });
      return;
    }
    if (!editClientData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre del cliente es obligatorio.", variant: "destructive" });
      return;
    }
    console.log("handleUpdateClient: Actualizando cliente ID:", currentClientToEdit._id, "con datos:", editClientData);
    const result = await updateClienteAction(currentClientToEdit._id, {
      nombre: editClientData.nombre!,
      telefono: editClientData.telefono,
      correo: editClientData.correo,
      rfc: editClientData.rfc,
    });

    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Cliente actualizado." });
      fetchClients(); // Recargar la lista de clientes
      setIsEditClientDialogOpen(false);
      setCurrentClientToEdit(null);
    } else {
      toast({ title: "Error al Actualizar", description: result.error || "No se pudo actualizar el cliente.", variant: "destructive" });
    }
  };

  /**
   * Abre el diálogo de confirmación para eliminar un cliente.
   * @param {string} clientId - El _id del cliente a eliminar.
   */
  const openDeleteClientDialog = (clientId: string) => {
    console.log("openDeleteClientDialog: Abriendo diálogo para eliminar cliente ID:", clientId);
    setClientToDeleteId(clientId);
    setIsDeleteClientDialogOpen(true);
  };

  /**
   * Confirma y ejecuta la eliminación de un cliente.
   * Llama a `deleteClienteAction`.
   */
  const handleDeleteClient = async () => {
    if (!clientToDeleteId) return;
    console.log("handleDeleteClient: Eliminando cliente ID:", clientToDeleteId);
    const result = await deleteClienteAction(clientToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Cliente eliminado." });
      fetchClients(); // Recargar lista de clientes
      // Si el cliente eliminado era el seleccionado en un formulario de orden, limpiarlo
      if (isCreateOrderDialogOpen && newOrderData.idCliente === clientToDeleteId) {
        setNewOrderData(prev => ({ ...prev, idCliente: undefined }));
      }
      if (isEditOrderDialogOpen && editOrderData.idCliente === clientToDeleteId) {
        setEditOrderData(prev => ({ ...prev, idCliente: undefined }));
      }
    } else {
      toast({ title: "Error al Eliminar", description: result.error || "No se pudo eliminar el cliente.", variant: "destructive" });
    }
    setIsDeleteClientDialogOpen(false);
    setClientToDeleteId(null);
  };

  // --- FUNCIONES DE GESTIÓN DE PUESTOS (ADMINISTRACIÓN GENERAL) ---
  const handleCreatePuesto = async () => { /* ... */ };
  const openEditPuestoDialog = (puesto: Puesto) => { /* ... */ };
  const handleUpdatePuesto = async () => { /* ... */ };
  const openDeletePuestoDialog = (puestoId: string) => { /* ... */ };
  const handleDeletePuesto = async () => { /* ... */ };

  // --- FUNCIONES DE GESTIÓN DE COLORES DE VEHÍCULO (ADMINISTRACIÓN GENERAL) ---
  const handleCreateColor = async () => { /* ... */ };
  const openEditColorDialog = (color: ColorVehiculo) => { /* ... */ };
  const handleUpdateColor = async () => { /* ... */ };
  const openDeleteColorDialog = (colorId: string) => { /* ... */ };
  const handleDeleteColor = async () => { /* ... */ };

  // --- Funciones Auxiliares de Formateo ---
  const formatDate = (dateInput?: Date | string | number, format: 'dd/MM/yyyy' | 'YYYY-MM-DD' = 'dd/MM/yyyy'): string => { /* ... */ };
  const formatDateTime = (dateInput?: Date | string | number): string => { /* ... */ };
  const getProcesoVariant = (proceso?: Order['proceso']): "default" | "secondary" | "outline" | "destructive" => { /* ... */ };

  // --- Opciones para Selects ---
  const procesoOptions: { value: Order['proceso']; label: string }[] = [ /* ... */ ];
  const userRoleOptions = Object.values(UserRole).map(role => ({ value: role, label: role.charAt(0).toUpperCase() + role.slice(1) }));
  const aseguradoTerceroOptions: {value: string; label: string}[] = [
    { value: 'true', label: 'Asegurado' },
    { value: 'false', label: 'Tercero' },
  ];

  /**
   * Renderiza un campo de formulario genérico (Label + Input/Select/Textarea/Checkbox).
   * @param {string} label - Texto de la etiqueta del campo.
   * @param {any} name - Nombre del campo (usado como key en el estado del formulario).
   * @param {string} [type="text"] - Tipo de input HTML.
   * @param {string} [placeholder] - Placeholder para el campo.
   * @param {'newOrder' | 'editOrder' | 'newMarca' | 'editMarca' | 'newModelo' | 'editModelo' | 'newAseguradora' | 'editAseguradora' | 'newAjustador' | 'editAjustador' | 'newEmpleado' | 'editEmpleado' | 'newClient' | 'editClient' | 'newPuesto' | 'editPuesto' | 'newColor' | 'editColor'} formType - Identificador del tipo de formulario.
   * @param {{ value: string | number; label: string }[]} [options] - Opciones para campos tipo 'select'.
   * @param {boolean} [isTextarea=false] - Si es true, renderiza un Textarea.
   * @param {boolean} [isDisabled=false] - Si es true, deshabilita el campo.
   * @param {boolean} [isRequired=false] - Si es true, añade un asterisco a la etiqueta.
   * @param {string} [classNameGrid] - Clases CSS adicionales para el div contenedor.
   * @returns {JSX.Element} El campo de formulario renderizado.
   */
  const renderDialogField = (
      label: string, name: any, type: string = "text", placeholder?: string,
      formType: 'newOrder' | 'editOrder' | 'newMarca' | 'editMarca' | 'newModelo' | 'editModelo' | 'newAseguradora' | 'editAseguradora' | 'newAjustador' | 'editAjustador' | 'newEmpleado' | 'editEmpleado' | 'newClient' | 'editClient'| 'newPuesto' | 'editPuesto' | 'newColor' | 'editColor' = 'newOrder',
      options?: { value: string | number; label: string }[],
      isTextarea?: boolean, isDisabled?: boolean, isRequired?: boolean,
      classNameGrid?: string
    ): JSX.Element => {
    // Determinar el estado y los manejadores de cambio según el formType
    let value: any;
    let handleChange: any;
    let handleSelect: any;
    let handleCheckbox: any;

    switch (formType) {
      case 'newOrder': value = newOrderData[name as keyof OrderFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => handleOrderInputChange(e, 'new'); handleSelect = (val: string | undefined) => handleOrderSelectChange(name as keyof OrderFormDataType, val, 'new'); handleCheckbox = (checked: boolean) => handleOrderCheckboxChange(name as keyof OrderFormDataType, checked, 'new'); break;
      case 'editOrder': value = editOrderData[name as keyof OrderFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => handleOrderInputChange(e, 'edit'); handleSelect = (val: string | undefined) => handleOrderSelectChange(name as keyof OrderFormDataType, val, 'edit'); handleCheckbox = (checked: boolean) => handleOrderCheckboxChange(name as keyof OrderFormDataType, checked, 'edit'); break;
      case 'newMarca': value = newMarcaData[name as keyof MarcaFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewMarcaData); break;
      case 'editMarca': value = editMarcaData[name as keyof MarcaFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditMarcaData); break;
      case 'newModelo': value = newModeloData[name as keyof Omit<ModeloVehiculo, 'idModelo'>]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewModeloData); break;
      case 'editModelo': value = editModeloData[name as keyof Partial<ModeloVehiculo>]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditModeloData); break;
      case 'newAseguradora': value = newAseguradoraData[name as keyof AseguradoraFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewAseguradoraData); break;
      case 'editAseguradora': value = editAseguradoraData[name as keyof AseguradoraFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditAseguradoraData); break;
      case 'newAjustador': value = newAjustadorData[name as keyof Omit<Ajustador, 'idAjustador'>]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewAjustadorData); break;
      case 'editAjustador': value = editAjustadorData[name as keyof Partial<Ajustador>]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditAjustadorData); break;
      case 'newEmpleado':
        value = newEmpleadoData[name as keyof EmpleadoFormDataType];
        handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewEmpleadoData);
        handleSelect = (val: string | undefined) => handleSelectChangeGeneric(name, val, setNewEmpleadoData);
        handleCheckbox = (checked: boolean) => handleCheckboxChangeGeneric(name, checked, setNewEmpleadoData);
        if (name === 'puesto') options = puestosList.map(p => ({ value: p.nombre, label: p.nombre }));
        if (name === 'systemUserRol') options = userRoleOptions;
        break;
      case 'editEmpleado':
        value = editEmpleadoData[name as keyof EditEmpleadoFormDataType];
        handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditEmpleadoData);
        handleSelect = (val: string | undefined) => handleSelectChangeGeneric(name, val, setEditEmpleadoData);
        handleCheckbox = (checked: boolean) => handleCheckboxChangeGeneric(name, checked, setEditEmpleadoData);
        if (name === 'puesto') options = puestosList.map(p => ({ value: p.nombre, label: p.nombre }));
        if (name === 'systemUserRol') options = userRoleOptions;
        break;
      case 'newClient': value = newClientData[name as keyof ClienteFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewClientData); break;
      case 'editClient': value = editClientData[name as keyof ClienteFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditClientData); break;
      case 'newPuesto': value = newPuestoData[name as keyof PuestoFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewPuestoData); break;
      case 'editPuesto': value = editPuestoData[name as keyof PuestoFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditPuestoData); break;
      case 'newColor': value = newColorData[name as keyof ColorVehiculoFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewColorData); break;
      case 'editColor': value = editColorData[name as keyof ColorVehiculoFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditColorData); break;
      default: value = ''; handleChange = () => {}; handleSelect = () => {}; handleCheckbox = () => {};
    }

    const fieldId = `${formType}_${String(name)}`;

    if (((formType === 'newEmpleado' || formType === 'editEmpleado') && name === 'puesto') ||
        ((formType === 'newOrder' || formType === 'editOrder') && name === 'color')
       ) {
      let currentOptions = options;
      let isLoadingSource = false;

      if (name === 'puesto') {
        currentOptions = puestosList.map(p => ({ value: p.nombre, label: p.nombre }));
        isLoadingSource = isLoadingPuestos;
      }
      if (name === 'color') {
        currentOptions = coloresList.map(c => ({ value: c.nombre, label: c.nombre }));
        isLoadingSource = isLoadingColores;
      }

      return (
        <div className={`space-y-1 ${classNameGrid || ''}`}>
          <Label htmlFor={fieldId} className="text-sm font-medium">{label}{isRequired && <span className="text-destructive">*</span>}</Label>
          <Select name={String(name)} onValueChange={handleSelect} value={value || undefined} disabled={isDisabled}>
            <SelectTrigger id={fieldId} className="w-full mt-1"><SelectValue placeholder={placeholder || `Seleccionar ${label.toLowerCase()}...`} /></SelectTrigger>
            <SelectContent>
              {isLoadingSource ? <SelectItem value="loading" disabled>Cargando opciones...</SelectItem> :
               (currentOptions && currentOptions.length > 0 ? currentOptions.map(opt => <SelectItem key={String(opt.value)} value={String(opt.value)}>{opt.label}</SelectItem>) :
               <SelectItem value="no_options" disabled>No hay opciones configuradas</SelectItem>)
              }
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div className={`space-y-1 ${classNameGrid || ''}`}>
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {label}{isRequired && <span className="text-destructive">*</span>}
        </Label>
        {isTextarea ? (
          <Textarea id={fieldId} name={String(name)} placeholder={placeholder} value={value || ''} onChange={handleChange} disabled={isDisabled} className="mt-1 w-full" />
        ) : type === 'select' ? (
          <Select name={String(name)} onValueChange={handleSelect} value={value || undefined} disabled={isDisabled}>
            <SelectTrigger id={fieldId} className="w-full mt-1"><SelectValue placeholder={placeholder || `Seleccionar ${label.toLowerCase()}...`} /></SelectTrigger>
            <SelectContent>
              {options && options.length > 0 ? options.map(opt => (<SelectItem key={String(opt.value)} value={String(opt.value)}>{opt.label}</SelectItem>)) : <SelectItem value="no_options_available" disabled>No hay opciones disponibles</SelectItem>}
            </SelectContent>
          </Select>
        ) : type === 'checkbox' ? (
          <div className="flex items-center space-x-2 mt-1 pt-1">
             <Checkbox id={fieldId} name={String(name)} checked={!!value} onCheckedChange={(checkedState) => handleCheckbox(typeof checkedState === 'boolean' ? checkedState : false)} disabled={isDisabled} />
             <Label htmlFor={fieldId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</Label>
          </div>
        ) : (
          <Input id={fieldId} name={String(name)} type={type} placeholder={placeholder} value={value === undefined || value === null ? '' : String(value)} onChange={handleChange} disabled={isDisabled} className="mt-1 w-full" min={type === 'number' ? '0' : undefined} />
        )}
      </div>
    );
  };

  if (!userName || !userRole || !userIdEmpleado) {
    console.log("DashboardPage: userName, userRole, o userIdEmpleado faltan. Mostrando 'Cargando...'");
    return <div className="flex h-screen items-center justify-center">Cargando dashboard...</div>;
  }

  const mainTabsListClassName = userRole === UserRole.ADMIN ?
    "grid w-full grid-cols-2 sm:grid-cols-4 mb-6 rounded-lg p-1 bg-muted" :
    "grid w-full grid-cols-1 sm:grid-cols-3 mb-6 rounded-lg p-1 bg-muted";


  return (
    <div className="flex min-h-screen flex-col bg-muted/30 dark:bg-muted/10">
      {/* Encabezado del Dashboard */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 shadow-sm">
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">
            Taller Automotriz - <span className="text-primary">{userName} ({userRole})</span>
          </h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      {/* Contenido Principal del Dashboard con Pestañas */}
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <Tabs defaultValue="ordenes" className="w-full">
          {/* Lista de Pestañas Principales */}
          <TabsList className={mainTabsListClassName}>
            <TabsTrigger value="citas" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><CalendarDays className="mr-2 h-4 w-4" />Citas</TabsTrigger>
            <TabsTrigger value="ordenes" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Wrench className="mr-2 h-4 w-4" />Órdenes</TabsTrigger>
            <TabsTrigger value="almacen" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Package className="mr-2 h-4 w-4" />Almacén</TabsTrigger>
            {userRole === UserRole.ADMIN && (
              <TabsTrigger value="admin" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Settings className="mr-2 h-4 w-4" />Admin</TabsTrigger>
            )}
          </TabsList>

          {/* Contenido de la Pestaña Citas */}
          <TabsContent value="citas">{/* ... */}</TabsContent>

          {/* Contenido de la Pestaña Órdenes */}
          <TabsContent value="ordenes">{/* ... */}</TabsContent>

          {/* Contenido de la Pestaña Almacén */}
          <TabsContent value="almacen">{/* ... */}</TabsContent>

          {/* Contenido de la Pestaña Admin (condicional si userRole es ADMIN) */}
          {userRole === UserRole.ADMIN && (
            <TabsContent value="admin">
              <Tabs defaultValue="empleados" className="w-full">
                {/* Sub-pestañas dentro de Admin */}
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-5 mb-4 rounded-md p-1 bg-muted/70">
                  <TabsTrigger value="general" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Settings className="mr-2 h-4 w-4" />Config. General</TabsTrigger>
                  <TabsTrigger value="clientes" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><UserCircle className="mr-2 h-4 w-4" />Clientes</TabsTrigger>
                  <TabsTrigger value="marcas" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Car className="mr-2 h-4 w-4" />Marcas/Modelos</TabsTrigger>
                  <TabsTrigger value="aseguradoras" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Shield className="mr-2 h-4 w-4"/>Aseguradoras</TabsTrigger>
                  <TabsTrigger value="empleados" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Users className="mr-2 h-4 w-4"/>Empleados</TabsTrigger>
                </TabsList>

                {/* Contenido de Admin -> Config. General */}
                <TabsContent value="general">{/* ... */}</TabsContent>

                {/* Contenido de Admin -> Clientes */}
                <TabsContent value="clientes">
                  <Card className="shadow-lg border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <div>
                        <CardTitle className="text-xl">Gestión de Clientes</CardTitle>
                        <CardDescription>Administra los clientes del taller.</CardDescription>
                      </div>
                      <Button size="sm" onClick={openCreateClientDialog}><PlusCircle className="mr-2 h-4 w-4"/>Nuevo Cliente</Button>
                    </CardHeader>
                    <CardContent>
                      {isLoadingClients ? <p>Cargando clientes...</p> : clients.length === 0 ? (
                        <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50">
                          <p className="text-muted-foreground">No hay clientes registrados.</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]">ID Cliente</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Teléfono</TableHead>
                              <TableHead>Correo</TableHead>
                              <TableHead>RFC</TableHead>
                              <TableHead className="text-right w-[100px]">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {clients.map((client) => (
                              <TableRow key={client._id}>
                                <TableCell className="font-mono text-xs truncate max-w-[100px]" title={client._id}>{client._id.slice(-6)}</TableCell>
                                <TableCell className="font-medium">{client.nombre}</TableCell>
                                <TableCell>{client.telefono || 'N/A'}</TableCell>
                                <TableCell>{client.correo || 'N/A'}</TableCell>
                                <TableCell>{client.rfc || 'N/A'}</TableCell>
                                <TableCell className="text-right space-x-1">
                                  <Button variant="ghost" size="icon" onClick={() => openEditClientDialog(client)} title="Editar Cliente"><Edit className="h-4 w-4"/></Button>
                                  <Button variant="ghost" size="icon" onClick={() => openDeleteClientDialog(client._id)} title="Eliminar Cliente"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Contenido de Admin -> Marcas/Modelos */}
                <TabsContent value="marcas">{/* ... */}</TabsContent>

                {/* Contenido de Admin -> Aseguradoras */}
                <TabsContent value="aseguradoras">{/* ... */}</TabsContent>

                {/* Contenido de Admin -> Empleados */}
                <TabsContent value="empleados">{/* ... */}</TabsContent>
              </Tabs>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* --- DIÁLOGOS ÓRDENES DE SERVICIO --- */}
      {/* ... (Diálogos de órdenes existentes) ... */}

      {/* --- DIÁLOGOS MARCAS Y MODELOS --- */}
      {/* ... (Diálogos de marcas y modelos existentes) ... */}

      {/* --- DIÁLOGOS ASEGURADORAS Y AJUSTADORES --- */}
      {/* ... (Diálogos de aseguradoras y ajustadores existentes) ... */}

      {/* --- DIÁLOGOS EMPLEADOS --- */}
      {/* ... (Diálogos de empleados existentes) ... */}

      {/* --- DIÁLOGOS CLIENTES (CREACIÓN RÁPIDA DESDE ÓRDENES Y GESTIÓN ADMIN) --- */}
      {/* Diálogo para Crear Nuevo Cliente (reutilizado) */}
      <Dialog open={isCreateClientDialogOpen} onOpenChange={(open) => { setIsCreateClientDialogOpen(open); if(!open) setNewClientData({ nombre: '', telefono: '', correo: '', rfc: '' }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nuevo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre Completo", "nombre", "text", "Nombre del cliente", "newClient", undefined, false, false, true)}
            {renderDialogField("Teléfono", "telefono", "text", "Teléfono de contacto", "newClient")}
            {renderDialogField("Correo Electrónico", "correo", "email", "ejemplo@correo.com", "newClient")}
            {renderDialogField("RFC (Opcional)", "rfc", "text", "XAXX010101000", "newClient")}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateClient}>Guardar Cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Editar Cliente */}
      <Dialog open={isEditClientDialogOpen} onOpenChange={(open) => { setIsEditClientDialogOpen(open); if (!open) setCurrentClientToEdit(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Cliente: {currentClientToEdit?.nombre}</DialogTitle></DialogHeader>
          {currentClientToEdit && (
            <div className="space-y-4 py-4">
              {renderDialogField("Nombre Completo", "nombre", "text", currentClientToEdit.nombre, "editClient", undefined, false, false, true)}
              {renderDialogField("Teléfono", "telefono", "text", currentClientToEdit.telefono, "editClient")}
              {renderDialogField("Correo Electrónico", "correo", "email", currentClientToEdit.correo, "editClient")}
              {renderDialogField("RFC (Opcional)", "rfc", "text", currentClientToEdit.rfc, "editClient")}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateClient}>Actualizar Cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Confirmar Eliminación de Cliente */}
      <Dialog open={isDeleteClientDialogOpen} onOpenChange={setIsDeleteClientDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar al cliente "{clients.find(c => c._id === clientToDeleteId)?.nombre}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteClient}>Eliminar Cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIÁLOGOS PARA GESTIÓN DE PUESTOS --- */}
      {/* ... (Diálogos de puestos existentes) ... */}

       {/* --- DIÁLOGOS PARA GESTIÓN DE COLORES DE VEHÍCULO --- */}
      {/* ... (Diálogos de colores existentes) ... */}

    </div>
  );
}
