
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

// Importación de tipos de datos. Es crucial para la consistencia y type-safety.
import type {
  UserRole as UserRoleType, // Renombramos UserRole a UserRoleType para evitar colisión con el enum.
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
import { UserRole } from '@/lib/types'; // Importamos el enum UserRole para usar sus valores.

// Acciones del servidor para interactuar con el backend.
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

// Tipos de datos para los formularios. Facilita el manejo de datos y validaciones.

/**
 * Tipo de datos para el formulario de creación/edición de Órdenes de Servicio.
 * Omitimos campos generados automáticamente o gestionados internamente (_id, idOrder, fechaRegistro, log).
 * Los IDs de entidades relacionadas son strings (MongoDB _id).
 * Campos numéricos que vienen de inputs de texto se manejan como string | number para flexibilidad en el formulario.
 */
type OrderFormDataType = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'log'>> & {
  idMarca?: string; // Refers to MarcaVehiculo._id
  idAseguradora?: string; // Refers to Aseguradora._id
  idCliente?: string;  // Refers to Cliente._id
  idValuador?: string; // Refers to Empleado._id (Valuador)
  idAsesor?: string;  // Refers to Empleado._id (Asesor)
  idHojalatero?: string; // Refers to Empleado._id (Hojalatero)
  idPintor?: string;  // Refers to Empleado._id (Pintor)
  idPresupuesto?: string; // Refers to Presupuesto._id
  idModelo?: number | string; // Puede ser string del input, se convierte a number para DB.
  ajustador?: string; // ID del ajustador (Ajustador.idAjustador - string ObjectId)
  año?: number | string;
  deducible?: number | string;
  kilometraje?: string; // Se mantiene como string ya que puede incluir "km".
};

/** Tipo de datos para el formulario de creación/edición de Marcas de Vehículos. */
type MarcaFormDataType = Partial<Omit<MarcaVehiculo, '_id' | 'idMarca' | 'modelos'>>;
/** Tipo de datos para el formulario de creación/edición de Modelos de Vehículos. */
type ModeloFormDataType = Partial<ModeloVehiculo>;

/** Tipo de datos para el formulario de creación/edición de Aseguradoras. */
type AseguradoraFormDataType = Partial<Omit<Aseguradora, '_id' | 'ajustadores'>>;
/** Tipo de datos para el formulario de creación/edición de Ajustadores. */
type AjustadorFormDataType = Partial<Omit<Ajustador, 'idAjustador'>>;

/** Tipo de datos para el formulario de creación de Empleados. */
type EmpleadoFormDataType = Omit<Empleado, '_id' | 'fechaRegistro' | 'user'> & {
  createSystemUser?: boolean; // Flag para indicar si se deben crear credenciales de sistema.
  systemUserUsuario?: string;
  systemUserContraseña?: string;
  systemUserConfirmContraseña?: string; // Para validación de contraseña.
  systemUserRol?: UserRoleType;
};

/** Tipo de datos para el formulario de edición de Empleados. */
type EditEmpleadoFormDataType = Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>> & {
  systemUserUsuario?: string;
  systemUserRol?: UserRoleType;
  newSystemUserContraseña?: string; // Para cambiar o establecer una nueva contraseña.
  newSystemUserConfirmContraseña?: string;
  createSystemUser?: boolean; // Para permitir crear acceso si no lo tiene.
};

/**
 * Componente principal de la página del Dashboard.
 * Maneja la lógica de sesión, carga de datos iniciales y la interfaz de usuario para
 * Citas, Órdenes de Servicio, Almacén y Administración.
 */
export default function DashboardPage() {
  console.log("DashboardPage: Renderizando componente...");
  const router = useRouter();
  const { toast } = useToast(); // Hook para mostrar notificaciones (toasts).

  // --- Estados de Sesión y Usuario ---
  const [userName, setUserName] = useState<string | null>(null); // Nombre de usuario del empleado logueado (empleado.user.usuario).
  const [empleadoId, setEmpleadoId] = useState<string | null>(null); // _id del empleado logueado (MongoDB ObjectId string).
  const [userRole, setUserRole] = useState<UserRoleType | null>(null); // Rol del empleado logueado (empleado.user.rol).

  // --- Estados para Órdenes de Servicio ---
  const [orders, setOrders] = useState<Order[]>([]); // Lista de órdenes de servicio.
  const [isLoadingOrders, setIsLoadingOrders] = useState(true); // Indicador de carga para órdenes.
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false); // Controla la visibilidad del diálogo de creación de orden.
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false); // Controla la visibilidad del diálogo de edición de orden.
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false); // Controla la visibilidad del diálogo de visualización de orden.
  const [isDeleteOrderDialogOpen, setIsDeleteOrderDialogOpen] = useState(false); // Controla la visibilidad del diálogo de eliminación de orden.
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null); // Orden actualmente seleccionada para ver/editar.
  const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null); // _id (string) de la orden a eliminar.
  const [availableAjustadoresForOrder, setAvailableAjustadoresForOrder] = useState<{idAjustador: string, nombre: string}[]>([]);


  // Datos iniciales para el formulario de nueva orden.
  const initialNewOrderData: OrderFormDataType = {
    proceso: 'pendiente', // Proceso por defecto.
    piso: false, // Por defecto no es de piso.
    grua: false, // Por defecto no llegó en grúa.
  };
  const [newOrderData, setNewOrderData] = useState<OrderFormDataType>(initialNewOrderData); // Datos del formulario de nueva orden.
  const [editOrderData, setEditOrderData] = useState<OrderFormDataType>({}); // Datos del formulario de edición de orden.

  // Estados para datos relacionados necesarios en los formularios de órdenes (Selects).
  const [clients, setClients] = useState<Cliente[]>([]); // Lista de clientes.
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [asesores, setAsesores] = useState<{ _id: string; nombre: string }[]>([]); // Lista de empleados con rol Asesor.
  const [isLoadingAsesores, setIsLoadingAsesores] = useState(true); 
  const [valuadores, setValuadores] = useState<{ _id: string; nombre: string }[]>([]); // Lista de empleados con rol Valuador.
  const [hojalateros, setHojalateros] = useState<{ _id: string; nombre: string }[]>([]); // Lista de empleados Hojalateros.
  const [pintores, setPintores] = useState<{ _id: string; nombre: string }[]>([]); // Lista de empleados Pintores.

  // --- Estados para Administración: Marcas y Modelos ---
  const [marcas, setMarcas] = useState<MarcaVehiculo[]>([]);
  const [isLoadingMarcas, setIsLoadingMarcas] = useState(true);
  const [isCreateMarcaDialogOpen, setIsCreateMarcaDialogOpen] = useState(false);
  const [isEditMarcaDialogOpen, setIsEditMarcaDialogOpen] = useState(false);
  const [isDeleteMarcaDialogOpen, setIsDeleteMarcaDialogOpen] = useState(false);
  const [currentMarca, setCurrentMarca] = useState<MarcaVehiculo | null>(null); // Marca seleccionada para editar o gestionar modelos.
  const [marcaToDeleteId, setMarcaToDeleteId] = useState<string | null>(null); // _id (string) de la marca a eliminar.
  const [newMarcaData, setNewMarcaData] = useState<MarcaFormDataType>({ marca: '' });
  const [editMarcaData, setEditMarcaData] = useState<MarcaFormDataType>({});

  // Estados para Administración: Modelos (subdocumentos de una Marca).
  const [isManageModelosDialogOpen, setIsManageModelosDialogOpen] = useState(false); // Controla diálogo para gestionar modelos de una marca.
  const [isCreateModeloDialogOpen, setIsCreateModeloDialogOpen] = useState(false);
  const [isEditModeloDialogOpen, setIsEditModeloDialogOpen] = useState(false);
  const [currentModelo, setCurrentModelo] = useState<ModeloVehiculo | null>(null); // Modelo seleccionado para editar.
  const [newModeloData, setNewModeloData] = useState<ModeloFormDataType>({ idModelo: undefined, modelo: '' });
  const [editModeloData, setEditModeloData] = useState<ModeloFormDataType>({});

  // --- Estados para Administración: Aseguradoras y Ajustadores ---
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  const [isLoadingAseguradoras, setIsLoadingAseguradoras] = useState(true);
  const [isCreateAseguradoraDialogOpen, setIsCreateAseguradoraDialogOpen] = useState(false);
  const [isEditAseguradoraDialogOpen, setIsEditAseguradoraDialogOpen] = useState(false);
  const [isDeleteAseguradoraDialogOpen, setIsDeleteAseguradoraDialogOpen] = useState(false);
  const [currentAseguradora, setCurrentAseguradora] = useState<Aseguradora | null>(null); // Aseguradora para editar o gestionar ajustadores.
  const [aseguradoraToDeleteId, setAseguradoraToDeleteId] = useState<string | null>(null); // _id (string) de la aseguradora a eliminar.
  const [newAseguradoraData, setNewAseguradoraData] = useState<AseguradoraFormDataType>({ nombre: '', telefono: '' });
  const [editAseguradoraData, setEditAseguradoraData] = useState<AseguradoraFormDataType>({});
  
  // Estados para Administración: Ajustadores (subdocumentos de una Aseguradora).
  const [isManageAjustadoresDialogOpen, setIsManageAjustadoresDialogOpen] = useState(false);
  const [isCreateAjustadorDialogOpen, setIsCreateAjustadorDialogOpen] = useState(false);
  const [isEditAjustadorDialogOpen, setIsEditAjustadorDialogOpen] = useState(false);
  const [currentAjustador, setCurrentAjustador] = useState<Ajustador | null>(null); // currentAjustador.idAjustador es string (ObjectId)
  const [newAjustadorData, setNewAjustadorData] = useState<AjustadorFormDataType>({ nombre: '', telefono: '', correo: '' });
  const [editAjustadorData, setEditAjustadorData] = useState<AjustadorFormDataType>({});

  // --- Estados para Administración: Empleados ---
  const [empleadosList, setEmpleadosList] = useState<Empleado[]>([]);
  const [isLoadingEmpleadosList, setIsLoadingEmpleadosList] = useState(true);
  const [isCreateEmpleadoDialogOpen, setIsCreateEmpleadoDialogOpen] = useState(false);
  const [isEditEmpleadoDialogOpen, setIsEditEmpleadoDialogOpen] = useState(false);
  const [isDeleteEmpleadoDialogOpen, setIsDeleteEmpleadoDialogOpen] = useState(false);
  const [currentEmpleadoToEdit, setCurrentEmpleadoToEdit] = useState<Empleado | null>(null); // Empleado seleccionado para editar.
  // Datos iniciales para el formulario de nuevo empleado.
  const initialNewEmpleadoData: EmpleadoFormDataType = {
    nombre: '', puesto: '', createSystemUser: false, systemUserUsuario: '', systemUserContraseña: '', systemUserConfirmContraseña: '', systemUserRol: UserRole.ASESOR,
  };
  const [newEmpleadoData, setNewEmpleadoData] = useState<EmpleadoFormDataType>(initialNewEmpleadoData);
  const [editEmpleadoData, setEditEmpleadoData] = useState<EditEmpleadoFormDataType>({
    nombre: '', puesto: '', createSystemUser: false 
  });
  const [empleadoToDeleteId, setEmpleadoToDeleteId] = useState<string | null>(null); // _id (string) del empleado a eliminar.

  /**
   * useEffect para verificar la sesión del usuario al cargar la página.
   * Si no hay sesión válida, redirige a la página de inicio.
   * Si la sesión es válida, establece los datos del usuario y carga los datos iniciales del dashboard.
   */
  useEffect(() => {
    console.log("Dashboard useEffect: Verificando sesión...");
    const loggedIn = localStorage.getItem('isLoggedIn');
    const storedUserName = localStorage.getItem('username');
    const storedEmpleadoId = localStorage.getItem('empleadoId'); // Este es el _id del empleado
    const storedUserRole = localStorage.getItem('userRole') as UserRoleType | null;

    console.log("Dashboard useEffect: Valores RAW de localStorage:", {
      loggedIn,
      storedUserName,
      storedEmpleadoId,
      storedUserRole
    });
    
    // Validaciones más robustas para los datos de sesión
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
      setEmpleadoId(storedEmpleadoId); // Guardar el _id del empleado logueado
      setUserRole(storedUserRole as UserRoleType);

      // Pre-llenar idAsesor si el rol es ASESOR
      if (storedUserRole === UserRole.ASESOR) {
        console.log("Dashboard useEffect: Es ASESOR. Pre-llenando idAsesor en newOrderData con Empleado._id:", storedEmpleadoId);
        setNewOrderData(prev => ({ ...prev, idAsesor: storedEmpleadoId }));
      }
      console.log("Dashboard useEffect: Llamando a fetchInitialData...");
      fetchInitialData(storedUserRole as UserRoleType, storedEmpleadoId);
      console.log("Dashboard useEffect: fetchInitialData llamado.");
    } else {
      console.log("Dashboard useEffect: Sesión inválida o datos faltantes. Redirigiendo a /. Detalles:", { loggedIn, storedUserName, storedEmpleadoId, storedUserRole });
      router.replace('/'); // Redirigir a la página de login
    }
  }, [router]); // router se incluye como dependencia para que el efecto se re-ejecute si cambia (aunque no debería en este caso).

  /**
   * Carga todos los datos iniciales necesarios para el dashboard.
   * @param {UserRoleType | null} role Rol del usuario actual.
   * @param {string | null} currentEmpleadoLogId _id (string) del empleado actual, para pre-llenar campos si es necesario.
   */
  const fetchInitialData = async (role: UserRoleType | null, currentEmpleadoLogId: string | null) => {
    console.log("fetchInitialData: Iniciando carga de datos...", { role, currentEmpleadoId: currentEmpleadoLogId });
    
    // Asegurar que initialNewOrderData se usa para resetear, incluyendo el idAsesor pre-llenado si aplica
    setNewOrderData(prev => ({ 
        ...initialNewOrderData, 
        idAsesor: role === UserRole.ASESOR && currentEmpleadoLogId ? currentEmpleadoLogId : undefined,
    }));

    // Establecer estados de carga a true
    setIsLoadingOrders(true);
    setIsLoadingMarcas(true);
    setIsLoadingAseguradoras(true);
    setIsLoadingClients(true);
    setIsLoadingAsesores(true); // Se usa isLoadingAsesores también para valuadores, hojalateros, pintores si se cargan al mismo tiempo.
    if (role === UserRole.ADMIN) setIsLoadingEmpleadosList(true); // Solo cargar empleados si es admin

    try {
      // Cargar todos los datos en paralelo
      await Promise.all([
        fetchOrders(),
        fetchMarcas(),
        fetchAseguradoras(),
        fetchClients(),
        fetchAsesores(),
        fetchValuadores(),
        fetchHojalateros(),
        fetchPintores(),
        role === UserRole.ADMIN ? fetchEmpleados() : Promise.resolve(), // Cargar empleados solo si es admin
      ]);
      console.log("fetchInitialData: Todos los datos cargados.");
    } catch (error) {
      console.error("fetchInitialData: Error al cargar datos iniciales:", error);
      toast({ title: "Error Crítico", description: "No se pudieron cargar los datos iniciales del dashboard.", variant: "destructive" });
    }
  };

  // --- Funciones de Carga de Datos Específicas (fetchers) ---

  /** Carga la lista de empleados con el rol 'Valuador'. */
  const fetchValuadores = async () => {
    console.log("fetchValuadores: Iniciando...");
    try {
      const result = await getValuadores(); // Asume que esta acción devuelve { _id: string, nombre: string }[]
      console.log("fetchValuadores: Resultado:", result);
      if (result.success && result.data) setValuadores(result.data);
      else toast({ title: "Error Valuadores", description: result.error || "No se pudieron cargar valuadores.", variant: "destructive" });
    } catch (error) {
      console.error("fetchValuadores: Error en la acción o al procesar:", error);
      toast({ title: "Error Crítico Valuadores", description: "Fallo al obtener valuadores.", variant: "destructive" });
    }
  };

  /** Carga la lista de empleados con el puesto 'Hojalatero'. */
  const fetchHojalateros = async () => {
    console.log("fetchHojalateros: Iniciando...");
    try {
      const result = await getEmployeesByPosition('Hojalatero'); // Asume que esta acción devuelve { _id: string, nombre: string }[]
      console.log("fetchHojalateros: Resultado:", result);
      if (result.success && result.data) setHojalateros(result.data);
      else toast({ title: "Error Hojalateros", description: result.error || "No se pudieron cargar hojalateros.", variant: "destructive" });
    } catch (error) {
      console.error("fetchHojalateros: Error en la acción o al procesar:", error);
      toast({ title: "Error Crítico Hojalateros", description: "Fallo al obtener hojalateros.", variant: "destructive" });
    }
  };

  /** Carga la lista de empleados con el puesto 'Pintor'. */
  const fetchPintores = async () => {
    console.log("fetchPintores: Iniciando...");
    try {
      const result = await getEmployeesByPosition('Pintor'); // Asume que esta acción devuelve { _id: string, nombre: string }[]
      console.log("fetchPintores: Resultado:", result);
      if (result.success && result.data) setPintores(result.data);
      else toast({ title: "Error Pintores", description: result.error || "No se pudieron cargar pintores.", variant: "destructive" });
    } catch (error) {
      console.error("fetchPintores: Error en la acción o al procesar:", error);
      toast({ title: "Error Crítico Pintores", description: "Fallo al obtener pintores.", variant: "destructive" });
    }
  };

  /** Carga la lista de clientes. */
  const fetchClients = async () => {
    console.log("fetchClients: Iniciando...");
    setIsLoadingClients(true);
    try {
      const result = await getClients(); // Asume que esta acción devuelve Cliente[]
      console.log("fetchClients: Resultado:", result);
      if (result.success && result.data) {
        setClients(result.data);
      } else {
        toast({ title: "Error Clientes", description: result.error || "No se pudo cargar clientes.", variant: "destructive" });
        setClients([]); // Resetear a array vacío en caso de error
      }
    } catch (error) {
      console.error("fetchClients: Error en la acción o al procesar:", error);
      toast({ title: "Error Crítico Clientes", description: "Fallo al obtener clientes.", variant: "destructive" });
    } finally {
      setIsLoadingClients(false);
    }
  };

  /** Carga la lista de empleados con el rol 'Asesor'. */
  const fetchAsesores = async () => {
    console.log("fetchAsesores: Iniciando...");
    setIsLoadingAsesores(true);
    try {
      const result = await getAsesores(); // Asume que esta acción devuelve { _id: string, nombre: string }[]
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

  /** Carga todas las órdenes de servicio. */
  const fetchOrders = async () => {
    console.log("fetchOrders: Iniciando...");
    setIsLoadingOrders(true);
    try {
      const result = await getAllOrdersAction(); // Asume que devuelve Order[]
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

  /** Carga todas las marcas de vehículos. */
  const fetchMarcas = async () => {
    console.log("fetchMarcas: Iniciando...");
    setIsLoadingMarcas(true);
    try {
      const result = await getAllMarcasAction(); // Asume que devuelve MarcaVehiculo[]
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

  /** Carga todas las aseguradoras. */
  const fetchAseguradoras = async () => {
    console.log("fetchAseguradoras: Iniciando...");
    setIsLoadingAseguradoras(true);
    try {
      const result = await getAllAseguradorasAction(); // Asume que devuelve Aseguradora[]
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

  /** Carga la lista completa de empleados (solo para Admin). */
  const fetchEmpleados = async () => {
    console.log("fetchEmpleados: Iniciando...");
    setIsLoadingEmpleadosList(true);
    try {
      const result = await getAllEmpleadosAction(); // Asume que devuelve Empleado[]
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

  /**
   * Maneja el cierre de sesión del usuario.
   * Limpia `localStorage` y redirige a la página de inicio.
   */
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('empleadoId');
    localStorage.removeItem('userRole');
    router.replace('/');
  };

  /**
   * Manejador genérico para cambios en inputs de texto, textarea y checkboxes.
   * @param e Evento de cambio o un objeto sintético con `target` que incluye `name`, `value` y `type`.
   *          Para checkboxes, `e.target.value` debe ser el valor booleano del estado `checked`.
   * @param setState Función para actualizar el estado del formulario correspondiente.
   */
  const handleInputChangeGeneric = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any; type?: string } },
    setState: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const target = e.target as { name: string; value: any; type?: string; checked?: boolean }; // Agregado checked opcional
    const { name, value } = target;
    let processedValue: any;
  
    // Si es un checkbox, el valor booleano 'checked' se maneja directamente por el onCheckedChange del componente Checkbox
    // y se pasa como 'value' a este manejador.
    if (target.type === 'checkbox') {
      processedValue = value; // El valor 'value' ya es el booleano 'checked'
    } else if (target.type === 'number') {
      // Para inputs de tipo number, permitir que estén vacíos (undefined) o que tengan un valor numérico.
      // El valor '' se convierte a undefined para que no se guarde como 0 si no se desea.
      processedValue = value === '' ? undefined : Number(value); 
    } else {
      processedValue = value;
    }
    
    setState((prev: any) => ({ ...prev, [name]: processedValue }));
  };

  /**
   * Manejador genérico para cambios en componentes Select.
   * @param name Nombre del campo en el estado del formulario.
   * @param value Nuevo valor seleccionado (string | undefined).
   * @param setState Función para actualizar el estado del formulario.
   */
  const handleSelectChangeGeneric = (
    name: string, value: string | undefined,
    setState: React.Dispatch<React.SetStateAction<any>>
  ) => {
    setState((prev: any) => ({ ...prev, [name]: value === 'null_value_placeholder' ? undefined : value }));
  };

  // --- Funciones de Gestión de Órdenes de Servicio ---
  /** Manejador de cambio para inputs en formularios de orden (nueva o edición). */
  const handleOrderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formType: 'new' | 'edit') => {
    handleInputChangeGeneric(e, formType === 'new' ? setNewOrderData : setEditOrderData);
  };
  /** Manejador de cambio para Selects en formularios de orden. */
  const handleOrderSelectChange = async (name: keyof OrderFormDataType, value: string | undefined, formType: 'new' | 'edit') => {
    const setState = formType === 'new' ? setNewOrderData : setEditOrderData;
    setState((prev: any) => ({ ...prev, [name]: value }));

    // Si cambia la Aseguradora, obtener sus ajustadores para el Select dependiente.
    if (name === 'idAseguradora' && value) {
        const result = await getAjustadoresForSelectByAseguradoraAction(value); // `value` es el _id de la aseguradora
        if (result.success && result.data) {
            setAvailableAjustadoresForOrder(result.data); // `result.data` es {idAjustador: string, nombre: string}[]
        } else {
            setAvailableAjustadoresForOrder([]);
            toast({ title: "Error", description: "No se pudieron cargar los ajustadores para la aseguradora seleccionada.", variant: "destructive"});
        }
        // Resetear el ajustador seleccionado si cambia la aseguradora
        setState((prev: any) => ({ ...prev, ajustador: undefined }));
    } else if (name === 'idAseguradora' && !value) {
        // Limpiar ajustadores si no hay aseguradora seleccionada
        setAvailableAjustadoresForOrder([]);
        setState((prev: any) => ({ ...prev, ajustador: undefined }));
    }
  };

  /**
   * Maneja la creación de una nueva orden de servicio.
   * Valida campos obligatorios, construye el objeto `NewOrderData` y llama a la acción del servidor.
   */
  const handleCreateOrder = async () => {
    // Validación de campos obligatorios
    if (!newOrderData.placas || !newOrderData.idCliente) {
      toast({ title: "Error de Validación", description: "Placas y Cliente son obligatorios.", variant: "destructive" });
      return;
    }

    const currentEmpleadoLogId = empleadoId; // _id (string) del empleado logueado.
    if (!currentEmpleadoLogId) {
        toast({ title: "Error de Autenticación", description: "No se pudo identificar al usuario para el registro de log.", variant: "destructive" });
        return;
    }

    // Construir el objeto NewOrderData para enviar a la acción del servidor.
    // Los IDs de entidades relacionadas (idCliente, idMarca, etc.) son strings (_id de MongoDB).
    // Los campos numéricos (idModelo, año, deducible) se convierten a Number.
    const orderToCreate: NewOrderData = {
      idCliente: newOrderData.idCliente, // string
      idMarca: newOrderData.idMarca, // string
      idAseguradora: newOrderData.idAseguradora, // string
      idValuador: newOrderData.idValuador, // string
      idAsesor: newOrderData.idAsesor, // string
      idHojalatero: newOrderData.idHojalatero, // string
      idPintor: newOrderData.idPintor, // string
      idPresupuesto: newOrderData.idPresupuesto, // string
      idModelo: newOrderData.idModelo ? Number(newOrderData.idModelo) : undefined,
      año: newOrderData.año ? Number(newOrderData.año) : undefined,
      ajustador: newOrderData.ajustador, // string (Ajustador.idAjustador)
      deducible: newOrderData.deducible ? Number(newOrderData.deducible) : undefined,
      vin: newOrderData.vin,
      placas: newOrderData.placas,
      color: newOrderData.color,
      kilometraje: newOrderData.kilometraje,
      siniestro: newOrderData.siniestro,
      poliza: newOrderData.poliza,
      folio: newOrderData.folio,
      urlArchivos: newOrderData.urlArchivos,
      aseguradoTercero: newOrderData.aseguradoTercero as Order['aseguradoTercero'], // Cast a tipo específico
      piso: !!newOrderData.piso, // Asegurar que sea booleano
      grua: !!newOrderData.grua, // Asegurar que sea booleano
      proceso: newOrderData.proceso as Order['proceso'] || 'pendiente', // Default a 'pendiente'
      // Convertir fechas de string (YYYY-MM-DD) a objetos Date
      fechaValuacion: newOrderData.fechaValuacion ? new Date(newOrderData.fechaValuacion as string) : undefined,
      fechaRengreso: newOrderData.fechaRengreso ? new Date(newOrderData.fechaRengreso as string) : undefined,
      fechaEntrega: newOrderData.fechaEntrega ? new Date(newOrderData.fechaEntrega as string) : undefined,
      fechaPromesa: newOrderData.fechaPromesa ? new Date(newOrderData.fechaPromesa as string) : undefined,
    };

    // Llamar a la acción del servidor para crear la orden.
    const result = await createOrderAction(orderToCreate, currentEmpleadoLogId);
    if (result.success && result.data) {
      toast({ title: "Éxito", description: `Orden OT-${String(result.data.customOrderId || '').padStart(4, '0')} creada.` });
      setIsCreateOrderDialogOpen(false); 
      fetchOrders(); // Recargar la lista de órdenes.
      // Resetear el formulario de nueva orden, pre-llenando idAsesor si aplica.
      setNewOrderData({ 
        ...initialNewOrderData, 
        idAsesor: userRole === UserRole.ASESOR && empleadoId ? empleadoId : undefined,
      });
      setAvailableAjustadoresForOrder([]); // Resetear lista de ajustadores para el próximo formulario.
    } else {
      toast({ title: "Error al Crear", description: result.error || "No se pudo crear la orden.", variant: "destructive" });
    }
  };

  /**
   * Abre el diálogo de edición para una orden específica.
   * Obtiene los datos de la orden y los formatea para el formulario.
   * @param orderId _id (string) de la orden a editar.
   */
  const openEditOrderDialog = async (orderId: string) => {
    const result = await getOrderByIdAction(orderId); // Obtener orden por su _id (string)
    if (result.success && result.data) {
      const order = result.data; // `order` es de tipo `Order`
      setCurrentOrder(order); 

      // Función para formatear fechas (Date object o string ISO) a 'YYYY-MM-DD' para inputs de tipo date.
      const formatDateForInput = (date?: Date | string): string | undefined => {
        if (!date) return undefined;
        const d = new Date(date); // Funciona para Date objects y strings ISO
        if (isNaN(d.getTime())) return undefined; // Fecha inválida
        // Usar UTC para evitar problemas de timezone con la fecha local.
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      // Formatear datos para el formulario de edición.
      // Los IDs de entidades (_id) ya son strings. Los campos numéricos se convierten a string para el input.
      setEditOrderData({
        ...order, // Copiar todos los campos de la orden.
        // Asegurar que los IDs de referencia sean strings (aunque ya deberían serlo desde el backend).
        idCliente: order.idCliente?.toString(),
        idMarca: order.idMarca?.toString(),
        idAseguradora: order.idAseguradora?.toString(),
        idValuador: order.idValuador?.toString(),
        idAsesor: order.idAsesor?.toString(),
        idHojalatero: order.idHojalatero?.toString(),
        idPintor: order.idPintor?.toString(),
        idPresupuesto: order.idPresupuesto?.toString(),
        // Campos numéricos y fechas se formatean para inputs.
        idModelo: order.idModelo?.toString(),
        año: order.año?.toString(),
        ajustador: order.ajustador, // Ya es string (Ajustador.idAjustador)
        deducible: order.deducible?.toString(),
        fechaValuacion: formatDateForInput(order.fechaValuacion),
        fechaRengreso: formatDateForInput(order.fechaRengreso),
        fechaEntrega: formatDateForInput(order.fechaEntrega),
        fechaPromesa: formatDateForInput(order.fechaPromesa),
      } as OrderFormDataType); // Cast a tipo de formulario.

      // Cargar ajustadores para la aseguradora seleccionada en la orden (si existe).
      if (order.idAseguradora) {
        const ajustadoresResult = await getAjustadoresForSelectByAseguradoraAction(order.idAseguradora);
        if (ajustadoresResult.success && ajustadoresResult.data) {
            setAvailableAjustadoresForOrder(ajustadoresResult.data);
        } else {
            setAvailableAjustadoresForOrder([]);
        }
      } else {
        setAvailableAjustadoresForOrder([]); // Limpiar si no hay aseguradora.
      }

      setIsEditOrderDialogOpen(true); // Abrir el diálogo de edición.
    } else {
      toast({ title: "Error", description: "No se pudo cargar la orden para editar.", variant: "destructive" });
    }
  };

  /**
   * Maneja la actualización de una orden existente.
   * Construye el objeto `UpdateOrderData` y llama a la acción del servidor.
   */
  const handleUpdateOrder = async () => {
    if (!currentOrder || !currentOrder._id) return; // Asegurar que hay una orden actual para editar.

    const currentEmpleadoLogId = empleadoId; // _id (string) del empleado logueado.
    if (!currentEmpleadoLogId) {
        toast({ title: "Error de Autenticación", description: "No se pudo identificar al usuario para el registro de log.", variant: "destructive" });
        return;
    }

    // Construir el objeto UpdateOrderData con los datos del formulario de edición.
    const dataToUpdate: UpdateOrderData = {
        // IDs de referencia (strings)
        idCliente: editOrderData.idCliente,
        idMarca: editOrderData.idMarca,
        idAseguradora: editOrderData.idAseguradora,
        idValuador: editOrderData.idValuador,
        idAsesor: editOrderData.idAsesor,
        idHojalatero: editOrderData.idHojalatero,
        idPintor: editOrderData.idPintor,
        idPresupuesto: editOrderData.idPresupuesto,
        // Campos numéricos (convertir de string a Number)
        idModelo: editOrderData.idModelo ? Number(editOrderData.idModelo) : undefined,
        año: editOrderData.año ? Number(editOrderData.año) : undefined,
        ajustador: editOrderData.ajustador, // string (Ajustador.idAjustador)
        deducible: editOrderData.deducible ? Number(editOrderData.deducible) : undefined,
        // Campos de texto
        vin: editOrderData.vin,
        placas: editOrderData.placas,
        color: editOrderData.color,
        kilometraje: editOrderData.kilometraje,
        siniestro: editOrderData.siniestro,
        poliza: editOrderData.poliza,
        folio: editOrderData.folio,
        urlArchivos: editOrderData.urlArchivos,
        // Campos tipo enum y booleanos
        aseguradoTercero: editOrderData.aseguradoTercero as Order['aseguradoTercero'],
        piso: !!editOrderData.piso,
        grua: !!editOrderData.grua,
        proceso: editOrderData.proceso as Order['proceso'],
        // Fechas (convertir de string 'YYYY-MM-DD' a Date)
        fechaValuacion: editOrderData.fechaValuacion ? new Date(editOrderData.fechaValuacion as string) : undefined,
        fechaRengreso: editOrderData.fechaRengreso ? new Date(editOrderData.fechaRengreso as string) : undefined,
        fechaEntrega: editOrderData.fechaEntrega ? new Date(editOrderData.fechaEntrega as string) : undefined,
        fechaPromesa: editOrderData.fechaPromesa ? new Date(editOrderData.fechaPromesa as string) : undefined,
    };
    
    // Normalizar IDs vacíos a undefined para que MongoDB los ignore si no se cambian (o se quieren limpiar).
    const optionalStringIdKeys: (keyof UpdateOrderData)[] = ['idCliente', 'idMarca', 'idAseguradora', 'idValuador', 'idAsesor', 'idHojalatero', 'idPintor', 'idPresupuesto', 'ajustador'];
    optionalStringIdKeys.forEach(key => {
      if (dataToUpdate[key] === '' || dataToUpdate[key] === 'null_value_placeholder') { // 'null_value_placeholder' es de los Selects
        (dataToUpdate as any)[key] = undefined; 
      }
    });

    // Eliminar claves con valor 'undefined' para no enviar {$set: {campo: undefined}} a MongoDB,
    // lo cual puede interpretarse como querer establecer el campo a `null` o eliminarlo,
    // dependiendo de la configuración de MongoDB y el driver.
    Object.keys(dataToUpdate).forEach(keyStr => {
        const key = keyStr as keyof UpdateOrderData;
        if ((dataToUpdate as any)[key] === undefined) {
            delete (dataToUpdate as any)[key];
        }
    });

    // Llamar a la acción del servidor para actualizar la orden.
    const result = await updateOrderAction(currentOrder._id.toString(), dataToUpdate, currentEmpleadoLogId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsEditOrderDialogOpen(false); fetchOrders(); setCurrentOrder(null); setEditOrderData({}); 
      setAvailableAjustadoresForOrder([]); // Resetear lista de ajustadores.
    } else {
      toast({ title: "Error al Actualizar", description: result.error || "No se pudo actualizar.", variant: "destructive" });
    }
  };

  /** Abre el diálogo para ver los detalles completos de una orden. */
  const openViewOrderDialog = async (orderId: string) => {
    const result = await getOrderByIdAction(orderId); // Obtener orden por _id (string)
    if (result.success && result.data) { setCurrentOrder(result.data); setIsViewOrderDialogOpen(true);}
    else { toast({ title: "Error", description: "No se pudo cargar la orden.", variant: "destructive" });}
  };

  /** Prepara la eliminación de una orden, mostrando un diálogo de confirmación. */
  const openDeleteOrderDialog = (orderId: string) => { setOrderToDeleteId(orderId); setIsDeleteOrderDialogOpen(true); };

  /** Confirma y ejecuta la eliminación de una orden. */
  const handleDeleteOrder = async () => {
    if (!orderToDeleteId) return; // orderToDeleteId es el _id (string) de la orden.
    const result = await deleteOrderAction(orderToDeleteId);
    if (result.success) { toast({ title: "Éxito", description: result.message }); fetchOrders(); }
    else { toast({ title: "Error", description: result.error || "Error al eliminar", variant: "destructive" }); }
    setIsDeleteOrderDialogOpen(false); setOrderToDeleteId(null); 
  };

  // --- Funciones de Gestión de Marcas (Administración) ---

  /** Maneja la creación de una nueva marca. */
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
  /** Abre el diálogo para editar una marca. */
  const openEditMarcaDialog = (marca: MarcaVehiculo) => { setCurrentMarca(marca); setEditMarcaData({ marca: marca.marca }); setIsEditMarcaDialogOpen(true); };
  /** Maneja la actualización de una marca. */
  const handleUpdateMarca = async () => {
    if (!currentMarca || !currentMarca._id || !editMarcaData.marca?.trim()) {
      toast({ title: "Error", description: "Datos inválidos para actualizar marca.", variant: "destructive" }); return;
    }
    // `currentMarca._id` es string (MongoDB _id).
    const result = await updateMarcaAction(currentMarca._id.toString(), editMarcaData);
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
    if (!marcaToDeleteId) return; // marcaToDeleteId es _id (string).
    const result = await deleteMarcaAction(marcaToDeleteId);
    if (result.success) { toast({ title: "Éxito", description: result.message }); fetchMarcas(); }
    else { toast({ title: "Error", description: result.error || "Error al eliminar", variant: "destructive" }); }
    setIsDeleteMarcaDialogOpen(false); setMarcaToDeleteId(null);
  };

  // --- Funciones de Gestión de Modelos (Administración) ---
  /** Abre el diálogo para gestionar los modelos de una marca. */
  const openManageModelosDialog = (marca: MarcaVehiculo) => { setCurrentMarca(marca); setIsManageModelosDialogOpen(true); };
  /** Maneja la creación de un nuevo modelo para la marca actual. */
  const handleCreateModelo = async () => {
    if (!currentMarca || !currentMarca._id || newModeloData.idModelo == null || String(newModeloData.idModelo).trim() === '' || !newModeloData.modelo?.trim()) {
      toast({ title: "Error", description: "ID Modelo y Nombre son requeridos.", variant: "destructive" }); return;
    }
    // `currentMarca._id` es string.
    const result = await addModeloToMarcaAction(currentMarca._id.toString(), { ...newModeloData, idModelo: Number(newModeloData.idModelo) } as ModeloVehiculo);
    if (result.success) {
      toast({ title: "Éxito", description: "Modelo añadido." });
      // Recargar los modelos de la marca actual para ver el cambio.
      const marcaRes = await getMarcaForModelosAction(currentMarca._id.toString());
      if (marcaRes.success && marcaRes.data) setCurrentMarca(marcaRes.data);
      else fetchMarcas(); // Fallback: recargar todas las marcas.
      setNewModeloData({ idModelo: undefined, modelo: '' }); // Resetear formulario.
      setIsCreateModeloDialogOpen(false); // Cerrar diálogo de creación de modelo.
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el modelo.", variant: "destructive" });
    }
  };
  /** Abre el diálogo para editar un modelo. */
  const openEditModeloDialog = (modelo: ModeloVehiculo) => { setCurrentModelo(modelo); setEditModeloData({ idModelo: modelo.idModelo, modelo: modelo.modelo }); setIsEditModeloDialogOpen(true); };
  /** Maneja la actualización de un modelo. */
  const handleUpdateModelo = async () => {
    if (!currentMarca?._id || currentModelo?.idModelo == null || !editModeloData.modelo?.trim()) {
      toast({ title: "Error", description: "Datos de modelo inválidos.", variant: "destructive" }); return;
    }
    // `currentMarca._id` es string. `currentModelo.idModelo` es number.
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
  /** Maneja la eliminación de un modelo de la marca actual. */
  const handleDeleteModelo = async (modeloId: number) => { // modeloId es number.
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

  // --- Funciones de Gestión de Aseguradoras (Administración) ---
  /** Maneja la creación de una nueva aseguradora. */
  const handleCreateAseguradora = async () => {
    if (!newAseguradoraData.nombre?.trim()) {
      toast({ title: "Error", description: "El nombre de la aseguradora es obligatorio.", variant: "destructive" }); return;
    }
    // `newAseguradoraData` es `NewAseguradoraData` (no tiene `_id`).
    const result = await createAseguradoraAction(newAseguradoraData as NewAseguradoraData);
    if (result.success) {
      toast({ title: "Éxito", description: `Aseguradora "${newAseguradoraData.nombre}" creada.` });
      setIsCreateAseguradoraDialogOpen(false); fetchAseguradoras(); setNewAseguradoraData({ nombre: '', telefono: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear la aseguradora.", variant: "destructive" });
    }
  };
  /** Abre el diálogo para editar una aseguradora. */
  const openEditAseguradoraDialog = (aseguradora: Aseguradora) => { setCurrentAseguradora(aseguradora); setEditAseguradoraData({ nombre: aseguradora.nombre, telefono: aseguradora.telefono || '' }); setIsEditAseguradoraDialogOpen(true); };
  /** Maneja la actualización de una aseguradora. */
  const handleUpdateAseguradora = async () => {
    if (!currentAseguradora || !currentAseguradora._id || !editAseguradoraData.nombre?.trim()) {
      toast({ title: "Error", description: "Datos inválidos para actualizar aseguradora.", variant: "destructive" }); return;
    }
    // `currentAseguradora._id` es string.
    const result = await updateAseguradoraAction(currentAseguradora._id.toString(), editAseguradoraData);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsEditAseguradoraDialogOpen(false); fetchAseguradoras(); setCurrentAseguradora(null); setEditAseguradoraData({ nombre: '', telefono: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar la aseguradora.", variant: "destructive" });
    }
  };
  /** Abre el diálogo de confirmación para eliminar una aseguradora. */
  const openDeleteAseguradoraDialog = (aseguradoraId: string) => { setAseguradoraToDeleteId(aseguradoraId); setIsDeleteAseguradoraDialogOpen(true); }; // aseguradoraId es _id (string).
  /** Confirma y ejecuta la eliminación de una aseguradora. */
  const handleDeleteAseguradora = async () => {
    if (!aseguradoraToDeleteId) return; // aseguradoraToDeleteId es _id (string).
    const result = await deleteAseguradoraAction(aseguradoraToDeleteId);
    if (result.success) { toast({ title: "Éxito", description: result.message }); fetchAseguradoras(); }
    else { toast({ title: "Error", description: result.error || "Error al eliminar", variant: "destructive" }); }
    setIsDeleteAseguradoraDialogOpen(false); setAseguradoraToDeleteId(null);
  };

  // --- Funciones de Gestión de Ajustadores (Administración) ---
  /** Abre el diálogo para gestionar los ajustadores de una aseguradora. */
  const openManageAjustadoresDialog = (aseguradora: Aseguradora) => { setCurrentAseguradora(aseguradora); setIsManageAjustadoresDialogOpen(true); };
  /** Maneja la creación de un nuevo ajustador para la aseguradora actual. */
  const handleCreateAjustador = async () => {
    if (!currentAseguradora?._id || !newAjustadorData.nombre?.trim()) {
      toast({ title: "Error", description: "Nombre del ajustador es requerido.", variant: "destructive" }); return;
    }
    // `currentAseguradora._id` es string.
    // `newAjustadorData` no tiene `idAjustador`, se genera en backend.
    const result = await addAjustadorToAseguradoraAction(currentAseguradora._id.toString(), { nombre: newAjustadorData.nombre!, telefono: newAjustadorData.telefono, correo: newAjustadorData.correo });
    if (result.success && result.data) { // `result.data` es el nuevo Ajustador con `idAjustador`.
      toast({ title: "Éxito", description: "Ajustador añadido." });
      // Recargar datos de la aseguradora actual para ver el nuevo ajustador.
      const aseguradoraRes = await getAseguradoraForAjustadoresAction(currentAseguradora._id.toString());
      if (aseguradoraRes.success && aseguradoraRes.data) setCurrentAseguradora(aseguradoraRes.data);
      else fetchAseguradoras(); // Fallback.
      setNewAjustadorData({ nombre: '', telefono: '', correo: '' }); setIsCreateAjustadorDialogOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el ajustador.", variant: "destructive" });
    }
  };
  /** Abre el diálogo para editar un ajustador. */
  const openEditAjustadorDialog = (ajustador: Ajustador) => { setCurrentAjustador(ajustador); setEditAjustadorData(ajustador); setIsEditAjustadorDialogOpen(true); }; // ajustador.idAjustador es string (ObjectId).
  /** Maneja la actualización de un ajustador. */
  const handleUpdateAjustador = async () => {
    if (!currentAseguradora?._id || !currentAjustador?.idAjustador || !editAjustadorData.nombre?.trim()) {
      toast({ title: "Error", description: "Datos de ajustador inválidos.", variant: "destructive" }); return;
    }
    // `currentAseguradora._id` y `currentAjustador.idAjustador` son strings.
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
  /** Maneja la eliminación de un ajustador de la aseguradora actual. */
  const handleDeleteAjustador = async (idAjustador: string) => { // idAjustador es string (ObjectId).
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

  // --- Funciones de Gestión de Empleados (Administración) ---
  /** Maneja la creación de un nuevo empleado, opcionalmente con acceso al sistema. */
  const handleCreateEmpleado = async () => {
    // Validaciones básicas.
    if (!newEmpleadoData.nombre?.trim() || !newEmpleadoData.puesto?.trim()) {
      toast({ title: "Error de Validación", description: "Nombre y Puesto son obligatorios.", variant: "destructive" });
      return;
    }

    let systemUserDetails: Omit<SystemUserCredentials, 'permisos' | '_id'> | undefined = undefined;
    // Si se marca "Crear acceso al sistema", validar y preparar datos de usuario.
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
        contraseña: newEmpleadoData.systemUserContraseña, // En una app real, hashear aquí.
        rol: newEmpleadoData.systemUserRol,
        // Los permisos por defecto se asignarán en el EmpleadoManager basado en el rol.
      };
    }

    // Preparar datos del empleado.
    const empleadoToCreate: Omit<Empleado, '_id' | 'fechaRegistro' | 'user'> = {
      nombre: newEmpleadoData.nombre,
      puesto: newEmpleadoData.puesto,
      telefono: newEmpleadoData.telefono,
      correo: newEmpleadoData.correo,
      sueldo: newEmpleadoData.sueldo ? Number(newEmpleadoData.sueldo) : undefined,
      comision: newEmpleadoData.comision ? Number(newEmpleadoData.comision) : undefined,
    };

    // Llamar a la acción del servidor.
    const result = await createEmpleadoAction(empleadoToCreate, systemUserDetails);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsCreateEmpleadoDialogOpen(false); fetchEmpleados(); setNewEmpleadoData(initialNewEmpleadoData); 
    } else {
      toast({ title: "Error al Crear Empleado", description: result.error || "No se pudo crear el empleado", variant: "destructive" });
    }
  };

  /** Abre el diálogo para editar un empleado, cargando sus datos. */
  const openEditEmpleadoDialog = async (empleadoIdToEdit: string) => { // empleadoIdToEdit es _id (string).
    const result = await getEmpleadoForEditAction(empleadoIdToEdit); // Obtiene Empleado.
    if (result.success && result.data) {
      const emp = result.data;
      setCurrentEmpleadoToEdit(emp);
      // Pre-llenar formulario de edición.
      setEditEmpleadoData({
        nombre: emp.nombre,
        puesto: emp.puesto,
        telefono: emp.telefono,
        correo: emp.correo,
        sueldo: emp.sueldo,
        comision: emp.comision,
        // Campos de usuario de sistema (si existen)
        systemUserUsuario: emp.user?.usuario,
        systemUserRol: emp.user?.rol,
        newSystemUserContraseña: '', // Para cambiar contraseña (opcional).
        newSystemUserConfirmContraseña: '',
        createSystemUser: !!emp.user // Si tiene `user`, se mostrará la opción de editarlo/removerlo.
                                   // Si no, se mostrará la opción de crearlo.
      });
      setIsEditEmpleadoDialogOpen(true);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo cargar el empleado para editar.", variant: "destructive" });
    }
  };

  /** Maneja la actualización de un empleado y/o sus credenciales de sistema. */
  const handleUpdateEmpleado = async () => {
    if (!currentEmpleadoToEdit || !currentEmpleadoToEdit._id) return;
    // Validación básica.
    if (!editEmpleadoData.nombre?.trim() || !editEmpleadoData.puesto?.trim()) {
       toast({ title: "Error de Validación", description: "Nombre y Puesto son obligatorios.", variant: "destructive" });
       return;
    }
    // Preparar datos del empleado a actualizar.
    const empleadoDetailsToUpdate: Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>> = {
        nombre: editEmpleadoData.nombre,
        puesto: editEmpleadoData.puesto,
        telefono: editEmpleadoData.telefono,
        correo: editEmpleadoData.correo,
        sueldo: editEmpleadoData.sueldo ? Number(editEmpleadoData.sueldo) : undefined,
        comision: editEmpleadoData.comision ? Number(editEmpleadoData.comision) : undefined,
    };

    let systemUserDetailsToUpdate: Partial<Omit<SystemUserCredentials, 'permisos' | '_id'>> | undefined = undefined;

    // Lógica para crear/actualizar credenciales de sistema.
    // Caso 1: Empleado NO tiene usuario, y se marca "Crear acceso al sistema".
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
            contraseña: editEmpleadoData.newSystemUserContraseña, // En app real, hashear.
            rol: editEmpleadoData.systemUserRol,
            // Permisos se asignan por defecto en EmpleadoManager.
        };
    }
    // Caso 2: Empleado SÍ tiene usuario. Se pueden modificar sus datos o cambiar contraseña.
    else if (currentEmpleadoToEdit.user) { 
        systemUserDetailsToUpdate = {}; // Iniciar objeto vacío.
        // Actualizar usuario si cambió y es diferente al actual.
        if (editEmpleadoData.systemUserUsuario && editEmpleadoData.systemUserUsuario !== currentEmpleadoToEdit.user.usuario) {
            systemUserDetailsToUpdate.usuario = editEmpleadoData.systemUserUsuario;
        }
        // Actualizar rol si cambió y es diferente al actual (y reasignar permisos).
        if (editEmpleadoData.systemUserRol && editEmpleadoData.systemUserRol !== currentEmpleadoToEdit.user.rol) {
            systemUserDetailsToUpdate.rol = editEmpleadoData.systemUserRol;
        }
        // Actualizar contraseña si se proporcionó una nueva.
        if (editEmpleadoData.newSystemUserContraseña?.trim()) { 
            if (editEmpleadoData.newSystemUserContraseña !== editEmpleadoData.newSystemUserConfirmContraseña) {
                toast({ title: "Error de Contraseña", description: "Las nuevas contraseñas no coinciden.", variant: "destructive" });
                return;
            }
            systemUserDetailsToUpdate.contraseña = editEmpleadoData.newSystemUserContraseña; // En app real, hashear.
        }
        // Si no hay cambios en los detalles del usuario, no enviar systemUserDetailsToUpdate.
        if (Object.keys(systemUserDetailsToUpdate).length === 0) {
            systemUserDetailsToUpdate = undefined;
        }
    }

    // Llamar a la acción del servidor.
    const result = await updateEmpleadoAction(currentEmpleadoToEdit._id.toString(), empleadoDetailsToUpdate, systemUserDetailsToUpdate);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsEditEmpleadoDialogOpen(false); fetchEmpleados(); setCurrentEmpleadoToEdit(null); setEditEmpleadoData({});
    } else {
      toast({ title: "Error al Actualizar Empleado", description: result.error || "No se pudo actualizar", variant: "destructive" });
    }
  };

  /** Abre el diálogo de confirmación para eliminar un empleado. */
  const openDeleteEmpleadoDialog = (empleadoIdToDelete: string) => { // empleadoIdToDelete es _id (string).
    setEmpleadoToDeleteId(empleadoIdToDelete);
    setIsDeleteEmpleadoDialogOpen(true);
  };

  /** Confirma y ejecuta la eliminación de un empleado. */
  const handleDeleteEmpleado = async () => {
    if (!empleadoToDeleteId) return;
    const result = await deleteEmpleadoAction(empleadoToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      fetchEmpleados(); // Recargar lista.
    } else {
      toast({ title: "Error al Eliminar Empleado", description: result.error || "Error al eliminar", variant: "destructive" });
    }
    setIsDeleteEmpleadoDialogOpen(false);
    setEmpleadoToDeleteId(null);
  };

  /** Remueve el acceso al sistema de un empleado. */
  const handleRemoveSystemUser = async (empleadoIdToRemoveAccess: string) => { // _id (string) del empleado.
    if (!empleadoIdToRemoveAccess) return;
    const result = await removeSystemUserFromEmpleadoAction(empleadoIdToRemoveAccess);
    if (result.success) {
        toast({title: "Éxito", description: result.message});
        fetchEmpleados(); // Recargar lista.
        // Actualizar el estado local del empleado que se está editando (si es el mismo).
        if (currentEmpleadoToEdit?._id === empleadoIdToRemoveAccess) {
            setCurrentEmpleadoToEdit(prev => prev ? ({...prev, user: undefined}) : null);
            setEditEmpleadoData(prev => ({...prev, systemUserUsuario: undefined, systemUserRol: undefined, createSystemUser: false}));
        }
    } else {
        toast({title: "Error", description: result.error || "No se pudo remover el acceso.", variant: "destructive"});
    }
  };

  // --- Funciones Auxiliares de Formateo ---
  /**
   * Formatea una fecha a string 'dd/mm/yyyy' usando UTC para evitar problemas de timezone.
   * @param dateInput Fecha a formatear (Date object, string ISO, o timestamp).
   * @returns Fecha formateada o 'N/A' si la entrada es inválida o nula.
   */
  const formatDate = (dateInput?: Date | string | number): string => {
    if (!dateInput) return 'N/A';
    let date: Date;

    if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'string') {
        // Intentar parsear como YYYY-MM-DD (común de <input type="date">) o ISO string.
        // El constructor de Date maneja strings ISO y otros formatos.
        // Para YYYY-MM-DD, añadir 'T00:00:00Z' para asegurar que se interprete como UTC.
        const parts = dateInput.split('T')[0].split('-');
        if (parts.length === 3 && dateInput.length === 10) { // Simple YYYY-MM-DD
            date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
        } else {
            date = new Date(dateInput); // Intentar parsear directamente (ej. ISO string).
        }
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput); // Asumir timestamp.
    } else {
        return 'Tipo de Fecha Inválido';
    }

    if (isNaN(date.getTime())) { // Verificar si la fecha es válida.
      return 'Fecha Inválida';
    }
    // Formatear a dd/mm/yyyy usando UTC.
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
  };

  /**
   * Formatea una fecha y hora a string 'dd/mm/yyyy, hh:mm' usando UTC.
   * @param dateInput Fecha y hora a formatear.
   * @returns Fecha y hora formateada o 'N/A'.
   */
  const formatDateTime = (dateInput?: Date | string | number): string => {
    if (!dateInput) return 'N/A';
    let date: Date;
    if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        date = new Date(dateInput); // El constructor de Date maneja ISO strings y timestamps.
    } else {
        return 'Tipo de Fecha/Hora Inválido';
    }
    if (isNaN(date.getTime())) return 'Fecha/Hora Inválida';
    // Formatear a dd/mm/yyyy, hh:mm usando UTC.
    return date.toLocaleString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  };

  /** Determina la variante de Badge según el proceso de la orden. */
  const getProcesoVariant = (proceso?: Order['proceso']): "default" | "secondary" | "outline" | "destructive" => {
    switch (proceso) {
      case 'entregado': case 'facturado': case 'listo_entrega': return 'default'; // Verde o color primario.
      case 'hojalateria': case 'pintura': case 'mecanica': case 'armado': case 'detallado_lavado': case 'control_calidad': return 'secondary'; // Azul o color secundario.
      case 'espera_refacciones': case 'valuacion': case 'pendiente': case 'refacciones_listas': case 'preparacion_pintura': case 'garantia': return 'outline'; // Amarillo o naranja.
      case 'cancelado': return 'destructive'; // Rojo.
      default: return 'secondary';
    }
  };
  /** Opciones para el Select de proceso de orden. */
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
  /** Opciones para el Select de rol de usuario (Empleado). */
  const userRoleOptions = Object.values(UserRole).map(role => ({ value: role, label: role.charAt(0).toUpperCase() + role.slice(1) }));

  /**
   * Función genérica para renderizar campos de formulario en diálogos.
   * Soporta Input, Select, Checkbox y Textarea.
   * @param label Etiqueta del campo.
   * @param name Nombre del campo (usado como key en el estado del formulario).
   * @param type Tipo de input HTML (text, number, date, etc.).
   * @param placeholder Placeholder para el campo.
   * @param formType Identificador del tipo de formulario (ej. 'newOrder', 'editEmpleado').
   * @param options Array de opciones para componentes Select. Cada opción debe tener `value` (string | number) y `label` (string).
   * @param isCheckbox Indica si el campo es un Checkbox.
   * @param isTextarea Indica si el campo es un Textarea.
   * @param isDisabled Indica si el campo debe estar deshabilitado.
   * @param isRequired Indica si el campo es obligatorio (añade asterisco y atributo HTML).
   */
  const renderDialogField = (
      label: string, name: any, type: string = "text", placeholder?: string,
      formType: 'newOrder' | 'editOrder' | 'newMarca' | 'editMarca' | 'newModelo' | 'editModelo' | 'newAseguradora' | 'editAseguradora' | 'newAjustador' | 'editAjustador' | 'newEmpleado' | 'editEmpleado' = 'newOrder',
      options?: { value: string | number; label: string }[], isCheckbox?: boolean, isTextarea?: boolean, isDisabled?: boolean, isRequired?: boolean
    ) => {
    // Determinar el objeto de estado y los manejadores basados en formType.
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
    const value = data[name] as any; // Valor actual del campo en el estado.

    // Renderizar Checkbox
    if (isCheckbox) {
      return (
        <div className="flex items-center space-x-2 py-1">
          <Checkbox 
            id={`${formType}_${name}`} 
            name={name} 
            checked={!!value} // Asegurar que 'checked' sea booleano.
            // Pasar el nuevo estado 'checked' directamente al manejador.
            onCheckedChange={(checked) => handler({ target: { name, value: checked, type: 'checkbox' } })} 
            disabled={isDisabled} />
          <Label htmlFor={`${formType}_${name}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}{isRequired && <span className="text-destructive">*</span>}</Label>
        </div>
      );
    }
    // Renderizar Textarea
    if (isTextarea) {
      return (
        <div className="space-y-1">
          <Label htmlFor={`${formType}_${name}`}>{label}{isRequired && <span className="text-destructive">*</span>}</Label>
          <Textarea id={`${formType}_${name}`} name={name} value={value || ''} onChange={handler} className="w-full" placeholder={placeholder} disabled={isDisabled} />
        </div>
      );
    }
    // Renderizar Select
    if (options) { 
      return (
        <div className="space-y-1">
          <Label htmlFor={`${formType}_${name}`}>{label}{isRequired && <span className="text-destructive">*</span>}</Label>
          <Select 
            name={name} 
            // El valor del Select debe ser string. Usar '' si es undefined o null.
            value={String(value || '')} 
            // El `val` de onValueChange es el `value` de la opción seleccionada (string).
            onValueChange={(val) => selectHandler(name, val === 'null_value_placeholder' ? undefined : val )} 
            disabled={isDisabled}>
            <SelectTrigger className="w-full"><SelectValue placeholder={placeholder || "Seleccionar..."} /></SelectTrigger>
            <SelectContent>
              {/* Opción placeholder para permitir "deseleccionar" o no tener valor. */}
              <SelectItem value="null_value_placeholder" className="text-muted-foreground italic">-- {placeholder || "Seleccionar..."} --</SelectItem>
              {options.map(opt => <SelectItem key={String(opt.value)} value={String(opt.value)}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    }
    // Renderizar Input (default)
    return (
      <div className="space-y-1">
        <Label htmlFor={`${formType}_${name}`}>{label}{isRequired && <span className="text-destructive">*</span>}</Label>
        <Input id={`${formType}_${name}`} name={name} type={type}
          // Para inputs de tipo 'date', el valor debe ser 'YYYY-MM-DD'.
          // Para otros, usar `value ?? ''` para evitar que React se queje de `null` o `undefined` en un input controlado.
          value={type === 'date' ? (value || '') : (value ?? '')} 
          onChange={handler}
          className="w-full" placeholder={placeholder}
          disabled={isDisabled }
          required={isRequired} // HTML5 required attribute.
        />
      </div>
    );
  };

  // --- Lógica de Renderizado del Componente ---
  // Mostrar "Cargando..." si los datos esenciales de sesión aún no están listos.
  if (!userName || !userRole || (userRole && !Object.values(UserRole).includes(userRole))) {
    console.log("DashboardPage: userName o userRole faltan o son inválidos. Mostrando 'Cargando...' Detalles:", { userName, userRole });
    return <div className="flex min-h-screen items-center justify-center bg-background"><p>Cargando...</p></div>;
  }

  // Datos de ejemplo para Citas y Almacén (serán reemplazados por datos de DB).
  const dummyCitas = [
    { id: 'CITA-001', cliente: 'Ana Pérez', vehiculo: 'Toyota Corolla (ABC-123)', fecha: '2024-07-28 10:00', servicio: 'Mantenimiento General', estado: 'Confirmada' },
    { id: 'CITA-002', cliente: 'Luis Gómez', vehiculo: 'Honda CRV (XYZ-789)', fecha: '2024-07-28 14:00', servicio: 'Revisión Frenos', estado: 'Pendiente' },
  ];
  const inventoryItems = [
    { id: 'INV-001', name: 'Filtro de Aceite', quantity: 50, category: 'Filtros', supplier: 'Proveedor A', price: 150.00 },
    { id: 'INV-002', name: 'Balatas Delanteras', quantity: 30, category: 'Frenos', supplier: 'Proveedor B', price: 750.00 },
  ];

 // Clases dinámicas para la lista de pestañas principal según el rol del usuario.
 const mainTabsListClassName = userRole === UserRole.ADMIN
    ? "grid w-full grid-cols-2 sm:grid-cols-4 mb-6 rounded-lg p-1 bg-muted" // 2x2 en móvil, 4 en línea en SM+
    : "grid w-full grid-cols-1 sm:grid-cols-3 mb-6 rounded-lg p-1 bg-muted"; // Apilado en móvil, 3 en línea en SM+

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 dark:bg-muted/10">
      {/* Encabezado del Dashboard */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 shadow-sm">
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Panel del Taller Automotriz</h1>
          <div className="flex items-center gap-4">
            {/* Información del usuario y botón de logout */}
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Bienvenido, <span className="font-medium text-foreground">{userName} (ID Emp: {empleadoId?.substring(0,8)}, Rol: {userRole})</span>
            </span>
            <Button onClick={handleLogout} variant="outline" size="sm"><LogOut className="mr-2 h-4 w-4" />Cerrar Sesión</Button>
          </div>
        </div>
      </header>

      {/* Contenido Principal del Dashboard */}
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <Tabs defaultValue="ordenes" className="w-full">
          {/* Lista de Pestañas Principales */}
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
            {/* Pestaña de Administración (solo visible para rol ADMIN) */}
            {userRole === UserRole.ADMIN && (
              <TabsTrigger value="admin" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Settings className="h-5 w-5" /> Admin
              </TabsTrigger>
            )}
          </TabsList>

          {/* Contenido de la Pestaña "Citas" */}
          <TabsContent value="citas">
            <Card className="shadow-lg border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div><CardTitle className="text-xl">Gestión de Citas</CardTitle><CardDescription>Programa y visualiza las citas de servicio.</CardDescription></div>
                <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Nueva Cita</Button>
              </CardHeader>
              <CardContent>
                {/* Placeholder para calendario de citas */}
                <div className="mt-4 flex h-60 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50">
                    <p className="text-muted-foreground">Calendario de citas (Próximamente).</p>
                </div>
                 {/* Tabla de ejemplo para citas */}
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

          {/* Contenido de la Pestaña "Órdenes de Servicio" */}
          <TabsContent value="ordenes">
             <Card className="shadow-lg border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div><CardTitle className="text-xl">Órdenes de Servicio</CardTitle><CardDescription>Administra todas las órdenes de trabajo.</CardDescription></div>
                    {/* Botón para abrir diálogo de creación de orden */}
                    <Button size="sm" onClick={() => { 
                        // Resetear datos del formulario y pre-llenar idAsesor si aplica
                        setNewOrderData({
                            ...initialNewOrderData, 
                            idAsesor: userRole === UserRole.ASESOR && empleadoId ? empleadoId : undefined
                        }); 
                        setAvailableAjustadoresForOrder([]); // Limpiar ajustadores para nuevo formulario.
                        setIsCreateOrderDialogOpen(true);
                    }}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Nueva Orden
                    </Button>
                </CardHeader>
                <CardContent>
                    {/* Mostrar indicador de carga o tabla de órdenes */}
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
                            {/* Mostrar nombre de cliente si se encuentra, sino el ID */}
                            <TableCell>{clients.find(c => c._id === order.idCliente)?.nombre || clients.find(c => c._id === order.idCliente)?.razonSocial || order.idCliente || 'N/A'}</TableCell>
                            <TableCell>{order.placas || 'N/A'}</TableCell>
                            <TableCell><Badge variant={getProcesoVariant(order.proceso)}>{procesoOptions.find(p=>p.value === order.proceso)?.label || order.proceso || 'N/A'}</Badge></TableCell>
                            <TableCell>{formatDate(order.fechaRegistro)}</TableCell>
                            <TableCell className="text-right space-x-1">
                                {/* Botones de acción para cada orden */}
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

          {/* Contenido de la Pestaña "Almacén" */}
          <TabsContent value="almacen">
             <Card className="shadow-lg border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div><CardTitle className="text-xl">Gestión de Almacén</CardTitle><CardDescription>Control de inventario de refacciones y consumibles.</CardDescription></div>
                    <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Artículo</Button>
                </CardHeader>
                <CardContent>
                    {/* Tabla de ejemplo para artículos de almacén */}
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

          {/* Contenido de la Pestaña "Admin" (solo visible para rol ADMIN) */}
          {userRole === UserRole.ADMIN && (
            <TabsContent value="admin">
              <Tabs defaultValue="empleados" className="w-full"> 
                {/* Sub-pestañas dentro de Admin */}
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
                      {/* Tabla de Marcas */}
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

                {/* Contenido de Admin -> Aseguradoras */}
                <TabsContent value="aseguradoras">
                    <Card className="shadow-lg border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div><CardTitle className="text-xl">Gestión de Aseguradoras</CardTitle></div>
                        <Button size="sm" onClick={() => { setNewAseguradoraData({nombre: '', telefono: ''}); setIsCreateAseguradoraDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Nueva Aseguradora</Button>
                        </CardHeader>
                        <CardContent>
                          {/* Tabla de Aseguradoras */}
                        {isLoadingAseguradoras ? <p>Cargando aseguradoras...</p> : aseguradoras.length === 0 ?
                            <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay aseguradoras registradas.</p></div>
                            : (
                            <Table>
                                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>Ajustadores</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                                <TableBody>
                                {aseguradoras.map((aseg) => (
                                    <TableRow key={aseg._id?.toString()}>
                                    {/* Mostrar los primeros 8 caracteres del _id */}
                                    <TableCell>{aseg._id?.substring(0, 8)}...</TableCell>
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

                {/* Contenido de Admin -> Empleados */}
                <TabsContent value="empleados">
                    <Card className="shadow-lg border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div><CardTitle className="text-xl">Gestión de Empleados</CardTitle></div>
                        <Button size="sm" onClick={() => { setNewEmpleadoData(initialNewEmpleadoData); setIsCreateEmpleadoDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Empleado</Button>
                        </CardHeader>
                        <CardContent>
                          {/* Tabla de Empleados */}
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

      {/* --- Diálogos para Órdenes de Servicio --- */}
      {/* Diálogo para Crear Nueva Orden */}
      <Dialog open={isCreateOrderDialogOpen} onOpenChange={(open) => {setIsCreateOrderDialogOpen(open); if (!open) {setNewOrderData(initialNewOrderData); setAvailableAjustadoresForOrder([]);}}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear Nueva Orden de Servicio</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4"> {/* Contenedor de campos */}
            <h3 className="font-semibold text-lg border-b pb-2 mb-2">Datos del Cliente y Vehículo</h3>
            {renderDialogField("Cliente", "idCliente", "select", isLoadingClients ? "Cargando..." : "Seleccionar cliente", "newOrder", clients.map(c => ({ value: c._id!, label: c.nombre || c.razonSocial || `ID: ${c._id}` })), false, false, false, true)}
            {renderDialogField("Placas", "placas", "text", "Ej: ABC-123", "newOrder", undefined, false, false, false, true)}
            {renderDialogField("VIN", "vin", "text", "Número de Identificación Vehicular", "newOrder")}
            {renderDialogField("Marca", "idMarca", "select", isLoadingMarcas ? "Cargando..." : "Seleccionar marca", "newOrder", marcas.map(m => ({ value: m._id!, label: m.marca })))}
            {renderDialogField("ID Modelo (Numérico)", "idModelo", "number", "ID del modelo (ej: 101)", "newOrder")}
            {renderDialogField("Año", "año", "number", "Ej: 2020", "newOrder")}
            {renderDialogField("Color", "color", "text", "Ej: Rojo", "newOrder")}
            {renderDialogField("Kilometraje", "kilometraje", "text", "Ej: 55000 km", "newOrder")}

            <h3 className="font-semibold text-lg border-b pb-2 mb-2 mt-4">Datos de Aseguradora (Opcional)</h3>
            {renderDialogField("Aseguradora", "idAseguradora", "select", isLoadingAseguradoras? "Cargando..." : "Seleccionar aseguradora", "newOrder", aseguradoras.map(a => ({ value: a._id!, label: a.nombre })))}
            {/* El Select de Ajustador depende de la Aseguradora seleccionada. */}
            {renderDialogField("Ajustador", "ajustador", "select", newOrderData.idAseguradora ? (availableAjustadoresForOrder.length > 0 ? "Seleccionar ajustador" : "No hay ajustadores") : "Seleccione aseguradora primero", "newOrder", availableAjustadoresForOrder.map(aj => ({value: aj.idAjustador, label: aj.nombre})), false, false, !newOrderData.idAseguradora)}
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
            {/* El Asesor se pre-llena y deshabilita si el usuario actual es Asesor. */}
            {renderDialogField("Asesor", "idAsesor", "select", asesores.length === 0 && isLoadingAsesores ? "Cargando..." : "Seleccionar asesor", "newOrder", asesores.map(a => ({ value: a._id, label: a.nombre })), undefined, false, false, userRole === UserRole.ASESOR && !!empleadoId)}
            {renderDialogField("Hojalatero", "idHojalatero", "select", hojalateros.length === 0 && isLoadingAsesores ? "Cargando..." : "Seleccionar hojalatero", "newOrder", hojalateros.map(h => ({ value: h._id, label: h.nombre })))}
            {renderDialogField("Pintor", "idPintor", "select", pintores.length === 0 && isLoadingAsesores ? "Cargando..." : "Seleccionar pintor", "newOrder", pintores.map(p => ({ value: p._id, label: p.nombre })))}
            {renderDialogField("ID Presupuesto (MongoDB ID)", "idPresupuesto", "text", "ID del presupuesto asociado", "newOrder")}

            <h3 className="font-semibold text-lg border-b pb-2 mb-2 mt-4">Fechas Importantes (Opcional)</h3>
            {renderDialogField("Fecha Valuación", "fechaValuacion", "date", "", "newOrder")}
            {renderDialogField("Fecha Reingreso", "fechaRengreso", "date", "", "newOrder")}
            {renderDialogField("Fecha Promesa Entrega", "fechaPromesa", "date", "", "newOrder")}
            {renderDialogField("Fecha Entrega Final", "fechaEntrega", "date", "", "newOrder")}
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateOrder}>Crear Orden</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Editar Orden */}
      <Dialog open={isEditOrderDialogOpen} onOpenChange={(open) => { setIsEditOrderDialogOpen(open); if (!open) {setCurrentOrder(null); setAvailableAjustadoresForOrder([]);} }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Orden: OT-{String(currentOrder?.idOrder || '').padStart(4, '0')}</DialogTitle></DialogHeader>
          {currentOrder && <div className="grid gap-4 py-4"> {/* Contenedor de campos */}
            <h3 className="font-semibold text-lg border-b pb-2 mb-2">Datos del Cliente y Vehículo</h3>
            {renderDialogField("Cliente", "idCliente", "select", isLoadingClients ? "Cargando..." : "Seleccionar cliente", "editOrder", clients.map(c => ({ value: c._id!, label: c.nombre || c.razonSocial || `ID: ${c._id}` })), false, false, false, true)}
            {renderDialogField("Placas", "placas", "text", "Ej: ABC-123", "editOrder", undefined, false, false, false, true)}
            {renderDialogField("VIN", "vin", "text", "Número de Identificación Vehicular", "editOrder")}
            {renderDialogField("Marca", "idMarca", "select", isLoadingMarcas ? "Cargando..." : "Seleccionar marca", "editOrder", marcas.map(m => ({ value: m._id!, label: m.marca })))}
            {renderDialogField("ID Modelo (Numérico)", "idModelo", "number", "ID del modelo (ej: 101)", "editOrder")}
            {renderDialogField("Año", "año", "number", "Ej: 2020", "editOrder")}
            {renderDialogField("Color", "color", "text", "Ej: Rojo", "editOrder")}
            {renderDialogField("Kilometraje", "kilometraje", "text", "Ej: 55000 km", "editOrder")}

            <h3 className="font-semibold text-lg border-b pb-2 mb-2 mt-4">Datos de Aseguradora</h3>
            {renderDialogField("Aseguradora", "idAseguradora", "select", isLoadingAseguradoras? "Cargando..." : "Seleccionar aseguradora", "editOrder", aseguradoras.map(a => ({ value: a._id!, label: a.nombre })))}
            {renderDialogField("Ajustador", "ajustador", "select", editOrderData.idAseguradora ? (availableAjustadoresForOrder.length > 0 ? "Seleccionar ajustador" : "No hay ajustadores") : "Seleccione aseguradora primero", "editOrder", availableAjustadoresForOrder.map(aj => ({value: aj.idAjustador, label: aj.nombre})), false, false, !editOrderData.idAseguradora)}
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
            {/* El Asesor se pre-llena y deshabilita si el usuario actual es Asesor o si la orden ya tiene un asesor. */}
            {renderDialogField("Asesor", "idAsesor", "select", asesores.length === 0 && isLoadingAsesores ? "Cargando..." : "Seleccionar asesor", "editOrder", asesores.map(a => ({ value: a._id, label: a.nombre })), undefined, false, false, true)}
            {renderDialogField("Hojalatero", "idHojalatero", "select", hojalateros.length === 0 && isLoadingAsesores ? "Cargando..." : "Seleccionar hojalatero", "editOrder", hojalateros.map(h => ({ value: h._id, label: h.nombre })))}
            {renderDialogField("Pintor", "idPintor", "select", pintores.length === 0 && isLoadingAsesores ? "Cargando..." : "Seleccionar pintor", "editOrder", pintores.map(p => ({ value: p._id, label: p.nombre })))}
            {renderDialogField("ID Presupuesto (MongoDB ID)", "idPresupuesto", "text", "ID presupuesto asociado", "editOrder")}

            <h3 className="font-semibold text-lg border-b pb-2 mb-2 mt-4">Fechas Importantes</h3>
            {renderDialogField("Fecha Valuación", "fechaValuacion", "date", "", "editOrder")}
            {renderDialogField("Fecha Reingreso", "fechaRengreso", "date", "", "editOrder")}
            {renderDialogField("Fecha Promesa Entrega", "fechaPromesa", "date", "", "editOrder")}
            {renderDialogField("Fecha Entrega Final", "fechaEntrega", "date", "", "editOrder")}
          </div>}
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateOrder}>Actualizar Orden</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Ver Detalles de Orden */}
      <Dialog open={isViewOrderDialogOpen} onOpenChange={(open) => { setIsViewOrderDialogOpen(open); if (!open) setCurrentOrder(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de Orden: OT-{String(currentOrder?.idOrder || '').padStart(4, '0')}</DialogTitle>
              <DialogDescription>Proceso actual: <Badge variant={getProcesoVariant(currentOrder?.proceso)}>{procesoOptions.find(p=>p.value === currentOrder?.proceso)?.label || currentOrder?.proceso || 'N/A'}</Badge></DialogDescription>
            </DialogHeader>
            {currentOrder && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm py-4">
                    {/* Sección Vehículo */}
                    <div className="col-span-1 md:col-span-2 mb-2 border-b pb-2"> <p className="font-semibold text-base">Vehículo:</p></div>
                    <p><span className="font-medium">Placas:</span> {currentOrder.placas}</p>
                    <p><span className="font-medium">VIN:</span> {currentOrder.vin || 'N/A'}</p>
                    <p><span className="font-medium">Marca:</span> {marcas.find(m => m._id === currentOrder.idMarca)?.marca || currentOrder.idMarca || 'N/A'}</p>
                    <p><span className="font-medium">Modelo ID (Numérico):</span> {currentOrder.idModelo || 'N/A'}</p>
                    <p><span className="font-medium">Año:</span> {currentOrder.año || 'N/A'}</p>
                    <p><span className="font-medium">Color:</span> {currentOrder.color || 'N/A'}</p>
                    <p><span className="font-medium">Kilometraje:</span> {currentOrder.kilometraje || 'N/A'}</p>

                    {/* Sección Cliente */}
                    <div className="col-span-1 md:col-span-2 mt-3 mb-2 border-b pb-2"> <p className="font-semibold text-base">Cliente:</p></div>
                    <p><span className="font-medium">Cliente:</span> {clients.find(c => c._id === currentOrder.idCliente)?.nombre || clients.find(c => c._id === currentOrder.idCliente)?.razonSocial || currentOrder.idCliente || 'N/A'}</p>

                    {/* Sección Aseguradora (si aplica) */}
                    {currentOrder.idAseguradora && (<>
                        <div className="col-span-1 md:col-span-2 mt-3 mb-2 border-b pb-2"> <p className="font-semibold text-base">Aseguradora:</p></div>
                        <p><span className="font-medium">Aseguradora:</span> {aseguradoras.find(a => a._id === currentOrder.idAseguradora)?.nombre || currentOrder.idAseguradora}</p>
                        <p><span className="font-medium">Ajustador:</span> {aseguradoras.find(a => a._id === currentOrder.idAseguradora)?.ajustadores?.find(aj => aj.idAjustador === currentOrder.ajustador)?.nombre || currentOrder.ajustador || 'N/A'}</p>
                        <p><span className="font-medium">Siniestro:</span> {currentOrder.siniestro || 'N/A'}</p>
                        <p><span className="font-medium">Póliza:</span> {currentOrder.poliza || 'N/A'}</p>
                        <p><span className="font-medium">Folio:</span> {currentOrder.folio || 'N/A'}</p>
                        <p><span className="font-medium">Deducible:</span> {currentOrder.deducible != null ? `$${currentOrder.deducible.toFixed(2)}` : 'N/A'}</p>
                        <p><span className="font-medium">Tipo Cliente Aseguradora:</span> {currentOrder.aseguradoTercero || 'N/A'}</p>
                    </>)}

                    {/* Sección Detalles y Fechas */}
                    <div className="col-span-1 md:col-span-2 mt-3 mb-2 border-b pb-2"> <p className="font-semibold text-base">Detalles y Fechas:</p></div>
                    <p><span className="font-medium">De Piso:</span> {currentOrder.piso ? 'Sí' : 'No'}</p>
                    <p><span className="font-medium">En Grúa:</span> {currentOrder.grua ? 'Sí' : 'No'}</p>
                    <p><span className="font-medium">URL Archivos:</span> {currentOrder.urlArchivos || 'N/A'}</p>
                    <p><span className="font-medium">Fecha Registro:</span> {formatDateTime(currentOrder.fechaRegistro)}</p>
                    <p><span className="font-medium">Fecha Valuación:</span> {formatDate(currentOrder.fechaValuacion)}</p>
                    <p><span className="font-medium">Fecha Reingreso:</span> {formatDate(currentOrder.fechaRengreso)}</p>
                    <p><span className="font-medium">Fecha Promesa:</span> {formatDate(currentOrder.fechaPromesa)}</p>
                    <p><span className="font-medium">Fecha Entrega:</span> {formatDate(currentOrder.fechaEntrega)}</p>

                    {/* Sección Personal Asignado */}
                    <div className="col-span-1 md:col-span-2 mt-3 mb-2 border-b pb-2"> <p className="font-semibold text-base">Personal Asignado:</p></div>
                    <p><span className="font-medium">Valuador:</span> {empleadosList.find(e => e._id === currentOrder.idValuador)?.nombre || currentOrder.idValuador || 'N/A'}</p>
                    <p><span className="font-medium">Asesor:</span> {empleadosList.find(e => e._id === currentOrder.idAsesor)?.nombre || currentOrder.idAsesor || 'N/A'}</p>
                    <p><span className="font-medium">Hojalatero:</span> {empleadosList.find(e => e._id === currentOrder.idHojalatero)?.nombre || currentOrder.idHojalatero || 'N/A'}</p>
                    <p><span className="font-medium">Pintor:</span> {empleadosList.find(e => e._id === currentOrder.idPintor)?.nombre || currentOrder.idPintor || 'N/A'}</p>

                    {/* Sección Presupuesto */}
                    <div className="col-span-1 md:col-span-2 mt-3 mb-2 border-b pb-2"> <p className="font-semibold text-base">Presupuesto:</p></div>
                    <p><span className="font-medium">ID Presupuesto:</span> {currentOrder.idPresupuesto || 'N/A'}</p>

                    {/* Sección Log de Cambios */}
                    <div className="col-span-1 md:col-span-2 mt-3 mb-2 border-b pb-2"> <p className="font-semibold text-base">Log de Cambios:</p></div>
                    <div className="col-span-1 md:col-span-2 max-h-32 overflow-y-auto bg-muted/50 p-2 rounded-md">
                        {currentOrder.log && currentOrder.log.length > 0 ? currentOrder.log.map((entry, index) => (
                            <p key={index} className="text-xs mb-1">
                                <span className="font-medium">{formatDateTime(entry.timestamp)}</span> (Usr: {empleadosList.find(e => e._id === entry.userId)?.nombre || entry.userId?.substring(0,8) || 'Sis'}): {entry.action} {entry.details && `- ${entry.details}`}
                            </p>
                        )) : <p className="text-xs text-muted-foreground">No hay logs.</p>}
                    </div>
                </div>
            )}
            <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Eliminar Orden */}
      <Dialog open={isDeleteOrderDialogOpen} onOpenChange={setIsDeleteOrderDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Seguro que deseas eliminar la orden OT-{String(orders.find(o=>o._id === orderToDeleteId)?.idOrder || '').padStart(4, '0')}? Esta acción eliminará la orden de forma permanente.</DialogDescription></DialogHeader>
            <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteOrder}>Eliminar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

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
      {/* Diálogo para Crear Nuevo Modelo */}
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
      {/* Diálogo para Editar Modelo */}
      <Dialog open={isEditModeloDialogOpen} onOpenChange={(open) => { setIsEditModeloDialogOpen(open); if (!open) setCurrentModelo(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Editar Modelo: {currentModelo?.modelo}</DialogTitle></DialogHeader>
            {currentModelo && (<div className="space-y-4 py-4">{renderDialogField("Nombre Modelo", "modelo", "text", "Ej: Corolla", "editModelo",undefined,false,false,false,true)}</div>)}
            <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateModelo}>Actualizar Modelo</Button></DialogFooter>
          </DialogContent>
      </Dialog>

      {/* --- Diálogos para Aseguradoras (Admin) --- */}
      {/* Diálogo para Crear Nueva Aseguradora */}
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
      {/* Diálogo para Editar Aseguradora */}
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
      {/* Diálogo para Eliminar Aseguradora */}
      <Dialog open={isDeleteAseguradoraDialogOpen} onOpenChange={setIsDeleteAseguradoraDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Seguro que deseas eliminar la aseguradora {aseguradoras.find(a=>a._id === aseguradoraToDeleteId)?.nombre}? Se eliminarán también sus ajustadores.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteAseguradora}>Eliminar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Gestionar Ajustadores de una Aseguradora */}
      <Dialog open={isManageAjustadoresDialogOpen} onOpenChange={(open) => { setIsManageAjustadoresDialogOpen(open); if (!open) setCurrentAseguradora(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Gestionar Ajustadores para: {currentAseguradora?.nombre}</DialogTitle></DialogHeader>
          <div className="my-4"><Button size="sm" onClick={() => { setNewAjustadorData({nombre: '', telefono: '', correo: ''}); setIsCreateAjustadorDialogOpen(true);}}><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Ajustador</Button></div>
          {currentAseguradora?.ajustadores && currentAseguradora.ajustadores.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>Correo</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {currentAseguradora.ajustadores.map(aj => (
                  // `aj.idAjustador` es un string (ObjectId)
                  <TableRow key={aj.idAjustador}><TableCell>{aj.idAjustador.substring(0,8)}...</TableCell><TableCell>{aj.nombre}</TableCell><TableCell>{aj.telefono || 'N/A'}</TableCell><TableCell>{aj.correo || 'N/A'}</TableCell>
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
      {/* Diálogo para Crear Nuevo Ajustador */}
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
      {/* Diálogo para Editar Ajustador */}
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

      {/* --- Diálogos para Empleados (Admin) --- */}
      {/* Diálogo para Crear Nuevo Empleado */}
      <Dialog open={isCreateEmpleadoDialogOpen} onOpenChange={setIsCreateEmpleadoDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear Nuevo Empleado</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4"> {/* Contenedor principal del formulario */}
            {/* Campos básicos del empleado */}
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
            
            {/* Sección para crear acceso al sistema */}
            <div className="my-2 border-t pt-4">
                {renderDialogField("Crear acceso al sistema", "createSystemUser", "checkbox", "", "newEmpleado", undefined, true)}
            </div>

            {/* Campos condicionales para credenciales de sistema */}
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
      {/* Diálogo para Editar Empleado */}
      <Dialog open={isEditEmpleadoDialogOpen} onOpenChange={(open) => { setIsEditEmpleadoDialogOpen(open); if (!open) setCurrentEmpleadoToEdit(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Empleado: {currentEmpleadoToEdit?.nombre}</DialogTitle></DialogHeader>
          {currentEmpleadoToEdit && (
            <div className="space-y-4 py-4"> {/* Contenedor principal del formulario */}
              {/* Campos básicos del empleado */}
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

              {/* Sección para credenciales de sistema */}
              <div className="my-2 border-t pt-4">
                <h4 className="font-medium mb-2 text-base">Acceso al Sistema</h4>
                {/* Opción para crear acceso si el empleado NO tiene uno */}
                {!currentEmpleadoToEdit.user && !editEmpleadoData.createSystemUser && ( 
                     renderDialogField("Crear nuevo acceso al sistema", "createSystemUser", "checkbox", "", "editEmpleado", undefined, true)
                )}
                
                {/* Campos para crear o editar credenciales de sistema */}
                {(currentEmpleadoToEdit.user || editEmpleadoData.createSystemUser) && ( 
                    <>
                        <div className="space-y-1">
                        {renderDialogField("Nombre de Usuario", "systemUserUsuario", "text", "Ej: juan.perez", "editEmpleado", undefined, false, false, 
                                          // Deshabilitar si el empleado ya tiene usuario Y no se está intentando crear uno nuevo.
                                          !!(currentEmpleadoToEdit.user && !editEmpleadoData.createSystemUser), 
                                          true)}
                        </div>
                        <div className="space-y-1">
                        {renderDialogField("Rol en Sistema", "systemUserRol", "select", "Seleccionar rol", "editEmpleado", userRoleOptions, false, false, 
                                          // Deshabilitar si el empleado ya tiene usuario Y no se está intentando crear uno nuevo.
                                          !!(currentEmpleadoToEdit.user && !editEmpleadoData.createSystemUser), 
                                          true)}
                        </div>
                        
                        {/* Sección para cambiar/establecer contraseña */}
                        <h5 className="font-medium mt-3 text-sm">
                            {/* Lógica de etiqueta para contraseña */}
                            {(currentEmpleadoToEdit.user && !editEmpleadoData.createSystemUser) ? 'Cambiar Contraseña (Opcional)' : 'Establecer Contraseña*'}
                        </h5>
                        <div className="space-y-1">
                        {renderDialogField("Nueva Contraseña", "newSystemUserContraseña", "password", 
                                          (currentEmpleadoToEdit.user && !editEmpleadoData.createSystemUser) ? "Dejar en blanco para no cambiar" : "Mínimo 6 caracteres", 
                                          "editEmpleado", undefined, false, false, false, 
                                          // Requerido si se está creando un nuevo usuario para este empleado.
                                          editEmpleadoData.createSystemUser && !currentEmpleadoToEdit.user)} 
                        </div>
                        <div className="space-y-1">
                        {renderDialogField("Confirmar Nueva Contraseña", "newSystemUserConfirmContraseña", "password", "", "editEmpleado", undefined, false, false, false, 
                                          editEmpleadoData.createSystemUser && !currentEmpleadoToEdit.user)} 
                        </div>
                        
                        {/* Botón para remover acceso si el empleado ya tiene uno */}
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
      {/* Diálogo para Eliminar Empleado */}
      <Dialog open={isDeleteEmpleadoDialogOpen} onOpenChange={(open) => { setIsDeleteEmpleadoDialogOpen(open); if(!open) setEmpleadoToDeleteId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Seguro que deseas eliminar al empleado {empleadosList.find(e => e._id === empleadoToDeleteId)?.nombre}? Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteEmpleado}>Eliminar Empleado</Button></DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

