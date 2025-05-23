
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LogOut, CalendarDays, Wrench, Package, PlusCircle, Edit, Trash2, EyeIcon, Car, Shield, Users, Settings, Building, UserX, AlertTriangle, UserPlus, Briefcase, Trash, Activity, ListChecks, Palette, ChevronsUpDown, Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils"; // Asegurar que cn esté importado

// Importación de tipos de datos.
import type {
  UserRole as UserRoleType, // Tipo para UserRole
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

// Acciones del servidor para Órdenes de Servicio.
import {
  getAllOrdersAction,
  createOrderAction,
  updateOrderAction,
  deleteOrderAction,
  getOrderByIdAction,
  getAjustadoresByAseguradora,
} from './service-orders/actions';

// Acciones del servidor para Marcas.
import {
  getAllMarcasAction,
  createMarcaAction,
  updateMarcaAction,
  deleteMarcaAction,
  addModeloToMarcaAction,
  updateModeloInMarcaAction,
  removeModeloFromMarcaAction,
  getMarcaByIdAction as getMarcaForModelosAction, 
  getModelosByMarcaAction, 
} from './admin/marcas/actions';

// Acciones del servidor para Aseguradoras.
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

// Acciones del servidor para Clientes.
import { getAllClientsAction, createClienteAction } from './admin/clients/actions';

// Acciones del servidor para Empleados.
import {
  getAllEmpleadosAction,
  createEmpleadoAction,
  getEmpleadoByIdAction as getEmpleadoForEditAction,
  updateEmpleadoAction,
  deleteEmpleadoAction,
  removeSystemUserFromEmpleadoAction,
  getEmpleadosByRolAction, 
  getEmpleadosByPuestoAction, 
} from './admin/empleados/actions';

// Acciones del servidor para Puestos.
import {
  getAllPuestosAction,
  createPuestoAction,
  updatePuestoAction,
  deletePuestoAction,
} from './admin/puestos/actions';

// Acciones del servidor para Colores de Vehículo.
import {
  getAllColoresVehiculoAction,
  createColorVehiculoAction,
  updateColorVehiculoAction,
  deleteColorVehiculoAction,
} from './admin/colores/actions';


/**
 * Tipo de datos para el formulario de creación/edición de Órdenes de Servicio.
 * Los campos de ID (ej. idCliente, idMarca) serán strings (ObjectIds).
 * Los campos numéricos como `año` y `deducible` pueden ser strings en el formulario y se convierten.
 * `aseguradoTerceroString` se usa para el Select y se convierte a boolean.
 */
type OrderFormDataType = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'Log' | 'presupuestos' | 'aseguradoTercero'>> & {
  año?: string; // Para input type="number" que devuelve string
  deducible?: string; // Para input type="number" que devuelve string
  aseguradoTerceroString?: 'true' | 'false' | string; // Para el Select 'Asegurado' / 'Tercero'
  // Las fechas se manejan como strings en el formato YYYY-MM-DD para los inputs de fecha
  fechaValuacion?: string;
  fechaReingreso?: string;
  fechaEntrega?: string;
  fechaPromesa?: string;
  fechaBaja?: string;
};


/** Tipo de datos para el formulario de creación/edición de Marcas de Vehículos. */
type MarcaFormDataType = Partial<Omit<MarcaVehiculo, '_id' | 'modelos'>>;
/** Tipo de datos para el formulario de creación/edición de Modelos. El idModelo_to_edit es para identificar cual se edita. */
type ModeloFormDataType = Partial<Omit<ModeloVehiculo, 'idModelo'>> & { idModelo_to_edit?: string };


/** Tipo de datos para el formulario de creación/edición de Aseguradoras. */
type AseguradoraFormDataType = Partial<Omit<Aseguradora, '_id' | 'ajustadores'>>;
/** Tipo de datos para el formulario de creación/edición de Ajustadores. El idAjustador_to_edit es para identificar cual se edita. */
type AjustadorFormDataType = Partial<Omit<Ajustador, 'idAjustador'>> & { idAjustador_to_edit?: string };

/**
 * Tipo de datos para el formulario de creación de Empleados.
 * Incluye campos para los datos básicos del empleado y, opcionalmente, para crear sus credenciales de sistema.
 */
type EmpleadoFormDataType = Omit<Empleado, '_id' | 'fechaRegistro' | 'user' | 'sueldo' | 'comision'> & {
  sueldo?: string; // Sueldo como string para el input, se convertirá a número
  comision?: string; // Comisión como string para el input, se convertirá a número
  createSystemUser?: boolean; // Checkbox para decidir si se crea acceso al sistema
  systemUserUsuario?: string; // Nombre de usuario para el sistema
  systemUserContraseña?: string; // Contraseña para el sistema
  systemUserConfirmContraseña?: string; // Confirmación de contraseña
  systemUserRol?: UserRoleType; // Rol del usuario en el sistema
};

/**
 * Tipo de datos para el formulario de edición de Empleados.
 * Similar a EmpleadoFormDataType pero todos los campos son opcionales.
 */
type EditEmpleadoFormDataType = Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user' | 'sueldo' | 'comision'>> & {
  sueldo?: string;
  comision?: string;
  createSystemUser?: boolean; // Para permitir crear acceso si no lo tiene, o indicar que se quieren modificar datos de user
  systemUserUsuario?: string;
  systemUserRol?: UserRoleType;
  newSystemUserContraseña?: string; // Para cambiar la contraseña
  newSystemUserConfirmContraseña?: string;
};

/** Tipo de datos para el formulario de creación de Clientes (desde el diálogo rápido). */
type ClienteFormDataType = Partial<NewClienteData>;

/** Tipo de datos para el formulario de creación/edición de Puestos. */
type PuestoFormDataType = Partial<NewPuestoData>;

/** Tipo de datos para el formulario de creación/edición de Colores de Vehículo. */
type ColorVehiculoFormDataType = Partial<NewColorVehiculoData>;


/**
 * Componente principal de la página del Dashboard.
 * Gestiona estados, carga de datos y diálogos para Citas, Órdenes, Almacén y Administración.
 */
export default function DashboardPage() {
  console.log("DashboardPage: Renderizando componente...");
  const router = useRouter();
  const { toast } = useToast();

  // --- Estados de Sesión y Usuario ---
  /** Nombre de usuario logueado. */
  const [userName, setUserName] = useState<string | null>(null);
  /** _id (string ObjectId) del empleado logueado. */
  const [userIdEmpleado, setUserIdEmpleado] = useState<string | null>(null);
  /** Rol del usuario logueado. */
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
  /** Lista de ajustadores disponibles para la aseguradora seleccionada en el formulario de orden. */
  const [availableAjustadoresForOrder, setAvailableAjustadoresForOrder] = useState<Pick<Ajustador, 'idAjustador' | 'nombre'>[]>([]);
  /** Lista de modelos disponibles para la marca seleccionada en el formulario de orden. */
  const [availableModelosForOrder, setAvailableModelosForOrder] = useState<Pick<ModeloVehiculo, 'idModelo' | 'modelo'>[]>([]);

  /** Datos iniciales para el formulario de creación de una nueva orden. */
  const initialNewOrderData: OrderFormDataType = {
    proceso: 'pendiente', piso: false, grua: false, aseguradoTerceroString: 'true', // 'true' para Asegurado
  };
  const [newOrderData, setNewOrderData] = useState<OrderFormDataType>(initialNewOrderData);
  const [editOrderData, setEditOrderData] = useState<OrderFormDataType>({});
  /** Controla si el combobox de cliente está abierto en el formulario de NUEVA orden. */
  const [isNewOrderClientComboboxOpen, setIsNewOrderClientComboboxOpen] = useState(false);
  /** Controla si el combobox de cliente está abierto en el formulario de EDITAR orden. */
  const [isEditOrderClientComboboxOpen, setIsEditOrderClientComboboxOpen] = useState(false);

  // --- Estados para poblar Selects en formularios de Órdenes y Empleados ---
  const [clients, setClients] = useState<Cliente[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [asesores, setAsesores] = useState<{ _id: string; nombre: string }[]>([]);
  const [isLoadingAsesores, setIsLoadingAsesores] = useState(true);
  const [valuadores, setValuadores] = useState<{ _id: string; nombre: string }[]>([]);
  const [isLoadingValuadores, setIsLoadingValuadores] = useState(true);
  const [hojalateros, setHojalateros] = useState<{ _id: string; nombre: string }[]>([]);
  const [isLoadingHojalateros, setIsLoadingHojalateros] = useState(true);
  const [pintores, setPintores] = useState<{ _id: string; nombre: string }[]>([]);
  const [isLoadingPintores, setIsLoadingPintores] = useState(true);

  // --- Estados para Administración: Marcas y Modelos ---
  const [marcas, setMarcas] = useState<MarcaVehiculo[]>([]);
  const [isLoadingMarcas, setIsLoadingMarcas] = useState(true);
  const [isCreateMarcaDialogOpen, setIsCreateMarcaDialogOpen] = useState(false);
  const [isEditMarcaDialogOpen, setIsEditMarcaDialogOpen] = useState(false);
  const [isDeleteMarcaDialogOpen, setIsDeleteMarcaDialogOpen] = useState(false);
  /** Marca actual seleccionada para editar o para gestionar sus modelos. */
  const [currentMarca, setCurrentMarca] = useState<MarcaVehiculo | null>(null);
  /** _id (string) de la marca a eliminar. */
  const [marcaToDeleteId, setMarcaToDeleteId] = useState<string | null>(null);
  const [newMarcaData, setNewMarcaData] = useState<MarcaFormDataType>({ marca: '' });
  const [editMarcaData, setEditMarcaData] = useState<MarcaFormDataType>({});
  /** Controla el diálogo para gestionar modelos de una marca específica. */
  const [isManageModelosDialogOpen, setIsManageModelosDialogOpen] = useState(false);
  const [isCreateModeloDialogOpen, setIsCreateModeloDialogOpen] = useState(false);
  const [isEditModeloDialogOpen, setIsEditModeloDialogOpen] = useState(false);
  /** Modelo actual seleccionado para editar. */
  const [currentModelo, setCurrentModelo] = useState<ModeloVehiculo | null>(null);
  const [newModeloData, setNewModeloData] = useState<Omit<ModeloVehiculo, 'idModelo'>>({ modelo: '' });
  const [editModeloData, setEditModeloData] = useState<Partial<ModeloVehiculo>>({});

  // --- Estados para Administración: Aseguradoras y Ajustadores ---
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  const [isLoadingAseguradoras, setIsLoadingAseguradoras] = useState(true);
  const [isCreateAseguradoraDialogOpen, setIsCreateAseguradoraDialogOpen] = useState(false);
  const [isEditAseguradoraDialogOpen, setIsEditAseguradoraDialogOpen] = useState(false);
  const [isDeleteAseguradoraDialogOpen, setIsDeleteAseguradoraDialogOpen] = useState(false);
  /** Aseguradora actual seleccionada para editar o para gestionar sus ajustadores. */
  const [currentAseguradora, setCurrentAseguradora] = useState<Aseguradora | null>(null);
  /** _id (string) de la aseguradora a eliminar. */
  const [aseguradoraToDeleteId, setAseguradoraToDeleteId] = useState<string | null>(null);
  const [newAseguradoraData, setNewAseguradoraData] = useState<AseguradoraFormDataType>({ nombre: '', telefono: '' });
  const [editAseguradoraData, setEditAseguradoraData] = useState<AseguradoraFormDataType>({});
  /** Controla el diálogo para gestionar ajustadores de una aseguradora específica. */
  const [isManageAjustadoresDialogOpen, setIsManageAjustadoresDialogOpen] = useState(false);
  const [isCreateAjustadorDialogOpen, setIsCreateAjustadorDialogOpen] = useState(false);
  const [isEditAjustadorDialogOpen, setIsEditAjustadorDialogOpen] = useState(false);
  /** Ajustador actual seleccionado para editar. */
  const [currentAjustador, setCurrentAjustador] = useState<Ajustador | null>(null);
  const [newAjustadorData, setNewAjustadorData] = useState<Omit<Ajustador, 'idAjustador'>>({ nombre: '', telefono: '', correo: '' });
  const [editAjustadorData, setEditAjustadorData] = useState<Partial<Ajustador>>({});

  // --- Estados para Administración: Empleados ---
  const [empleadosList, setEmpleadosList] = useState<Empleado[]>([]);
  const [isLoadingEmpleadosList, setIsLoadingEmpleadosList] = useState(true);
  const [isCreateEmpleadoDialogOpen, setIsCreateEmpleadoDialogOpen] = useState(false);
  const [isEditEmpleadoDialogOpen, setIsEditEmpleadoDialogOpen] = useState(false);
  const [isDeleteEmpleadoDialogOpen, setIsDeleteEmpleadoDialogOpen] = useState(false);
  /** Empleado actual seleccionado para editar. */
  const [currentEmpleadoToEdit, setCurrentEmpleadoToEdit] = useState<Empleado | null>(null);
  /** Datos iniciales para el formulario de creación de un nuevo empleado. */
  const initialNewEmpleadoData: EmpleadoFormDataType = {
    nombre: '', puesto: '', createSystemUser: false, systemUserUsuario: '', systemUserContraseña: '', systemUserConfirmContraseña: '', systemUserRol: UserRole.ASESOR, // Rol por defecto
  };
  const [newEmpleadoData, setNewEmpleadoData] = useState<EmpleadoFormDataType>(initialNewEmpleadoData);
  const [editEmpleadoData, setEditEmpleadoData] = useState<EditEmpleadoFormDataType>({
    nombre: '', puesto: '',
  });
  /** _id (string) del empleado a eliminar. */
  const [empleadoToDeleteId, setEmpleadoToDeleteId] = useState<string | null>(null);

  // --- Estados para Administración: Clientes (para diálogo de creación rápida desde Órdenes) ---
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false);
  const [newClientData, setNewClientData] = useState<ClienteFormDataType>({ nombre: '', telefono: '', correo: ''});

  // --- ESTADOS PARA CONFIGURACIÓN GENERAL (Admin): PUESTOS ---
  const [puestosList, setPuestosList] = useState<Puesto[]>([]);
  const [isLoadingPuestos, setIsLoadingPuestos] = useState(true);
  const [isCreatePuestoDialogOpen, setIsCreatePuestoDialogOpen] = useState(false);
  const [newPuestoData, setNewPuestoData] = useState<PuestoFormDataType>({ nombre: '' });
  const [isEditPuestoDialogOpen, setIsEditPuestoDialogOpen] = useState(false);
  /** Puesto actual seleccionado para editar. */
  const [currentPuestoToEdit, setCurrentPuestoToEdit] = useState<Puesto | null>(null);
  const [editPuestoData, setEditPuestoData] = useState<PuestoFormDataType>({});
  const [isDeletePuestoDialogOpen, setIsDeletePuestoDialogOpen] = useState(false);
  /** _id (string) del puesto a eliminar. */
  const [puestoToDeleteId, setPuestoToDeleteId] = useState<string | null>(null);

  // --- ESTADOS PARA CONFIGURACIÓN GENERAL (Admin): COLORES DE VEHÍCULO ---
  const [coloresList, setColoresList] = useState<ColorVehiculo[]>([]);
  const [isLoadingColores, setIsLoadingColores] = useState(true);
  const [isCreateColorDialogOpen, setIsCreateColorDialogOpen] = useState(false);
  const [newColorData, setNewColorData] = useState<ColorVehiculoFormDataType>({ nombre: '' });
  const [isEditColorDialogOpen, setIsEditColorDialogOpen] = useState(false);
  /** Color actual seleccionado para editar. */
  const [currentColorToEdit, setCurrentColorToEdit] = useState<ColorVehiculo | null>(null);
  const [editColorData, setEditColorData] = useState<ColorVehiculoFormDataType>({});
  const [isDeleteColorDialogOpen, setIsDeleteColorDialogOpen] = useState(false);
  /** _id (string) del color a eliminar. */
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
    const storedEmpleadoId = localStorage.getItem('empleadoId'); // Ya debería ser string
    const storedUserRole = localStorage.getItem('userRole') as UserRoleType | null;

    console.log("Dashboard useEffect: Valores RAW de localStorage:", {
      loggedIn, storedUserName, storedEmpleadoId, storedUserRole
    });
    
    // Validación más estricta de los datos de sesión
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
      setUserIdEmpleado(storedEmpleadoId); // Ya es string
      setUserRole(storedUserRole);
      fetchInitialData(storedUserRole, storedEmpleadoId); // Pasar el ID del empleado
    } else {
      console.log("Dashboard useEffect: Sesión inválida o datos faltantes. Redirigiendo a /. Detalles:",
        { loggedIn, storedUserName, storedEmpleadoId, storedUserRole }
      );
      if (typeof window !== 'undefined') { // Asegurar que se ejecuta solo en el cliente
        router.replace('/');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // router es una dependencia estable.


  /**
   * Función de callback para cargar todos los datos iniciales necesarios para el dashboard.
   * Se llama después de que la sesión del usuario ha sido verificada y es válida.
   * @param {UserRoleType | null} role - Rol del usuario actual.
   * @param {string | null} currentUserIdEmpleado - _id (string ObjectId) del empleado logueado.
   */
  const fetchInitialData = useCallback(async (role: UserRoleType | null, currentUserIdEmpleado: string | null) => {
    console.log("fetchInitialData: Iniciando carga de datos...", { role, currentUserIdEmpleado });
     // Pre-llenar el idAsesor en el formulario de nueva orden si el usuario es Asesor
     setNewOrderData(prev => ({
      ...initialNewOrderData, // Mantener otros valores iniciales
      idAsesor: role === UserRole.ASESOR && currentUserIdEmpleado ? currentUserIdEmpleado : undefined,
    }));

    // Establecer estados de carga para todas las fuentes de datos
    setIsLoadingOrders(true); setIsLoadingMarcas(true); setIsLoadingAseguradoras(true);
    setIsLoadingClients(true); setIsLoadingAsesores(true); setIsLoadingValuadores(true);
    setIsLoadingHojalateros(true); setIsLoadingPintores(true);
    setIsLoadingEmpleadosList(true); setIsLoadingPuestos(true); setIsLoadingColores(true);

    try {
      // Cargar todos los datos en paralelo
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
  }, [toast]); // `toast` es una dependencia estable. `initialNewOrderData` también es estable si se define fuera.

  // --- Funciones de Carga de Datos Específicas (fetchers) ---
  // Cada una de estas funciones es async y maneja su propio estado de carga y errores con toasts.

  /** Carga las órdenes de servicio desde el backend. */
  const fetchOrders = async () => {
    console.log("fetchOrders: Iniciando...");
    setIsLoadingOrders(true);
    try {
      const result = await getAllOrdersAction();
      console.log("fetchOrders: Resultado:", result.data ? `${result.data.length} órdenes obtenidas` : result.error);
      if (result.success && result.data) {
        setOrders(result.data);
      } else {
        toast({ title: "Error al Cargar Órdenes", description: result.error || "No se pudieron cargar las órdenes de servicio.", variant: "destructive" });
        setOrders([]); // Limpiar en caso de error
      }
    } catch (error) {
      console.error("fetchOrders: Error crítico:", error);
      toast({ title: "Error Crítico de Órdenes", description: "Fallo al obtener órdenes de servicio.", variant: "destructive" });
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  /** Carga las marcas de vehículos desde el backend. */
  const fetchMarcas = async () => {
    console.log("fetchMarcas: Iniciando...");
    setIsLoadingMarcas(true);
    try {
      const result = await getAllMarcasAction();
      console.log("fetchMarcas: Resultado:", result.data ? `${result.data.length} marcas obtenidas` : result.error);
      if (result.success && result.data) {
        setMarcas(result.data);
      } else {
        toast({ title: "Error al Cargar Marcas", description: result.error || "No se pudieron cargar las marcas de vehículos.", variant: "destructive" });
        setMarcas([]);
      }
    } catch (error) {
      console.error("fetchMarcas: Error crítico:", error);
      toast({ title: "Error Crítico de Marcas", description: "Fallo al obtener marcas de vehículos.", variant: "destructive" });
      setMarcas([]);
    } finally {
      setIsLoadingMarcas(false);
    }
  };

  /** Carga las aseguradoras desde el backend. */
  const fetchAseguradoras = async () => {
    console.log("fetchAseguradoras: Iniciando...");
    setIsLoadingAseguradoras(true);
    try {
      const result = await getAllAseguradorasAction();
      console.log("fetchAseguradoras: Resultado:", result.data ? `${result.data.length} aseguradoras obtenidas` : result.error);
      if (result.success && result.data) {
        setAseguradoras(result.data);
      } else {
        toast({ title: "Error al Cargar Aseguradoras", description: result.error || "No se pudieron cargar las aseguradoras.", variant: "destructive" });
        setAseguradoras([]);
      }
    } catch (error) {
      console.error("fetchAseguradoras: Error crítico:", error);
      toast({ title: "Error Crítico de Aseguradoras", description: "Fallo al obtener aseguradoras.", variant: "destructive" });
      setAseguradoras([]);
    } finally {
      setIsLoadingAseguradoras(false);
    }
  };

  /** Carga los clientes desde el backend. */
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

  /** Carga empleados con rol ASESOR desde el backend. */
  const fetchAsesores = async () => {
    console.log("fetchAsesores: Iniciando...");
    setIsLoadingAsesores(true);
    try {
      const result = await getEmpleadosByRolAction(UserRole.ASESOR);
      console.log("fetchAsesores: Resultado:", result.data ? `${result.data.length} asesores obtenidos` : result.error);
      if (result.success && result.data) {
        setAsesores(result.data);
      } else {
        toast({ title: "Error al Cargar Asesores", description: result.error || "No se pudieron cargar los asesores.", variant: "destructive" });
        setAsesores([]);
      }
    } catch (error) {
      console.error("fetchAsesores: Error crítico:", error);
      toast({ title: "Error Crítico de Asesores", description: "Fallo al obtener asesores.", variant: "destructive" });
      setAsesores([]);
    } finally {
      setIsLoadingAsesores(false);
    }
  };

  /** Carga empleados con rol VALUADOR desde el backend. */
  const fetchValuadores = async () => {
    console.log("fetchValuadores: Iniciando...");
    setIsLoadingValuadores(true);
    try {
      const result = await getEmpleadosByRolAction(UserRole.VALUADOR);
      console.log("fetchValuadores: Resultado:", result.data ? `${result.data.length} valuadores obtenidos` : result.error);
      if (result.success && result.data) {
        setValuadores(result.data);
      } else {
        toast({ title: "Error al Cargar Valuadores", description: result.error || "No se pudieron cargar los valuadores.", variant: "destructive" });
        setValuadores([]);
      }
    } catch (error) {
      console.error("fetchValuadores: Error crítico:", error);
      toast({ title: "Error Crítico de Valuadores", description: "Fallo al obtener valuadores.", variant: "destructive" });
      setValuadores([]);
    } finally {
      setIsLoadingValuadores(false);
    }
  };

  /** Carga empleados con puesto HOJALATERO desde el backend. */
  const fetchHojalateros = async () => {
    console.log("fetchHojalateros: Iniciando...");
    setIsLoadingHojalateros(true);
    try {
      const result = await getEmpleadosByPuestoAction("Hojalatero"); // Asume que "Hojalatero" es un puesto válido
      console.log("fetchHojalateros: Resultado:", result.data ? `${result.data.length} hojalateros obtenidos` : result.error);
      if (result.success && result.data) {
        setHojalateros(result.data);
      } else {
        toast({ title: "Error al Cargar Hojalateros", description: result.error || "No se pudieron cargar los hojalateros.", variant: "destructive" });
        setHojalateros([]);
      }
    } catch (error) {
      console.error("fetchHojalateros: Error crítico:", error);
      toast({ title: "Error Crítico de Hojalateros", description: "Fallo al obtener hojalateros.", variant: "destructive" });
      setHojalateros([]);
    } finally {
      setIsLoadingHojalateros(false);
    }
  };

  /** Carga empleados con puesto PINTOR desde el backend. */
  const fetchPintores = async () => {
    console.log("fetchPintores: Iniciando...");
    setIsLoadingPintores(true);
    try {
      const result = await getEmpleadosByPuestoAction("Pintor"); // Asume que "Pintor" es un puesto válido
      console.log("fetchPintores: Resultado:", result.data ? `${result.data.length} pintores obtenidos` : result.error);
      if (result.success && result.data) {
        setPintores(result.data);
      } else {
        toast({ title: "Error al Cargar Pintores", description: result.error || "No se pudieron cargar los pintores.", variant: "destructive" });
        setPintores([]);
      }
    } catch (error) {
      console.error("fetchPintores: Error crítico:", error);
      toast({ title: "Error Crítico de Pintores", description: "Fallo al obtener pintores.", variant: "destructive" });
      setPintores([]);
    } finally {
      setIsLoadingPintores(false);
    }
  };

  /** Carga la lista completa de empleados desde el backend. */
  const fetchEmpleados = async () => {
    console.log("fetchEmpleados: Iniciando...");
    setIsLoadingEmpleadosList(true);
    try {
      const result = await getAllEmpleadosAction();
      console.log("fetchEmpleados: Resultado de getAllEmpleadosAction:", result.data ? `${result.data.length} empleados obtenidos` : result.error);
      if (result.success && result.data) {
        setEmpleadosList(result.data);
      } else {
        toast({ title: "Error al Cargar Empleados", description: result.error || "No se pudieron cargar los empleados.", variant: "destructive" });
        setEmpleadosList([]);
      }
    } catch (error) {
      console.error("fetchEmpleados: Error crítico:", error);
      toast({ title: "Error Crítico de Empleados", description: "Fallo al obtener lista de empleados.", variant: "destructive" });
      setEmpleadosList([]);
    } finally {
      setIsLoadingEmpleadosList(false);
    }
  };

  /** Carga la lista de puestos de trabajo desde el backend. */
  const fetchPuestos = async () => {
    console.log("fetchPuestos: Iniciando...");
    setIsLoadingPuestos(true);
    try {
      const result = await getAllPuestosAction();
      console.log("fetchPuestos: Resultado:", result.data ? `${result.data.length} puestos obtenidos` : result.error);
      if (result.success && result.data) {
        setPuestosList(result.data);
      } else {
        toast({ title: "Error al Cargar Puestos", description: result.error || "No se pudieron cargar los puestos de trabajo.", variant: "destructive" });
        setPuestosList([]);
      }
    } catch (error) {
      console.error("fetchPuestos: Error crítico:", error);
      toast({ title: "Error Crítico de Puestos", description: "Fallo al obtener puestos de trabajo.", variant: "destructive" });
      setPuestosList([]);
    } finally {
      setIsLoadingPuestos(false);
    }
  };

  /** Carga la lista de colores de vehículos desde el backend. */
  const fetchColores = async () => {
    console.log("fetchColores: Iniciando...");
    setIsLoadingColores(true);
    try {
      const result = await getAllColoresVehiculoAction();
      console.log("fetchColores: Resultado:", result.data ? `${result.data.length} colores obtenidos` : result.error);
      if (result.success && result.data) {
        setColoresList(result.data);
      } else {
        toast({ title: "Error al Cargar Colores", description: result.error || "No se pudieron cargar los colores de vehículos.", variant: "destructive" });
        setColoresList([]);
      }
    } catch (error) {
      console.error("fetchColores: Error crítico:", error);
      toast({ title: "Error Crítico de Colores", description: "Fallo al obtener colores de vehículos.", variant: "destructive" });
      setColoresList([]);
    } finally {
      setIsLoadingColores(false);
    }
  };

  /**
   * Maneja el cierre de sesión del usuario.
   * Limpia `localStorage` y redirige a la página de inicio.
   */
  const handleLogout = () => {
    console.log("handleLogout: Cerrando sesión...");
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('empleadoId');
    localStorage.removeItem('userRole');
    // Resetear estados de usuario
    setUserName(null);
    setUserIdEmpleado(null);
    setUserRole(null);
    // Redirigir
    router.replace('/');
    toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
  };

  /**
   * Manejador genérico para cambios en inputs de texto o textarea.
   * Actualiza el estado del formulario correspondiente.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - Evento de cambio.
   * @param {React.Dispatch<React.SetStateAction<any>>} setState - Función para actualizar el estado del formulario.
   */
  const handleInputChangeGeneric = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, setState: React.Dispatch<React.SetStateAction<any>>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;

    // Convertir a número si es de tipo 'number', pero permitir string vacío para que el usuario pueda borrar el campo.
    // La conversión final a número se hará antes de enviar al backend.
    if (type === 'number' ) {
      processedValue = value; // Mantener como string, la validación/conversión se hará en el submit.
    }
    // Para otros tipos, usar el valor directamente.
    setState((prev: any) => ({ ...prev, [name]: processedValue }));
  };

  /**
   * Manejador genérico para cambios en checkboxes.
   * Actualiza el estado del formulario correspondiente.
   * @param {string} name - Nombre del campo checkbox.
   * @param {boolean} checked - Nuevo estado del checkbox.
   * @param {React.Dispatch<React.SetStateAction<any>>} setState - Función para actualizar el estado del formulario.
   */
  const handleCheckboxChangeGeneric = (name: string, checked: boolean, setState: React.Dispatch<React.SetStateAction<any>>) => {
    setState((prev: any) => ({ ...prev, [name]: checked }));
  };


  /**
   * Manejador genérico para cambios en selects.
   * Actualiza el estado del formulario correspondiente.
   * @param {string} name - Nombre del campo select.
   * @param {string | undefined} value - Nuevo valor seleccionado.
   * @param {React.Dispatch<React.SetStateAction<any>>} setState - Función para actualizar el estado del formulario.
   */
  const handleSelectChangeGeneric = (name: string, value: string | undefined, setState: React.Dispatch<React.SetStateAction<any>>) => {
    setState((prev: any) => ({ ...prev, [name]: value }));
  };

  // --- Funciones de Gestión de Órdenes de Servicio ---
  /**
   * Manejador de cambios para inputs en formularios de órdenes (nuevo o edición).
   * Llama a `handleInputChangeGeneric` para actualizar el estado del formulario de orden.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - Evento de cambio.
   * @param {'new' | 'edit'} formType - Tipo de formulario ('new' o 'edit').
   */
  const handleOrderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formType: 'new' | 'edit') => {
    const setState = formType === 'new' ? setNewOrderData : setEditOrderData;
    handleInputChangeGeneric(e, setState);
  };

  /**
   * Manejador de cambios para checkboxes en formularios de órdenes.
   * Llama a `handleCheckboxChangeGeneric`.
   * @param {keyof OrderFormDataType} name - Nombre del campo checkbox.
   * @param {boolean} checked - Nuevo estado del checkbox.
   * @param {'new' | 'edit'} formType - Tipo de formulario.
   */
  const handleOrderCheckboxChange = (name: keyof OrderFormDataType, checked: boolean, formType: 'new' | 'edit') => {
    const setState = formType === 'new' ? setNewOrderData : setEditOrderData;
    handleCheckboxChangeGeneric(String(name), checked, setState); // Asegurar que name sea string
  };

  /**
   * Manejador de cambios para selects en formularios de órdenes.
   * Carga dinámicamente ajustadores o modelos si se selecciona una aseguradora o marca.
   * @param {keyof OrderFormDataType} name - Nombre del campo select.
   * @param {string | undefined} value - Nuevo valor seleccionado (generalmente el _id de la entidad).
   * @param {'new' | 'edit'} formType - Tipo de formulario.
   */
  const handleOrderSelectChange = async (name: keyof OrderFormDataType, value: string | undefined, formType: 'new' | 'edit') => {
    const setState = formType === 'new' ? setNewOrderData : setEditOrderData;
    handleSelectChangeGeneric(String(name), value, setState); // Asegurar que name sea string

    // Si se cambia la aseguradora, cargar sus ajustadores y limpiar el ajustador seleccionado.
    if (name === 'idAseguradora') {
      setState((prev: any) => ({ ...prev, idAjustador: undefined })); // Resetear ajustador antes de cargar nuevos
      if (value) {
        const result = await getAjustadoresByAseguradora(value);
        if (result.success && result.data) {
          setAvailableAjustadoresForOrder(result.data);
        } else {
          setAvailableAjustadoresForOrder([]);
          toast({ title: "Error", description: result.error || "No se pudieron cargar los ajustadores.", variant: "destructive" });
        }
      } else {
        setAvailableAjustadoresForOrder([]); // Limpiar si no hay aseguradora seleccionada.
      }
    }

    // Si se cambia la marca, cargar sus modelos y limpiar el modelo seleccionado.
    if (name === 'idMarca') {
      setState((prev: any) => ({ ...prev, idModelo: undefined })); // Resetear modelo antes de cargar nuevos
      if (value) {
        const result = await getModelosByMarcaAction(value);
        if (result.success && result.data) {
          setAvailableModelosForOrder(result.data);
        } else {
          setAvailableModelosForOrder([]);
          toast({ title: "Error", description: result.error || "No se pudieron cargar los modelos.", variant: "destructive" });
        }
      } else {
        setAvailableModelosForOrder([]); // Limpiar si no hay marca seleccionada.
      }
    }
  };

  /**
   * Maneja la creación de una nueva orden de servicio.
   * Realiza validaciones y llama a la acción del servidor `createOrderAction`.
   */
  const handleCreateOrder = async () => {
    // Validación básica de campos obligatorios.
    // El _id del asesor (userIdEmpleado) se obtiene del estado/localstorage
    if (!newOrderData.idCliente || !newOrderData.idMarca || !newOrderData.idModelo || !newOrderData.idAsesor || !newOrderData.proceso || !newOrderData.color) {
      toast({ title: "Error de Validación", description: "Cliente, Marca, Modelo, Color, Asesor y Proceso son obligatorios.", variant: "destructive" });
      return;
    }

    // Construye el objeto de datos para la nueva orden.
    const orderToCreate: NewOrderData = {
      // IDs de referencia (ya son strings desde los Selects o ComboBox)
      idCliente: newOrderData.idCliente, 
      idAseguradora: newOrderData.idAseguradora,
      idAjustador: newOrderData.idAjustador, // Este es el idAjustador (ObjectId string) del ajustador
      idMarca: newOrderData.idMarca,
      idModelo: newOrderData.idModelo, // Este es el idModelo (ObjectId string) del modelo
      idValuador: newOrderData.idValuador,
      idAsesor: newOrderData.idAsesor, // Este es el _id (string ObjectId) del empleado asesor
      idHojalatero: newOrderData.idHojalatero,
      idPintor: newOrderData.idPintor,

      // Campos de texto
      siniestro: newOrderData.siniestro,
      poliza: newOrderData.poliza,
      folio: newOrderData.folio,
      vin: newOrderData.vin,
      placas: newOrderData.placas,
      color: newOrderData.color, 
      kilometraje: newOrderData.kilometraje,
      
      // Campos numéricos (convertir de string/undefined a number/undefined)
      año: newOrderData.año ? Number(newOrderData.año) : undefined,
      deducible: newOrderData.deducible ? Number(newOrderData.deducible) : undefined,
      
      // Campos booleanos
      piso: newOrderData.piso || false,
      grua: newOrderData.grua || false,
      aseguradoTercero: newOrderData.aseguradoTerceroString === 'true',

      // Otros campos
      proceso: newOrderData.proceso as Order['proceso'], // Castear al tipo específico de proceso
      // Los campos de fecha se envían como undefined si están vacíos en el formulario de creación.
      fechaValuacion: newOrderData.fechaValuacion ? new Date(newOrderData.fechaValuacion + 'T00:00:00Z') : undefined,
      fechaReingreso: newOrderData.fechaReingreso ? new Date(newOrderData.fechaReingreso + 'T00:00:00Z') : undefined,
      fechaEntrega: newOrderData.fechaEntrega ? new Date(newOrderData.fechaEntrega + 'T00:00:00Z') : undefined,
      fechaPromesa: newOrderData.fechaPromesa ? new Date(newOrderData.fechaPromesa + 'T00:00:00Z') : undefined,
      fechaBaja: newOrderData.fechaBaja ? new Date(newOrderData.fechaBaja + 'T00:00:00Z') : undefined,
    };

    // Llama a la acción del servidor para crear la orden.
    // Asegurar que userIdEmpleado sea string y no null/undefined antes de pasarlo.
    const currentUserId = userIdEmpleado ? userIdEmpleado : undefined; // userIdEmpleado ya es string ObjectId del empleado
    if (!currentUserId) {
        toast({ title: "Error de Sesión", description: "No se pudo identificar al usuario para el log.", variant: "destructive" });
        return;
    }
    const result = await createOrderAction(orderToCreate, currentUserId);

    if (result.success) {
      toast({ title: "Éxito", description: result.message || `Orden OT-${result.data?.customOrderId} creada.` });
      setIsCreateOrderDialogOpen(false);
      fetchOrders(); // Recargar la lista de órdenes.
      setNewOrderData(initialNewOrderData); // Resetear el formulario.
      setAvailableAjustadoresForOrder([]); // Limpiar listas dependientes.
      setAvailableModelosForOrder([]);
    } else {
      toast({ title: "Error al Crear Orden", description: result.error || "No se pudo crear la orden.", variant: "destructive" });
    }
  };

  /**
   * Abre el diálogo para editar una orden y carga sus datos.
   * Obtiene la orden por su _id y prepara los datos para el formulario.
   * @param {string} orderId - _id (string ObjectId) de la orden a editar.
   */
  const openEditOrderDialog = async (orderId: string) => {
    const result = await getOrderByIdAction(orderId);
    if (result.success && result.data) {
      setCurrentOrder(result.data);
      // Prepara los datos para el formulario de edición.
      const orderDataForForm: OrderFormDataType = {
        ...result.data, // Esto copia todos los campos de la orden
        // Convertir números a string para inputs
        año: result.data.año?.toString(),
        deducible: result.data.deducible?.toString(),
        // Convertir boolean a string para el select de aseguradoTercero
        aseguradoTerceroString: result.data.aseguradoTercero ? 'true' : 'false',
        // Formatear fechas para los inputs type="date" (formato YYYY-MM-DD)
        fechaValuacion: result.data.fechaValuacion ? formatDate(result.data.fechaValuacion, 'YYYY-MM-DD') : undefined,
        fechaReingreso: result.data.fechaReingreso ? formatDate(result.data.fechaReingreso, 'YYYY-MM-DD') : undefined,
        fechaEntrega: result.data.fechaEntrega ? formatDate(result.data.fechaEntrega, 'YYYY-MM-DD') : undefined,
        fechaPromesa: result.data.fechaPromesa ? formatDate(result.data.fechaPromesa, 'YYYY-MM-DD') : undefined,
        fechaBaja: result.data.fechaBaja ? formatDate(result.data.fechaBaja, 'YYYY-MM-DD') : undefined,
      };
      setEditOrderData(orderDataForForm);

      // Cargar ajustadores y modelos si la aseguradora y marca están definidas en la orden.
      if (result.data.idAseguradora) {
        const ajustadoresRes = await getAjustadoresByAseguradora(result.data.idAseguradora);
        if (ajustadoresRes.success && ajustadoresRes.data) setAvailableAjustadoresForOrder(ajustadoresRes.data);
      } else {
        setAvailableAjustadoresForOrder([]); // Limpiar si no hay aseguradora
      }
      if (result.data.idMarca) {
        const modelosRes = await getModelosByMarcaAction(result.data.idMarca);
        if (modelosRes.success && modelosRes.data) setAvailableModelosForOrder(modelosRes.data);
      } else {
        setAvailableModelosForOrder([]); // Limpiar si no hay marca
      }
      setIsEditOrderDialogOpen(true);
    } else {
      toast({ title: "Error", description: "No se pudo cargar la orden para editar.", variant: "destructive" });
    }
  };

  /**
   * Maneja la actualización de una orden existente.
   * Llama a la acción del servidor `updateOrderAction`.
   */
  const handleUpdateOrder = async () => {
    if (!currentOrder || !currentOrder._id) {
      toast({ title: "Error", description: "No hay orden seleccionada para actualizar.", variant: "destructive" });
      return;
    }
    // Validación básica
    if (!editOrderData.idCliente || !editOrderData.idMarca || !editOrderData.idModelo || !editOrderData.idAsesor || !editOrderData.proceso || !editOrderData.color) {
      toast({ title: "Error de Validación", description: "Cliente, Marca, Modelo, Color, Asesor y Proceso son obligatorios.", variant: "destructive" });
      return;
    }

    // Construye el objeto de datos para actualizar la orden.
    const orderToUpdate: UpdateOrderData = {
      // IDs de referencia (directamente del estado del formulario, ya son strings)
      idCliente: editOrderData.idCliente,
      idAseguradora: editOrderData.idAseguradora,
      idAjustador: editOrderData.idAjustador,
      idMarca: editOrderData.idMarca,
      idModelo: editOrderData.idModelo,
      idValuador: editOrderData.idValuador,
      idAsesor: editOrderData.idAsesor,
      idHojalatero: editOrderData.idHojalatero,
      idPintor: editOrderData.idPintor,

      // Campos de texto
      siniestro: editOrderData.siniestro,
      poliza: editOrderData.poliza,
      folio: editOrderData.folio,
      vin: editOrderData.vin,
      placas: editOrderData.placas,
      color: editOrderData.color,
      kilometraje: editOrderData.kilometraje,
      
      // Campos numéricos
      año: editOrderData.año ? Number(editOrderData.año) : undefined,
      deducible: editOrderData.deducible ? Number(editOrderData.deducible) : undefined,
      
      // Campos booleanos
      piso: editOrderData.piso || false,
      grua: editOrderData.grua || false,
      aseguradoTercero: editOrderData.aseguradoTerceroString === 'true',

      // Otros campos
      proceso: editOrderData.proceso as Order['proceso'],
      // Campos de fecha (convertir de string YYYY-MM-DD a Date)
      // Añadir 'T00:00:00Z' para asegurar que se interpreten como UTC y evitar problemas de un día por zona horaria.
      fechaValuacion: editOrderData.fechaValuacion ? new Date(editOrderData.fechaValuacion + 'T00:00:00Z') : undefined, 
      fechaReingreso: editOrderData.fechaReingreso ? new Date(editOrderData.fechaReingreso + 'T00:00:00Z') : undefined,
      fechaEntrega: editOrderData.fechaEntrega ? new Date(editOrderData.fechaEntrega + 'T00:00:00Z') : undefined,
      fechaPromesa: editOrderData.fechaPromesa ? new Date(editOrderData.fechaPromesa + 'T00:00:00Z') : undefined,
      fechaBaja: editOrderData.fechaBaja ? new Date(editOrderData.fechaBaja + 'T00:00:00Z') : undefined,
    };
    
    // Llama a la acción del servidor para actualizar la orden.
    const currentUserId = userIdEmpleado ? userIdEmpleado : undefined; // _id (string) del empleado para el log
    if (!currentUserId) {
        toast({ title: "Error de Sesión", description: "No se pudo identificar al usuario para el log.", variant: "destructive" });
        return;
    }
    const result = await updateOrderAction(currentOrder._id, orderToUpdate, currentUserId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Orden actualizada." });
      setIsEditOrderDialogOpen(false);
      fetchOrders();
      setCurrentOrder(null);
      setAvailableAjustadoresForOrder([]);
      setAvailableModelosForOrder([]);
    } else {
      toast({ title: "Error al Actualizar Orden", description: result.error || "No se pudo actualizar la orden.", variant: "destructive" });
    }
  };

  /**
   * Abre el diálogo para ver los detalles de una orden.
   * Obtiene la orden y sus datos relacionados (ajustadores, modelos) para mostrar.
   * @param {string} orderId - _id (string ObjectId) de la orden a ver.
   */
  const openViewOrderDialog = async (orderId: string) => {
    const result = await getOrderByIdAction(orderId);
    if (result.success && result.data) {
      setCurrentOrder(result.data);
      // Si la orden tiene idAseguradora, cargar sus ajustadores para mostrar el nombre.
      if (result.data.idAseguradora) {
        const aseguradoraCompleta = aseguradoras.find(a => a._id === result.data.idAseguradora);
        if (aseguradoraCompleta && aseguradoraCompleta.ajustadores) {
            // Guardar solo los ajustadores de la aseguradora actual para la vista
            setAvailableAjustadoresForOrder(aseguradoraCompleta.ajustadores.map(aj => ({idAjustador: aj.idAjustador, nombre: aj.nombre})));
        } else {
            setAvailableAjustadoresForOrder([]); // Limpiar si no se encuentran
        }
      } else {
        setAvailableAjustadoresForOrder([]);
      }
      // Si la orden tiene idMarca, cargar sus modelos para mostrar el nombre.
      if (result.data.idMarca) {
        const marcaCompleta = marcas.find(m => m._id === result.data.idMarca);
         if (marcaCompleta && marcaCompleta.modelos) {
            // Guardar solo los modelos de la marca actual para la vista
            setAvailableModelosForOrder(marcaCompleta.modelos.map(mod => ({idModelo: mod.idModelo, modelo: mod.modelo})));
        } else {
            setAvailableModelosForOrder([]); // Limpiar si no se encuentran
        }
      } else {
        setAvailableModelosForOrder([]);
      }
      setIsViewOrderDialogOpen(true);
    } else {
      toast({ title: "Error", description: "No se pudo cargar la orden para ver.", variant: "destructive" });
    }
  };

  /**
   * Abre el diálogo de confirmación para eliminar una orden.
   * @param {string} orderId - _id (string ObjectId) de la orden a eliminar.
   */
  const openDeleteOrderDialog = (orderId: string) => {
    setOrderToDeleteId(orderId);
    setIsDeleteOrderDialogOpen(true);
  };

  /**
   * Confirma y ejecuta la eliminación de una orden.
   * Llama a la acción del servidor `deleteOrderAction`.
   */
  const handleDeleteOrder = async () => {
    if (!orderToDeleteId) return;
    const result = await deleteOrderAction(orderToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Orden eliminada." });
      fetchOrders(); // Recargar la lista de órdenes
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar la orden.", variant: "destructive" });
    }
    setIsDeleteOrderDialogOpen(false);
    setOrderToDeleteId(null);
  };

  // --- Funciones de Gestión de Marcas (Administración) ---
  /** Maneja la creación de una nueva marca. Llama a `createMarcaAction`. */
  const handleCreateMarca = async () => {
    if (!newMarcaData.marca?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre de la marca es obligatorio.", variant: "destructive" });
      return;
    }
    const result = await createMarcaAction({ marca: newMarcaData.marca! });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Marca creada." });
      setIsCreateMarcaDialogOpen(false);
      fetchMarcas(); // Recargar
      setNewMarcaData({ marca: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear la marca.", variant: "destructive" });
    }
  };

  /** Abre el diálogo para editar una marca, cargando sus datos. */
  const openEditMarcaDialog = (marca: MarcaVehiculo) => {
    setCurrentMarca(marca);
    setEditMarcaData({ marca: marca.marca });
    setIsEditMarcaDialogOpen(true);
  };

  /** Maneja la actualización de una marca existente. Llama a `updateMarcaAction`. */
  const handleUpdateMarca = async () => {
    if (!currentMarca || !currentMarca._id || !editMarcaData.marca?.trim()) {
      toast({ title: "Error de Validación", description: "Datos inválidos para actualizar la marca.", variant: "destructive" });
      return;
    }
    const result = await updateMarcaAction(currentMarca._id, { marca: editMarcaData.marca! });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Marca actualizada." });
      setIsEditMarcaDialogOpen(false);
      fetchMarcas(); // Recargar
      setCurrentMarca(null);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar la marca.", variant: "destructive" });
    }
  };

  /** Abre el diálogo de confirmación para eliminar una marca. */
  const openDeleteMarcaDialog = (marcaId: string) => {
    setMarcaToDeleteId(marcaId);
    setIsDeleteMarcaDialogOpen(true);
  };

  /** Confirma y ejecuta la eliminación de una marca. Llama a `deleteMarcaAction`. */
  const handleDeleteMarca = async () => {
    if (!marcaToDeleteId) return;
    const result = await deleteMarcaAction(marcaToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Marca eliminada." });
      fetchMarcas(); // Recargar
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar la marca.", variant: "destructive" });
    }
    setIsDeleteMarcaDialogOpen(false);
    setMarcaToDeleteId(null);
  };

  // --- Funciones de Gestión de Modelos (Administración) ---
  /** 
   * Abre el diálogo para gestionar modelos de una marca específica.
   * Carga los datos de la marca, incluyendo sus modelos.
   */
  const openManageModelosDialog = async (marca: MarcaVehiculo) => {
    if (!marca._id) {
        toast({ title: "Error", description: "ID de marca no encontrado.", variant: "destructive" });
        return;
    }
    // Obtener los datos más recientes de la marca (incluyendo sus modelos)
    const result = await getMarcaForModelosAction(marca._id); // Esta acción debe devolver la marca con sus modelos.
    if (result.success && result.data) {
        setCurrentMarca(result.data); // Guardar la marca completa con sus modelos
        setIsManageModelosDialogOpen(true);
    } else {
        toast({ title: "Error", description: "No se pudo cargar la marca para gestionar modelos.", variant: "destructive" });
    }
  };

  /** Maneja la creación de un nuevo modelo para la marca actual. Llama a `addModeloToMarcaAction`. */
  const handleCreateModelo = async () => {
    if (!currentMarca || !currentMarca._id || !newModeloData.modelo?.trim()) {
      toast({ title: "Error de Validación", description: "Marca no seleccionada o nombre de modelo inválido.", variant: "destructive" });
      return;
    }
    const result = await addModeloToMarcaAction(currentMarca._id, { modelo: newModeloData.modelo! });
    if (result.success && result.data) {
      toast({ title: "Éxito", description: `Modelo "${result.data.modelo}" añadido a ${currentMarca.marca}.` });
      // Actualizar el estado local de 'currentMarca' para reflejar el nuevo modelo
      setCurrentMarca(prev => prev ? {...prev, modelos: [...(prev.modelos || []), result.data!]} : null);
      fetchMarcas(); // Recargar lista global de marcas para consistencia (ej. conteo de modelos)
      setNewModeloData({ modelo: ''});
      setIsCreateModeloDialogOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo añadir el modelo.", variant: "destructive" });
    }
  };

  /** Abre el diálogo para editar un modelo, cargando sus datos. */
  const openEditModeloDialog = (modelo: ModeloVehiculo) => {
    setCurrentModelo(modelo); // Guardar el modelo completo que se está editando
    setEditModeloData({ modelo: modelo.modelo }); 
    setIsEditModeloDialogOpen(true);
  };

  /** Maneja la actualización de un modelo existente. Llama a `updateModeloInMarcaAction`. */
  const handleUpdateModelo = async () => {
    if (!currentMarca || !currentMarca._id || !currentModelo || !currentModelo.idModelo || !editModeloData.modelo?.trim()) {
      toast({ title: "Error de Validación", description: "Datos inválidos para actualizar modelo.", variant: "destructive" });
      return;
    }
    const result = await updateModeloInMarcaAction(currentMarca._id, currentModelo.idModelo, { modelo: editModeloData.modelo! });
    if (result.success) {
      toast({ title: "Éxito", description: `Modelo "${editModeloData.modelo}" actualizado.` });
      // Actualizar el estado local de 'currentMarca'
      setCurrentMarca(prev => prev ? {
          ...prev,
          modelos: prev.modelos?.map(m => m.idModelo === currentModelo.idModelo ? {...m, modelo: editModeloData.modelo!} : m)
      } : null);
      fetchMarcas(); // Recargar lista global
      setIsEditModeloDialogOpen(false);
      setCurrentModelo(null);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar el modelo.", variant: "destructive" });
    }
  };

  /** Maneja la eliminación de un modelo. Llama a `removeModeloFromMarcaAction`. */
  const handleDeleteModelo = async (idModelo: string) => {
    if (!currentMarca || !currentMarca._id) return;
    const result = await removeModeloFromMarcaAction(currentMarca._id, idModelo);
    if (result.success) {
      toast({ title: "Éxito", description: "Modelo eliminado." });
      // Actualizar el estado local de 'currentMarca'
      setCurrentMarca(prev => prev ? {...prev, modelos: prev.modelos?.filter(m => m.idModelo !== idModelo)} : null);
      fetchMarcas(); // Recargar lista global
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar el modelo.", variant: "destructive" });
    }
  };

  // --- Funciones de Gestión de Aseguradoras (Administración) ---
  /** Maneja la creación de una nueva aseguradora. Llama a `createAseguradoraAction`. */
  const handleCreateAseguradora = async () => {
    if (!newAseguradoraData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre de la aseguradora es obligatorio.", variant: "destructive" });
      return;
    }
    const result = await createAseguradoraAction({ nombre: newAseguradoraData.nombre!, telefono: newAseguradoraData.telefono });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Aseguradora creada." });
      setIsCreateAseguradoraDialogOpen(false);
      fetchAseguradoras(); // Recargar
      setNewAseguradoraData({ nombre: '', telefono: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear la aseguradora.", variant: "destructive" });
    }
  };

  /** Abre el diálogo para editar una aseguradora, cargando sus datos. */
  const openEditAseguradoraDialog = (aseguradora: Aseguradora) => {
    setCurrentAseguradora(aseguradora);
    setEditAseguradoraData({ nombre: aseguradora.nombre, telefono: aseguradora.telefono });
    setIsEditAseguradoraDialogOpen(true);
  };

  /** Maneja la actualización de una aseguradora existente. Llama a `updateAseguradoraAction`. */
  const handleUpdateAseguradora = async () => {
    if (!currentAseguradora || !currentAseguradora._id || !editAseguradoraData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "Datos inválidos para actualizar la aseguradora.", variant: "destructive" });
      return;
    }
    const result = await updateAseguradoraAction(currentAseguradora._id, { nombre: editAseguradoraData.nombre!, telefono: editAseguradoraData.telefono });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Aseguradora actualizada." });
      setIsEditAseguradoraDialogOpen(false);
      fetchAseguradoras(); // Recargar
      setCurrentAseguradora(null);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar la aseguradora.", variant: "destructive" });
    }
  };

  /** Abre el diálogo de confirmación para eliminar una aseguradora. */
  const openDeleteAseguradoraDialog = (aseguradoraId: string) => {
    setAseguradoraToDeleteId(aseguradoraId);
    setIsDeleteAseguradoraDialogOpen(true);
  };

  /** Confirma y ejecuta la eliminación de una aseguradora. Llama a `deleteAseguradoraAction`. */
  const handleDeleteAseguradora = async () => {
    if (!aseguradoraToDeleteId) return;
    const result = await deleteAseguradoraAction(aseguradoraToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Aseguradora eliminada." });
      fetchAseguradoras(); // Recargar
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar la aseguradora.", variant: "destructive" });
    }
    setIsDeleteAseguradoraDialogOpen(false);
    setAseguradoraToDeleteId(null);
  };

  // --- Funciones de Gestión de Ajustadores (Administración) ---
  /** 
   * Abre el diálogo para gestionar ajustadores de una aseguradora específica.
   * Carga los datos de la aseguradora, incluyendo sus ajustadores.
   */
  const openManageAjustadoresDialog = async (aseguradora: Aseguradora) => {
    if (!aseguradora._id) {
      toast({ title: "Error", description: "ID de aseguradora no encontrado.", variant: "destructive" });
      return;
    }
     const result = await getAseguradoraForAjustadoresAction(aseguradora._id); // Esta acción debe devolver la aseguradora con sus ajustadores.
     if (result.success && result.data) {
        setCurrentAseguradora(result.data); // Guardar la aseguradora completa
        setIsManageAjustadoresDialogOpen(true);
     } else {
        toast({ title: "Error", description: "No se pudo cargar la aseguradora para gestionar ajustadores.", variant: "destructive" });
     }
  };

  /** Maneja la creación de un nuevo ajustador para la aseguradora actual. Llama a `addAjustadorToAseguradoraAction`. */
  const handleCreateAjustador = async () => {
    if (!currentAseguradora || !currentAseguradora._id || !newAjustadorData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "Aseguradora no seleccionada o nombre de ajustador inválido.", variant: "destructive" });
      return;
    }
    const result = await addAjustadorToAseguradoraAction(currentAseguradora._id, newAjustadorData);
    if (result.success && result.data) {
      toast({ title: "Éxito", description: `Ajustador "${result.data.nombre}" añadido.` });
      // Actualizar el estado local de 'currentAseguradora'
      setCurrentAseguradora(prev => prev ? {...prev, ajustadores: [...(prev.ajustadores || []), result.data!]} : null);
      fetchAseguradoras(); // Recargar lista global de aseguradoras
      setNewAjustadorData({ nombre: '', telefono: '', correo: '' });
      setIsCreateAjustadorDialogOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo añadir el ajustador.", variant: "destructive" });
    }
  };

  /** Abre el diálogo para editar un ajustador, cargando sus datos. */
  const openEditAjustadorDialog = (ajustador: Ajustador) => {
    setCurrentAjustador(ajustador); // Guardar el ajustador completo
    setEditAjustadorData({ ...ajustador }); // Llenar el formulario
    setIsEditAjustadorDialogOpen(true);
  };

  /** Maneja la actualización de un ajustador existente. Llama a `updateAjustadorInAseguradoraAction`. */
  const handleUpdateAjustador = async () => {
    if (!currentAseguradora || !currentAseguradora._id || !currentAjustador || !currentAjustador.idAjustador || !editAjustadorData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "Datos inválidos para actualizar ajustador.", variant: "destructive" });
      return;
    }
    const { idAjustador, ...updatePayload } = editAjustadorData; // Extraer idAjustador ya que no se envía en el payload de actualización
    const result = await updateAjustadorInAseguradoraAction(currentAseguradora._id, currentAjustador.idAjustador, updatePayload);
    if (result.success) {
      toast({ title: "Éxito", description: "Ajustador actualizado." });
      // Actualizar el estado local de 'currentAseguradora'
      setCurrentAseguradora(prev => prev ? {
          ...prev,
          ajustadores: prev.ajustadores?.map(a => a.idAjustador === currentAjustador.idAjustador ? {...a, ...updatePayload} : a)
      } : null);
      fetchAseguradoras(); // Recargar lista global
      setIsEditAjustadorDialogOpen(false);
      setCurrentAjustador(null);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar el ajustador.", variant: "destructive" });
    }
  };

  /** Maneja la eliminación de un ajustador. Llama a `removeAjustadorFromAseguradoraAction`. */
  const handleDeleteAjustador = async (idAjustador: string) => {
    if (!currentAseguradora || !currentAseguradora._id) return;
    const result = await removeAjustadorFromAseguradoraAction(currentAseguradora._id, idAjustador);
    if (result.success) {
      toast({ title: "Éxito", description: "Ajustador eliminado." });
      // Actualizar el estado local de 'currentAseguradora'
      setCurrentAseguradora(prev => prev ? {...prev, ajustadores: prev.ajustadores?.filter(a => a.idAjustador !== idAjustador)} : null);
      fetchAseguradoras(); // Recargar lista global
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar el ajustador.", variant: "destructive" });
    }
  };

  // --- Funciones de Gestión de Empleados (Administración) ---
  /** Maneja la creación de un nuevo empleado, incluyendo opcionalmente credenciales de sistema. */
  const handleCreateEmpleado = async () => {
    // Validaciones básicas para los campos del empleado
    if (!newEmpleadoData.nombre?.trim() || !newEmpleadoData.puesto?.trim()) {
      toast({ title: "Error de Validación", description: "Nombre y Puesto del empleado son obligatorios.", variant: "destructive" });
      return;
    }

    let systemUserDetails: Omit<SystemUserCredentials, '_id' | 'permisos'> | undefined = undefined;
    // Validaciones para credenciales de sistema si se elige crearlas
    if (newEmpleadoData.createSystemUser) {
      if (!newEmpleadoData.systemUserUsuario?.trim() || !newEmpleadoData.systemUserContraseña?.trim() || !newEmpleadoData.systemUserRol) {
        toast({ title: "Error de Validación de Usuario", description: "Usuario, Contraseña y Rol son obligatorios para crear acceso al sistema.", variant: "destructive" });
        return;
      }
      if (newEmpleadoData.systemUserContraseña !== newEmpleadoData.systemUserConfirmContraseña) {
        toast({ title: "Error de Contraseña", description: "Las contraseñas para el acceso al sistema no coinciden.", variant: "destructive" });
        return;
      }
      systemUserDetails = {
        usuario: newEmpleadoData.systemUserUsuario,
        contraseña: newEmpleadoData.systemUserContraseña,
        rol: newEmpleadoData.systemUserRol,
      };
    }

    // Preparar datos básicos del empleado
    const empleadoDataToCreate: Omit<Empleado, '_id' | 'fechaRegistro' | 'user'> = {
        nombre: newEmpleadoData.nombre,
        puesto: newEmpleadoData.puesto,
        telefono: newEmpleadoData.telefono,
        correo: newEmpleadoData.correo,
        sueldo: newEmpleadoData.sueldo ? Number(newEmpleadoData.sueldo) : undefined,
        comision: newEmpleadoData.comision ? Number(newEmpleadoData.comision) : undefined,
    };

    // Llamar a la acción del servidor
    const result = await createEmpleadoAction(empleadoDataToCreate, systemUserDetails);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Empleado creado." });
      setIsCreateEmpleadoDialogOpen(false);
      fetchEmpleados(); // Recargar lista de empleados
      // Recargar listas de personal para selects de órdenes (asesores, valuadores, etc.)
      fetchAsesores(); fetchValuadores(); fetchHojalateros(); fetchPintores();
      setNewEmpleadoData(initialNewEmpleadoData); // Resetear formulario
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el empleado.", variant: "destructive" });
    }
  };

  /** 
   * Abre el diálogo para editar un empleado. 
   * Carga los datos del empleado y prepara el formulario de edición.
   */
  const openEditEmpleadoDialog = async (empleadoIdToEdit: string) => {
    const result = await getEmpleadoForEditAction(empleadoIdToEdit); // Acción para obtener empleado por ID
    if (result.success && result.data) {
      setCurrentEmpleadoToEdit(result.data);
      // Preparar datos para el formulario de edición
      setEditEmpleadoData({
        nombre: result.data.nombre,
        puesto: result.data.puesto,
        telefono: result.data.telefono,
        correo: result.data.correo,
        sueldo: result.data.sueldo?.toString(), // Convertir a string para input
        comision: result.data.comision?.toString(), // Convertir a string para input
        createSystemUser: !!result.data.user, // Marcar si ya tiene usuario de sistema
        systemUserUsuario: result.data.user?.usuario,
        systemUserRol: result.data.user?.rol,
        newSystemUserContraseña: '', // Limpiar campos de nueva contraseña
        newSystemUserConfirmContraseña: '',
      });
      setIsEditEmpleadoDialogOpen(true);
    } else {
      toast({ title: "Error", description: "No se pudo cargar el empleado para editar.", variant: "destructive" });
    }
  };

  /** Maneja la actualización de un empleado existente. */
  const handleUpdateEmpleado = async () => {
    if (!currentEmpleadoToEdit || !currentEmpleadoToEdit._id) {
      toast({ title: "Error", description: "No hay empleado seleccionado para actualizar.", variant: "destructive" });
      return;
    }
    // Validaciones básicas
    if (!editEmpleadoData.nombre?.trim() || !editEmpleadoData.puesto?.trim()) {
      toast({ title: "Error de Validación", description: "Nombre y Puesto son obligatorios.", variant: "destructive" });
      return;
    }

    // Preparar datos básicos del empleado para actualizar
    const empleadoUpdates: Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>> = {
      nombre: editEmpleadoData.nombre,
      puesto: editEmpleadoData.puesto,
      telefono: editEmpleadoData.telefono,
      correo: editEmpleadoData.correo,
      sueldo: editEmpleadoData.sueldo ? Number(editEmpleadoData.sueldo) : undefined,
      comision: editEmpleadoData.comision ? Number(editEmpleadoData.comision) : undefined,
    };

    // Preparar datos de usuario del sistema si se van a modificar/crear
    let systemUserUpdates: Partial<Omit<SystemUserCredentials, 'permisos' | '_id' | 'contraseña'>> & { contraseña?: string } | undefined = undefined;
    if (editEmpleadoData.createSystemUser) { // Si el checkbox está marcado (para crear nuevo o modificar existente)
        if (!editEmpleadoData.systemUserUsuario?.trim() || !editEmpleadoData.systemUserRol) {
            toast({ title: "Error de Validación de Usuario", description: "Usuario y Rol son obligatorios para el acceso al sistema.", variant: "destructive" });
            return;
        }
        systemUserUpdates = {
            usuario: editEmpleadoData.systemUserUsuario,
            rol: editEmpleadoData.systemUserRol,
        };
        // Si se proporciona una nueva contraseña, añadirla a las actualizaciones
        if (editEmpleadoData.newSystemUserContraseña) {
            if (editEmpleadoData.newSystemUserContraseña !== editEmpleadoData.newSystemUserConfirmContraseña) {
                toast({ title: "Error de Contraseña", description: "Las nuevas contraseñas no coinciden.", variant: "destructive" });
                return;
            }
            systemUserUpdates.contraseña = editEmpleadoData.newSystemUserContraseña;
        }
    }
    
    // Llamar a la acción del servidor
    const result = await updateEmpleadoAction(currentEmpleadoToEdit._id, empleadoUpdates, systemUserUpdates);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Empleado actualizado." });
      setIsEditEmpleadoDialogOpen(false);
      fetchEmpleados(); // Recargar lista de empleados
      // Recargar listas de personal para selects de órdenes
      fetchAsesores(); fetchValuadores(); fetchHojalateros(); fetchPintores();
      setCurrentEmpleadoToEdit(null);
      setEditEmpleadoData({}); // Resetear formulario de edición
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar el empleado.", variant: "destructive" });
    }
  };

  /** Abre el diálogo de confirmación para eliminar un empleado. */
  const openDeleteEmpleadoDialog = (empleadoIdToDelete: string) => {
    setEmpleadoToDeleteId(empleadoIdToDelete);
    setIsDeleteEmpleadoDialogOpen(true);
  };

  /** Confirma y ejecuta la eliminación de un empleado. Llama a `deleteEmpleadoAction`. */
  const handleDeleteEmpleado = async () => {
    if (!empleadoToDeleteId) return;
    const result = await deleteEmpleadoAction(empleadoToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Empleado eliminado." });
      fetchEmpleados(); // Recargar
      // Recargar listas de personal para selects de órdenes
      fetchAsesores(); fetchValuadores(); fetchHojalateros(); fetchPintores();
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar el empleado.", variant: "destructive" });
    }
    setIsDeleteEmpleadoDialogOpen(false);
    setEmpleadoToDeleteId(null);
  };

  /** Maneja la eliminación del acceso al sistema de un empleado. */
  const handleRemoveSystemUser = async (empleadoIdToRemoveAccess: string) => {
      const result = await removeSystemUserFromEmpleadoAction(empleadoIdToRemoveAccess);
      if (result.success) {
          toast({ title: "Éxito", description: result.message || "Acceso al sistema removido."});
          fetchEmpleados(); // Recargar para que se actualice la info en la tabla
          // Si el empleado que se está editando es al que se le quitó el acceso, actualizar su estado local
          if (currentEmpleadoToEdit && currentEmpleadoToEdit._id === empleadoIdToRemoveAccess) {
              setCurrentEmpleadoToEdit(prev => prev ? {...prev, user: undefined} : null);
              setEditEmpleadoData(prev => ({ // Resetear campos de usuario en el form de edición
                ...prev,
                createSystemUser: false, // Desmarcar el checkbox
                systemUserUsuario: undefined,
                systemUserRol: undefined,
                newSystemUserContraseña: '',
                newSystemUserConfirmContraseña: ''
              }));
          }
      } else {
          toast({ title: "Error", description: result.error || "No se pudo remover el acceso.", variant: "destructive" });
      }
  };

  // --- Funciones de Gestión de Clientes (para diálogo de creación rápida desde Órdenes) ---
  /** Abre el diálogo para crear un nuevo cliente desde el formulario de orden. */
  const openCreateClientDialog = () => {
    setNewClientData({ nombre: '', telefono: '', correo: '' }); // Resetear datos del formulario de nuevo cliente
    setIsCreateClientDialogOpen(true);
  };

  /** 
   * Maneja la creación de un nuevo cliente desde el diálogo rápido.
   * Si tiene éxito, actualiza la lista de clientes y preselecciona el nuevo cliente en el formulario de orden.
   */
  const handleCreateClient = async () => {
    if (!newClientData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre del cliente es obligatorio.", variant: "destructive" });
      return;
    }
    // Llamar a la acción del servidor
    const result = await createClienteAction({
        nombre: newClientData.nombre!,
        telefono: newClientData.telefono,
        correo: newClientData.correo,
        // RFC se eliminó de este formulario simple
    });

    if (result.success && result.data?.clienteId && result.data.nuevoCliente) {
      toast({ title: "Éxito", description: `Cliente "${result.data.nuevoCliente.nombre}" creado.` });
      fetchClients(); // Recargar la lista de clientes
      setIsCreateClientDialogOpen(false);
      // Si el diálogo de creación de orden está abierto, preseleccionar el nuevo cliente
      if (isCreateOrderDialogOpen) {
        setNewOrderData(prev => ({ ...prev, idCliente: result.data!.clienteId! }));
      } else if (isEditOrderDialogOpen) { // Si el diálogo de edición de orden está abierto
        setEditOrderData(prev => ({ ...prev, idCliente: result.data!.clienteId! }));
      }
      setNewClientData({ nombre: '', telefono: '', correo: ''}); // Resetear formulario de cliente
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el cliente.", variant: "destructive" });
    }
  };

  // --- FUNCIONES DE GESTIÓN DE PUESTOS (ADMINISTRACIÓN GENERAL) ---
  /** Maneja la creación de un nuevo Puesto. Llama a `createPuestoAction`. */
  const handleCreatePuesto = async () => {
    if (!newPuestoData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre del puesto es obligatorio.", variant: "destructive" });
      return;
    }
    const result = await createPuestoAction({ nombre: newPuestoData.nombre! });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || `Puesto "${newPuestoData.nombre}" creado.` });
      setIsCreatePuestoDialogOpen(false);
      fetchPuestos(); // Recargar
      setNewPuestoData({ nombre: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el puesto.", variant: "destructive" });
    }
  };

  /** Abre el diálogo para editar un Puesto, cargando sus datos. */
  const openEditPuestoDialog = (puesto: Puesto) => {
    setCurrentPuestoToEdit(puesto);
    setEditPuestoData({ nombre: puesto.nombre });
    setIsEditPuestoDialogOpen(true);
  };

  /** Maneja la actualización de un Puesto existente. Llama a `updatePuestoAction`. */
  const handleUpdatePuesto = async () => {
    if (!currentPuestoToEdit || !currentPuestoToEdit._id || !editPuestoData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "Datos inválidos para actualizar el puesto.", variant: "destructive" });
      return;
    }
    const result = await updatePuestoAction(currentPuestoToEdit._id, { nombre: editPuestoData.nombre! });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Puesto actualizado." });
      setIsEditPuestoDialogOpen(false);
      fetchPuestos(); // Recargar
      setCurrentPuestoToEdit(null);
      setEditPuestoData({ nombre: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar el puesto.", variant: "destructive" });
    }
  };

  /** Abre el diálogo de confirmación para eliminar un Puesto. */
  const openDeletePuestoDialog = (puestoId: string) => {
    setPuestoToDeleteId(puestoId);
    setIsDeletePuestoDialogOpen(true);
  };

  /** Confirma y ejecuta la eliminación de un Puesto. Llama a `deletePuestoAction`. */
  const handleDeletePuesto = async () => {
    if (!puestoToDeleteId) return;
    const result = await deletePuestoAction(puestoToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Puesto eliminado." });
      fetchPuestos(); // Recargar
      // También recargar empleados y listas dependientes ya que un puesto pudo haber sido eliminado
      fetchEmpleados(); fetchAsesores(); fetchValuadores(); fetchHojalateros(); fetchPintores();
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar el puesto.", variant: "destructive" });
    }
    setIsDeletePuestoDialogOpen(false);
    setPuestoToDeleteId(null);
  };

  // --- FUNCIONES DE GESTIÓN DE COLORES DE VEHÍCULO (ADMINISTRACIÓN GENERAL) ---
  /** Maneja la creación de un nuevo Color de Vehículo. Llama a `createColorVehiculoAction`. */
  const handleCreateColor = async () => {
    if (!newColorData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre del color es obligatorio.", variant: "destructive" });
      return;
    }
    const result = await createColorVehiculoAction({ nombre: newColorData.nombre! });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || `Color "${newColorData.nombre}" creado.` });
      setIsCreateColorDialogOpen(false);
      fetchColores(); // Recargar
      setNewColorData({ nombre: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el color.", variant: "destructive" });
    }
  };

  /** Abre el diálogo para editar un Color de Vehículo, cargando sus datos. */
  const openEditColorDialog = (color: ColorVehiculo) => {
    setCurrentColorToEdit(color);
    setEditColorData({ nombre: color.nombre });
    setIsEditColorDialogOpen(true);
  };

  /** Maneja la actualización de un Color de Vehículo existente. Llama a `updateColorVehiculoAction`. */
  const handleUpdateColor = async () => {
    if (!currentColorToEdit || !currentColorToEdit._id || !editColorData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "Datos inválidos para actualizar el color.", variant: "destructive" });
      return;
    }
    const result = await updateColorVehiculoAction(currentColorToEdit._id, { nombre: editColorData.nombre! });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Color actualizado." });
      setIsEditColorDialogOpen(false);
      fetchColores(); // Recargar
      setCurrentColorToEdit(null);
      setEditColorData({ nombre: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar el color.", variant: "destructive" });
    }
  };

  /** Abre el diálogo de confirmación para eliminar un Color de Vehículo. */
  const openDeleteColorDialog = (colorId: string) => {
    setColorToDeleteId(colorId);
    setIsDeleteColorDialogOpen(true);
  };

  /** Confirma y ejecuta la eliminación de un Color de Vehículo. Llama a `deleteColorVehiculoAction`. */
  const handleDeleteColor = async () => {
    if (!colorToDeleteId) return;
    const result = await deleteColorVehiculoAction(colorToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Color eliminado." });
      fetchColores(); // Recargar
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar el color.", variant: "destructive" });
    }
    setIsDeleteColorDialogOpen(false);
    setColorToDeleteId(null);
  };

  // --- Funciones Auxiliares de Formateo ---
  /**
   * Formatea una fecha a string 'dd/MM/yyyy' (local) o 'YYYY-MM-DD' (para input date).
   * Maneja strings de fecha, timestamps numéricos o objetos Date.
   * Si el input es un string 'YYYY-MM-DD', lo interpreta como fecha local (medianoche) para evitar problemas de un día por UTC.
   * @param {Date | string | number | undefined} dateInput - La fecha a formatear.
   * @param {'dd/MM/yyyy' | 'YYYY-MM-DD'} format - El formato de salida deseado.
   * @returns {string} La fecha formateada, o string vacío si la entrada es inválida/nula.
   */
   const formatDate = (dateInput?: Date | string | number, format: 'dd/MM/yyyy' | 'YYYY-MM-DD' = 'dd/MM/yyyy'): string => {
    if (!dateInput) return '';
    let date: Date;

    if (typeof dateInput === 'string') {
      // Si el string es solo 'YYYY-MM-DD', asumimos que es una fecha local, no UTC.
      // Para crear el objeto Date correctamente y evitar corrimientos de un día:
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        // Separar año, mes, día. Mes es 0-indexado para el constructor de Date.
        const parts = dateInput.split('-');
        date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        // Para otros formatos de string (ej. ISO completo con 'Z' o offset), new Date() suele funcionar bien.
        date = new Date(dateInput);
      }
    } else { // number (timestamp) o Date object
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return 'Fecha inválida';

    if (format === 'YYYY-MM-DD') {
      // Para input type="date", se necesita YYYY-MM-DD.
      // Usar los componentes de fecha del objeto Date ya ajustado a la zona horaria local.
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mes es 0-indexado
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else { // 'dd/MM/yyyy', mostrar en hora local (es-MX) del navegador.
      return date.toLocaleDateString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
    }
  };

  /** 
   * Formatea una fecha y hora a 'dd/MM/yyyy HH:mm' en la zona horaria local del navegador.
   * @param {Date | string | number | undefined} dateInput - La fecha y hora a formatear.
   * @returns {string} La fecha y hora formateada, o string vacío si la entrada es inválida/nula.
   */
  const formatDateTime = (dateInput?: Date | string | number): string => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleString('es-MX', { // Formato para México
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false // Formato de 24 horas
    });
  };

  /** Devuelve la variante de Badge (color) según el proceso de la orden. */
  const getProcesoVariant = (proceso?: Order['proceso']): "default" | "secondary" | "outline" | "destructive" => {
    if (!proceso) return "outline"; // Color por defecto si no hay proceso
    if (['cancelado', 'baja'].includes(proceso)) return "destructive"; // Rojo para cancelado/baja
    if (['entregado', 'facturado'].includes(proceso)) return "default"; // Color primario (usualmente azul/verde) para completados
    if (['pendiente', 'espera_refacciones'].includes(proceso)) return "secondary"; // Gris o color secundario para pendientes/esperas
    return "outline"; // Outline para otros estados intermedios
  };

  /** Opciones para el select de Proceso en el formulario de órdenes. */
  const procesoOptions: { value: Order['proceso']; label: string }[] = [
    { value: 'pendiente', label: 'Pendiente' }, { value: 'valuacion', label: 'Valuación' },
    { value: 'espera_refacciones', label: 'Espera Refacciones' }, { value: 'refacciones_listas', label: 'Refacciones Listas' },
    { value: 'hojalateria', label: 'Hojalatería' }, { value: 'preparacion_pintura', label: 'Preparación Pintura' },
    { value: 'pintura', label: 'Pintura' }, { value: 'mecanica', label: 'Mecánica' },
    { value: 'armado', label: 'Armado' }, { value: 'detallado_lavado', label: 'Detallado/Lavado' },
    { value: 'control_calidad', label: 'Control de Calidad' }, { value: 'listo_entrega', label: 'Listo para Entrega' },
    { value: 'entregado', label: 'Entregado' }, { value: 'facturado', label: 'Facturado' },
    { value: 'garantia', label: 'Garantía' }, { value: 'cancelado', label: 'Cancelado' },
  ];
  /** Opciones para el select de Rol de Usuario. */
  const userRoleOptions = Object.values(UserRole).map(role => ({ value: role, label: role.charAt(0).toUpperCase() + role.slice(1) }));
  /** Opciones para el select de Asegurado/Tercero. */
  const aseguradoTerceroOptions: {value: string; label: string}[] = [
    { value: 'true', label: 'Asegurado' },
    { value: 'false', label: 'Tercero' },
  ];

  /**
   * Renderiza un campo de formulario genérico (Label + Input/Select/Textarea/Checkbox).
   * Se utiliza para construir los diversos diálogos de forma consistente.
   * @param {string} label - Texto de la etiqueta del campo.
   * @param {any} name - Nombre del campo (usado como key en el estado del formulario).
   * @param {string} [type="text"] - Tipo de input HTML ("text", "number", "date", "email", "password", "select", "checkbox").
   * @param {string} [placeholder] - Placeholder para el campo.
   * @param {'newOrder' | 'editOrder' | 'newMarca' | 'editMarca' | 'newModelo' | 'editModelo' | 'newAseguradora' | 'editAseguradora' | 'newAjustador' | 'editAjustador' | 'newEmpleado' | 'editEmpleado' | 'newClient' | 'newPuesto' | 'editPuesto' | 'newColor' | 'editColor'} formType - Identificador del tipo de formulario para obtener el estado y los manejadores correctos.
   * @param {{ value: string | number; label: string }[]} [options] - Opciones para campos tipo 'select'.
   * @param {boolean} [isTextarea=false] - Si es true, renderiza un Textarea.
   * @param {boolean} [isDisabled=false] - Si es true, deshabilita el campo.
   * @param {boolean} [isRequired=false] - Si es true, añade un asterisco a la etiqueta.
   * @param {string} [classNameGrid] - Clases CSS adicionales para el div contenedor del campo (ej. para control de columnas en grid).
   * @returns {JSX.Element} El campo de formulario renderizado.
   */
  const renderDialogField = (
      label: string, name: any, type: string = "text", placeholder?: string,
      formType: 'newOrder' | 'editOrder' | 'newMarca' | 'editMarca' | 'newModelo' | 'editModelo' | 'newAseguradora' | 'editAseguradora' | 'newAjustador' | 'editAjustador' | 'newEmpleado' | 'editEmpleado' | 'newClient' | 'newPuesto' | 'editPuesto' | 'newColor' | 'editColor' = 'newOrder',
      options?: { value: string | number; label: string }[], // Opciones para selects
      isTextarea?: boolean, isDisabled?: boolean, isRequired?: boolean,
      classNameGrid?: string // Clases para el div contenedor, útil para grid layouts
    ): JSX.Element => {

    // Determinar el estado y los manejadores de cambio según el formType
    let value: any;
    let handleChange: any; // Para Inputs y Textareas
    let handleSelect: any; // Para Selects
    let handleCheckbox: any; // Para Checkboxes

    // Asignar estado y manejadores basados en formType
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
        handleCheckbox = (checked: boolean) => handleCheckboxChangeGeneric(name, checked, setNewEmpleadoData); // Manejador para checkbox
        // Opciones dinámicas para selects dentro de este formulario
        if (name === 'puesto') options = puestosList.map(p => ({ value: p.nombre, label: p.nombre }));
        if (name === 'systemUserRol') options = userRoleOptions;
        break;
      case 'editEmpleado':
        value = editEmpleadoData[name as keyof EditEmpleadoFormDataType];
        handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditEmpleadoData);
        handleSelect = (val: string | undefined) => handleSelectChangeGeneric(name, val, setEditEmpleadoData);
        handleCheckbox = (checked: boolean) => handleCheckboxChangeGeneric(name, checked, setEditEmpleadoData); // Manejador para checkbox
        // Opciones dinámicas
        if (name === 'puesto') options = puestosList.map(p => ({ value: p.nombre, label: p.nombre }));
        if (name === 'systemUserRol') options = userRoleOptions;
        break;
      case 'newClient': value = newClientData[name as keyof ClienteFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewClientData); break;
      case 'newPuesto': value = newPuestoData[name as keyof PuestoFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewPuestoData); break;
      case 'editPuesto': value = editPuestoData[name as keyof PuestoFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditPuestoData); break;
      case 'newColor': value = newColorData[name as keyof ColorVehiculoFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewColorData); break;
      case 'editColor': value = editColorData[name as keyof ColorVehiculoFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditColorData); break;
      default: value = ''; handleChange = () => {}; handleSelect = () => {}; handleCheckbox = () => {}; // Defaults
    }

    const fieldId = `${formType}_${String(name)}`; // ID único para el input/select/etc.

    // Caso especial para Select de Puestos (en Empleados) y Color (en Órdenes)
    // para asegurar que las opciones se carguen desde el estado correcto
    if (((formType === 'newEmpleado' || formType === 'editEmpleado') && name === 'puesto') ||
        ((formType === 'newOrder' || formType === 'editOrder') && name === 'color')
       ) {
      let currentOptions = options; // Opciones pasadas como argumento (si las hay)
      let isLoadingSource = false; // Para mostrar "Cargando..." si las opciones aún no están listas

      // Sobrescribir opciones y estado de carga si es un campo específico
      if (name === 'puesto') {
        currentOptions = puestosList.map(p => ({ value: p.nombre, label: p.nombre }));
        isLoadingSource = isLoadingPuestos;
      }
      if (name === 'color') {
        currentOptions = coloresList.map(c => ({ value: c.nombre, label: c.nombre }));
        isLoadingSource = isLoadingColores;
      }

      // Renderizado del Select para estos casos especiales
      return (
        <div className={`space-y-1 ${classNameGrid || ''}`}>
          <Label htmlFor={fieldId} className="text-sm font-medium">{label}{isRequired && <span className="text-destructive">*</span>}</Label>
          <Select name={String(name)} onValueChange={handleSelect} value={value || ''} disabled={isDisabled}>
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
    
    // Renderizado general para otros campos
    return (
      <div className={`space-y-1 ${classNameGrid || ''}`}>
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {label}{isRequired && <span className="text-destructive">*</span>}
        </Label>
        {isTextarea ? (
          <Textarea
            id={fieldId}
            name={String(name)}
            placeholder={placeholder}
            value={value || ''} // Asegurar que value no sea undefined
            onChange={handleChange}
            disabled={isDisabled}
            className="mt-1 w-full"
          />
        ) : type === 'select' ? (
          <Select name={String(name)} onValueChange={handleSelect} value={value || ''} disabled={isDisabled}>
            <SelectTrigger id={fieldId} className="w-full mt-1">
              <SelectValue placeholder={placeholder || `Seleccionar ${label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {/* Placeholder si las opciones están cargando (si se implementa) */}
              {/* {isLoadingOptions ? <SelectItem value="loading" disabled>Cargando...</SelectItem> : null} */}
              {options && options.length > 0 ? options.map(opt => (
                <SelectItem key={String(opt.value)} value={String(opt.value)}>{opt.label}</SelectItem>
              )) : <SelectItem value="no_options_available" disabled>No hay opciones disponibles</SelectItem>}
            </SelectContent>
          </Select>
        ) : type === 'checkbox' ? (
          <div className="flex items-center space-x-2 mt-1 pt-1">
             <Checkbox
                id={fieldId}
                name={String(name)}
                checked={!!value} // Asegurar que 'value' sea booleano para 'checked'
                onCheckedChange={(checkedState) => handleCheckbox(typeof checkedState === 'boolean' ? checkedState : false)} // Pasar solo el valor booleano
                disabled={isDisabled}
             />
             {/* Opcional: Se podría añadir una etiqueta aquí si el checkbox no tiene una label global con renderDialogField */}
          </div>
        ) : (
          <Input
            id={fieldId}
            name={String(name)}
            type={type}
            placeholder={placeholder}
            value={value === undefined || value === null ? '' : String(value)} // Convertir a string para el input
            onChange={handleChange}
            disabled={isDisabled}
            className="mt-1 w-full"
            min={type === 'number' ? '0' : undefined} // Para inputs numéricos, no permitir negativos (opcional)
          />
        )}
      </div>
    );
  };

  /**
   * Si los datos de sesión o el rol no están cargados, muestra un mensaje de carga.
   * Este chequeo es crucial antes de renderizar el contenido del dashboard.
   */
  if (!userName || !userRole || !userIdEmpleado) {
    console.log("DashboardPage: userName, userRole, o userIdEmpleado faltan. Mostrando 'Cargando...'");
    return <div className="flex h-screen items-center justify-center">Cargando dashboard...</div>;
  }

  // Define las clases para el TabsList principal según el rol del usuario para un mejor diseño responsivo.
  const mainTabsListClassName = userRole === UserRole.ADMIN ?
    "grid w-full grid-cols-2 sm:grid-cols-4 mb-6 rounded-lg p-1 bg-muted" : // 2x2 en móvil, 4 en línea en SM+
    "grid w-full grid-cols-1 sm:grid-cols-3 mb-6 rounded-lg p-1 bg-muted"; // 1 columna en móvil, 3 en línea en SM+


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
          <TabsContent value="citas">
            <Card className="shadow-lg border-border/50">
              <CardHeader><CardTitle className="text-xl">Gestión de Citas</CardTitle><CardDescription>Programa y visualiza las citas del taller.</CardDescription></CardHeader>
              <CardContent>
                <p>Contenido de la gestión de citas (ej. Calendario, lista de próximas citas).</p>
                {/* Aquí iría el componente de calendario o lista de citas */}
                <Button className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Nueva Cita</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contenido de la Pestaña Órdenes */}
          <TabsContent value="ordenes">
            <Card className="shadow-lg border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                    <CardTitle className="text-xl">Órdenes de Servicio</CardTitle>
                    <CardDescription>Administra todas las órdenes de trabajo del taller.</CardDescription>
                </div>
                <Button size="sm" onClick={() => { setNewOrderData(initialNewOrderData); setIsCreateOrderDialogOpen(true); setAvailableAjustadoresForOrder([]); setAvailableModelosForOrder([]); }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Nueva Orden
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? <p>Cargando órdenes...</p> : orders.length === 0 ? (
                  <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50">
                    <p className="text-muted-foreground">No hay órdenes de servicio registradas.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>OT</TableHead><TableHead>Cliente</TableHead><TableHead>Vehículo</TableHead><TableHead>Placas</TableHead><TableHead>Proceso</TableHead><TableHead>Fecha Reg.</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {orders.map((order) => {
                        const cliente = clients.find(c => c._id === order.idCliente);
                        const marca = marcas.find(m => m._id === order.idMarca);
                        const modelo = marca?.modelos?.find(mod => mod.idModelo === order.idModelo);
                        return (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">OT-{order.idOrder}</TableCell>
                          <TableCell>{cliente?.nombre || order.idCliente || 'N/A'}</TableCell>
                          <TableCell>{marca?.marca || 'N/A'} {modelo?.modelo || order.idModelo || ''}</TableCell>
                          <TableCell>{order.placas || 'N/A'}</TableCell>
                          <TableCell><Badge variant={getProcesoVariant(order.proceso)}>{order.proceso}</Badge></TableCell>
                          <TableCell>{formatDate(order.fechaRegistro)}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => openViewOrderDialog(order._id)} title="Ver Detalles"><EyeIcon className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditOrderDialog(order._id)} title="Editar Orden"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteOrderDialog(order._id)} title="Eliminar Orden"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contenido de la Pestaña Almacén */}
          <TabsContent value="almacen">
            <Card className="shadow-lg border-border/50">
              <CardHeader><CardTitle className="text-xl">Gestión de Almacén</CardTitle><CardDescription>Control de inventario de refacciones y consumibles.</CardDescription></CardHeader>
              <CardContent>
                <p>Contenido de la gestión de almacén (ej. Tabla de refacciones, niveles de stock).</p>
                {/* Aquí iría la tabla de refacciones y controles de inventario */}
                <Button className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Nueva Refacción</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contenido de la Pestaña Admin (condicional si userRole es ADMIN) */}
          {userRole === UserRole.ADMIN && (
            <TabsContent value="admin">
              <Tabs defaultValue="empleados" className="w-full">
                {/* Sub-pestañas dentro de Admin */}
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-4 rounded-md p-1 bg-muted/70">
                  <TabsTrigger value="general" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Settings className="mr-2 h-4 w-4" />Config. General</TabsTrigger>
                  <TabsTrigger value="marcas" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Car className="mr-2 h-4 w-4" />Marcas/Modelos</TabsTrigger>
                  <TabsTrigger value="aseguradoras" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Shield className="mr-2 h-4 w-4"/>Aseguradoras</TabsTrigger>
                  <TabsTrigger value="empleados" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Users className="mr-2 h-4 w-4"/>Empleados</TabsTrigger>
                </TabsList>

                {/* Contenido de Admin -> Config. General */}
                <TabsContent value="general">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Card para Gestión de Puestos */}
                    <Card className="shadow-lg border-border/50">
                      <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div><CardTitle className="text-lg">Gestión de Puestos</CardTitle><CardDescription className="text-xs">Define los puestos de trabajo.</CardDescription></div>
                        <Button size="sm" onClick={() => { setNewPuestoData({nombre: ''}); setIsCreatePuestoDialogOpen(true); }}><Briefcase className="mr-2 h-4 w-4" />Nuevo Puesto</Button>
                      </CardHeader>
                      <CardContent>
                        {isLoadingPuestos ? <p>Cargando...</p> : puestosList.length === 0 ? (
                          <div className="mt-4 flex h-32 items-center justify-center rounded-lg border-2 border-dashed"><p className="text-muted-foreground text-sm">No hay puestos.</p></div>
                        ) : (
                          <Table><TableHeader><TableRow><TableHead>Nombre Puesto</TableHead><TableHead className="text-right w-[80px]">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {puestosList.map((puesto) => (
                              <TableRow key={puesto._id}>
                                <TableCell className="font-medium">{puesto.nombre}</TableCell>
                                <TableCell className="text-right space-x-1">
                                  <Button variant="ghost" size="icon" onClick={() => openEditPuestoDialog(puesto)} title="Editar"><Edit className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="icon" onClick={() => openDeletePuestoDialog(puesto._id)} title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </TableCell>
                              </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                    {/* Card para Gestión de Colores */}
                    <Card className="shadow-lg border-border/50">
                      <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div><CardTitle className="text-lg">Gestión de Colores</CardTitle><CardDescription className="text-xs">Define los colores de vehículos.</CardDescription></div>
                        <Button size="sm" onClick={() => { setNewColorData({nombre: ''}); setIsCreateColorDialogOpen(true); }}><Palette className="mr-2 h-4 w-4" />Nuevo Color</Button>
                      </CardHeader>
                      <CardContent>
                        {isLoadingColores ? <p>Cargando...</p> : coloresList.length === 0 ? (
                          <div className="mt-4 flex h-32 items-center justify-center rounded-lg border-2 border-dashed"><p className="text-muted-foreground text-sm">No hay colores.</p></div>
                        ) : (
                          <Table><TableHeader><TableRow><TableHead>Nombre Color</TableHead><TableHead className="text-right w-[80px]">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {coloresList.map((color) => (
                              <TableRow key={color._id}>
                                <TableCell className="font-medium">{color.nombre}</TableCell>
                                <TableCell className="text-right space-x-1">
                                  <Button variant="ghost" size="icon" onClick={() => openEditColorDialog(color)} title="Editar"><Edit className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="icon" onClick={() => openDeleteColorDialog(color._id)} title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </TableCell>
                              </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Contenido de Admin -> Marcas/Modelos */}
                <TabsContent value="marcas">
                  <Card className="shadow-lg border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div><CardTitle className="text-xl">Gestión de Marcas y Modelos</CardTitle><CardDescription>Administra las marcas de vehículos y sus respectivos modelos.</CardDescription></div>
                        <Button size="sm" onClick={() => { setNewMarcaData({ marca: ''}); setIsCreateMarcaDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4"/>Nueva Marca</Button>
                    </CardHeader>
                    <CardContent>
                        {isLoadingMarcas ? <p>Cargando marcas...</p> : marcas.length === 0 ? (
                            <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay marcas registradas.</p></div>
                        ) : (
                        <Table>
                            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Nombre Marca</TableHead><TableHead>Modelos</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                            {marcas.map((marca) => (
                                <TableRow key={marca._id}>
                                    <TableCell className="font-mono text-xs truncate max-w-[80px]" title={marca._id}>{marca._id.slice(-6)}</TableCell>
                                    <TableCell className="font-medium">{marca.marca}</TableCell>
                                    <TableCell>{marca.modelos?.length || 0}</TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="outline" size="sm" onClick={() => openManageModelosDialog(marca)}><ListChecks className="mr-2 h-4 w-4"/>Modelos</Button>
                                        <Button variant="ghost" size="icon" onClick={() => openEditMarcaDialog(marca)} title="Editar Marca"><Edit className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" onClick={() => openDeleteMarcaDialog(marca._id)} title="Eliminar Marca"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Contenido de Admin -> Aseguradoras */}
                <TabsContent value="aseguradoras">
                    <Card className="shadow-lg border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div><CardTitle className="text-xl">Gestión de Aseguradoras</CardTitle><CardDescription>Administra las compañías aseguradoras y sus ajustadores.</CardDescription></div>
                            <Button size="sm" onClick={() => { setNewAseguradoraData({ nombre: '', telefono: '' }); setIsCreateAseguradoraDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4"/>Nueva Aseguradora</Button>
                        </CardHeader>
                        <CardContent>
                            {isLoadingAseguradoras ? <p>Cargando aseguradoras...</p> : aseguradoras.length === 0 ? (
                                 <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay aseguradoras registradas.</p></div>
                            ) : (
                            <Table>
                                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>Ajustadores</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                                <TableBody>
                                {aseguradoras.map((aseg) => (
                                    <TableRow key={aseg._id}>
                                        <TableCell className="font-mono text-xs truncate max-w-[80px]" title={aseg._id}>{aseg._id.slice(-6)}</TableCell>
                                        <TableCell className="font-medium">{aseg.nombre}</TableCell>
                                        <TableCell>{aseg.telefono || 'N/A'}</TableCell>
                                        <TableCell>{aseg.ajustadores?.length || 0}</TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button variant="outline" size="sm" onClick={() => openManageAjustadoresDialog(aseg)}><ListChecks className="mr-2 h-4 w-4"/>Ajustadores</Button>
                                            <Button variant="ghost" size="icon" onClick={() => openEditAseguradoraDialog(aseg)} title="Editar Aseguradora"><Edit className="h-4 w-4"/></Button>
                                            <Button variant="ghost" size="icon" onClick={() => openDeleteAseguradoraDialog(aseg._id)} title="Eliminar Aseguradora"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Contenido de Admin -> Empleados */}
                <TabsContent value="empleados">
                  <Card className="shadow-lg border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div><CardTitle className="text-xl">Gestión de Empleados</CardTitle><CardDescription>Administra los empleados y su acceso al sistema.</CardDescription></div>
                        <Button size="sm" onClick={() => { setNewEmpleadoData(initialNewEmpleadoData); setIsCreateEmpleadoDialogOpen(true);}}><UserPlus className="mr-2 h-4 w-4"/>Nuevo Empleado</Button>
                    </CardHeader>
                    <CardContent>
                        {isLoadingEmpleadosList ? <p>Cargando empleados...</p> : empleadosList.length === 0 ? (
                            <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay empleados registrados.</p></div>
                        ) : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Puesto</TableHead><TableHead>Usuario Sistema</TableHead><TableHead>Rol Sistema</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                            {empleadosList.map((emp) => (
                                <TableRow key={emp._id}>
                                    <TableCell className="font-medium">{emp.nombre}</TableCell>
                                    <TableCell>{emp.puesto || 'N/A'}</TableCell>
                                    <TableCell>{emp.user?.usuario || <Badge variant="outline">Sin Acceso</Badge>}</TableCell>
                                    <TableCell>{emp.user?.rol || 'N/A'}</TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="icon" onClick={() => openEditEmpleadoDialog(emp._id)} title="Editar Empleado"><Edit className="h-4 w-4"/></Button>
                                        {/* El botón de remover acceso solo aparece si el empleado TIENE un usuario de sistema */}
                                        {emp.user && <Button variant="ghost" size="icon" onClick={() => handleRemoveSystemUser(emp._id)} title="Remover Acceso al Sistema"><UserX className="h-4 w-4 text-orange-500"/></Button>}
                                        <Button variant="ghost" size="icon" onClick={() => openDeleteEmpleadoDialog(emp._id)} title="Eliminar Empleado"><Trash2 className="h-4 w-4 text-destructive"/></Button>
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

      {/* --- DIÁLOGOS ÓRDENES DE SERVICIO --- */}
      {/* Diálogo para Crear Nueva Orden */}
      <Dialog open={isCreateOrderDialogOpen} onOpenChange={(open) => { setIsCreateOrderDialogOpen(open); if (!open) { setNewOrderData(initialNewOrderData); setAvailableAjustadoresForOrder([]); setAvailableModelosForOrder([]); setIsNewOrderClientComboboxOpen(false);}}}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear Nueva Orden de Servicio</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {/* Campo Cliente con Combobox y Botón Nuevo */}
            <div className="space-y-1 col-span-1 md:col-span-2 lg:col-span-1">
              <Label htmlFor="newOrder_idCliente" className="text-sm font-medium">Cliente<span className="text-destructive">*</span></Label>
              <div className="flex items-center space-x-2">
                <Popover open={isNewOrderClientComboboxOpen} onOpenChange={setIsNewOrderClientComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={isNewOrderClientComboboxOpen} className="w-full justify-between flex-1">
                      {newOrderData.idCliente ? clients.find((client) => client._id === newOrderData.idCliente)?.nombre : "Seleccionar cliente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." />
                      <CommandList>
                        <CommandEmpty>No se encontró ningún cliente.</CommandEmpty>
                        <CommandGroup>
                          {clients.map((client) => (
                            <CommandItem
                              key={client._id}
                              value={client.nombre} // Usar nombre para búsqueda/filtrado de CMDK
                              onSelect={() => {
                                handleOrderSelectChange("idCliente", client._id, "new");
                                setIsNewOrderClientComboboxOpen(false);
                              }}
                            >{/* Icono de Check si está seleccionado */}
                              <Check className={cn("mr-2 h-4 w-4", newOrderData.idCliente === client._id ? "opacity-100" : "opacity-0")} />
                              {client.nombre}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button type="button" size="sm" variant="outline" onClick={openCreateClientDialog} className="shrink-0"><PlusCircle className="mr-2 h-4 w-4" />Nuevo</Button>
              </div>
            </div>

            {renderDialogField("Aseguradora", "idAseguradora", "select", "Seleccionar aseguradora...", "newOrder", [{value: "", label: "Ninguna/Particular"}, ...aseguradoras.map(a => ({value: a._id, label: a.nombre}))], false, false, false, "col-span-1")}
            {renderDialogField("Ajustador", "idAjustador", "select", "Seleccionar ajustador...", "newOrder", availableAjustadoresForOrder.map(a => ({value: a.idAjustador, label: a.nombre})), false, !newOrderData.idAseguradora || availableAjustadoresForOrder.length === 0, false, "col-span-1")}
            {renderDialogField("No. Siniestro", "siniestro", "text", "Número de siniestro", "newOrder", undefined, false, false, false, "col-span-1")}
            {renderDialogField("No. Póliza", "poliza", "text", "Número de póliza", "newOrder", undefined, false, false, false, "col-span-1")}
            {renderDialogField("Folio Aseguradora", "folio", "text", "Folio de la aseguradora", "newOrder", undefined, false, false, false, "col-span-1")}
            {renderDialogField("Deducible ($)", "deducible", "number", "Monto del deducible", "newOrder", undefined, false, false, false, "col-span-1")}
            {renderDialogField("Asegurado/Tercero", "aseguradoTerceroString", "select", "Indicar tipo", "newOrder", aseguradoTerceroOptions, false, false, true, "col-span-1")}
            {renderDialogField("Marca", "idMarca", "select", "Seleccionar marca...", "newOrder", marcas.map(m => ({value: m._id, label: m.marca})), false, false, true, "col-span-1")}
            {renderDialogField("Modelo", "idModelo", "select", "Seleccionar modelo...", "newOrder", availableModelosForOrder.map(m => ({value: m.idModelo, label: m.modelo})), false, !newOrderData.idMarca || availableModelosForOrder.length === 0, true, "col-span-1")}
            {renderDialogField("Año", "año", "number", "Ej: 2020", "newOrder", undefined, false, false, false, "col-span-1")}
            {renderDialogField("Placas", "placas", "text", "Placas del vehículo", "newOrder", undefined, false, false, false, "col-span-1")}
            {renderDialogField("Color", "color", "select", "Color del vehículo", "newOrder", coloresList.map(c => ({value: c.nombre, label:c.nombre})), false, false, true, "col-span-1")}
            {renderDialogField("VIN", "vin", "text", "Número de serie", "newOrder", undefined, false, false, false, "col-span-1")}
            {renderDialogField("Kilometraje", "kilometraje", "text", "KM del vehículo", "newOrder", undefined, false, false, false, "col-span-1")}
            <div className="col-span-1 flex items-center space-x-2 pt-5"> {/* Usar pt-5 para alinear con label de arriba */}
              {renderDialogField("¿Piso?", "piso", "checkbox", "", "newOrder", undefined, false, false, false, "flex items-center")}
            </div>
            <div className="col-span-1 flex items-center space-x-2 pt-5">
              {renderDialogField("¿Grúa?", "grua", "checkbox", "", "newOrder", undefined, false, false, false, "flex items-center")}
            </div>
            {renderDialogField("Proceso Inicial", "proceso", "select", "Seleccionar proceso...", "newOrder", procesoOptions, false, false, true, "col-span-1")}
            {renderDialogField("Asesor", "idAsesor", "select", "Seleccionar asesor...", "newOrder", asesores.map(a => ({value: a._id, label: a.nombre})), false, userRole === UserRole.ASESOR, true, "col-span-1")}
            {renderDialogField("Valuador", "idValuador", "select", "Seleccionar valuador...", "newOrder", valuadores.map(v => ({value: v._id, label: v.nombre})), false, false, false, "col-span-1")}
            {renderDialogField("Hojalatero", "idHojalatero", "select", "Seleccionar hojalatero...", "newOrder", hojalateros.map(h => ({value: h._id, label: h.nombre})), false, false, false, "col-span-1")}
            {renderDialogField("Pintor", "idPintor", "select", "Seleccionar pintor...", "newOrder", pintores.map(p => ({value: p._id, label: p.nombre})), false, false, false, "col-span-1")}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateOrder}>Crear Orden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Editar Orden */}
      <Dialog open={isEditOrderDialogOpen} onOpenChange={(open) => { setIsEditOrderDialogOpen(open); if(!open) { setCurrentOrder(null); setAvailableAjustadoresForOrder([]); setAvailableModelosForOrder([]); setIsEditOrderClientComboboxOpen(false); } }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Orden de Servicio OT-{currentOrder?.idOrder}</DialogTitle></DialogHeader>
          {currentOrder && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              {/* Campo Cliente con Combobox y Botón Nuevo para Edición */}
              <div className="space-y-1 col-span-1 md:col-span-2 lg:col-span-1">
                <Label htmlFor="editOrder_idCliente" className="text-sm font-medium">Cliente<span className="text-destructive">*</span></Label>
                <div className="flex items-center space-x-2">
                  <Popover open={isEditOrderClientComboboxOpen} onOpenChange={setIsEditOrderClientComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={isEditOrderClientComboboxOpen} className="w-full justify-between flex-1">
                        {editOrderData.idCliente ? clients.find((client) => client._id === editOrderData.idCliente)?.nombre : "Seleccionar cliente..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar cliente..." />
                        <CommandList>
                          <CommandEmpty>No se encontró ningún cliente.</CommandEmpty>
                          <CommandGroup>
                            {clients.map((client) => (
                              <CommandItem
                                key={client._id}
                                value={client.nombre} // Usar nombre para búsqueda/filtrado
                                onSelect={() => {
                                  handleOrderSelectChange("idCliente", client._id, "edit");
                                  setIsEditOrderClientComboboxOpen(false);
                                }}
                              >{/* Icono de Check si está seleccionado */}
                                <Check className={cn("mr-2 h-4 w-4", editOrderData.idCliente === client._id ? "opacity-100" : "opacity-0")}/>
                                {client.nombre}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button type="button" size="sm" variant="outline" onClick={openCreateClientDialog} className="shrink-0"><PlusCircle className="mr-2 h-4 w-4" />Nuevo</Button>
                </div>
              </div>
              {renderDialogField("Aseguradora", "idAseguradora", "select", "Seleccionar aseguradora...", "editOrder", [{value: "", label: "Ninguna/Particular"}, ...aseguradoras.map(a => ({value: a._id, label: a.nombre}))], false, false, false, "col-span-1")}
              {renderDialogField("Ajustador", "idAjustador", "select", "Seleccionar ajustador...", "editOrder", availableAjustadoresForOrder.map(a => ({value: a.idAjustador, label: a.nombre})), false, !editOrderData.idAseguradora || availableAjustadoresForOrder.length === 0, false, "col-span-1")}
              {renderDialogField("No. Siniestro", "siniestro", "text", "Número de siniestro", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("No. Póliza", "poliza", "text", "Número de póliza", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("Folio Aseguradora", "folio", "text", "Folio de la aseguradora", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("Deducible ($)", "deducible", "number", "Monto del deducible", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("Asegurado/Tercero", "aseguradoTerceroString", "select", "Indicar tipo", "editOrder", aseguradoTerceroOptions, false, false, true, "col-span-1")}
              {renderDialogField("Marca", "idMarca", "select", "Seleccionar marca...", "editOrder", marcas.map(m => ({value: m._id, label: m.marca})), false, false, true, "col-span-1")}
              {renderDialogField("Modelo", "idModelo", "select", "Seleccionar modelo...", "editOrder", availableModelosForOrder.map(m => ({value: m.idModelo, label: m.modelo})), false, !editOrderData.idMarca || availableModelosForOrder.length === 0, true, "col-span-1")}
              {renderDialogField("Año", "año", "number", "Ej: 2020", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("Placas", "placas", "text", "Placas del vehículo", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("Color", "color", "select", "Color del vehículo", "editOrder", coloresList.map(c => ({value: c.nombre, label:c.nombre})), false, false, true, "col-span-1")}
              {renderDialogField("VIN", "vin", "text", "Número de serie", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("Kilometraje", "kilometraje", "text", "KM del vehículo", "editOrder", undefined, false, false, false, "col-span-1")}
              <div className="col-span-1 flex items-center space-x-2 pt-5">
                {renderDialogField("¿Piso?", "piso", "checkbox", "", "editOrder", undefined, false, false, false, "flex items-center")}
              </div>
              <div className="col-span-1 flex items-center space-x-2 pt-5">
                {renderDialogField("¿Grúa?", "grua", "checkbox", "", "editOrder", undefined, false, false, false, "flex items-center")}
              </div>
              {renderDialogField("Proceso", "proceso", "select", "Seleccionar proceso...", "editOrder", procesoOptions, false, false, true, "col-span-1")}
              {renderDialogField("Asesor", "idAsesor", "select", "Seleccionar asesor...", "editOrder", asesores.map(a => ({value: a._id, label: a.nombre})), false, userRole === UserRole.ASESOR && currentOrder?.idAsesor === userIdEmpleado, true, "col-span-1")}
              {renderDialogField("Valuador", "idValuador", "select", "Seleccionar valuador...", "editOrder", valuadores.map(v => ({value: v._id, label: v.nombre})), false, false, false, "col-span-1")}
              {renderDialogField("Hojalatero", "idHojalatero", "select", "Seleccionar hojalatero...", "editOrder", hojalateros.map(h => ({value: h._id, label: h.nombre})), false, false, false, "col-span-1")}
              {renderDialogField("Pintor", "idPintor", "select", "Seleccionar pintor...", "editOrder", pintores.map(p => ({value: p._id, label: p.nombre})), false, false, false, "col-span-1")}
              {renderDialogField("Fecha Valuación", "fechaValuacion", "date", "", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("Fecha Reingreso", "fechaReingreso", "date", "", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("Fecha Promesa", "fechaPromesa", "date", "", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("Fecha Entrega", "fechaEntrega", "date", "", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("Fecha Baja", "fechaBaja", "date", "", "editOrder", undefined, false, false, false, "col-span-1")}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateOrder}>Actualizar Orden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Ver Detalles de Orden */}
      <Dialog open={isViewOrderDialogOpen} onOpenChange={(open) => { setIsViewOrderDialogOpen(open); if(!open) setCurrentOrder(null); }}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalles de Orden OT-{currentOrder?.idOrder}</DialogTitle></DialogHeader>
          {currentOrder && (
            <div className="space-y-6 py-4">
              {/* Sección Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Cliente</h3>
                  <p><strong>Nombre:</strong> {clients.find(c=>c._id === currentOrder.idCliente)?.nombre || 'N/A'}</p>
                  <p><strong>Teléfono:</strong> {clients.find(c=>c._id === currentOrder.idCliente)?.telefono || 'N/A'}</p>
                  <p><strong>Correo:</strong> {clients.find(c=>c._id === currentOrder.idCliente)?.correo || 'N/A'}</p>
                </div>
                {/* Sección Aseguradora / Siniestro */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Aseguradora / Siniestro</h3>
                  <p><strong>Aseguradora:</strong> {aseguradoras.find(a=>a._id === currentOrder.idAseguradora)?.nombre || 'Particular'}</p>
                  <p><strong>Ajustador:</strong> {availableAjustadoresForOrder.find(aj => aj.idAjustador === currentOrder.idAjustador)?.nombre || 'N/A'}</p>
                  <p><strong>Póliza:</strong> {currentOrder.poliza || 'N/A'}</p>
                  <p><strong>Siniestro:</strong> {currentOrder.siniestro || 'N/A'}</p>
                  <p><strong>Folio:</strong> {currentOrder.folio || 'N/A'}</p>
                  <p><strong>Deducible:</strong> ${currentOrder.deducible?.toLocaleString() || '0.00'}</p>
                  <p><strong>Tipo:</strong> {currentOrder.aseguradoTercero ? 'Asegurado' : 'Tercero'}</p>
                </div>
              </div>

              {/* Sección Vehículo */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-primary">Vehículo</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <p><strong>Marca:</strong> {marcas.find(m=>m._id === currentOrder.idMarca)?.marca || 'N/A'}</p>
                  <p><strong>Modelo:</strong> {availableModelosForOrder.find(mod => mod.idModelo === currentOrder.idModelo)?.modelo || 'N/A'}</p>
                  <p><strong>Año:</strong> {currentOrder.año || 'N/A'}</p>
                  <p><strong>Placas:</strong> {currentOrder.placas || 'N/A'}</p>
                  <p><strong>VIN:</strong> {currentOrder.vin || 'N/A'}</p>
                  <p><strong>Color:</strong> {currentOrder.color || 'N/A'}</p>
                  <p><strong>Kilometraje:</strong> {currentOrder.kilometraje || 'N/A'}</p>
                  <p><strong>En Piso:</strong> {currentOrder.piso ? 'Sí' : 'No'}</p>
                  <p><strong>Llegó en Grúa:</strong> {currentOrder.grua ? 'Sí' : 'No'}</p>
                </div>
              </div>

              {/* Sección Estado y Personal Técnico */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Estado y Proceso</h3>
                  <p><strong>Proceso Actual:</strong> <Badge variant={getProcesoVariant(currentOrder.proceso)}>{currentOrder.proceso}</Badge></p>
                  <p><strong>Asesor:</strong> {empleadosList.find(e=>e._id === currentOrder.idAsesor)?.nombre || 'N/A'}</p>
                  <p><strong>Valuador:</strong> {empleadosList.find(e=>e._id === currentOrder.idValuador)?.nombre || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Personal Técnico Asignado</h3>
                  <p><strong>Hojalatero:</strong> {empleadosList.find(e=>e._id === currentOrder.idHojalatero)?.nombre || 'N/A'}</p>
                  <p><strong>Pintor:</strong> {empleadosList.find(e=>e._id === currentOrder.idPintor)?.nombre || 'N/A'}</p>
                </div>
              </div>

              {/* Sección Fechas Clave */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-primary">Fechas Clave</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <p><strong>Registro:</strong> {formatDate(currentOrder.fechaRegistro)}</p>
                    <p><strong>Valuación:</strong> {currentOrder.fechaValuacion ? formatDate(currentOrder.fechaValuacion) : 'Pendiente'}</p>
                    <p><strong>Promesa:</strong> {currentOrder.fechaPromesa ? formatDate(currentOrder.fechaPromesa) : 'Pendiente'}</p>
                    <p><strong>Reingreso:</strong> {currentOrder.fechaReingreso ? formatDate(currentOrder.fechaReingreso) : 'N/A'}</p>
                    <p><strong>Entrega:</strong> {currentOrder.fechaEntrega ? formatDate(currentOrder.fechaEntrega) : 'Pendiente'}</p>
                    <p><strong>Baja:</strong> {currentOrder.fechaBaja ? formatDate(currentOrder.fechaBaja) : 'N/A'}</p>
                </div>
              </div>

              {/* Sección Historial de Cambios (Log) */}
              {currentOrder.Log && currentOrder.Log.length > 0 && (
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg mb-2 text-primary">Historial de Cambios</h3>
                    <ScrollArea className="h-40">
                    <ul className="space-y-2">
                        {currentOrder.Log.map((logEntry, index) => (
                        <li key={index} className="text-sm border-b pb-1">
                            <span className="font-medium">{formatDateTime(logEntry.timestamp)}</span> -
                            <span className="text-muted-foreground"> {empleadosList.find(e => e._id === logEntry.userId)?.nombre || 'Sistema'}: </span>
                            {logEntry.action}
                        </li>
                        ))}
                    </ul>
                    </ScrollArea>
                </div>
              )}
              {/* Sección Presupuestos (resumen) */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-primary">Presupuestos</h3>
                {currentOrder.presupuestos && currentOrder.presupuestos.length > 0 ? (
                    <Table>
                        <TableHeader><TableRow><TableHead>Concepto</TableHead><TableHead>Cant.</TableHead><TableHead>Precio P.</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {currentOrder.presupuestos.map((item, idx) =>(
                                <TableRow key={(item.concepto || 'item') + idx}>
                                    <TableCell>{item.concepto}</TableCell>
                                    <TableCell>{item.cantidad}</TableCell>
                                    <TableCell>${item.precioPublico?.toLocaleString() || '0.00'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : <p className="text-muted-foreground">No hay presupuestos registrados para esta orden.</p>}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para confirmar eliminación de orden */}
      <Dialog open={isDeleteOrderDialogOpen} onOpenChange={setIsDeleteOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar la orden OT-{orders.find(o => o._id === orderToDeleteId)?.idOrder}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteOrder}>Eliminar Orden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* --- DIÁLOGOS MARCAS Y MODELOS --- */}
      <Dialog open={isCreateMarcaDialogOpen} onOpenChange={setIsCreateMarcaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nueva Marca</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre de la Marca", "marca", "text", "Ej: Toyota", "newMarca", undefined, false, false, true)}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateMarca}>Crear Marca</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditMarcaDialogOpen} onOpenChange={(open) => { setIsEditMarcaDialogOpen(open); if(!open) setCurrentMarca(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Marca: {currentMarca?.marca}</DialogTitle></DialogHeader>
          {currentMarca && (
            <div className="space-y-4 py-4">
              {renderDialogField("Nombre de la Marca", "marca", "text", currentMarca.marca, "editMarca", undefined, false, false, true)}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateMarca}>Actualizar Marca</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteMarcaDialogOpen} onOpenChange={setIsDeleteMarcaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Seguro que deseas eliminar la marca "{marcas.find(m => m._id === marcaToDeleteId)?.marca}" y todos sus modelos? Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteMarca}>Eliminar Marca</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para gestionar Modelos */}
      <Dialog open={isManageModelosDialogOpen} onOpenChange={(open) => { setIsManageModelosDialogOpen(open); if(!open) setCurrentMarca(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Gestionar Modelos de: {currentMarca?.marca}</DialogTitle></DialogHeader>
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => { setNewModeloData({ modelo: ''}); setIsCreateModeloDialogOpen(true);}}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Modelo</Button>
          </div>
          {currentMarca?.modelos && currentMarca.modelos.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>ID Modelo</TableHead><TableHead>Nombre Modelo</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {currentMarca.modelos.map(modelo => (
                  <TableRow key={modelo.idModelo}>
                    <TableCell className="font-mono text-xs truncate max-w-[100px]" title={modelo.idModelo}>{modelo.idModelo}</TableCell>
                    <TableCell>{modelo.modelo}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditModeloDialog(modelo)} title="Editar Modelo"><Edit className="h-4 w-4"/></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteModelo(modelo.idModelo)} title="Eliminar Modelo"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-muted-foreground text-center py-4">No hay modelos para esta marca.</p>}
          <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para crear Modelo */}
      <Dialog open={isCreateModeloDialogOpen} onOpenChange={(open) => {setIsCreateModeloDialogOpen(open); if(!open) setNewModeloData({modelo: ''});}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Añadir Nuevo Modelo a {currentMarca?.marca}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre del Modelo", "modelo", "text", "Ej: Corolla", "newModelo", undefined, false, false, true)}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateModelo}>Añadir Modelo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para editar Modelo */}
      <Dialog open={isEditModeloDialogOpen} onOpenChange={(open) => { setIsEditModeloDialogOpen(open); if(!open) setCurrentModelo(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Modelo: {currentModelo?.modelo}</DialogTitle></DialogHeader>
          {currentModelo && (
            <div className="space-y-4 py-4">
              {renderDialogField("Nombre del Modelo", "modelo", "text", currentModelo.modelo, "editModelo", undefined, false, false, true)}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateModelo}>Actualizar Modelo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIÁLOGOS ASEGURADORAS Y AJUSTADORES --- */}
      <Dialog open={isCreateAseguradoraDialogOpen} onOpenChange={setIsCreateAseguradoraDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nueva Aseguradora</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre Aseguradora", "nombre", "text", "Ej: GNP Seguros", "newAseguradora", undefined, false, false, true)}
            {renderDialogField("Teléfono", "telefono", "text", "Ej: 5512345678", "newAseguradora")}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateAseguradora}>Crear Aseguradora</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditAseguradoraDialogOpen} onOpenChange={(open) => { setIsEditAseguradoraDialogOpen(open); if(!open) setCurrentAseguradora(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Aseguradora: {currentAseguradora?.nombre}</DialogTitle></DialogHeader>
          {currentAseguradora && (<div className="space-y-4 py-4">
              {renderDialogField("Nombre Aseguradora", "nombre", "text", currentAseguradora.nombre, "editAseguradora", undefined, false, false, true)}
              {renderDialogField("Teléfono", "telefono", "text", currentAseguradora.telefono, "editAseguradora")}
          </div>)}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateAseguradora}>Actualizar Aseguradora</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteAseguradoraDialogOpen} onOpenChange={setIsDeleteAseguradoraDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Seguro que deseas eliminar la aseguradora "{aseguradoras.find(a => a._id === aseguradoraToDeleteId)?.nombre}" y todos sus ajustadores? Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteAseguradora}>Eliminar Aseguradora</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para gestionar Ajustadores */}
      <Dialog open={isManageAjustadoresDialogOpen} onOpenChange={(open) => { setIsManageAjustadoresDialogOpen(open); if(!open) setCurrentAseguradora(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Gestionar Ajustadores de: {currentAseguradora?.nombre}</DialogTitle></DialogHeader>
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => { setNewAjustadorData({ nombre: '', telefono: '', correo: ''}); setIsCreateAjustadorDialogOpen(true);}}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Ajustador</Button>
          </div>
          {currentAseguradora?.ajustadores && currentAseguradora.ajustadores.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>ID Ajustador</TableHead><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>Correo</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {currentAseguradora.ajustadores.map(aj => (
                  <TableRow key={aj.idAjustador}>
                    <TableCell className="font-mono text-xs truncate max-w-[100px]" title={aj.idAjustador}>{aj.idAjustador}</TableCell><TableCell>{aj.nombre}</TableCell><TableCell>{aj.telefono || 'N/A'}</TableCell><TableCell>{aj.correo || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditAjustadorDialog(aj)} title="Editar Ajustador"><Edit className="h-4 w-4"/></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAjustador(aj.idAjustador)} title="Eliminar Ajustador"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-muted-foreground text-center py-4">No hay ajustadores para esta aseguradora.</p>}
          <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para crear Ajustador */}
      <Dialog open={isCreateAjustadorDialogOpen} onOpenChange={(open) => {setIsCreateAjustadorDialogOpen(open); if(!open) setNewAjustadorData({ nombre: '', telefono: '', correo: ''});}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Añadir Nuevo Ajustador a {currentAseguradora?.nombre}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre Ajustador", "nombre", "text", "Nombre completo", "newAjustador", undefined, false, false, true)}
            {renderDialogField("Teléfono", "telefono", "text", "Teléfono de contacto", "newAjustador")}
            {renderDialogField("Correo", "correo", "email", "Correo electrónico", "newAjustador")}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateAjustador}>Añadir Ajustador</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para editar Ajustador */}
      <Dialog open={isEditAjustadorDialogOpen} onOpenChange={(open) => { setIsEditAjustadorDialogOpen(open); if(!open) setCurrentAjustador(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Ajustador: {currentAjustador?.nombre}</DialogTitle></DialogHeader>
          {currentAjustador && (<div className="space-y-4 py-4">
            {renderDialogField("Nombre Ajustador", "nombre", "text", currentAjustador.nombre, "editAjustador", undefined, false, false, true)}
            {renderDialogField("Teléfono", "telefono", "text", currentAjustador.telefono, "editAjustador")}
            {renderDialogField("Correo", "correo", "email", currentAjustador.correo, "editAjustador")}
          </div>)}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateAjustador}>Actualizar Ajustador</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIÁLOGOS EMPLEADOS --- */}
      <Dialog open={isCreateEmpleadoDialogOpen} onOpenChange={(open) => { setIsCreateEmpleadoDialogOpen(open); if (!open) setNewEmpleadoData(initialNewEmpleadoData); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear Nuevo Empleado</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">{renderDialogField("Nombre Completo", "nombre", "text", "Nombre del empleado", "newEmpleado", undefined, false, false, true)}</div>
            <div className="space-y-1">{renderDialogField("Puesto", "puesto", "select", "Seleccionar puesto...", "newEmpleado", puestosList.map(p => ({value: p.nombre, label: p.nombre})), false, false, true)}</div>
            <div className="space-y-1">{renderDialogField("Teléfono", "telefono", "text", "Teléfono de contacto", "newEmpleado")}</div>
            <div className="space-y-1">{renderDialogField("Correo", "correo", "email", "Correo electrónico", "newEmpleado")}</div>
            <div className="space-y-1">{renderDialogField("Sueldo ($)", "sueldo", "number", "Sueldo mensual", "newEmpleado")}</div>
            <div className="space-y-1">{renderDialogField("Comisión (%)", "comision", "number", "Porcentaje de comisión", "newEmpleado")}</div>

            {/* Sección para crear acceso al sistema */}
            <div className="my-2 border-t pt-4">
              <div className="flex items-center space-x-2">
                {renderDialogField("Crear acceso al sistema", "createSystemUser", "checkbox", "", "newEmpleado")}
              </div>
            </div>

            {/* Campos de credenciales de sistema (visibles si createSystemUser es true) */}
            {newEmpleadoData.createSystemUser && (
              <>
                <div className="space-y-1">{renderDialogField("Nombre de Usuario", "systemUserUsuario", "text", "usuario_login", "newEmpleado", undefined, false, false, true)}</div>
                <div className="space-y-1">{renderDialogField("Contraseña", "systemUserContraseña", "password", "••••••••", "newEmpleado", undefined, false, false, true)}</div>
                <div className="space-y-1">{renderDialogField("Confirmar Contraseña", "systemUserConfirmContraseña", "password", "••••••••", "newEmpleado", undefined, false, false, true)}</div>
                <div className="space-y-1">{renderDialogField("Rol en Sistema", "systemUserRol", "select", "Seleccionar rol...", "newEmpleado", userRoleOptions, false, false, true)}</div>
              </>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateEmpleado}>Crear Empleado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditEmpleadoDialogOpen} onOpenChange={(open) => { setIsEditEmpleadoDialogOpen(open); if (!open) setCurrentEmpleadoToEdit(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Empleado: {currentEmpleadoToEdit?.nombre}</DialogTitle></DialogHeader>
          {currentEmpleadoToEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-1">{renderDialogField("Nombre Completo", "nombre", "text", currentEmpleadoToEdit.nombre, "editEmpleado", undefined, false, false, true)}</div>
              <div className="space-y-1">{renderDialogField("Puesto", "puesto", "select", currentEmpleadoToEdit.puesto, "editEmpleado", puestosList.map(p => ({value: p.nombre, label: p.nombre})), false, false, true)}</div>
              <div className="space-y-1">{renderDialogField("Teléfono", "telefono", "text", currentEmpleadoToEdit.telefono, "editEmpleado")}</div>
              <div className="space-y-1">{renderDialogField("Correo", "correo", "email", currentEmpleadoToEdit.correo, "editEmpleado")}</div>
              <div className="space-y-1">{renderDialogField("Sueldo ($)", "sueldo", "number", currentEmpleadoToEdit.sueldo?.toString(), "editEmpleado")}</div>
              <div className="space-y-1">{renderDialogField("Comisión (%)", "comision", "number", currentEmpleadoToEdit.comision?.toString(), "editEmpleado")}</div>

              {/* Sección para gestionar acceso al sistema */}
              <div className="my-2 border-t pt-4">
                <div className="flex items-center space-x-2 mb-2">
                    {/* El checkbox indica si se quieren gestionar datos de usuario (crear si no existe, o preparar para modificar) */}
                    {renderDialogField(currentEmpleadoToEdit.user ? 'Modificar acceso al sistema' : 'Crear acceso al sistema', "createSystemUser", "checkbox", "", "editEmpleado")}
                </div>

                {/* Campos de credenciales visibles si createSystemUser está marcado */}
                {editEmpleadoData.createSystemUser && (
                  <>
                    <div className="space-y-1">{renderDialogField("Nombre de Usuario", "systemUserUsuario", "text", currentEmpleadoToEdit.user?.usuario, "editEmpleado", undefined, false, !currentEmpleadoToEdit.user, true)}</div>
                    <div className="space-y-1">{renderDialogField("Rol en Sistema", "systemUserRol", "select", currentEmpleadoToEdit.user?.rol, "editEmpleado", userRoleOptions, false, false, true)}</div>
                    {/* Campos para nueva contraseña (solo si se desea cambiar) */}
                    <div className="mt-2 space-y-1">
                        <Label htmlFor="editEmp_newPass">Nueva Contraseña (dejar en blanco para no cambiar)</Label>
                        <Input id="editEmp_newPass" name="newSystemUserContraseña" type="password" placeholder="••••••••" value={editEmpleadoData.newSystemUserContraseña || ''} onChange={(e) => handleInputChangeGeneric(e, setEditEmpleadoData)} />
                    </div>
                    <div className="mt-2 space-y-1">
                        <Label htmlFor="editEmp_confirmNewPass">Confirmar Nueva Contraseña</Label>
                        <Input id="editEmp_confirmNewPass" name="newSystemUserConfirmContraseña" type="password" placeholder="••••••••" value={editEmpleadoData.newSystemUserConfirmContraseña || ''} onChange={(e) => handleInputChangeGeneric(e, setEditEmpleadoData)} />
                    </div>
                  </>
                )}
                 {/* Botón para remover acceso si el empleado ya tiene usuario y el checkbox NO está marcado */}
                 {currentEmpleadoToEdit.user && !editEmpleadoData.createSystemUser && (
                    <Button variant="link" size="sm" className="text-orange-600 p-0 h-auto mt-2" onClick={() => handleRemoveSystemUser(currentEmpleadoToEdit._id)}>Remover Acceso al Sistema Actual</Button>
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
      <Dialog open={isDeleteEmpleadoDialogOpen} onOpenChange={setIsDeleteEmpleadoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar al empleado "{empleadosList.find(e => e._id === empleadoToDeleteId)?.nombre}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteEmpleado}>Eliminar Empleado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIÁLOGO CREAR CLIENTE (desde formulario de orden) --- */}
      <Dialog open={isCreateClientDialogOpen} onOpenChange={setIsCreateClientDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nuevo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre Completo", "nombre", "text", "Nombre del cliente", "newClient", undefined, false, false, true)}
            {renderDialogField("Teléfono", "telefono", "text", "Teléfono de contacto", "newClient")}
            {renderDialogField("Correo Electrónico", "correo", "email", "ejemplo@correo.com", "newClient")}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateClient}>Guardar Cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIÁLOGOS PARA GESTIÓN DE PUESTOS --- */}
      <Dialog open={isCreatePuestoDialogOpen} onOpenChange={setIsCreatePuestoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nuevo Puesto</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre del Puesto", "nombre", "text", "Ej: Hojalatero", "newPuesto", undefined, false, false, true)}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreatePuesto}>Crear Puesto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditPuestoDialogOpen} onOpenChange={(open) => { setIsEditPuestoDialogOpen(open); if (!open) setCurrentPuestoToEdit(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Puesto: {currentPuestoToEdit?.nombre}</DialogTitle></DialogHeader>
          {currentPuestoToEdit && (
            <div className="space-y-4 py-4">
              {renderDialogField("Nombre del Puesto", "nombre", "text", currentPuestoToEdit.nombre, "editPuesto", undefined, false, false, true)}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdatePuesto}>Actualizar Puesto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeletePuestoDialogOpen} onOpenChange={setIsDeletePuestoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar el puesto "{puestosList.find(p => p._id === puestoToDeleteId)?.nombre}"?
              Esta acción no se puede deshacer y podría afectar a empleados que tengan este puesto asignado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeletePuesto}>Eliminar Puesto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       {/* --- DIÁLOGOS PARA GESTIÓN DE COLORES DE VEHÍCULO --- */}
      <Dialog open={isCreateColorDialogOpen} onOpenChange={setIsCreateColorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nuevo Color de Vehículo</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre del Color", "nombre", "text", "Ej: Rojo Brillante", "newColor", undefined, false, false, true)}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateColor}>Crear Color</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditColorDialogOpen} onOpenChange={(open) => { setIsEditColorDialogOpen(open); if (!open) setCurrentColorToEdit(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Color: {currentColorToEdit?.nombre}</DialogTitle></DialogHeader>
          {currentColorToEdit && (
            <div className="space-y-4 py-4">
              {renderDialogField("Nombre del Color", "nombre", "text", currentColorToEdit.nombre, "editColor", undefined, false, false, true)}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateColor}>Actualizar Color</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteColorDialogOpen} onOpenChange={setIsDeleteColorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar el color "{coloresList.find(c => c._id === colorToDeleteId)?.nombre}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteColor}>Eliminar Color</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

