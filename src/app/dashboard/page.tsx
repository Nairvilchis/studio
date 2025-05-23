
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
  UpdateClienteData,
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
  getMarcaByIdAction as getMarcaForModelosAction,
  getModelosByMarcaAction,
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
  getAseguradoraByIdAction as getAseguradoraForAjustadoresAction,
} from './admin/aseguradoras/actions';
// Clientes
import {
  getAllClientsAction,
  createClienteAction,
  getClienteByIdAction as getClienteForEditAction,
  updateClienteAction,
  deleteClienteAction
} from './admin/clients/actions';
// Empleados
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

/**
 * Tipo de datos para el formulario de creación/edición de Órdenes de Servicio.
 * Representa los campos que el usuario puede llenar en la UI.
 * Varios campos son string para facilitar el manejo en inputs, y se convierten
 * a números o booleanos antes de enviar a las actions del servidor.
 */
type OrderFormDataType = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'Log' | 'presupuestos' | 'aseguradoTercero' | 'deducible' | 'año'>> & {
  // Campos que son números pero se manejan como string en el input
  año?: string;
  deducible?: string;
  // Campo para manejar el select de asegurado/tercero como string
  aseguradoTerceroString?: 'true' | 'false' | string;
  // Campos de fecha como string en formato YYYY-MM-DD para input type="date"
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

/**
 * Tipo de datos para el formulario de creación de Empleados.
 * Incluye campos para el empleado y, opcionalmente, para crear su usuario de sistema.
 */
type EmpleadoFormDataType = Omit<Empleado, '_id' | 'fechaRegistro' | 'user' | 'sueldo' | 'comision'> & {
  sueldo?: string; // Sueldo como string para el input, se convertirá a número.
  comision?: string; // Comisión como string para el input, se convertirá a número.
  createSystemUser?: boolean; // Checkbox para decidir si se crea un usuario de sistema.
  systemUserUsuario?: string; // Nombre de usuario para el sistema.
  systemUserContraseña?: string; // Contraseña para el sistema.
  systemUserConfirmContraseña?: string; // Confirmación de contraseña.
  systemUserRol?: UserRoleType; // Rol del usuario en el sistema.
};
/**
 * Tipo de datos para el formulario de edición de Empleados.
 * Permite actualizar campos del empleado y, opcionalmente, su usuario de sistema.
 */
type EditEmpleadoFormDataType = Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user' | 'sueldo' | 'comision'>> & {
  sueldo?: string; // Sueldo como string.
  comision?: string; // Comisión como string.
  createSystemUser?: boolean; // Para añadir usuario a un empleado existente sin uno.
  systemUserUsuario?: string; // Para crear o (potencialmente) cambiar username.
  systemUserRol?: UserRoleType; // Para crear o cambiar rol.
  newSystemUserContraseña?: string; // Para establecer/cambiar contraseña.
  newSystemUserConfirmContraseña?: string; // Confirmación de nueva contraseña.
};

/** Tipo de datos para el formulario de creación/edición de Clientes. */
type ClienteFormDataType = Partial<NewClienteData>; // Usa NewClienteData ya que RFC es opcional.

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
  const [userIdEmpleado, setUserIdEmpleado] = useState<string | null>(null); // Este es el _id del Empleado (string)
  const [userRole, setUserRole] = useState<UserRoleType | null>(null);

  // --- Estados para Órdenes de Servicio ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false);
  const [isDeleteOrderDialogOpen, setIsDeleteOrderDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null); // _id de la orden a eliminar
  const [availableAjustadoresForOrder, setAvailableAjustadoresForOrder] = useState<Pick<Ajustador, 'idAjustador' | 'nombre'>[]>([]);
  const [availableModelosForOrder, setAvailableModelosForOrder] = useState<Pick<ModeloVehiculo, 'idModelo' | 'modelo'>[]>([]);
  /** Estado inicial para el formulario de nueva orden. */
  const initialNewOrderData: OrderFormDataType = {
    proceso: 'pendiente', piso: false, grua: false, aseguradoTerceroString: 'true', // 'true' para Asegurado por defecto
  };
  const [newOrderData, setNewOrderData] = useState<OrderFormDataType>(initialNewOrderData);
  const [editOrderData, setEditOrderData] = useState<OrderFormDataType>({});
  const [isNewOrderClientComboboxOpen, setIsNewOrderClientComboboxOpen] = useState(false);
  const [isEditOrderClientComboboxOpen, setIsEditOrderClientComboboxOpen] = useState(false);

  // --- Estados para poblar Selects en formularios de Órdenes ---
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
  const [currentMarca, setCurrentMarca] = useState<MarcaVehiculo | null>(null);
  const [marcaToDeleteId, setMarcaToDeleteId] = useState<string | null>(null); // _id de la marca a eliminar
  const [newMarcaData, setNewMarcaData] = useState<MarcaFormDataType>({ marca: '' });
  const [editMarcaData, setEditMarcaData] = useState<MarcaFormDataType>({});
  const [isManageModelosDialogOpen, setIsManageModelosDialogOpen] = useState(false);
  const [isCreateModeloDialogOpen, setIsCreateModeloDialogOpen] = useState(false);
  const [isEditModeloDialogOpen, setIsEditModeloDialogOpen] = useState(false);
  const [currentModelo, setCurrentModelo] = useState<ModeloVehiculo | null>(null);
  const [newModeloData, setNewModeloData] = useState<Omit<ModeloVehiculo, 'idModelo'>>({ modelo: '' });
  const [editModeloData, setEditModeloData] = useState<Partial<ModeloVehiculo>>({}); // idModelo no se edita aquí, solo el nombre

  // --- Estados para Administración: Aseguradoras y Ajustadores ---
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  const [isLoadingAseguradoras, setIsLoadingAseguradoras] = useState(true);
  const [isCreateAseguradoraDialogOpen, setIsCreateAseguradoraDialogOpen] = useState(false);
  const [isEditAseguradoraDialogOpen, setIsEditAseguradoraDialogOpen] = useState(false);
  const [isDeleteAseguradoraDialogOpen, setIsDeleteAseguradoraDialogOpen] = useState(false);
  const [currentAseguradora, setCurrentAseguradora] = useState<Aseguradora | null>(null);
  const [aseguradoraToDeleteId, setAseguradoraToDeleteId] = useState<string | null>(null); // _id de la aseguradora a eliminar
  const [newAseguradoraData, setNewAseguradoraData] = useState<AseguradoraFormDataType>({ nombre: '', telefono: '' });
  const [editAseguradoraData, setEditAseguradoraData] = useState<AseguradoraFormDataType>({});
  const [isManageAjustadoresDialogOpen, setIsManageAjustadoresDialogOpen] = useState(false);
  const [isCreateAjustadorDialogOpen, setIsCreateAjustadorDialogOpen] = useState(false);
  const [isEditAjustadorDialogOpen, setIsEditAjustadorDialogOpen] = useState(false);
  const [currentAjustador, setCurrentAjustador] = useState<Ajustador | null>(null);
  const [newAjustadorData, setNewAjustadorData] = useState<Omit<Ajustador, 'idAjustador'>>({ nombre: '', telefono: '', correo: '' });
  const [editAjustadorData, setEditAjustadorData] = useState<Partial<Ajustador>>({}); // idAjustador no se edita aquí

  // --- Estados para Administración: Empleados ---
  const [empleadosList, setEmpleadosList] = useState<Empleado[]>([]);
  const [isLoadingEmpleadosList, setIsLoadingEmpleadosList] = useState(true);
  const [isCreateEmpleadoDialogOpen, setIsCreateEmpleadoDialogOpen] = useState(false);
  const [isEditEmpleadoDialogOpen, setIsEditEmpleadoDialogOpen] = useState(false);
  const [isDeleteEmpleadoDialogOpen, setIsDeleteEmpleadoDialogOpen] = useState(false);
  const [currentEmpleadoToEdit, setCurrentEmpleadoToEdit] = useState<Empleado | null>(null);
  /** Estado inicial para el formulario de nuevo empleado. */
  const initialNewEmpleadoData: EmpleadoFormDataType = {
    nombre: '', puesto: '', createSystemUser: false, systemUserUsuario: '', systemUserContraseña: '', systemUserConfirmContraseña: '', systemUserRol: UserRole.ASESOR, // Rol por defecto
  };
  const [newEmpleadoData, setNewEmpleadoData] = useState<EmpleadoFormDataType>(initialNewEmpleadoData);
  const [editEmpleadoData, setEditEmpleadoData] = useState<EditEmpleadoFormDataType>({});
  const [empleadoToDeleteId, setEmpleadoToDeleteId] = useState<string | null>(null); // _id del empleado a eliminar

  // --- Estados para Administración: Clientes (Gestión Completa y Creación Rápida) ---
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false); // Usado también por el botón en Órdenes
  const [newClientData, setNewClientData] = useState<ClienteFormDataType>({ nombre: '', telefono: '', correo: ''});
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false); // Específico para la tabla de Admin/Clientes
  const [currentClientToEdit, setCurrentClientToEdit] = useState<Cliente | null>(null); // Específico para Admin/Clientes
  const [editClientData, setEditClientData] = useState<ClienteFormDataType>({}); // Específico para Admin/Clientes
  const [isDeleteClientDialogOpen, setIsDeleteClientDialogOpen] = useState(false); // Específico para Admin/Clientes
  const [clientToDeleteId, setClientToDeleteId] = useState<string | null>(null); // Específico para Admin/Clientes

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
   * Si la sesión es válida, configura el estado del usuario y llama a `fetchInitialData`.
   * Si no, redirige a la página de inicio.
   */
  useEffect(() => {
    console.log("Dashboard useEffect: Verificando sesión...");
    const loggedIn = localStorage.getItem('isLoggedIn');
    const storedUserName = localStorage.getItem('username');
    const storedEmpleadoId = localStorage.getItem('empleadoId'); // Se espera que sea el _id (string) del Empleado
    const storedUserRole = localStorage.getItem('userRole') as UserRoleType | null;

    console.log("Dashboard useEffect: Valores RAW de localStorage:", {
      loggedIn, storedUserName, storedEmpleadoId, storedUserRole
    });
    
    // Validación robusta de los datos de sesión.
    const isSessionValid =
        loggedIn === 'true' &&
        storedUserName && storedUserName.trim() !== '' &&
        storedEmpleadoId && storedEmpleadoId.trim() !== '' && storedEmpleadoId !== 'null' && storedEmpleadoId !== 'undefined' &&
        storedUserRole && storedUserRole.trim() !== '' && Object.values(UserRole).includes(storedUserRole as UserRole);

    console.log("Dashboard useEffect: Validaciones de sesión:", {
      isLoggedIn: loggedIn === 'true',
      isUserNamePresent: !!(storedUserName && storedUserName.trim() !== ''),
      isEmpleadoIdValid: !!(storedEmpleadoId && storedEmpleadoId.trim() !== '' && storedEmpleadoId !== 'null' && storedEmpleadoId !== 'undefined'),
      isUserRoleValid: !!(storedUserRole && storedUserRole.trim() !== '' && Object.values(UserRole).includes(storedUserRole as UserRole)),
      overallSessionValid: isSessionValid
    });

    if (isSessionValid) {
      console.log("Dashboard useEffect: Usuario logueado. Configurando estado y cargando datos iniciales.");
      setUserName(storedUserName);
      setUserIdEmpleado(storedEmpleadoId); // Guardar el _id del empleado
      setUserRole(storedUserRole);
      fetchInitialData(storedUserRole, storedEmpleadoId);
    } else {
      console.log("Dashboard useEffect: Sesión inválida o datos faltantes. Redirigiendo a /. Detalles:",
        { loggedIn, storedUserName, storedEmpleadoId, storedUserRole }
      );
      // Asegurar que la redirección solo ocurra en el cliente.
      if (typeof window !== 'undefined') {
        router.replace('/');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // Solo depende de router para la redirección


  /**
   * Carga todos los datos iniciales necesarios para el dashboard.
   * Se llama después de que la sesión del usuario ha sido verificada y es válida.
   * @param {UserRoleType | null} role - Rol del usuario actual.
   * @param {string | null} currentUserIdEmpleado - _id (string) del Empleado logueado.
   */
  const fetchInitialData = useCallback(async (role: UserRoleType | null, currentUserIdEmpleado: string | null) => {
    console.log("fetchInitialData: Iniciando carga de datos...", { role, currentUserIdEmpleado });
    // Configurar el idAsesor por defecto en el formulario de nueva orden si el usuario es Asesor.
     setNewOrderData(prev => ({
      ...initialNewOrderData,
      idAsesor: role === UserRole.ASESOR && currentUserIdEmpleado ? currentUserIdEmpleado : undefined,
    }));

    // Establecer todos los estados de carga a true.
    setIsLoadingOrders(true); setIsLoadingMarcas(true); setIsLoadingAseguradoras(true);
    setIsLoadingClients(true); setIsLoadingAsesores(true); setIsLoadingValuadores(true);
    setIsLoadingHojalateros(true); setIsLoadingPintores(true);
    setIsLoadingEmpleadosList(true); setIsLoadingPuestos(true); setIsLoadingColores(true);

    try {
      // Ejecutar todas las promesas de carga de datos en paralelo.
      await Promise.all([
        fetchOrders(),
        fetchMarcas(),
        fetchAseguradoras(),
        fetchClients(),
        fetchAsesores(),
        fetchValuadores(),
        fetchHojalateros(),
        fetchPintores(),
        fetchEmpleados(),
        fetchPuestos(),
        fetchColores(),
      ]);
      console.log("fetchInitialData: Todas las promesas de datos se han resuelto.");
    } catch (error) {
      console.error("fetchInitialData: Error crítico al cargar datos iniciales:", error);
      toast({ title: "Error Crítico de Carga", description: "No se pudieron cargar los datos iniciales del dashboard. Intente recargar la página.", variant: "destructive" });
    } finally {
      console.log("fetchInitialData: Finalizando carga de datos (bloque finally).");
      // Asegurarse de que todos los isLoading se pongan en false, aunque algunos podrían ya estarlo.
      setIsLoadingOrders(false); setIsLoadingMarcas(false); setIsLoadingAseguradoras(false);
      setIsLoadingClients(false); setIsLoadingAsesores(false); setIsLoadingValuadores(false);
      setIsLoadingHojalateros(false); setIsLoadingPintores(false);
      setIsLoadingEmpleadosList(false); setIsLoadingPuestos(false); setIsLoadingColores(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // No es necesario userIdEmpleado aquí como dependencia si solo se pasa como argumento.

  // --- Funciones de Carga de Datos Específicas (fetchers) ---
  /** Carga las órdenes de servicio desde el servidor. */
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
        setOrders([]); // Asegurar que orders sea un array vacío en caso de error.
      }
    } catch (error) {
      console.error("fetchOrders: Error crítico:", error);
      toast({ title: "Error Crítico de Órdenes", description: "Fallo al obtener órdenes de servicio.", variant: "destructive" });
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
      console.log("fetchOrders: Finalizado.");
    }
  };

  /** Carga las marcas de vehículos desde el servidor. */
  const fetchMarcas = async () => {
    console.log("fetchMarcas: Iniciando...");
    setIsLoadingMarcas(true);
    try {
      const result = await getAllMarcasAction();
      console.log("fetchMarcas: Resultado:", result.data ? `${result.data.length} marcas obtenidas` : result.error);
      if (result.success && result.data) {
        setMarcas(result.data);
      } else {
        toast({ title: "Error al Cargar Marcas", description: result.error || "No se pudieron cargar las marcas.", variant: "destructive" });
        setMarcas([]);
      }
    } catch (error) {
      console.error("fetchMarcas: Error crítico:", error);
      toast({ title: "Error Crítico de Marcas", description: "Fallo al obtener marcas.", variant: "destructive" });
      setMarcas([]);
    } finally {
      setIsLoadingMarcas(false);
      console.log("fetchMarcas: Finalizado.");
    }
  };

  /** Carga las aseguradoras desde el servidor. */
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
      console.log("fetchAseguradoras: Finalizado.");
    }
  };

  /** Carga los clientes desde el servidor. */
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
      console.log("fetchClients: Finalizado.");
    }
  };

  /** Carga los empleados con rol de Asesor. */
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
      console.log("fetchAsesores: Finalizado.");
    }
  };

  /** Carga los empleados con rol de Valuador. */
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
      console.log("fetchValuadores: Finalizado.");
    }
  };

  /** Carga los empleados con puesto de Hojalatero. */
  const fetchHojalateros = async () => {
    console.log("fetchHojalateros: Iniciando...");
    setIsLoadingHojalateros(true);
    try {
      const result = await getEmpleadosByPuestoAction("Hojalatero"); // El nombre del puesto debe coincidir exactamente
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
      console.log("fetchHojalateros: Finalizado.");
    }
  };

  /** Carga los empleados con puesto de Pintor. */
  const fetchPintores = async () => {
    console.log("fetchPintores: Iniciando...");
    setIsLoadingPintores(true);
    try {
      const result = await getEmpleadosByPuestoAction("Pintor"); // El nombre del puesto debe coincidir exactamente
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
      console.log("fetchPintores: Finalizado.");
    }
  };

  /** Carga la lista de todos los empleados. */
  const fetchEmpleados = async () => {
    console.log("fetchEmpleados: Iniciando...");
    setIsLoadingEmpleadosList(true);
    try {
      const result = await getAllEmpleadosAction();
      console.log("fetchEmpleados: Resultado:", result.data ? `${result.data.length} empleados obtenidos` : result.error);
      if (result.success && result.data) {
        setEmpleadosList(result.data);
      } else {
        toast({ title: "Error al Cargar Empleados", description: result.error || "No se pudieron cargar los empleados.", variant: "destructive" });
        setEmpleadosList([]);
      }
    } catch (error) {
      console.error("fetchEmpleados: Error crítico:", error);
      toast({ title: "Error Crítico de Empleados", description: "Fallo al obtener empleados.", variant: "destructive" });
      setEmpleadosList([]);
    } finally {
      setIsLoadingEmpleadosList(false);
      console.log("fetchEmpleados: Finalizado.");
    }
  };

  /** Carga la lista de puestos de trabajo configurados. */
  const fetchPuestos = async () => {
    console.log("fetchPuestos: Iniciando...");
    setIsLoadingPuestos(true);
    try {
      const result = await getAllPuestosAction();
      console.log("fetchPuestos: Resultado:", result.data ? `${result.data.length} puestos obtenidos` : result.error);
      if (result.success && result.data) {
        setPuestosList(result.data);
      } else {
        toast({ title: "Error al Cargar Puestos", description: result.error || "No se pudieron cargar los puestos.", variant: "destructive" });
        setPuestosList([]);
      }
    } catch (error) {
      console.error("fetchPuestos: Error crítico:", error);
      toast({ title: "Error Crítico de Puestos", description: "Fallo al obtener puestos.", variant: "destructive" });
      setPuestosList([]);
    } finally {
      setIsLoadingPuestos(false);
      console.log("fetchPuestos: Finalizado.");
    }
  };

  /** Carga la lista de colores de vehículo configurados. */
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
      console.log("fetchColores: Finalizado.");
    }
  };

  /** Maneja el cierre de sesión del usuario. */
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('empleadoId');
    localStorage.removeItem('userRole');
    setUserName(null);
    setUserIdEmpleado(null);
    setUserRole(null);
    router.push('/'); // Redirigir a la página de login
    toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
  };

  /**
   * Manejador genérico para cambios en inputs y textareas de los formularios.
   * Actualiza el estado del formulario correspondiente.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - Evento de cambio.
   * @param {React.Dispatch<React.SetStateAction<any>>} setState - Función para actualizar el estado del formulario.
   */
  const handleInputChangeGeneric = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setState: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;

    // Si el tipo es 'number', convertir a número o mantener como string vacío si el input está vacío.
    if (type === 'number') {
      processedValue = value === '' ? '' : Number(value); // Permitir campo vacío para números, convertir a Number si no
    }
    // Para otros tipos, usar el valor directamente.
    // No se maneja 'checkbox' aquí porque se gestiona con handleCheckboxChangeGeneric.
    setState((prev: any) => ({ ...prev, [name]: processedValue }));
  };
  
  /**
   * Manejador genérico para cambios en checkboxes.
   * @param {string} name - Nombre del campo del checkbox.
   * @param {boolean} checked - Nuevo estado del checkbox.
   * @param {React.Dispatch<React.SetStateAction<any>>} setState - Función para actualizar el estado del formulario.
   */
  const handleCheckboxChangeGeneric = (
    name: string,
    checked: boolean,
    setState: React.Dispatch<React.SetStateAction<any>>
  ) => {
    setState((prev: any) => ({ ...prev, [name]: checked }));
  };

  /**
   * Manejador genérico para cambios en selects.
   * @param {string} name - Nombre del campo del select.
   * @param {string | undefined} value - Nuevo valor seleccionado.
   * @param {React.Dispatch<React.SetStateAction<any>>} setState - Función para actualizar el estado del formulario.
   */
  const handleSelectChangeGeneric = (
    name: string,
    value: string | undefined,
    setState: React.Dispatch<React.SetStateAction<any>>
  ) => {
    setState((prev: any) => ({ ...prev, [name]: value }));
  };

  // --- Funciones de Gestión de Órdenes de Servicio ---
  /**
   * Maneja el cambio en los inputs del formulario de órdenes (nuevas o en edición).
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - Evento del input.
   * @param {'new' | 'edit'} formType - Tipo de formulario ('new' o 'edit').
   */
  const handleOrderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formType: 'new' | 'edit') => {
    const { name, value, type } = e.target;
    const setState = formType === 'new' ? setNewOrderData : setEditOrderData;
    
    let processedValue: string | number | undefined = value;
    if (type === 'number') {
      // Permitir string vacío para que el usuario pueda borrar el número.
      // La conversión a Number se hará al enviar el formulario.
      processedValue = value; 
    } else if (type === 'date') {
        // El valor de input date ya es YYYY-MM-DD, que es lo que queremos para el estado
        processedValue = value;
    }

    setState((prev: OrderFormDataType) => ({ ...prev, [name]: processedValue }));
  };

  /**
   * Maneja el cambio en los checkboxes del formulario de órdenes.
   * @param {keyof OrderFormDataType} name - Nombre del campo.
   * @param {boolean} checked - Nuevo estado del checkbox.
   * @param {'new' | 'edit'} formType - Tipo de formulario.
   */
  const handleOrderCheckboxChange = (name: keyof OrderFormDataType, checked: boolean, formType: 'new' | 'edit') => {
    const setState = formType === 'new' ? setNewOrderData : setEditOrderData;
    setState((prev: OrderFormDataType) => ({ ...prev, [name]: checked }));
  };

  /**
   * Maneja el cambio en los selects del formulario de órdenes.
   * Carga ajustadores o modelos dinámicamente si se selecciona una aseguradora o marca.
   * @param {keyof OrderFormDataType | 'idMarca' | 'idAseguradora'} name - Nombre del campo.
   * @param {string | undefined} value - Nuevo valor seleccionado (_id de la entidad referenciada).
   * @param {'new' | 'edit'} formType - Tipo de formulario.
   */
  const handleOrderSelectChange = async (name: keyof OrderFormDataType | 'idMarca' | 'idAseguradora', value: string | undefined, formType: 'new' | 'edit') => {
    const setState = formType === 'new' ? setNewOrderData : setEditOrderData;
    setState((prev: OrderFormDataType) => ({ ...prev, [name as keyof OrderFormDataType]: value }));

    // Si cambia la Aseguradora, cargar sus ajustadores y limpiar selección de ajustador.
    if (name === 'idAseguradora') {
      setAvailableAjustadoresForOrder([]); // Limpiar ajustadores anteriores
      setState((prev: OrderFormDataType) => ({ ...prev, idAjustador: undefined })); // Limpiar selección
      if (value) { // Solo cargar si se seleccionó una aseguradora
        const result = await getAjustadoresByAseguradora(value);
        if (result.success && result.data) {
          setAvailableAjustadoresForOrder(result.data);
        } else {
          toast({ title: "Error", description: "No se pudieron cargar los ajustadores para la aseguradora seleccionada.", variant: "destructive" });
        }
      }
    }

    // Si cambia la Marca, cargar sus modelos y limpiar selección de modelo.
    if (name === 'idMarca') {
      setAvailableModelosForOrder([]); // Limpiar modelos anteriores
      setState((prev: OrderFormDataType) => ({ ...prev, idModelo: undefined })); // Limpiar selección
      if (value) { // Solo cargar si se seleccionó una marca
        const result = await getModelosByMarcaAction(value);
        if (result.success && result.data) {
          setAvailableModelosForOrder(result.data);
        } else {
          toast({ title: "Error", description: "No se pudieron cargar los modelos para la marca seleccionada.", variant: "destructive" });
        }
      }
    }
  };

  /** Maneja la creación de una nueva orden de servicio. */
  const handleCreateOrder = async () => {
    console.log("handleCreateOrder: Creando orden con datos del formulario:", newOrderData);
    // Validaciones básicas de campos requeridos que son IDs de Selects
    if (!newOrderData.idCliente || !newOrderData.idMarca || !newOrderData.idModelo || !newOrderData.idAsesor || !newOrderData.aseguradoTerceroString) {
      toast({ title: "Campos Requeridos", description: "Cliente, Marca, Modelo, Asesor y tipo (Asegurado/Tercero) son obligatorios.", variant: "destructive"});
      return;
    }

    // Mapeo de datos del formulario (OrderFormDataType) al tipo NewOrderData para la acción del servidor.
    const orderPayload: NewOrderData = {
      // Campos de Aseguradora (todos opcionales en el payload si no se proporcionan)
      idAseguradora: newOrderData.idAseguradora || undefined,
      idAjustador: newOrderData.idAjustador || undefined,
      poliza: newOrderData.poliza || undefined,
      folio: newOrderData.folio || undefined,
      siniestro: newOrderData.siniestro || undefined,
      deducible: newOrderData.deducible ? Number(newOrderData.deducible) : undefined,
      aseguradoTercero: newOrderData.aseguradoTerceroString === 'true', // Convertir string a boolean

      // Campos de Vehículo
      idMarca: newOrderData.idMarca!, // Validado arriba
      idModelo: newOrderData.idModelo!, // Validado arriba
      año: newOrderData.año ? Number(newOrderData.año) : undefined,
      vin: newOrderData.vin || undefined,
      placas: newOrderData.placas || undefined,
      color: newOrderData.color || undefined, // Viene del Select de Colores
      kilometraje: newOrderData.kilometraje || undefined,
      
      // Campos de Cliente y Personal (IDs son strings ObjectId)
      idCliente: newOrderData.idCliente!, // Validado arriba
      idValuador: newOrderData.idValuador || undefined,
      idAsesor: newOrderData.idAsesor!, // Validado arriba
      idHojalatero: newOrderData.idHojalatero || undefined,
      idPintor: newOrderData.idPintor || undefined,

      // Estado y Banderas
      piso: newOrderData.piso || false,
      grua: newOrderData.grua || false,
      proceso: newOrderData.proceso || 'pendiente', // Proceso viene del Select
    };

    // El empleadoLogId es el _id del empleado logueado.
    const result = await createOrderAction(orderPayload, userIdEmpleado || undefined);
    if (result.success && result.data?.orderId) { // orderId es el _id de MongoDB
      toast({ title: "Éxito", description: `Orden OT-${result.data.customOrderId} creada.`});
      fetchOrders(); // Recargar la lista de órdenes
      setIsCreateOrderDialogOpen(false);
      setNewOrderData(initialNewOrderData); // Resetear formulario, incluyendo idAsesor si estaba pre-llenado
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear la orden.", variant: "destructive"});
    }
  };

  /**
   * Abre el diálogo para editar una orden de servicio, cargando sus datos.
   * @param {string} orderId - El _id (string ObjectId) de la orden a editar.
   */
  const openEditOrderDialog = async (orderId: string) => {
    const result = await getOrderByIdAction(orderId); // Obtener la orden por su _id
    if (result.success && result.data) {
      const order = result.data;
      setCurrentOrder(order); // Guardar la orden completa para referencia

      // Transformar los datos de la orden para el formulario de edición (OrderFormDataType)
      setEditOrderData({
        ...order, // Copiar todos los campos compatibles
        aseguradoTerceroString: order.aseguradoTercero ? 'true' : 'false',
        deducible: order.deducible?.toString(), // Convertir número a string para input
        año: order.año?.toString(), // Convertir número a string para input
        // Convertir fechas Date a string YYYY-MM-DD para inputs tipo 'date'
        fechaValuacion: order.fechaValuacion ? formatDate(order.fechaValuacion, 'YYYY-MM-DD') : undefined,
        fechaReingreso: order.fechaReingreso ? formatDate(order.fechaReingreso, 'YYYY-MM-DD') : undefined,
        fechaEntrega: order.fechaEntrega ? formatDate(order.fechaEntrega, 'YYYY-MM-DD') : undefined,
        fechaPromesa: order.fechaPromesa ? formatDate(order.fechaPromesa, 'YYYY-MM-DD') : undefined,
        fechaBaja: order.fechaBaja ? formatDate(order.fechaBaja, 'YYYY-MM-DD') : undefined,
      });

      // Pre-cargar ajustadores y modelos si se seleccionó una aseguradora o marca
      if (order.idAseguradora) {
        const ajustadoresResult = await getAjustadoresByAseguradora(order.idAseguradora);
        if (ajustadoresResult.success && ajustadoresResult.data) setAvailableAjustadoresForOrder(ajustadoresResult.data);
      } else {
        setAvailableAjustadoresForOrder([]);
      }
      if (order.idMarca) {
        const modelosResult = await getModelosByMarcaAction(order.idMarca);
        if (modelosResult.success && modelosResult.data) setAvailableModelosForOrder(modelosResult.data);
      } else {
        setAvailableModelosForOrder([]);
      }
      setIsEditOrderDialogOpen(true); // Abrir el diálogo
    } else {
      toast({ title: "Error", description: "No se pudieron cargar los datos de la orden para editar.", variant: "destructive" });
    }
  };

  /** Maneja la actualización de una orden de servicio existente. */
  const handleUpdateOrder = async () => {
    if (!currentOrder || !currentOrder._id) { // currentOrder debe tener el _id de la orden original
      toast({ title: "Error", description: "No hay orden seleccionada para actualizar.", variant: "destructive"});
      return;
    }
    // Validaciones básicas
    if (!editOrderData.idCliente || !editOrderData.idMarca || !editOrderData.idModelo || !editOrderData.idAsesor || !editOrderData.aseguradoTerceroString) {
      toast({ title: "Campos Requeridos", description: "Cliente, Marca, Modelo, Asesor y tipo (Asegurado/Tercero) son obligatorios.", variant: "destructive"});
      return;
    }

    // Mapeo de datos del formulario (OrderFormDataType) al tipo UpdateOrderData
    const orderPayload: UpdateOrderData = {
        idAseguradora: editOrderData.idAseguradora || undefined,
        idAjustador: editOrderData.idAjustador || undefined,
        poliza: editOrderData.poliza || undefined,
        folio: editOrderData.folio || undefined,
        siniestro: editOrderData.siniestro || undefined,
        piso: editOrderData.piso, // Booleano
        grua: editOrderData.grua, // Booleano
        deducible: editOrderData.deducible ? Number(editOrderData.deducible) : undefined,
        aseguradoTercero: editOrderData.aseguradoTerceroString === 'true',
        idMarca: editOrderData.idMarca!,
        idModelo: editOrderData.idModelo!,
        año: editOrderData.año ? Number(editOrderData.año) : undefined,
        vin: editOrderData.vin || undefined,
        placas: editOrderData.placas || undefined,
        color: editOrderData.color || undefined,
        kilometraje: editOrderData.kilometraje || undefined,
        idCliente: editOrderData.idCliente!,
        idValuador: editOrderData.idValuador || undefined,
        idAsesor: editOrderData.idAsesor!,
        idHojalatero: editOrderData.idHojalatero || undefined,
        idPintor: editOrderData.idPintor || undefined,
        proceso: editOrderData.proceso || undefined,
        // Convertir strings de fecha YYYY-MM-DD a objetos Date
        fechaValuacion: editOrderData.fechaValuacion ? new Date(editOrderData.fechaValuacion + 'T00:00:00') : undefined, // Añadir T00:00:00 para evitar problemas de timezone al parsear YYYY-MM-DD
        fechaReingreso: editOrderData.fechaReingreso ? new Date(editOrderData.fechaReingreso + 'T00:00:00') : undefined,
        fechaEntrega: editOrderData.fechaEntrega ? new Date(editOrderData.fechaEntrega + 'T00:00:00') : undefined,
        fechaPromesa: editOrderData.fechaPromesa ? new Date(editOrderData.fechaPromesa + 'T00:00:00') : undefined,
        fechaBaja: editOrderData.fechaBaja ? new Date(editOrderData.fechaBaja + 'T00:00:00') : undefined,
    };

    const result = await updateOrderAction(currentOrder._id, orderPayload, userIdEmpleado || undefined);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || `Orden OT-${currentOrder.idOrder} actualizada.`});
      fetchOrders(); // Recargar lista de órdenes
      setIsEditOrderDialogOpen(false);
      setCurrentOrder(null); // Limpiar la orden actual
    } else {
      toast({ title: "Error al Actualizar", description: result.error || "No se pudo actualizar la orden.", variant: "destructive"});
    }
  };

  /**
   * Abre el diálogo para ver los detalles de una orden de servicio.
   * @param {string} orderId - El _id (string ObjectId) de la orden a visualizar.
   */
  const openViewOrderDialog = async (orderId: string) => {
    console.log("openViewOrderDialog: Abriendo para orden ID:", orderId);
    const result = await getOrderByIdAction(orderId);
    console.log("openViewOrderDialog: Resultado de getOrderByIdAction:", result);
    if (result.success && result.data) {
      const order = result.data;
      setCurrentOrder(order); // Guardar la orden completa
      // Pre-cargar ajustadores y modelos para la visualización de nombres.
      // Estas listas también se usan en el diálogo de edición si se abre desde aquí.
      if (order.idAseguradora) {
        console.log("openViewOrderDialog: Cargando ajustadores para aseguradora ID:", order.idAseguradora);
        const ajustadoresResult = await getAjustadoresByAseguradora(order.idAseguradora);
        console.log("openViewOrderDialog: Resultado de getAjustadoresByAseguradora:", ajustadoresResult);
        if (ajustadoresResult.success && ajustadoresResult.data) {
            setAvailableAjustadoresForOrder(ajustadoresResult.data);
        }
      } else {
        setAvailableAjustadoresForOrder([]); // Limpiar si no hay aseguradora
      }
      if (order.idMarca) {
        console.log("openViewOrderDialog: Cargando modelos para marca ID:", order.idMarca);
        const modelosResult = await getModelosByMarcaAction(order.idMarca);
        console.log("openViewOrderDialog: Resultado de getModelosByMarcaAction:", modelosResult);
        if (modelosResult.success && modelosResult.data) {
            setAvailableModelosForOrder(modelosResult.data);
        }
      } else {
        setAvailableModelosForOrder([]); // Limpiar si no hay marca
      }
      setIsViewOrderDialogOpen(true); // Abrir el diálogo
    } else {
      toast({ title: "Error", description: "No se pudieron cargar los detalles de la orden.", variant: "destructive"});
    }
  };

  /**
   * Abre el diálogo de confirmación para eliminar una orden de servicio.
   * @param {string} orderId - El _id (string ObjectId) de la orden a eliminar.
   */
  const openDeleteOrderDialog = (orderId: string) => {
    setOrderToDeleteId(orderId);
    setIsDeleteOrderDialogOpen(true);
  };

  /** Confirma y ejecuta la eliminación de una orden de servicio. */
  const handleDeleteOrder = async () => {
    if (!orderToDeleteId) return;
    const result = await deleteOrderAction(orderToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Orden eliminada."});
      fetchOrders(); // Recargar lista
    } else {
      toast({ title: "Error al Eliminar", description: result.error || "No se pudo eliminar la orden.", variant: "destructive"});
    }
    setIsDeleteOrderDialogOpen(false);
    setOrderToDeleteId(null); // Limpiar ID
  };


  // --- Funciones de Gestión de Marcas (Administración) ---
  /** Maneja la creación de una nueva marca de vehículo. */
  const handleCreateMarca = async () => {
    if (!newMarcaData.marca?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre de la marca es obligatorio.", variant: "destructive"});
      return;
    }
    const result = await createMarcaAction({ marca: newMarcaData.marca! });
    if (result.success && result.data?.marcaId) {
      toast({ title: "Éxito", description: `Marca "${newMarcaData.marca}" creada.`});
      fetchMarcas(); // Recargar lista de marcas
      setIsCreateMarcaDialogOpen(false);
      setNewMarcaData({ marca: '' }); // Resetear formulario
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear la marca.", variant: "destructive"});
    }
  };

  /**
   * Abre el diálogo para editar una marca de vehículo.
   * @param {MarcaVehiculo} marca - La marca a editar.
   */
  const openEditMarcaDialog = (marca: MarcaVehiculo) => {
    setCurrentMarca(marca); // Guardar la marca completa
    setEditMarcaData({ marca: marca.marca }); // Pre-llenar formulario
    setIsEditMarcaDialogOpen(true);
  };

  /** Maneja la actualización de una marca de vehículo existente. */
  const handleUpdateMarca = async () => {
    if (!currentMarca || !currentMarca._id) {
      toast({ title: "Error", description: "No hay marca seleccionada para actualizar.", variant: "destructive"});
      return;
    }
    if (!editMarcaData.marca?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre de la marca es obligatorio.", variant: "destructive"});
      return;
    }
    const result = await updateMarcaAction(currentMarca._id, { marca: editMarcaData.marca! });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Marca actualizada."});
      fetchMarcas(); // Recargar lista
      setIsEditMarcaDialogOpen(false);
      setCurrentMarca(null); // Limpiar
    } else {
      toast({ title: "Error al Actualizar", description: result.error || "No se pudo actualizar la marca.", variant: "destructive"});
    }
  };

  /**
   * Abre el diálogo de confirmación para eliminar una marca de vehículo.
   * @param {string} marcaId - El _id (string ObjectId) de la marca a eliminar.
   */
  const openDeleteMarcaDialog = (marcaId: string) => {
    setMarcaToDeleteId(marcaId);
    setIsDeleteMarcaDialogOpen(true);
  };

  /** Confirma y ejecuta la eliminación de una marca de vehículo. */
  const handleDeleteMarca = async () => {
    if (!marcaToDeleteId) return;
    const result = await deleteMarcaAction(marcaToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Marca eliminada."});
      fetchMarcas(); // Recargar lista
    } else {
      toast({ title: "Error al Eliminar", description: result.error || "No se pudo eliminar la marca.", variant: "destructive"});
    }
    setIsDeleteMarcaDialogOpen(false);
    setMarcaToDeleteId(null); // Limpiar
  };


  // --- Funciones de Gestión de Modelos (Administración) ---
  /**
   * Abre el diálogo para gestionar los modelos de una marca específica.
   * Carga la información actualizada de la marca, incluyendo sus modelos.
   * @param {MarcaVehiculo} marca - La marca cuyos modelos se van a gestionar.
   */
  const openManageModelosDialog = async (marca: MarcaVehiculo) => {
    // Obtener la marca actualizada con sus modelos.
    const result = await getMarcaForModelosAction(marca._id);
    if (result.success && result.data) {
      setCurrentMarca(result.data); // Actualizar currentMarca con los modelos más recientes.
      setIsManageModelosDialogOpen(true);
    } else {
      toast({ title: "Error", description: "No se pudo cargar la información de la marca para gestionar modelos.", variant: "destructive"});
      setCurrentMarca(marca); // Usar la info de marca que ya teníamos si falla la recarga.
      setIsManageModelosDialogOpen(true); // Intentar abrir con datos posiblemente desactualizados
    }
  };

  /** Maneja la creación de un nuevo modelo para la marca actual. */
  const handleCreateModelo = async () => {
    if (!currentMarca || !currentMarca._id) {
      toast({ title: "Error", description: "No hay marca seleccionada para añadir el modelo.", variant: "destructive"});
      return;
    }
    if (!newModeloData.modelo?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre del modelo es obligatorio.", variant: "destructive"});
      return;
    }
    const result = await addModeloToMarcaAction(currentMarca._id, { modelo: newModeloData.modelo! });
    if (result.success && result.data?.idModelo) {
      toast({ title: "Éxito", description: `Modelo "${result.data.modelo}" añadido a la marca "${currentMarca.marca}".`});
      // Recargar la marca actual para actualizar la lista de modelos en el diálogo
      const updatedMarcaResult = await getMarcaForModelosAction(currentMarca._id);
      if (updatedMarcaResult.success && updatedMarcaResult.data) {
        setCurrentMarca(updatedMarcaResult.data);
      }
      fetchMarcas(); // Recargar la lista global de marcas (para actualizar el contador de modelos)
      setIsCreateModeloDialogOpen(false);
      setNewModeloData({ modelo: '' }); // Resetear formulario de nuevo modelo
    } else {
      toast({ title: "Error", description: result.error || "No se pudo añadir el modelo.", variant: "destructive"});
    }
  };

  /**
   * Abre el diálogo para editar un modelo de vehículo.
   * @param {ModeloVehiculo} modelo - El modelo a editar.
   */
  const openEditModeloDialog = (modelo: ModeloVehiculo) => {
    setCurrentModelo(modelo); // Guardar el modelo actual para edición
    setEditModeloData({ modelo: modelo.modelo, idModelo: modelo.idModelo }); // Pre-llenar formulario. idModelo no se edita aquí.
    setIsEditModeloDialogOpen(true);
  };

  /** Maneja la actualización de un modelo de vehículo existente. */
  const handleUpdateModelo = async () => {
    if (!currentMarca || !currentMarca._id || !currentModelo || !currentModelo.idModelo) {
      toast({ title: "Error", description: "No hay modelo o marca seleccionada para actualizar.", variant: "destructive"});
      return;
    }
    if (!editModeloData.modelo?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre del modelo es obligatorio.", variant: "destructive"});
      return;
    }
    // Solo se actualiza el nombre del modelo. El idModelo no cambia.
    const result = await updateModeloInMarcaAction(currentMarca._id, currentModelo.idModelo, { modelo: editModeloData.modelo! });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Modelo actualizado."});
      // Recargar la marca actual para reflejar el cambio en la lista del diálogo de gestión.
      const updatedMarcaResult = await getMarcaForModelosAction(currentMarca._id);
      if (updatedMarcaResult.success && updatedMarcaResult.data) {
        setCurrentMarca(updatedMarcaResult.data);
      }
      fetchMarcas(); // Recargar la lista global de marcas
      setIsEditModeloDialogOpen(false);
      setCurrentModelo(null); // Limpiar modelo actual
    } else {
      toast({ title: "Error al Actualizar", description: result.error || "No se pudo actualizar el modelo.", variant: "destructive"});
    }
  };

  /**
   * Maneja la eliminación de un modelo de una marca.
   * @param {string} idModelo - El idModelo (string ObjectId) del modelo a eliminar.
   */
  const handleDeleteModelo = async (idModelo: string) => {
    if (!currentMarca || !currentMarca._id) {
      toast({ title: "Error", description: "No hay marca seleccionada.", variant: "destructive"});
      return;
    }
    // Confirmación del usuario (idealmente con un diálogo de confirmación).
    if (!window.confirm(`¿Estás seguro de eliminar el modelo con ID ${idModelo} de la marca ${currentMarca.marca}?`)) return;

    const result = await removeModeloFromMarcaAction(currentMarca._id, idModelo);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Modelo eliminado."});
      // Recargar la marca actual para reflejar el cambio en la lista del diálogo.
      const updatedMarcaResult = await getMarcaForModelosAction(currentMarca._id);
      if (updatedMarcaResult.success && updatedMarcaResult.data) {
        setCurrentMarca(updatedMarcaResult.data);
      }
      fetchMarcas(); // Recargar la lista global de marcas
    } else {
      toast({ title: "Error al Eliminar", description: result.error || "No se pudo eliminar el modelo.", variant: "destructive"});
    }
  };


  // --- Funciones de Gestión de Aseguradoras (Administración) ---
  /** Maneja la creación de una nueva aseguradora. */
  const handleCreateAseguradora = async () => {
    if (!newAseguradoraData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre de la aseguradora es obligatorio.", variant: "destructive"});
      return;
    }
    // El _id se genera en el backend (MongoDB).
    const result = await createAseguradoraAction({ nombre: newAseguradoraData.nombre!, telefono: newAseguradoraData.telefono });
    if (result.success && result.data?.aseguradoraId) { // aseguradoraId es el _id de MongoDB
      toast({ title: "Éxito", description: `Aseguradora "${newAseguradoraData.nombre}" creada.`});
      fetchAseguradoras(); // Recargar lista
      setIsCreateAseguradoraDialogOpen(false);
      setNewAseguradoraData({ nombre: '', telefono: '' }); // Resetear formulario
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear la aseguradora.", variant: "destructive"});
    }
  };

  /**
   * Abre el diálogo para editar una aseguradora.
   * @param {Aseguradora} aseguradora - La aseguradora a editar.
   */
  const openEditAseguradoraDialog = (aseguradora: Aseguradora) => {
    setCurrentAseguradora(aseguradora); // Guardar la aseguradora completa
    setEditAseguradoraData({ nombre: aseguradora.nombre, telefono: aseguradora.telefono }); // Pre-llenar formulario
    setIsEditAseguradoraDialogOpen(true);
  };

  /** Maneja la actualización de una aseguradora existente. */
  const handleUpdateAseguradora = async () => {
    if (!currentAseguradora || !currentAseguradora._id) {
      toast({ title: "Error", description: "No hay aseguradora seleccionada para actualizar.", variant: "destructive"});
      return;
    }
    if (!editAseguradoraData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre de la aseguradora es obligatorio.", variant: "destructive"});
      return;
    }
    const result = await updateAseguradoraAction(currentAseguradora._id, { nombre: editAseguradoraData.nombre!, telefono: editAseguradoraData.telefono });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Aseguradora actualizada."});
      fetchAseguradoras(); // Recargar lista
      setIsEditAseguradoraDialogOpen(false);
      setCurrentAseguradora(null); // Limpiar
    } else {
      toast({ title: "Error al Actualizar", description: result.error || "No se pudo actualizar la aseguradora.", variant: "destructive"});
    }
  };

  /**
   * Abre el diálogo de confirmación para eliminar una aseguradora.
   * @param {string} aseguradoraId - El _id (string ObjectId) de la aseguradora a eliminar.
   */
  const openDeleteAseguradoraDialog = (aseguradoraId: string) => {
    setAseguradoraToDeleteId(aseguradoraId);
    setIsDeleteAseguradoraDialogOpen(true);
  };

  /** Confirma y ejecuta la eliminación de una aseguradora. */
  const handleDeleteAseguradora = async () => {
    if (!aseguradoraToDeleteId) return;
    const result = await deleteAseguradoraAction(aseguradoraToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Aseguradora eliminada."});
      fetchAseguradoras(); // Recargar lista
    } else {
      toast({ title: "Error al Eliminar", description: result.error || "No se pudo eliminar la aseguradora.", variant: "destructive"});
    }
    setIsDeleteAseguradoraDialogOpen(false);
    setAseguradoraToDeleteId(null); // Limpiar
  };


  // --- Funciones de Gestión de Ajustadores (Administración) ---
  /**
   * Abre el diálogo para gestionar los ajustadores de una aseguradora.
   * Carga la información actualizada de la aseguradora, incluyendo sus ajustadores.
   * @param {Aseguradora} aseguradora - La aseguradora cuyos ajustadores se gestionarán.
   */
  const openManageAjustadoresDialog = async (aseguradora: Aseguradora) => {
    const result = await getAseguradoraForAjustadoresAction(aseguradora._id); // Obtener la aseguradora por su _id
    if (result.success && result.data) {
      setCurrentAseguradora(result.data); // Guardar la aseguradora con sus ajustadores actualizados
      setIsManageAjustadoresDialogOpen(true);
    } else {
      toast({ title: "Error", description: "No se pudo cargar la información de la aseguradora.", variant: "destructive"});
      setCurrentAseguradora(aseguradora); // Intentar abrir con datos posiblemente desactualizados
      setIsManageAjustadoresDialogOpen(true);
    }
  };

  /** Maneja la creación de un nuevo ajustador para la aseguradora actual. */
  const handleCreateAjustador = async () => {
    if (!currentAseguradora || !currentAseguradora._id) {
      toast({ title: "Error", description: "No hay aseguradora seleccionada.", variant: "destructive"});
      return;
    }
    if (!newAjustadorData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre del ajustador es obligatorio.", variant: "destructive"});
      return;
    }
    // El idAjustador se genera en el backend (ObjectId string).
    const result = await addAjustadorToAseguradoraAction(currentAseguradora._id, newAjustadorData);
    if (result.success && result.data?.idAjustador) { // result.data es el Ajustador creado
      toast({ title: "Éxito", description: `Ajustador "${result.data.nombre}" añadido.`});
      // Recargar la aseguradora actual para actualizar la lista de ajustadores en el diálogo
      const updatedAseguradoraResult = await getAseguradoraForAjustadoresAction(currentAseguradora._id);
      if (updatedAseguradoraResult.success && updatedAseguradoraResult.data) {
        setCurrentAseguradora(updatedAseguradoraResult.data);
      }
      fetchAseguradoras(); // Recargar la lista global de aseguradoras (para actualizar el contador de ajustadores)
      setIsCreateAjustadorDialogOpen(false);
      setNewAjustadorData({ nombre: '', telefono: '', correo: '' }); // Resetear formulario
    } else {
      toast({ title: "Error", description: result.error || "No se pudo añadir el ajustador.", variant: "destructive"});
    }
  };

  /**
   * Abre el diálogo para editar un ajustador.
   * @param {Ajustador} ajustador - El ajustador a editar.
   */
  const openEditAjustadorDialog = (ajustador: Ajustador) => {
    setCurrentAjustador(ajustador); // Guardar el ajustador actual
    // Pre-llenar el formulario de edición. idAjustador no se edita aquí.
    setEditAjustadorData({ ...ajustador }); 
    setIsEditAjustadorDialogOpen(true);
  };

  /** Maneja la actualización de un ajustador existente. */
  const handleUpdateAjustador = async () => {
    if (!currentAseguradora || !currentAseguradora._id || !currentAjustador || !currentAjustador.idAjustador) {
      toast({ title: "Error", description: "No hay ajustador o aseguradora seleccionada.", variant: "destructive"});
      return;
    }
    if (!editAjustadorData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre del ajustador es obligatorio.", variant: "destructive"});
      return;
    }
    // Excluir idAjustador del payload de actualización, ya que no se modifica.
    const { idAjustador, ...updateData } = editAjustadorData; 
    const result = await updateAjustadorInAseguradoraAction(currentAseguradora._id, currentAjustador.idAjustador, updateData);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Ajustador actualizado."});
      // Recargar la aseguradora actual para reflejar el cambio.
      const updatedAseguradoraResult = await getAseguradoraForAjustadoresAction(currentAseguradora._id);
      if (updatedAseguradoraResult.success && updatedAseguradoraResult.data) {
        setCurrentAseguradora(updatedAseguradoraResult.data);
      }
      fetchAseguradoras(); // Recargar lista global
      setIsEditAjustadorDialogOpen(false);
      setCurrentAjustador(null); // Limpiar
    } else {
      toast({ title: "Error al Actualizar", description: result.error || "No se pudo actualizar el ajustador.", variant: "destructive"});
    }
  };

  /**
   * Maneja la eliminación de un ajustador de una aseguradora.
   * @param {string} idAjustador - El idAjustador (string ObjectId) del ajustador a eliminar.
   */
  const handleDeleteAjustador = async (idAjustador: string) => {
    if (!currentAseguradora || !currentAseguradora._id) {
      toast({ title: "Error", description: "No hay aseguradora seleccionada.", variant: "destructive"});
      return;
    }
    // Confirmación del usuario.
    if (!window.confirm(`¿Estás seguro de eliminar el ajustador con ID ${idAjustador} de la aseguradora ${currentAseguradora.nombre}?`)) return;

    const result = await removeAjustadorFromAseguradoraAction(currentAseguradora._id, idAjustador);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Ajustador eliminado."});
      // Recargar aseguradora actual.
      const updatedAseguradoraResult = await getAseguradoraForAjustadoresAction(currentAseguradora._id);
      if (updatedAseguradoraResult.success && updatedAseguradoraResult.data) {
        setCurrentAseguradora(updatedAseguradoraResult.data);
      }
      fetchAseguradoras(); // Recargar lista global
    } else {
      toast({ title: "Error al Eliminar", description: result.error || "No se pudo eliminar el ajustador.", variant: "destructive"});
    }
  };


  // --- Funciones de Gestión de Empleados (Administración) ---
  /** Maneja la creación de un nuevo empleado, incluyendo opcionalmente credenciales de sistema. */
  const handleCreateEmpleado = async () => {
    console.log("handleCreateEmpleado: Creando empleado con datos:", newEmpleadoData);
    // Validaciones básicas
    if (!newEmpleadoData.nombre?.trim() || !newEmpleadoData.puesto?.trim()) {
      toast({ title: "Error de Validación", description: "Nombre y Puesto son obligatorios.", variant: "destructive"});
      return;
    }
    // Validaciones si se crea acceso al sistema
    if (newEmpleadoData.createSystemUser) {
      if (!newEmpleadoData.systemUserUsuario?.trim() || !newEmpleadoData.systemUserContraseña?.trim() || !newEmpleadoData.systemUserRol) {
        toast({ title: "Error de Validación de Usuario", description: "Usuario, Contraseña y Rol son obligatorios para el acceso al sistema.", variant: "destructive"});
        return;
      }
      if (newEmpleadoData.systemUserContraseña !== newEmpleadoData.systemUserConfirmContraseña) {
        toast({ title: "Error de Contraseña", description: "Las contraseñas para el acceso al sistema no coinciden.", variant: "destructive"});
        return;
      }
    }

    // Preparar payload del empleado básico (sin _id, fechaRegistro, user)
    const empleadoPayload: Omit<Empleado, '_id' | 'fechaRegistro' | 'user'> = {
      nombre: newEmpleadoData.nombre,
      puesto: newEmpleadoData.puesto,
      telefono: newEmpleadoData.telefono,
      correo: newEmpleadoData.correo,
      sueldo: newEmpleadoData.sueldo ? Number(newEmpleadoData.sueldo) : undefined,
      comision: newEmpleadoData.comision ? Number(newEmpleadoData.comision) : undefined,
    };

    // Preparar detalles del usuario del sistema si aplica
    let systemUserDetails: Omit<SystemUserCredentials, 'permisos' | '_id'> | undefined = undefined;
    if (newEmpleadoData.createSystemUser && newEmpleadoData.systemUserUsuario && newEmpleadoData.systemUserContraseña && newEmpleadoData.systemUserRol) {
      systemUserDetails = {
        usuario: newEmpleadoData.systemUserUsuario,
        contraseña: newEmpleadoData.systemUserContraseña, // La acción o el manager se encargará de hashear si es necesario
        rol: newEmpleadoData.systemUserRol,
      };
    }

    const result = await createEmpleadoAction(empleadoPayload, systemUserDetails);
    if (result.success && result.data?.empleadoId) { // empleadoId es el _id de MongoDB
      toast({ title: "Éxito", description: `Empleado "${empleadoPayload.nombre}" creado.`});
      fetchEmpleados(); // Recargar la lista de empleados
      // Recargar listas de personal específico si el nuevo empleado afecta alguna
      if (systemUserDetails?.rol === UserRole.ASESOR) fetchAsesores();
      if (systemUserDetails?.rol === UserRole.VALUADOR) fetchValuadores();
      if (empleadoPayload.puesto === "Hojalatero") fetchHojalateros(); // Usar nombres exactos de puestos
      if (empleadoPayload.puesto === "Pintor") fetchPintores();

      setIsCreateEmpleadoDialogOpen(false);
      setNewEmpleadoData(initialNewEmpleadoData); // Resetear formulario
    } else {
      toast({ title: "Error al Crear Empleado", description: result.error || "No se pudo crear el empleado.", variant: "destructive"});
    }
  };

  /**
   * Abre el diálogo para editar un empleado, cargando sus datos.
   * @param {string} empleadoIdToEdit - El _id (string ObjectId) del empleado a editar.
   */
  const openEditEmpleadoDialog = async (empleadoIdToEdit: string) => {
    const result = await getEmpleadoForEditAction(empleadoIdToEdit); // Obtener empleado por _id
    if (result.success && result.data) {
      const emp = result.data;
      setCurrentEmpleadoToEdit(emp); // Guardar empleado completo
      // Pre-llenar formulario de edición
      setEditEmpleadoData({
        nombre: emp.nombre,
        puesto: emp.puesto,
        telefono: emp.telefono,
        correo: emp.correo,
        sueldo: emp.sueldo?.toString(),
        comision: emp.comision?.toString(),
        // No pre-llenar createSystemUser aquí, se maneja según si emp.user existe
        systemUserUsuario: emp.user?.usuario, // Para mostrar si ya existe
        systemUserRol: emp.user?.rol, // Para mostrar si ya existe
        // No pre-llenar contraseñas
      });
      setIsEditEmpleadoDialogOpen(true);
    } else {
      toast({ title: "Error", description: "No se pudieron cargar los datos del empleado.", variant: "destructive" });
    }
  };

  /** Maneja la actualización de un empleado existente y/o sus credenciales de sistema. */
  const handleUpdateEmpleado = async () => {
    if (!currentEmpleadoToEdit || !currentEmpleadoToEdit._id) {
      toast({ title: "Error", description: "No hay empleado seleccionado para actualizar.", variant: "destructive"});
      return;
    }
    // Validaciones básicas para datos del empleado
    if (!editEmpleadoData.nombre?.trim() || !editEmpleadoData.puesto?.trim()) {
      toast({ title: "Error de Validación", description: "Nombre y Puesto son obligatorios.", variant: "destructive"});
      return;
    }

    // Preparar payload de actualización para datos básicos del empleado
    const empleadoUpdatePayload: Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>> = {
      nombre: editEmpleadoData.nombre,
      puesto: editEmpleadoData.puesto,
      telefono: editEmpleadoData.telefono,
      correo: editEmpleadoData.correo,
      sueldo: editEmpleadoData.sueldo ? Number(editEmpleadoData.sueldo) : undefined,
      comision: editEmpleadoData.comision ? Number(editEmpleadoData.comision) : undefined,
    };

    // Preparar payload de actualización para credenciales de sistema
    let systemUserUpdateDetails: Partial<Omit<SystemUserCredentials, 'permisos' | '_id' | 'contraseña'>> & { contraseña?: string } | undefined = undefined;
    
    // Caso 1: El empleado NO tenía usuario y ahora se quiere crear uno
    if (!currentEmpleadoToEdit.user && editEmpleadoData.createSystemUser) {
      if (!editEmpleadoData.systemUserUsuario?.trim() || !editEmpleadoData.newSystemUserContraseña?.trim() || !editEmpleadoData.systemUserRol) {
        toast({ title: "Error de Validación de Usuario", description: "Usuario, Nueva Contraseña y Rol son obligatorios para crear acceso.", variant: "destructive"});
        return;
      }
      if (editEmpleadoData.newSystemUserContraseña !== editEmpleadoData.newSystemUserConfirmContraseña) {
        toast({ title: "Error de Contraseña", description: "Las nuevas contraseñas no coinciden.", variant: "destructive"});
        return;
      }
      systemUserUpdateDetails = {
        usuario: editEmpleadoData.systemUserUsuario,
        contraseña: editEmpleadoData.newSystemUserContraseña, // Nueva contraseña
        rol: editEmpleadoData.systemUserRol,
      };
    } 
    // Caso 2: El empleado YA TENÍA usuario y se pueden estar modificando sus detalles (ej. contraseña, rol)
    else if (currentEmpleadoToEdit.user) {
      systemUserUpdateDetails = {}; // Iniciar objeto
      // Solo incluir campos si han cambiado o se proporcionan explícitamente
      if (editEmpleadoData.systemUserUsuario && editEmpleadoData.systemUserUsuario !== currentEmpleadoToEdit.user.usuario) {
        systemUserUpdateDetails.usuario = editEmpleadoData.systemUserUsuario;
      }
      if (editEmpleadoData.systemUserRol && editEmpleadoData.systemUserRol !== currentEmpleadoToEdit.user.rol) {
        systemUserUpdateDetails.rol = editEmpleadoData.systemUserRol;
      }
      if (editEmpleadoData.newSystemUserContraseña?.trim()) { // Si se ingresó una nueva contraseña
        if (editEmpleadoData.newSystemUserContraseña !== editEmpleadoData.newSystemUserConfirmContraseña) {
          toast({ title: "Error de Contraseña", description: "Las nuevas contraseñas no coinciden.", variant: "destructive"});
          return;
        }
        systemUserUpdateDetails.contraseña = editEmpleadoData.newSystemUserContraseña;
      }
      // Si systemUserUpdateDetails está vacío, significa que no hay cambios en el usuario
      if (Object.keys(systemUserUpdateDetails).length === 0) {
        systemUserUpdateDetails = undefined;
      }
    }

    const result = await updateEmpleadoAction(currentEmpleadoToEdit._id, empleadoUpdatePayload, systemUserUpdateDetails);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Empleado actualizado."});
      fetchEmpleados(); // Recargar lista global
      // Recargar listas de personal específico si el empleado actualizado afecta alguna
      if (systemUserUpdateDetails?.rol || currentEmpleadoToEdit.user?.rol) { // Si el rol cambió o existía
        fetchAsesores(); fetchValuadores();
      }
      if (empleadoUpdatePayload.puesto || currentEmpleadoToEdit.puesto) { // Si el puesto cambió o existía
         fetchHojalateros(); fetchPintores();
      }
      setIsEditEmpleadoDialogOpen(false);
      setCurrentEmpleadoToEdit(null); // Limpiar
    } else {
      toast({ title: "Error al Actualizar", description: result.error || "No se pudo actualizar el empleado.", variant: "destructive"});
    }
  };

  /**
   * Abre el diálogo de confirmación para eliminar un empleado.
   * @param {string} empleadoIdToDelete - El _id (string ObjectId) del empleado a eliminar.
   */
  const openDeleteEmpleadoDialog = (empleadoIdToDelete: string) => {
    setEmpleadoToDeleteId(empleadoIdToDelete);
    setIsDeleteEmpleadoDialogOpen(true);
  };

  /** Confirma y ejecuta la eliminación de un empleado. */
  const handleDeleteEmpleado = async () => {
    if (!empleadoToDeleteId) return;
    const result = await deleteEmpleadoAction(empleadoToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Empleado eliminado."});
      fetchEmpleados(); // Recargar lista global
      // Recargar todas las listas de personal, ya que el empleado eliminado podría haber estado en alguna
      fetchAsesores(); fetchValuadores(); fetchHojalateros(); fetchPintores();
    } else {
      toast({ title: "Error al Eliminar", description: result.error || "No se pudo eliminar el empleado.", variant: "destructive"});
    }
    setIsDeleteEmpleadoDialogOpen(false);
    setEmpleadoToDeleteId(null); // Limpiar
  };

  /**
   * Maneja la eliminación del acceso al sistema de un empleado.
   * @param {string} empleadoIdToRemoveAccess - El _id (string ObjectId) del empleado.
   */
  const handleRemoveSystemUser = async (empleadoIdToRemoveAccess: string) => {
    // Confirmación del usuario
    if (!window.confirm("¿Estás seguro de remover el acceso al sistema para este empleado? Esta acción no se puede deshacer.")) return;
    
    const result = await removeSystemUserFromEmpleadoAction(empleadoIdToRemoveAccess);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      fetchEmpleados(); // Recargar para reflejar el cambio en la UI
      // Si el empleado editado era el actual, recargar sus datos para el diálogo de edición.
      if (currentEmpleadoToEdit?._id === empleadoIdToRemoveAccess) {
        const updatedEmp = await getEmpleadoForEditAction(empleadoIdToRemoveAccess);
        if (updatedEmp.success && updatedEmp.data) {
          setCurrentEmpleadoToEdit(updatedEmp.data); // Actualizar el estado local
          // Pre-llenar el formulario de edición de nuevo, ya que emp.user ahora no existe.
          setEditEmpleadoData({
            nombre: updatedEmp.data.nombre,
            puesto: updatedEmp.data.puesto,
            telefono: updatedEmp.data.telefono,
            correo: updatedEmp.data.correo,
            sueldo: updatedEmp.data.sueldo?.toString(),
            comision: updatedEmp.data.comision?.toString(),
            createSystemUser: false, // Ahora puede volver a crearse
            systemUserUsuario: undefined,
            systemUserRol: undefined,
          });
        }
      }
    } else {
      toast({ title: "Error", description: result.error || "No se pudo remover el acceso.", variant: "destructive" });
    }
  };


  // --- Funciones de Gestión de Clientes (Admin y creación rápida) ---
  /** Abre el diálogo para crear un nuevo cliente (usado desde Órdenes y desde Admin/Clientes). */
  const openCreateClientDialog = () => {
    console.log("openCreateClientDialog: Abriendo diálogo para crear cliente.");
    setNewClientData({ nombre: '', telefono: '', correo: '' }); // Resetear datos
    setIsCreateClientDialogOpen(true);
  };

  /** Maneja la creación de un nuevo cliente. */
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
    });

    if (result.success && result.data?.clienteId && result.data.nuevoCliente) {
      toast({ title: "Éxito", description: `Cliente "${result.data.nuevoCliente.nombre}" creado.` });
      fetchClients(); // Recargar la lista global de clientes
      setIsCreateClientDialogOpen(false); // Cerrar diálogo de creación de cliente
      
      // Si algún formulario de orden está abierto, intentar preseleccionar este cliente
      if (isCreateOrderDialogOpen && result.data.clienteId) {
        console.log("handleCreateClient: Preseleccionando nuevo cliente en formulario de NUEVA orden:", result.data.clienteId);
        setNewOrderData(prev => ({ ...prev, idCliente: result.data!.clienteId! }));
      } else if (isEditOrderDialogOpen && result.data.clienteId) {
        console.log("handleCreateClient: Preseleccionando nuevo cliente en formulario de EDITAR orden:", result.data.clienteId);
        setEditOrderData(prev => ({ ...prev, idCliente: result.data!.clienteId! }));
      }
      setNewClientData({ nombre: '', telefono: '', correo: ''}); // Resetear formulario de nuevo cliente
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el cliente.", variant: "destructive" });
    }
  };
  
  /**
   * Abre el diálogo para editar un cliente desde la sección de Admin/Clientes.
   * @param {Cliente} client - El objeto cliente a editar.
   */
  const openEditClientDialog = (client: Cliente) => {
    console.log("openEditClientDialog: Abriendo diálogo para editar cliente:", client._id);
    setCurrentClientToEdit(client); // Guardar cliente completo
    setEditClientData({ // Pre-llenar el formulario de edición
      nombre: client.nombre,
      telefono: client.telefono,
      correo: client.correo,
    });
    setIsEditClientDialogOpen(true);
  };

  /** Maneja la actualización de un cliente existente desde Admin/Clientes. */
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
    });

    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Cliente actualizado." });
      fetchClients(); // Recargar la lista de clientes
      setIsEditClientDialogOpen(false);
      setCurrentClientToEdit(null); // Limpiar
    } else {
      toast({ title: "Error al Actualizar", description: result.error || "No se pudo actualizar el cliente.", variant: "destructive" });
    }
  };

  /**
   * Abre el diálogo de confirmación para eliminar un cliente desde Admin/Clientes.
   * @param {string} clientId - El _id (string ObjectId) del cliente a eliminar.
   */
  const openDeleteClientDialog = (clientId: string) => {
    console.log("openDeleteClientDialog: Abriendo diálogo para eliminar cliente ID:", clientId);
    setClientToDeleteId(clientId);
    setIsDeleteClientDialogOpen(true);
  };

  /** Confirma y ejecuta la eliminación de un cliente desde Admin/Clientes. */
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
    setClientToDeleteId(null); // Limpiar
  };


  // --- FUNCIONES DE GESTIÓN DE PUESTOS (ADMINISTRACIÓN GENERAL) ---
  /** Maneja la creación de un nuevo puesto. */
  const handleCreatePuesto = async () => {
    if (!newPuestoData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre del puesto es obligatorio.", variant: "destructive"});
      return;
    }
    const result = await createPuestoAction({ nombre: newPuestoData.nombre! });
    if (result.success && result.data?.puestoId) {
      toast({ title: "Éxito", description: `Puesto "${newPuestoData.nombre}" creado.`});
      fetchPuestos(); // Recargar lista
      setIsCreatePuestoDialogOpen(false);
      setNewPuestoData({ nombre: '' }); // Resetear formulario
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el puesto.", variant: "destructive"});
    }
  };

  /**
   * Abre el diálogo para editar un puesto.
   * @param {Puesto} puesto - El puesto a editar.
   */
  const openEditPuestoDialog = (puesto: Puesto) => {
    setCurrentPuestoToEdit(puesto);
    setEditPuestoData({ nombre: puesto.nombre }); // Pre-llenar formulario
    setIsEditPuestoDialogOpen(true);
  };

  /** Maneja la actualización de un puesto existente. */
  const handleUpdatePuesto = async () => {
    if (!currentPuestoToEdit || !currentPuestoToEdit._id) {
      toast({ title: "Error", description: "No hay puesto seleccionado para actualizar.", variant: "destructive"});
      return;
    }
    if (!editPuestoData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre del puesto es obligatorio.", variant: "destructive"});
      return;
    }
    const result = await updatePuestoAction(currentPuestoToEdit._id, { nombre: editPuestoData.nombre! });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Puesto actualizado."});
      fetchPuestos(); // Recargar lista
      // Si el puesto se actualizó, también recargar empleados por si afecta a alguien y las listas dependientes.
      fetchEmpleados(); 
      fetchAsesores(); fetchValuadores(); fetchHojalateros(); fetchPintores();
      setIsEditPuestoDialogOpen(false);
      setCurrentPuestoToEdit(null); // Limpiar
    } else {
      toast({ title: "Error al Actualizar", description: result.error || "No se pudo actualizar el puesto.", variant: "destructive"});
    }
  };

  /**
   * Abre el diálogo de confirmación para eliminar un puesto.
   * @param {string} puestoId - El _id (string ObjectId) del puesto a eliminar.
   */
  const openDeletePuestoDialog = (puestoId: string) => {
    setPuestoToDeleteId(puestoId);
    setIsDeletePuestoDialogOpen(true);
  };

  /** Confirma y ejecuta la eliminación de un puesto. */
  const handleDeletePuesto = async () => {
    if (!puestoToDeleteId) return;
    const result = await deletePuestoAction(puestoToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Puesto eliminado."});
      fetchPuestos(); // Recargar lista
      // Si se eliminó un puesto, también recargar empleados por si afecta a alguien y listas dependientes.
      fetchEmpleados();
      fetchAsesores(); fetchValuadores(); fetchHojalateros(); fetchPintores();
    } else {
      toast({ title: "Error al Eliminar", description: result.error || "No se pudo eliminar el puesto.", variant: "destructive"});
    }
    setIsDeletePuestoDialogOpen(false);
    setPuestoToDeleteId(null); // Limpiar
  };


  // --- FUNCIONES DE GESTIÓN DE COLORES DE VEHÍCULO (ADMINISTRACIÓN GENERAL) ---
  /** Maneja la creación de un nuevo color de vehículo. */
  const handleCreateColor = async () => {
    if (!newColorData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre del color es obligatorio.", variant: "destructive"});
      return;
    }
    const result = await createColorVehiculoAction({ nombre: newColorData.nombre! });
    if (result.success && result.data?.colorId) {
      toast({ title: "Éxito", description: `Color "${newColorData.nombre}" creado.`});
      fetchColores(); // Recargar lista
      setIsCreateColorDialogOpen(false);
      setNewColorData({ nombre: '' }); // Resetear formulario
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el color.", variant: "destructive"});
    }
  };

  /**
   * Abre el diálogo para editar un color de vehículo.
   * @param {ColorVehiculo} color - El color a editar.
   */
  const openEditColorDialog = (color: ColorVehiculo) => {
    setCurrentColorToEdit(color);
    setEditColorData({ nombre: color.nombre }); // Pre-llenar formulario
    setIsEditColorDialogOpen(true);
  };

  /** Maneja la actualización de un color de vehículo existente. */
  const handleUpdateColor = async () => {
    if (!currentColorToEdit || !currentColorToEdit._id) {
      toast({ title: "Error", description: "No hay color seleccionado para actualizar.", variant: "destructive"});
      return;
    }
    if (!editColorData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre del color es obligatorio.", variant: "destructive"});
      return;
    }
    const result = await updateColorVehiculoAction(currentColorToEdit._id, { nombre: editColorData.nombre! });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Color actualizado."});
      fetchColores(); // Recargar lista
      setIsEditColorDialogOpen(false);
      setCurrentColorToEdit(null); // Limpiar
    } else {
      toast({ title: "Error al Actualizar", description: result.error || "No se pudo actualizar el color.", variant: "destructive"});
    }
  };

  /**
   * Abre el diálogo de confirmación para eliminar un color de vehículo.
   * @param {string} colorId - El _id (string ObjectId) del color a eliminar.
   */
  const openDeleteColorDialog = (colorId: string) => {
    setColorToDeleteId(colorId);
    setIsDeleteColorDialogOpen(true);
  };

  /** Confirma y ejecuta la eliminación de un color de vehículo. */
  const handleDeleteColor = async () => {
    if (!colorToDeleteId) return;
    const result = await deleteColorVehiculoAction(colorToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Color eliminado."});
      fetchColores(); // Recargar lista
    } else {
      toast({ title: "Error al Eliminar", description: result.error || "No se pudo eliminar el color.", variant: "destructive"});
    }
    setIsDeleteColorDialogOpen(false);
    setColorToDeleteId(null); // Limpiar
  };

  // --- Funciones Auxiliares de Formateo ---
  /**
   * Formatea una fecha (o string/número de fecha) a un formato legible.
   * @param {Date | string | number | undefined} dateInput - La fecha a formatear.
   * @param {'dd/MM/yyyy' | 'YYYY-MM-DD'} [format='dd/MM/yyyy'] - El formato de salida.
   * @returns {string} La fecha formateada, o string vacío si la entrada es inválida.
   */
  const formatDate = (dateInput?: Date | string | number, format: 'dd/MM/yyyy' | 'YYYY-MM-DD' = 'dd/MM/yyyy'): string => {
    if (!dateInput) return '';
    try {
      let date: Date;
      // Si es un string y parece ser 'YYYY-MM-DD', hay que parsearlo cuidadosamente para evitar problemas de timezone.
      // Crear la fecha asumiendo que es UTC para evitar que el timezone local la cambie a un día anterior.
      // Esto es especialmente importante si el string no tiene información de timezone.
      if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const parts = dateInput.split('-').map(Number);
        date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])); // Mes es 0-indexado
      } else {
        date = new Date(dateInput); // Intentar parsear otros formatos de string o números (timestamps)
      }

      if (isNaN(date.getTime())) return ''; // Fecha inválida

      if (format === 'YYYY-MM-DD') {
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = date.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      } else { // 'dd/MM/yyyy'
        // Usar toLocaleDateString con UTC para mantener consistencia con el parseo
        return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
      }
    } catch (error) {
      console.error("Error formateando fecha:", dateInput, error);
      return '';
    }
  };

  /**
   * Formatea una fecha y hora a un formato legible.
   * @param {Date | string | number | undefined} dateInput - La fecha y hora a formatear.
   * @returns {string} La fecha y hora formateada.
   */
  const formatDateTime = (dateInput?: Date | string | number): string => {
    if (!dateInput) return 'N/A';
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      // Usar toLocaleString para formato local de fecha y hora.
      return date.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    } catch (error) {
      console.error("Error formateando fecha y hora:", dateInput, error);
      return 'Error de fecha';
    }
  };

  /**
   * Devuelve la variante de color para el Badge según el estado del proceso de la orden.
   * @param {Order['proceso']} [proceso] - El estado del proceso de la orden.
   * @returns {"default" | "secondary" | "outline" | "destructive"} La variante del Badge.
   */
  const getProcesoVariant = (proceso?: Order['proceso']): "default" | "secondary" | "outline" | "destructive" => {
    switch (proceso) {
      case 'pendiente': return "secondary";
      case 'valuacion': return "outline";
      case 'listo_entrega':
      case 'entregado':
      case 'facturado': return "default"; // Usar primary color para estados "positivos" finales
      case 'cancelado': return "destructive";
      default: return "outline"; // Para otros procesos intermedios (ej. espera_refacciones, pintura, etc.)
    }
  };

  // --- Opciones para Selects ---
  /** Opciones para el select de estado del proceso de la orden. */
  const procesoOptions: { value: Order['proceso']; label: string }[] = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'valuacion', label: 'Valuación' },
    { value: 'espera_refacciones', label: 'Espera Refacciones' },
    { value: 'refacciones_listas', label: 'Refacciones Listas' },
    { value: 'hojalateria', label: 'Hojalatería' },
    { value: 'preparacion_pintura', label: 'Preparación Pintura' },
    { value: 'pintura', label: 'Pintura' },
    { value: 'mecanica', label: 'Mecánica' },
    { value: 'armado', label: 'Armado' },
    { value: 'detallado_lavado', label: 'Detallado y Lavado' },
    { value: 'control_calidad', label: 'Control de Calidad' },
    { value: 'listo_entrega', label: 'Listo para Entrega' },
    { value: 'entregado', label: 'Entregado' },
    { value: 'facturado', label: 'Facturado' },
    { value: 'garantia', label: 'Garantía' },
    { value: 'cancelado', label: 'Cancelado' },
  ];
  /** Opciones para el select de rol de usuario. */
  const userRoleOptions = Object.values(UserRole).map(role => ({ value: role, label: role.charAt(0).toUpperCase() + role.slice(1) }));
  /** Opciones para el select de tipo asegurado/tercero. */
  const aseguradoTerceroOptions: {value: string; label: string}[] = [
    { value: 'true', label: 'Asegurado' },
    { value: 'false', label: 'Tercero' },
  ];

  /**
   * Renderiza un campo de formulario genérico (Label + Input/Select/Textarea/Checkbox).
   * Utilizado en varios diálogos de creación y edición.
   * @param {string} label - Texto de la etiqueta del campo.
   * @param {any} name - Nombre del campo (usado como key en el estado del formulario).
   * @param {string} [type="text"] - Tipo de input HTML.
   * @param {string} [placeholder] - Placeholder para el campo.
   * @param {'newOrder' | 'editOrder' | 'newMarca' | 'editMarca' | 'newModelo' | 'editModelo' | 'newAseguradora' | 'editAseguradora' | 'newAjustador' | 'editAjustador' | 'newEmpleado' | 'editEmpleado' | 'newClient' | 'editClient'| 'newPuesto' | 'editPuesto' | 'newColor' | 'editColor'} formType - Identificador del tipo de formulario para determinar el estado y los manejadores.
   * @param {{ value: string | number; label: string }[]} [options] - Opciones para campos tipo 'select'. Se espera que 'value' sea string o number.
   * @param {boolean} [isTextarea=false] - Si es true, renderiza un Textarea.
   * @param {boolean} [isDisabled=false] - Si es true, deshabilita el campo.
   * @param {boolean} [isRequired=false] - Si es true, añade un asterisco a la etiqueta.
   * @param {string} [classNameGrid] - Clases CSS adicionales para el div contenedor del campo.
   * @returns {JSX.Element} El campo de formulario renderizado.
   */
  const renderDialogField = (
      label: string, name: any, type: string = "text", placeholder?: string,
      formType: 'newOrder' | 'editOrder' | 'newMarca' | 'editMarca' | 'newModelo' | 'editModelo' | 'newAseguradora' | 'editAseguradora' | 'newAjustador' | 'editAjustador' | 'newEmpleado' | 'editEmpleado' | 'newClient' | 'editClient'| 'newPuesto' | 'editPuesto' | 'newColor' | 'editColor' = 'newOrder',
      options?: { value: string | number; label: string }[], // value ahora es string | number
      isTextarea?: boolean, isDisabled?: boolean, isRequired?: boolean,
      classNameGrid?: string
    ): JSX.Element => {
    // Determinar el estado y los manejadores de cambio según el formType
    let value: any; // Puede ser string, number, boolean, o undefined
    let handleChange: any; // (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => void
    let handleSelect: any; // (val: string | undefined) => void
    let handleCheckbox: any; // (checked: boolean) => void

    // Asignar manejadores y valor según el tipo de formulario
    switch (formType) {
      case 'newOrder': value = newOrderData[name as keyof OrderFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => handleOrderInputChange(e, 'new'); handleSelect = (val: string | undefined) => handleOrderSelectChange(name as keyof OrderFormDataType | 'idMarca' | 'idAseguradora', val, 'new'); handleCheckbox = (checked: boolean) => handleOrderCheckboxChange(name as keyof OrderFormDataType, checked, 'new'); break;
      case 'editOrder': value = editOrderData[name as keyof OrderFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => handleOrderInputChange(e, 'edit'); handleSelect = (val: string | undefined) => handleOrderSelectChange(name as keyof OrderFormDataType | 'idMarca' | 'idAseguradora', val, 'edit'); handleCheckbox = (checked: boolean) => handleOrderCheckboxChange(name as keyof OrderFormDataType, checked, 'edit'); break;
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
        handleSelect = (val: string | undefined) => handleSelectChangeGeneric(name, val, setNewEmpleadoData); // Usar el genérico
        handleCheckbox = (checked: boolean) => handleCheckboxChangeGeneric(name, checked, setNewEmpleadoData); // Usar el genérico
        if (name === 'puesto') options = puestosList.filter(p => p.nombre && p.nombre.trim() !== "").map(p => ({ value: p.nombre, label: p.nombre })); 
        if (name === 'systemUserRol') options = userRoleOptions;
        break;
      case 'editEmpleado':
        value = editEmpleadoData[name as keyof EditEmpleadoFormDataType];
        handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditEmpleadoData);
        handleSelect = (val: string | undefined) => handleSelectChangeGeneric(name, val, setEditEmpleadoData);
        handleCheckbox = (checked: boolean) => handleCheckboxChangeGeneric(name, checked, setEditEmpleadoData);
        if (name === 'puesto') options = puestosList.filter(p => p.nombre && p.nombre.trim() !== "").map(p => ({ value: p.nombre, label: p.nombre })); 
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

    // ID único para el campo y su etiqueta, crucial para accesibilidad.
    const fieldId = `${formType}_${String(name)}`;

    // Caso especial para Select de 'color' en formularios de orden, que usa coloresList.
    let currentOptions = options; 
    let isLoadingSource = false;
    if (((formType === 'newOrder' || formType === 'editOrder') && name === 'color')) {
      currentOptions = coloresList.filter(c => c.nombre && c.nombre.trim() !== "").map(c => ({ value: c.nombre, label: c.nombre })); 
      isLoadingSource = isLoadingColores;
    }

    // Renderizado general para otros tipos de campos
    return (
      <div className={`space-y-1 ${classNameGrid || ''}`}>
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {label}{isRequired && <span className="text-destructive">*</span>}
        </Label>
        {isTextarea ? (
          <Textarea id={fieldId} name={String(name)} placeholder={placeholder} value={value || ''} onChange={handleChange} disabled={isDisabled} className="mt-1 w-full" />
        ) : type === 'select' ? (
          <Select name={String(name)} onValueChange={handleSelect} value={String(value || '')} disabled={isDisabled}>
            <SelectTrigger id={fieldId} className="w-full mt-1"><SelectValue placeholder={placeholder || `Seleccionar ${label.toLowerCase()}...`} /></SelectTrigger>
            <SelectContent>
              {isLoadingSource ? <SelectItem value="loading_options" disabled>Cargando opciones...</SelectItem> :
               (currentOptions && currentOptions.length > 0 ? currentOptions.map(opt => <SelectItem key={String(opt.value)} value={String(opt.value)}>{opt.label}</SelectItem>) :
               <SelectItem value="no_options_configured" disabled>No hay opciones configuradas</SelectItem>)
              }
            </SelectContent>
          </Select>
        ) : type === 'checkbox' ? (
          <div className="flex items-center space-x-2 mt-1 pt-2"> {/* Ajuste para que label del checkbox esté al lado */}
             <Checkbox id={fieldId} name={String(name)} checked={!!value} onCheckedChange={(checkedState) => handleCheckbox(typeof checkedState === 'boolean' ? checkedState : false)} disabled={isDisabled} />
             {/* La label para el checkbox se renderiza aquí si se desea una etiqueta al lado */}
             <Label htmlFor={fieldId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</Label>
          </div>
        ) : (
          <Input id={fieldId} name={String(name)} type={type} placeholder={placeholder} value={value === undefined || value === null ? '' : String(value)} onChange={handleChange} disabled={isDisabled} className="mt-1 w-full" min={type === 'number' ? '0' : undefined} />
        )}
      </div>
    );
  };


  // Si no hay datos de sesión, mostrar "Cargando..." o redirigir (ya manejado en useEffect)
  if (!userName || !userRole || !userIdEmpleado) {
    console.log("DashboardPage: userName, userRole, o userIdEmpleado faltan. Mostrando 'Cargando dashboard...'");
    return <div className="flex h-screen items-center justify-center">Cargando dashboard...</div>;
  }
  console.log("DashboardPage: Renderizando contenido principal. Estados de carga:", {isLoadingOrders, isLoadingMarcas, isLoadingAseguradoras, isLoadingClients, isLoadingAsesores, isLoadingValuadores, isLoadingHojalateros, isLoadingPintores, isLoadingEmpleadosList, isLoadingPuestos, isLoadingColores});


  // Determinar las clases para la lista de pestañas principales según el rol del usuario
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
          <TabsContent value="citas">
            <Card className="shadow-lg border-border/50">
              <CardHeader>
                <CardTitle className="text-xl">Gestión de Citas</CardTitle>
                <CardDescription>Programa y visualiza las citas del taller.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Contenido de Citas (ej. calendario, lista de próximas citas) irá aquí.</p>
                <Button className="mt-4"><PlusCircle className="mr-2 h-4 w-4"/>Nueva Cita</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contenido de la Pestaña Órdenes */}
          <TabsContent value="ordenes">
            <Card className="shadow-lg border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-xl">Órdenes de Servicio</CardTitle>
                  <CardDescription>Visualiza y gestiona las órdenes de servicio activas.</CardDescription>
                </div>
                <Button size="sm" onClick={() => { 
                  setNewOrderData({
                    ...initialNewOrderData, 
                    idAsesor: userRole === UserRole.ASESOR && userIdEmpleado ? userIdEmpleado : undefined, 
                  }); 
                  setAvailableAjustadoresForOrder([]); 
                  setAvailableModelosForOrder([]); 
                  setIsCreateOrderDialogOpen(true); 
                }}>
                  <PlusCircle className="mr-2 h-4 w-4"/>Nueva Orden
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? <p>Cargando órdenes...</p> : orders.length === 0 ? (
                  <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50">
                    <p className="text-muted-foreground">No hay órdenes de servicio registradas.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">OT</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vehículo (Marca Modelo)</TableHead>
                        <TableHead>Placas</TableHead>
                        <TableHead>Proceso</TableHead>
                        <TableHead>Fecha Registro</TableHead>
                        <TableHead className="text-right w-[120px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
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
                            <TableCell><Badge variant={getProcesoVariant(order.proceso)}>{order.proceso?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}</Badge></TableCell>
                            <TableCell>{formatDate(order.fechaRegistro)}</TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => openViewOrderDialog(order._id)} title="Ver Detalles"><EyeIcon className="h-4 w-4"/></Button>
                              <Button variant="ghost" size="icon" onClick={() => openEditOrderDialog(order._id)} title="Editar Orden"><Edit className="h-4 w-4"/></Button>
                              <Button variant="ghost" size="icon" onClick={() => openDeleteOrderDialog(order._id)} title="Eliminar Orden"><Trash2 className="h-4 w-4 text-destructive"/></Button>
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
              <CardHeader>
                <CardTitle className="text-xl">Gestión de Almacén</CardTitle>
                <CardDescription>Controla el inventario de refacciones y materiales.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Contenido de Almacén (ej. tabla de refacciones, búsqueda, stock) irá aquí.</p>
                <Button className="mt-4"><PlusCircle className="mr-2 h-4 w-4"/>Nueva Refacción</Button>
              </CardContent>
            </Card>
          </TabsContent>

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
                <TabsContent value="general">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Card para Gestión de Puestos */}
                    <Card className="shadow-lg border-border/50">
                      <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                          <CardTitle className="text-xl">Gestión de Puestos</CardTitle>
                          <CardDescription>Administra los puestos de trabajo del taller.</CardDescription>
                        </div>
                        <Button size="sm" onClick={() => { setNewPuestoData({nombre: ''}); setIsCreatePuestoDialogOpen(true);}}><PlusCircle className="mr-2 h-4 w-4"/>Nuevo Puesto</Button>
                      </CardHeader>
                      <CardContent>
                        {isLoadingPuestos ? <p>Cargando puestos...</p> : puestosList.length === 0 ? (
                          <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50">
                            <p className="text-muted-foreground">No hay puestos registrados.</p>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader><TableRow><TableHead className="w-[100px]">ID</TableHead><TableHead>Nombre del Puesto</TableHead><TableHead className="text-right w-[100px]">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {puestosList.map((puesto) => (
                                <TableRow key={puesto._id}>
                                  <TableCell className="font-mono text-xs truncate max-w-[100px]" title={puesto._id}>{puesto._id.slice(-6)}</TableCell>
                                  <TableCell className="font-medium">{puesto.nombre}</TableCell>
                                  <TableCell className="text-right space-x-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEditPuestoDialog(puesto)} title="Editar Puesto"><Edit className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" onClick={() => openDeletePuestoDialog(puesto._id)} title="Eliminar Puesto"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                    {/* Card para Gestión de Colores de Vehículos */}
                    <Card className="shadow-lg border-border/50">
                      <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                          <CardTitle className="text-xl">Gestión de Colores de Vehículos</CardTitle>
                          <CardDescription>Administra los colores disponibles para vehículos.</CardDescription>
                        </div>
                        <Button size="sm" onClick={() => { setNewColorData({nombre: ''}); setIsCreateColorDialogOpen(true);}}><PlusCircle className="mr-2 h-4 w-4"/>Nuevo Color</Button>
                      </CardHeader>
                      <CardContent>
                        {isLoadingColores ? <p>Cargando colores...</p> : coloresList.length === 0 ? (
                          <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50">
                            <p className="text-muted-foreground">No hay colores registrados.</p>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader><TableRow><TableHead className="w-[100px]">ID</TableHead><TableHead>Nombre del Color</TableHead><TableHead className="text-right w-[100px]">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {coloresList.map((color) => (
                                <TableRow key={color._id}>
                                  <TableCell className="font-mono text-xs truncate max-w-[100px]" title={color._id}>{color._id.slice(-6)}</TableCell>
                                  <TableCell className="font-medium">{color.nombre}</TableCell>
                                  <TableCell className="text-right space-x-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEditColorDialog(color)} title="Editar Color"><Edit className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon" onClick={() => openDeleteColorDialog(color._id)} title="Eliminar Color"><Trash2 className="h-4 w-4 text-destructive"/></Button>
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
                <TabsContent value="marcas">
                  <Card className="shadow-lg border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <div>
                        <CardTitle className="text-xl">Gestión de Marcas y Modelos</CardTitle>
                        <CardDescription>Administra las marcas de vehículos y sus respectivos modelos.</CardDescription>
                      </div>
                      <Button size="sm" onClick={() => { setNewMarcaData({marca: ''}); setIsCreateMarcaDialogOpen(true);}}><PlusCircle className="mr-2 h-4 w-4"/>Nueva Marca</Button>
                    </CardHeader>
                    <CardContent>
                    {isLoadingMarcas ? <p>Cargando marcas...</p> : marcas.length === 0 ? (
                      <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50">
                        <p className="text-muted-foreground">No hay marcas registradas.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader><TableRow><TableHead className="w-[100px]">ID Marca</TableHead><TableHead>Nombre Marca</TableHead><TableHead>Nº Modelos</TableHead><TableHead className="text-right w-[150px]">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {marcas.map((marca) => (
                            <TableRow key={marca._id}>
                              <TableCell className="font-mono text-xs truncate max-w-[100px]" title={marca._id}>{marca._id.slice(-6)}</TableCell>
                              <TableCell className="font-medium">{marca.marca}</TableCell>
                              <TableCell>{marca.modelos?.length || 0}</TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button variant="outline" size="sm" onClick={() => openManageModelosDialog(marca)}>Modelos</Button>
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
                      <div>
                        <CardTitle className="text-xl">Gestión de Aseguradoras</CardTitle>
                        <CardDescription>Administra las compañías de seguros y sus ajustadores.</CardDescription>
                      </div>
                      <Button size="sm" onClick={() => { setNewAseguradoraData({nombre: '', telefono: ''}); setIsCreateAseguradoraDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4"/>Nueva Aseguradora</Button>
                    </CardHeader>
                    <CardContent>
                    {isLoadingAseguradoras ? <p>Cargando aseguradoras...</p> : aseguradoras.length === 0 ? (
                      <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50">
                        <p className="text-muted-foreground">No hay aseguradoras registradas.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader><TableRow><TableHead className="w-[100px]">ID Aseg.</TableHead><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>Nº Ajustadores</TableHead><TableHead className="text-right w-[150px]">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {aseguradoras.map((aseg) => (
                            <TableRow key={aseg._id}>
                              <TableCell className="font-mono text-xs truncate max-w-[100px]" title={aseg._id}>{aseg._id.slice(-6)}</TableCell>
                              <TableCell className="font-medium">{aseg.nombre}</TableCell>
                              <TableCell>{aseg.telefono || 'N/A'}</TableCell>
                              <TableCell>{aseg.ajustadores?.length || 0}</TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button variant="outline" size="sm" onClick={() => openManageAjustadoresDialog(aseg)}>Ajustadores</Button>
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
                      <div>
                        <CardTitle className="text-xl">Gestión de Empleados</CardTitle>
                        <CardDescription>Administra el personal del taller y sus accesos al sistema.</CardDescription>
                      </div>
                      <Button size="sm" onClick={() => { setNewEmpleadoData(initialNewEmpleadoData); setIsCreateEmpleadoDialogOpen(true);}}><UserPlus className="mr-2 h-4 w-4"/>Nuevo Empleado</Button>
                    </CardHeader>
                    <CardContent>
                      {isLoadingEmpleadosList ? <p>Cargando empleados...</p> : empleadosList.length === 0 ? (
                        <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50">
                            <p className="text-muted-foreground">No hay empleados registrados.</p>
                        </div>
                        ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]">ID Empleado</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Puesto</TableHead>
                              <TableHead>Usuario Sistema</TableHead>
                              <TableHead>Rol Sistema</TableHead>
                              <TableHead className="text-right w-[100px]">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {empleadosList.map((emp) => (
                              <TableRow key={emp._id}>
                                <TableCell className="font-mono text-xs truncate max-w-[100px]" title={emp._id}>{emp._id.slice(-6)}</TableCell>
                                <TableCell className="font-medium">{emp.nombre}</TableCell>
                                <TableCell>{emp.puesto || 'N/A'}</TableCell>
                                <TableCell>{emp.user?.usuario || <Badge variant="outline">Sin Acceso</Badge>}</TableCell>
                                <TableCell>{emp.user?.rol ? <Badge variant={emp.user.rol === UserRole.ADMIN ? "default" : "secondary"}>{emp.user.rol}</Badge> : 'N/A'}</TableCell>
                                <TableCell className="text-right space-x-1">
                                  <Button variant="ghost" size="icon" onClick={() => openEditEmpleadoDialog(emp._id)} title="Editar Empleado"><Edit className="h-4 w-4"/></Button>
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
      <Dialog open={isCreateOrderDialogOpen} onOpenChange={(open) => { setIsCreateOrderDialogOpen(open); if (!open) setNewOrderData(initialNewOrderData); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear Nueva Orden de Servicio</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {/* Sección Cliente */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4 mb-4">
                <div className="space-y-1">
                  <Label htmlFor="newOrder_idCliente">Cliente*</Label>
                  <div className="flex items-center gap-2">
                    <Popover open={isNewOrderClientComboboxOpen} onOpenChange={setIsNewOrderClientComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={isNewOrderClientComboboxOpen} className="w-full justify-between">
                          {newOrderData.idCliente ? clients.find(c => c._id === newOrderData.idCliente)?.nombre : "Seleccionar cliente..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar cliente..." />
                          <CommandList>
                            <CommandEmpty>Ningún cliente encontrado.</CommandEmpty>
                            <CommandGroup>
                              {clients.map((client) => (
                                <CommandItem
                                  key={client._id}
                                  value={client.nombre} 
                                  onSelect={(currentValue) => { 
                                    const selectedClient = clients.find(c => c.nombre.toLowerCase() === currentValue.toLowerCase());
                                    if (selectedClient) {
                                      handleOrderSelectChange('idCliente', selectedClient._id, 'new');
                                    }
                                    setIsNewOrderClientComboboxOpen(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", newOrderData.idCliente === client._id ? "opacity-100" : "opacity-0")}/>
                                  {client.nombre}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Button size="sm" onClick={openCreateClientDialog} variant="outline" title="Crear Nuevo Cliente"><PlusCircle className="h-4 w-4"/></Button>
                  </div>
                </div>
              </div>
              {/* Sección Aseguradora */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4 mb-4">
                {renderDialogField("Aseguradora", "idAseguradora", "select", "Seleccionar aseguradora...", "newOrder", aseguradoras.map(a => ({value: a._id, label: a.nombre})))}
                {renderDialogField("Ajustador", "idAjustador", "select", "Seleccionar ajustador...", "newOrder", availableAjustadoresForOrder.map(a => ({value: a.idAjustador, label: a.nombre})), false, !newOrderData.idAseguradora || availableAjustadoresForOrder.length === 0)}
                {renderDialogField("No. Siniestro", "siniestro", "text", "No. Siniestro", "newOrder")}
                {renderDialogField("No. Póliza", "poliza", "text", "No. Póliza", "newOrder")}
                {renderDialogField("Folio Aseguradora", "folio", "text", "Folio", "newOrder")}
                {renderDialogField("Deducible ($)", "deducible", "number", "0.00", "newOrder")}
                {renderDialogField("Asegurado/Tercero*", "aseguradoTerceroString", "select", "Seleccionar...", "newOrder", aseguradoTerceroOptions, false, false, true)}
              </div>
              {/* Sección Vehículo */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4 mb-4">
                {renderDialogField("Marca*", "idMarca", "select", "Seleccionar marca...", "newOrder", marcas.map(m => ({value: m._id, label: m.marca})), false, false, true)}
                {renderDialogField("Modelo*", "idModelo", "select", "Seleccionar modelo...", "newOrder", availableModelosForOrder.map(m => ({value: m.idModelo, label: m.modelo})), false, !newOrderData.idMarca || availableModelosForOrder.length === 0, true)}
                {renderDialogField("Año", "año", "number", "Ej: 2020", "newOrder")}
                {renderDialogField("Placas", "placas", "text", "Ej: ABC-123", "newOrder")}
                {renderDialogField("Color", "color", "select", "Seleccionar color...", "newOrder", coloresList.filter(c => c.nombre && c.nombre.trim() !== "").map(c => ({value: c.nombre, label: c.nombre})))}
                {renderDialogField("VIN", "vin", "text", "Número de Serie", "newOrder")}
                {renderDialogField("Kilometraje", "kilometraje", "text", "Ej: 50000", "newOrder")}
              </div>
              {/* Sección Estado y Personal */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderDialogField("¿Piso?", "piso", "checkbox", undefined, "newOrder")}
                {renderDialogField("¿Grúa?", "grua", "checkbox", undefined, "newOrder")}
                {renderDialogField("Proceso Inicial*", "proceso", "select", "Seleccionar proceso...", "newOrder", procesoOptions, false, false, true)}
                {renderDialogField("Asesor*", "idAsesor", "select", "Seleccionar asesor...", "newOrder", asesores.map(a => ({value: a._id, label: a.nombre})), false, userRole === UserRole.ASESOR, true)}
                {renderDialogField("Valuador", "idValuador", "select", "Seleccionar valuador...", "newOrder", valuadores.map(v => ({value: v._id, label: v.nombre})))}
                {renderDialogField("Hojalatero", "idHojalatero", "select", "Seleccionar hojalatero...", "newOrder", hojalateros.map(h => ({value: h._id, label: h.nombre})))}
                {renderDialogField("Pintor", "idPintor", "select", "Seleccionar pintor...", "newOrder", pintores.map(p => ({value: p._id, label: p.nombre})))}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateOrder}>Crear Orden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Editar Orden */}
      <Dialog open={isEditOrderDialogOpen} onOpenChange={(open) => { setIsEditOrderDialogOpen(open); if (!open) setCurrentOrder(null); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Orden de Servicio OT-{currentOrder?.idOrder}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {/* Sección Cliente */}
               <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4 mb-4">
                <div className="space-y-1">
                  <Label htmlFor="editOrder_idCliente">Cliente*</Label>
                  <div className="flex items-center gap-2">
                    <Popover open={isEditOrderClientComboboxOpen} onOpenChange={setIsEditOrderClientComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={isEditOrderClientComboboxOpen} className="w-full justify-between">
                          {editOrderData.idCliente ? clients.find(c => c._id === editOrderData.idCliente)?.nombre : "Seleccionar cliente..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar cliente..." />
                          <CommandList>
                            <CommandEmpty>Ningún cliente encontrado.</CommandEmpty>
                            <CommandGroup>
                              {clients.map((client) => (
                                <CommandItem
                                  key={client._id}
                                  value={client.nombre} 
                                  onSelect={(currentValue) => {
                                    const selectedClient = clients.find(c => c.nombre.toLowerCase() === currentValue.toLowerCase());
                                    if (selectedClient) {
                                      handleOrderSelectChange('idCliente', selectedClient._id, 'edit');
                                    }
                                    setIsEditOrderClientComboboxOpen(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", editOrderData.idCliente === client._id ? "opacity-100" : "opacity-0")}/>
                                  {client.nombre}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Button size="sm" onClick={openCreateClientDialog} variant="outline" title="Crear Nuevo Cliente"><PlusCircle className="h-4 w-4"/></Button>
                  </div>
                </div>
              </div>
              {/* Sección Aseguradora */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4 mb-4">
                {renderDialogField("Aseguradora", "idAseguradora", "select", "Seleccionar aseguradora...", "editOrder", aseguradoras.map(a => ({value: a._id, label: a.nombre})))}
                {renderDialogField("Ajustador", "idAjustador", "select", "Seleccionar ajustador...", "editOrder", availableAjustadoresForOrder.map(a => ({value: a.idAjustador, label: a.nombre})), false, !editOrderData.idAseguradora || availableAjustadoresForOrder.length === 0)}
                {renderDialogField("No. Siniestro", "siniestro", "text", "No. Siniestro", "editOrder")}
                {renderDialogField("No. Póliza", "poliza", "text", "No. Póliza", "editOrder")}
                {renderDialogField("Folio Aseguradora", "folio", "text", "Folio", "editOrder")}
                {renderDialogField("Deducible ($)", "deducible", "number", "0.00", "editOrder")}
                {renderDialogField("Asegurado/Tercero*", "aseguradoTerceroString", "select", "Seleccionar...", "editOrder", aseguradoTerceroOptions, false, false, true)}
              </div>
              {/* Sección Vehículo */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4 mb-4">
                {renderDialogField("Marca*", "idMarca", "select", "Seleccionar marca...", "editOrder", marcas.map(m => ({value: m._id, label: m.marca})), false, false, true)}
                {renderDialogField("Modelo*", "idModelo", "select", "Seleccionar modelo...", "editOrder", availableModelosForOrder.map(m => ({value: m.idModelo, label: m.modelo})), false, !editOrderData.idMarca || availableModelosForOrder.length === 0, true)}
                {renderDialogField("Año", "año", "number", "Ej: 2020", "editOrder")}
                {renderDialogField("Placas", "placas", "text", "Ej: ABC-123", "editOrder")}
                {renderDialogField("Color", "color", "select", "Seleccionar color...", "editOrder", coloresList.filter(c => c.nombre && c.nombre.trim() !== "").map(c => ({value: c.nombre, label: c.nombre})))}
                {renderDialogField("VIN", "vin", "text", "Número de Serie", "editOrder")}
                {renderDialogField("Kilometraje", "kilometraje", "text", "Ej: 50000", "editOrder")}
              </div>
              {/* Sección Estado, Personal y Fechas */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderDialogField("¿Piso?", "piso", "checkbox", undefined, "editOrder")}
                {renderDialogField("¿Grúa?", "grua", "checkbox", undefined, "editOrder")}
                {renderDialogField("Proceso*", "proceso", "select", "Seleccionar proceso...", "editOrder", procesoOptions, false, false, true)}
                {renderDialogField("Asesor*", "idAsesor", "select", "Seleccionar asesor...", "editOrder", asesores.map(a => ({value: a._id, label: a.nombre})), false, userRole === UserRole.ASESOR && currentOrder?.idAsesor === userIdEmpleado, true)}
                {renderDialogField("Valuador", "idValuador", "select", "Seleccionar valuador...", "editOrder", valuadores.map(v => ({value: v._id, label: v.nombre})))}
                {renderDialogField("Hojalatero", "idHojalatero", "select", "Seleccionar hojalatero...", "editOrder", hojalateros.map(h => ({value: h._id, label: h.nombre})))}
                {renderDialogField("Pintor", "idPintor", "select", "Seleccionar pintor...", "editOrder", pintores.map(p => ({value: p._id, label: p.nombre})))}
                {renderDialogField("Fecha Valuación", "fechaValuacion", "date", "", "editOrder")}
                {renderDialogField("Fecha Reingreso", "fechaReingreso", "date", "", "editOrder")}
                {renderDialogField("Fecha Promesa", "fechaPromesa", "date", "", "editOrder")}
                {renderDialogField("Fecha Entrega", "fechaEntrega", "date", "", "editOrder")}
                {renderDialogField("Fecha Baja", "fechaBaja", "date", "", "editOrder")}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateOrder}>Actualizar Orden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Ver Detalles de Orden */}
      <Dialog open={isViewOrderDialogOpen} onOpenChange={(open) => { setIsViewOrderDialogOpen(open); if(!open) setCurrentOrder(null);}}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Detalles de Orden OT-{currentOrder?.idOrder}</DialogTitle>
            <DialogDescription>Información completa de la orden de servicio.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1"> {/* Padding p-1 para el scrollbar */}
            {currentOrder ? (
              <div className="space-y-6 p-4"> {/* Padding p-4 para el contenido */}
                {/* Detalles del Cliente y Aseguradora */}
                <Card><CardHeader><CardTitle className="text-lg">Cliente y Aseguradora</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Cliente:</strong> {clients.find(c => c._id === currentOrder.idCliente)?.nombre || currentOrder.idCliente || 'N/A'}</div>
                    <div><strong>Aseguradora:</strong> {aseguradoras.find(a => a._id === currentOrder.idAseguradora)?.nombre || 'Particular'}</div>
                    <div><strong>Ajustador:</strong> { (currentOrder.idAseguradora && availableAjustadoresForOrder.length > 0) ? (availableAjustadoresForOrder.find(aj => aj.idAjustador === currentOrder.idAjustador)?.nombre) : (aseguradoras.find(a => a._id === currentOrder.idAseguradora)?.ajustadores?.find(aj => aj.idAjustador === currentOrder.idAjustador)?.nombre || 'N/A')}</div>
                    <div><strong>No. Siniestro:</strong> {currentOrder.siniestro || 'N/A'}</div>
                    <div><strong>No. Póliza:</strong> {currentOrder.poliza || 'N/A'}</div>
                    <div><strong>Folio Aseg.:</strong> {currentOrder.folio || 'N/A'}</div>
                    <div><strong>Deducible:</strong> ${currentOrder.deducible?.toLocaleString() || '0.00'}</div>
                    <div><strong>Tipo:</strong> {currentOrder.aseguradoTercero ? 'Asegurado' : 'Tercero'}</div>
                  </CardContent>
                </Card>
                {/* Detalles del Vehículo */}
                <Card><CardHeader><CardTitle className="text-lg">Vehículo</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Marca:</strong> {marcas.find(m => m._id === currentOrder.idMarca)?.marca || 'N/A'}</div>
                    <div><strong>Modelo:</strong> { (currentOrder.idMarca && availableModelosForOrder.length > 0) ? (availableModelosForOrder.find(mod => mod.idModelo === currentOrder.idModelo)?.modelo) : (marcas.find(m => m._id === currentOrder.idMarca)?.modelos?.find(mod => mod.idModelo === currentOrder.idModelo)?.modelo || 'N/A')}</div>
                    <div><strong>Año:</strong> {currentOrder.año || 'N/A'}</div>
                    <div><strong>Placas:</strong> {currentOrder.placas || 'N/A'}</div>
                    <div><strong>Color:</strong> {currentOrder.color || 'N/A'}</div>
                    <div><strong>VIN:</strong> {currentOrder.vin || 'N/A'}</div>
                    <div><strong>Kilometraje:</strong> {currentOrder.kilometraje || 'N/A'}</div>
                  </CardContent>
                </Card>
                {/* Estado y Personal Asignado */}
                <Card><CardHeader><CardTitle className="text-lg">Estado y Personal</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Proceso Actual:</strong> <Badge variant={getProcesoVariant(currentOrder.proceso)}>{currentOrder.proceso?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}</Badge></div>
                    <div><strong>En Piso:</strong> {currentOrder.piso ? 'Sí' : 'No'}</div>
                    <div><strong>Llegó en Grúa:</strong> {currentOrder.grua ? 'Sí' : 'No'}</div>
                    <div><strong>Asesor:</strong> {asesores.find(e => e._id === currentOrder.idAsesor)?.nombre || 'N/A'}</div>
                    <div><strong>Valuador:</strong> {valuadores.find(e => e._id === currentOrder.idValuador)?.nombre || 'N/A'}</div>
                    <div><strong>Hojalatero:</strong> {hojalateros.find(e => e._id === currentOrder.idHojalatero)?.nombre || 'N/A'}</div>
                    <div><strong>Pintor:</strong> {pintores.find(e => e._id === currentOrder.idPintor)?.nombre || 'N/A'}</div>
                  </CardContent>
                </Card>
                {/* Fechas Clave */}
                <Card><CardHeader><CardTitle className="text-lg">Fechas Clave</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Registro:</strong> {formatDateTime(currentOrder.fechaRegistro)}</div>
                    <div><strong>Valuación:</strong> {currentOrder.fechaValuacion ? formatDate(currentOrder.fechaValuacion) : 'N/A'}</div>
                    <div><strong>Reingreso:</strong> {currentOrder.fechaReingreso ? formatDate(currentOrder.fechaReingreso) : 'N/A'}</div>
                    <div><strong>Promesa Entrega:</strong> {currentOrder.fechaPromesa ? formatDate(currentOrder.fechaPromesa) : 'N/A'}</div>
                    <div><strong>Entrega Real:</strong> {currentOrder.fechaEntrega ? formatDate(currentOrder.fechaEntrega) : 'N/A'}</div>
                    <div><strong>Baja:</strong> {currentOrder.fechaBaja ? formatDate(currentOrder.fechaBaja) : 'N/A'}</div>
                  </CardContent>
                </Card>
                {/* Historial (Log) */}
                {currentOrder.Log && currentOrder.Log.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Historial de Cambios</CardTitle></CardHeader>
                    <CardContent className="text-sm">
                      <ScrollArea className="h-[150px]">
                        <ul className="space-y-2">
                          {currentOrder.Log.slice().reverse().map((entry, index) => ( 
                            <li key={index} className="border-b pb-1 mb-1">
                              <strong>{formatDateTime(entry.timestamp)}</strong> - {empleadosList.find(e => e._id === entry.userId)?.nombre || entry.userId || 'Sistema'}: {entry.action}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
                {/* Presupuestos (Placeholder) */}
                <Card><CardHeader><CardTitle className="text-lg">Presupuestos</CardTitle></CardHeader>
                  <CardContent className="text-sm">
                    {currentOrder.presupuestos && currentOrder.presupuestos.length > 0 ? (
                      <p>Hay {currentOrder.presupuestos.length} ítems en el presupuesto. (UI de detalle de presupuestos pendiente)</p>
                    ) : <p>No hay ítems de presupuesto registrados para esta orden.</p>}
                  </CardContent>
                </Card>
              </div>
            ) : <p>Cargando detalles de la orden...</p>}
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Confirmar Eliminación de Orden */}
      <Dialog open={isDeleteOrderDialogOpen} onOpenChange={setIsDeleteOrderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la orden OT-{orders.find(o => o._id === orderToDeleteId)?.idOrder || orderToDeleteId}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteOrder}>Eliminar Orden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIÁLOGOS MARCAS Y MODELOS --- */}
      {/* Diálogo para Crear Nueva Marca */}
      <Dialog open={isCreateMarcaDialogOpen} onOpenChange={(open) => {setIsCreateMarcaDialogOpen(open); if(!open) setNewMarcaData({ marca: '' });}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nueva Marca</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre de la Marca", "marca", "text", "Ej: Toyota", "newMarca", undefined, false, false, true)}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateMarca}>Guardar Marca</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Editar Marca */}
      <Dialog open={isEditMarcaDialogOpen} onOpenChange={(open) => {setIsEditMarcaDialogOpen(open); if(!open)setCurrentMarca(null);}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Marca: {currentMarca?.marca}</DialogTitle></DialogHeader>
          {currentMarca && (<div className="space-y-4 py-4">{renderDialogField("Nombre de la Marca", "marca", "text", currentMarca.marca, "editMarca",undefined,false,false,true)}</div>)}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateMarca}>Actualizar Marca</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Confirmar Eliminación de Marca */}
      <Dialog open={isDeleteMarcaDialogOpen} onOpenChange={setIsDeleteMarcaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Estás seguro de eliminar la marca "{marcas.find(m => m._id === marcaToDeleteId)?.marca}"? Se eliminarán también todos sus modelos. Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteMarca}>Eliminar Marca</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Gestionar Modelos de una Marca */}
      <Dialog open={isManageModelosDialogOpen} onOpenChange={setIsManageModelosDialogOpen}>
        <DialogContent className="sm:max-w-xl"> {/* Aumentado el ancho */}
          <DialogHeader><DialogTitle>Gestionar Modelos de: {currentMarca?.marca}</DialogTitle></DialogHeader>
          <div className="my-4">
            <div className="flex justify-end mb-2">
              <Button size="sm" onClick={() => { setNewModeloData({modelo:''}); setIsCreateModeloDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Modelo</Button>
            </div>
            {currentMarca?.modelos && currentMarca.modelos.length > 0 ? (
              <Table><TableHeader><TableRow><TableHead className="w-[150px]">ID Modelo</TableHead><TableHead>Nombre Modelo</TableHead><TableHead className="text-right w-[100px]">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {currentMarca.modelos.map(mod => (
                    <TableRow key={mod.idModelo}>
                      <TableCell className="font-mono text-xs truncate max-w-[150px]" title={mod.idModelo}>{mod.idModelo.slice(-6)}</TableCell>
                      <TableCell className="font-medium truncate" title={mod.modelo}>{mod.modelo}</TableCell> {/* Añadido truncate y title */}
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditModeloDialog(mod)} title="Editar Modelo"><Edit className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteModelo(mod.idModelo)} title="Eliminar Modelo"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (<p className="text-center text-muted-foreground py-4">No hay modelos registrados para esta marca.</p>)}
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Crear Modelo (anidado o separado) */}
      <Dialog open={isCreateModeloDialogOpen} onOpenChange={setIsCreateModeloDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Añadir Nuevo Modelo a {currentMarca?.marca}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">{renderDialogField("Nombre del Modelo", "modelo", "text", "Ej: Corolla", "newModelo",undefined,false,false,true)}</div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateModelo}>Guardar Modelo</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Editar Modelo */}
      <Dialog open={isEditModeloDialogOpen} onOpenChange={setIsEditModeloDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Modelo: {currentModelo?.modelo}</DialogTitle></DialogHeader>
          {currentModelo && (<div className="space-y-4 py-4">{renderDialogField("Nombre del Modelo", "modelo", "text", currentModelo.modelo, "editModelo",undefined,false,false,true)}</div>)}
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateModelo}>Actualizar Modelo</Button></DialogFooter>
        </DialogContent>
      </Dialog>


      {/* --- DIÁLOGOS ASEGURADORAS Y AJUSTADORES --- */}
      {/* Diálogo para Crear Nueva Aseguradora */}
      <Dialog open={isCreateAseguradoraDialogOpen} onOpenChange={(open) => {setIsCreateAseguradoraDialogOpen(open); if(!open) setNewAseguradoraData({ nombre: '', telefono: '' });}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nueva Aseguradora</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre Aseguradora", "nombre", "text", "Nombre de la compañía", "newAseguradora", undefined, false, false, true)}
            {renderDialogField("Teléfono", "telefono", "text", "Teléfono de contacto", "newAseguradora")}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateAseguradora}>Guardar Aseguradora</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Editar Aseguradora */}
      <Dialog open={isEditAseguradoraDialogOpen} onOpenChange={(open) => {setIsEditAseguradoraDialogOpen(open); if(!open)setCurrentAseguradora(null);}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Aseguradora: {currentAseguradora?.nombre}</DialogTitle></DialogHeader>
          {currentAseguradora && (
            <div className="space-y-4 py-4">
              {renderDialogField("Nombre Aseguradora", "nombre", "text", currentAseguradora.nombre, "editAseguradora",undefined,false,false,true)}
              {renderDialogField("Teléfono", "telefono", "text", currentAseguradora.telefono, "editAseguradora")}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateAseguradora}>Actualizar Aseguradora</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Confirmar Eliminación de Aseguradora */}
      <Dialog open={isDeleteAseguradoraDialogOpen} onOpenChange={setIsDeleteAseguradoraDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Estás seguro de eliminar la aseguradora "{aseguradoras.find(a => a._id === aseguradoraToDeleteId)?.nombre}"? Se eliminarán también todos sus ajustadores. Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteAseguradora}>Eliminar Aseguradora</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Gestionar Ajustadores de una Aseguradora */}
      <Dialog open={isManageAjustadoresDialogOpen} onOpenChange={setIsManageAjustadoresDialogOpen}>
        <DialogContent className="sm:max-w-2xl"> {/* Aumentado el ancho */}
          <DialogHeader><DialogTitle>Gestionar Ajustadores de: {currentAseguradora?.nombre}</DialogTitle></DialogHeader>
          <div className="my-4">
            <div className="flex justify-end mb-2">
              <Button size="sm" onClick={() => { setNewAjustadorData({nombre:'', telefono:'', correo:''}); setIsCreateAjustadorDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Ajustador</Button>
            </div>
            {currentAseguradora?.ajustadores && currentAseguradora.ajustadores.length > 0 ? (
              <Table><TableHeader><TableRow><TableHead className="w-[150px]">ID Ajustador</TableHead><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>Correo</TableHead><TableHead className="text-right w-[100px]">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {currentAseguradora.ajustadores.map(aj => (
                    <TableRow key={aj.idAjustador}>
                      <TableCell className="font-mono text-xs truncate max-w-[150px]" title={aj.idAjustador}>{aj.idAjustador.slice(-6)}</TableCell>
                      <TableCell className="font-medium">{aj.nombre}</TableCell>
                      <TableCell>{aj.telefono || 'N/A'}</TableCell>
                      <TableCell className="truncate" title={aj.correo || 'N/A'}>{aj.correo || 'N/A'}</TableCell> {/* Añadido truncate y title */}
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditAjustadorDialog(aj)} title="Editar Ajustador"><Edit className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAjustador(aj.idAjustador)} title="Eliminar Ajustador"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (<p className="text-center text-muted-foreground py-4">No hay ajustadores registrados para esta aseguradora.</p>)}
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Crear Ajustador */}
      <Dialog open={isCreateAjustadorDialogOpen} onOpenChange={setIsCreateAjustadorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Añadir Nuevo Ajustador a {currentAseguradora?.nombre}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre Ajustador", "nombre", "text", "Nombre completo", "newAjustador",undefined,false,false,true)}
            {renderDialogField("Teléfono", "telefono", "text", "Teléfono de contacto", "newAjustador")}
            {renderDialogField("Correo Electrónico", "correo", "email", "ejemplo@correo.com", "newAjustador")}
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateAjustador}>Guardar Ajustador</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Editar Ajustador */}
      <Dialog open={isEditAjustadorDialogOpen} onOpenChange={setIsEditAjustadorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Ajustador: {currentAjustador?.nombre}</DialogTitle></DialogHeader>
          {currentAjustador && (
            <div className="space-y-4 py-4">
              {renderDialogField("Nombre Ajustador", "nombre", "text", currentAjustador.nombre, "editAjustador",undefined,false,false,true)}
              {renderDialogField("Teléfono", "telefono", "text", currentAjustador.telefono, "editAjustador")}
              {renderDialogField("Correo Electrónico", "correo", "email", currentAjustador.correo, "editAjustador")}
            </div>
          )}
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateAjustador}>Actualizar Ajustador</Button></DialogFooter>
        </DialogContent>
      </Dialog>


      {/* --- DIÁLOGOS EMPLEADOS --- */}
      {/* Diálogo para Crear Nuevo Empleado */}
      <Dialog open={isCreateEmpleadoDialogOpen} onOpenChange={(open) => { setIsCreateEmpleadoDialogOpen(open); if(!open) setNewEmpleadoData(initialNewEmpleadoData); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear Nuevo Empleado</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1">
            <div className="space-y-4 p-4">
              <div className="space-y-1">{renderDialogField("Nombre Completo*", "nombre", "text", "Nombre completo del empleado", "newEmpleado", undefined, false, false, true)}</div>
              <div className="space-y-1">{renderDialogField("Puesto*", "puesto", "select", "Seleccionar puesto...", "newEmpleado", undefined, false, !puestosList || puestosList.length === 0, true)}</div>
              <div className="space-y-1">{renderDialogField("Teléfono", "telefono", "tel", "Número de teléfono", "newEmpleado")}</div>
              <div className="space-y-1">{renderDialogField("Correo Electrónico", "correo", "email", "correo@ejemplo.com", "newEmpleado")}</div>
              <div className="space-y-1">{renderDialogField("Sueldo", "sueldo", "number", "0.00", "newEmpleado")}</div>
              <div className="space-y-1">{renderDialogField("Comisión (%)", "comision", "number", "0", "newEmpleado")}</div>
              
              <div className="my-2 border-t pt-4">
                {renderDialogField("Crear acceso al sistema", "createSystemUser", "checkbox", undefined, "newEmpleado")}
              </div>

              {newEmpleadoData.createSystemUser && (
                <>
                  <div className="space-y-1">{renderDialogField("Nombre de Usuario*", "systemUserUsuario", "text", "usuario_sistema", "newEmpleado", undefined, false, false, true)}</div>
                  <div className="space-y-1">{renderDialogField("Contraseña*", "systemUserContraseña", "password", "••••••••", "newEmpleado", undefined, false, false, true)}</div>
                  <div className="space-y-1">{renderDialogField("Confirmar Contraseña*", "systemUserConfirmContraseña", "password", "••••••••", "newEmpleado", undefined, false, false, true)}</div>
                  <div className="space-y-1">{renderDialogField("Rol en Sistema*", "systemUserRol", "select", "Seleccionar rol...", "newEmpleado", undefined, false, false, true)}</div>
                </>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateEmpleado}>Crear Empleado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Editar Empleado */}
      <Dialog open={isEditEmpleadoDialogOpen} onOpenChange={(open) => { setIsEditEmpleadoDialogOpen(open); if(!open) setCurrentEmpleadoToEdit(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Empleado: {currentEmpleadoToEdit?.nombre}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1">
            {currentEmpleadoToEdit && (
              <div className="space-y-4 p-4">
                <div className="space-y-1">{renderDialogField("Nombre Completo*", "nombre", "text", currentEmpleadoToEdit.nombre, "editEmpleado",undefined,false,false,true)}</div>
                <div className="space-y-1">{renderDialogField("Puesto*", "puesto", "select", currentEmpleadoToEdit.puesto, "editEmpleado",undefined,false,!puestosList || puestosList.length === 0,true)}</div>
                <div className="space-y-1">{renderDialogField("Teléfono", "telefono", "text", currentEmpleadoToEdit.telefono, "editEmpleado")}</div>
                <div className="space-y-1">{renderDialogField("Correo Electrónico", "correo", "email", currentEmpleadoToEdit.correo, "editEmpleado")}</div>
                <div className="space-y-1">{renderDialogField("Sueldo", "sueldo", "number", currentEmpleadoToEdit.sueldo?.toString(), "editEmpleado")}</div>
                <div className="space-y-1">{renderDialogField("Comisión (%)", "comision", "number", currentEmpleadoToEdit.comision?.toString(), "editEmpleado")}</div>

                <div className="my-2 border-t pt-4">
                  {currentEmpleadoToEdit.user ? ( 
                    <div>
                      <h4 className="font-medium mb-2">Acceso al Sistema</h4>
                      <div className="space-y-1">{renderDialogField("Nombre de Usuario*", "systemUserUsuario", "text", "Usuario del sistema", "editEmpleado", undefined, false, false, true)}</div>
                      <div className="space-y-1">{renderDialogField("Rol en Sistema*", "systemUserRol", "select", "Rol en el sistema", "editEmpleado", undefined, false, false, true)}</div>
                      <div className="space-y-1">{renderDialogField("Nueva Contraseña (dejar vacío para no cambiar)", "newSystemUserContraseña", "password", "••••••••", "editEmpleado")}</div>
                      <div className="space-y-1">{renderDialogField("Confirmar Nueva Contraseña", "newSystemUserConfirmContraseña", "password", "••••••••", "editEmpleado")}</div>
                       <Button variant="outline" size="sm" onClick={() => handleRemoveSystemUser(currentEmpleadoToEdit._id)} className="mt-3 text-destructive hover:bg-destructive/10">
                        <UserX className="mr-2 h-4 w-4"/>Remover Acceso al Sistema
                      </Button>
                    </div>
                  ) : ( 
                     renderDialogField("Crear acceso al sistema", "createSystemUser", "checkbox", undefined, "editEmpleado")
                  )}
                </div>
                {editEmpleadoData.createSystemUser && !currentEmpleadoToEdit.user && (
                  <>
                    <div className="space-y-1">{renderDialogField("Nombre de Usuario*", "systemUserUsuario", "text", "usuario_sistema", "editEmpleado", undefined, false, false, true)}</div>
                    <div className="space-y-1">{renderDialogField("Contraseña*", "newSystemUserContraseña", "password", "••••••••", "editEmpleado", undefined, false, false, true)}</div>
                    <div className="space-y-1">{renderDialogField("Confirmar Contraseña*", "newSystemUserConfirmContraseña", "password", "••••••••", "editEmpleado", undefined, false, false, true)}</div>
                    <div className="space-y-1">{renderDialogField("Rol en Sistema*", "systemUserRol", "select", "Seleccionar rol...", "editEmpleado", undefined, false, false, true)}</div>
                  </>
                )}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateEmpleado}>Actualizar Empleado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Confirmar Eliminación de Empleado */}
      <Dialog open={isDeleteEmpleadoDialogOpen} onOpenChange={setIsDeleteEmpleadoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Estás seguro de eliminar al empleado "{empleadosList.find(e => e._id === empleadoToDeleteId)?.nombre}"? Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteEmpleado}>Eliminar Empleado</Button></DialogFooter>
        </DialogContent>
      </Dialog>


      {/* --- DIÁLOGOS CLIENTES (CREACIÓN RÁPIDA DESDE ÓRDENES Y GESTIÓN ADMIN) --- */}
      {/* Diálogo para Crear Nuevo Cliente (reutilizado) */}
      <Dialog open={isCreateClientDialogOpen} onOpenChange={(open) => { setIsCreateClientDialogOpen(open); if(!open) setNewClientData({ nombre: '', telefono: '', correo: '' }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nuevo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">{renderDialogField("Nombre Completo*", "nombre", "text", "Nombre del cliente", "newClient", undefined, false, false, true)}</div>
            <div className="space-y-1">{renderDialogField("Teléfono", "telefono", "text", "Teléfono de contacto", "newClient")}</div>
            <div className="space-y-1">{renderDialogField("Correo Electrónico", "correo", "email", "ejemplo@correo.com", "newClient")}</div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateClient}>Guardar Cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Editar Cliente (desde Admin) */}
      <Dialog open={isEditClientDialogOpen} onOpenChange={(open) => { setIsEditClientDialogOpen(open); if (!open) setCurrentClientToEdit(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Cliente: {currentClientToEdit?.nombre}</DialogTitle></DialogHeader>
          {currentClientToEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-1">{renderDialogField("Nombre Completo*", "nombre", "text", currentClientToEdit.nombre, "editClient", undefined, false, false, true)}</div>
              <div className="space-y-1">{renderDialogField("Teléfono", "telefono", "text", currentClientToEdit.telefono, "editClient")}</div>
              <div className="space-y-1">{renderDialogField("Correo Electrónico", "correo", "email", currentClientToEdit.correo, "editClient")}</div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateClient}>Actualizar Cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Confirmar Eliminación de Cliente (desde Admin) */}
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
      <Dialog open={isCreatePuestoDialogOpen} onOpenChange={(open) => { setIsCreatePuestoDialogOpen(open); if(!open) setNewPuestoData({nombre: ''}); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nuevo Puesto</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre del Puesto", "nombre", "text", "Ej: Hojalatero", "newPuesto", undefined, false, false, true)}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreatePuesto}>Guardar Puesto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditPuestoDialogOpen} onOpenChange={(open) => { setIsEditPuestoDialogOpen(open); if(!open) setCurrentPuestoToEdit(null); }}>
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
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Estás seguro de que deseas eliminar el puesto "{puestosList.find(p => p._id === puestoToDeleteId)?.nombre}"? Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeletePuesto}>Eliminar Puesto</Button></DialogFooter>
        </DialogContent>
      </Dialog>

       {/* --- DIÁLOGOS PARA GESTIÓN DE COLORES DE VEHÍCULO --- */}
      <Dialog open={isCreateColorDialogOpen} onOpenChange={(open) => { setIsCreateColorDialogOpen(open); if(!open) setNewColorData({nombre: ''}); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nuevo Color de Vehículo</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre del Color", "nombre", "text", "Ej: Rojo Brillante", "newColor", undefined, false, false, true)}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateColor}>Guardar Color</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditColorDialogOpen} onOpenChange={(open) => { setIsEditColorDialogOpen(open); if(!open) setCurrentColorToEdit(null); }}>
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
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Estás seguro de que deseas eliminar el color "{coloresList.find(c => c._id === colorToDeleteId)?.nombre}"? Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteColor}>Eliminar Color</Button></DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

