
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogOut, CalendarDays, Wrench, Package, PlusCircle, Edit, Trash2, EyeIcon, Car, Shield, Users, Settings, Building, UserX, AlertTriangle, UserPlus, Briefcase, Trash, Activity, ListChecks } from 'lucide-react';
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
  NewClienteData,
  LogEntry,
  PresupuestoItem,
  Puesto, 
  NewPuestoData, 
  UpdatePuestoData, 
} from '@/lib/types';
import { UserRole } from '@/lib/types'; // Enum para usar sus valores.

// Acciones del servidor.
import {
  getAllOrdersAction,
  createOrderAction,
  updateOrderAction,
  deleteOrderAction,
  getOrderByIdAction,
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
  getModelosByMarcaAction,
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
  getAjustadoresByAseguradora,
} from './admin/aseguradoras/actions';

import { getAllClientsAction, createClienteAction as createClientForOrderAction } from './admin/clients/actions'; 

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

import {
  getAllPuestosAction,
  createPuestoAction,
  updatePuestoAction,
  deletePuestoAction,
} from './admin/puestos/actions';


/**
 * Tipo de datos para el formulario de creación/edición de Órdenes de Servicio.
 * `aseguradoTerceroString` se usa para el Select y se convierte a boolean antes de enviar.
 */
type OrderFormDataType = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'Log' | 'presupuestos' | 'aseguradoTercero'>> & {
  año?: string; // Para input type="number"
  deducible?: string; // Para input type="number"
  aseguradoTerceroString?: 'true' | 'false' | string; // Para el Select 'Asegurado' / 'Tercero'
};


/** Tipo de datos para el formulario de creación/edición de Marcas de Vehículos. */
type MarcaFormDataType = Partial<Omit<MarcaVehiculo, '_id' | 'modelos'>>;
/** Tipo de datos para el formulario de creación/edición de Modelos. */
type ModeloFormDataType = Partial<Omit<ModeloVehiculo, 'idModelo'>> & { idModelo_to_edit?: string };


/** Tipo de datos para el formulario de creación/edición de Aseguradoras. */
type AseguradoraFormDataType = Partial<Omit<Aseguradora, '_id' | 'ajustadores'>>;
/** Tipo de datos para el formulario de creación/edición de Ajustadores. */
type AjustadorFormDataType = Partial<Omit<Ajustador, 'idAjustador'>> & { idAjustador_to_edit?: string };

/**
 * Tipo de datos para el formulario de creación de Empleados.
 * `_id` y `fechaRegistro` se generan automáticamente.
 * `user` se construye condicionalmente.
 */
type EmpleadoFormDataType = Omit<Empleado, '_id' | 'fechaRegistro' | 'user' | 'sueldo' | 'comision'> & {
  sueldo?: string; // Para input de texto
  comision?: string; // Para input de texto
  createSystemUser?: boolean;
  systemUserUsuario?: string;
  systemUserContraseña?: string;
  systemUserConfirmContraseña?: string;
  systemUserRol?: UserRoleType;
};

/**
 * Tipo de datos para el formulario de edición de Empleados.
 * Campos básicos son opcionales. Credenciales de sistema son opcionales.
 */
type EditEmpleadoFormDataType = Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user' | 'sueldo' | 'comision'>> & {
  sueldo?: string; // Para input de texto
  comision?: string; // Para input de texto
  systemUserUsuario?: string;
  systemUserRol?: UserRoleType;
  newSystemUserContraseña?: string;
  newSystemUserConfirmContraseña?: string;
  // No es 'createSystemUser' aquí, sino que se determina si 'user' existe en currentEmpleadoToEdit
};

/** Tipo de datos para el formulario de creación de Clientes. */
type ClienteFormDataType = Partial<NewClienteData>;

/** Tipo de datos para el formulario de creación/edición de Puestos. */
type PuestoFormDataType = Partial<NewPuestoData>;


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
  /** Lista de órdenes de servicio. */
  const [orders, setOrders] = useState<Order[]>([]);
  /** Indica si se están cargando las órdenes. */
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  /** Controla visibilidad del diálogo "Crear Nueva Orden". */
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  /** Controla visibilidad del diálogo "Editar Orden". */
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  /** Controla visibilidad del diálogo "Ver Detalles de Orden". */
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false);
  /** Controla visibilidad del diálogo "Eliminar Orden". */
  const [isDeleteOrderDialogOpen, setIsDeleteOrderDialogOpen] = useState(false);
  /** Orden actual seleccionada para ver/editar/eliminar. */
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  /** _id (string ObjectId) de la orden a eliminar. */
  const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null);
  /** Lista de ajustadores disponibles para la aseguradora seleccionada en el formulario de orden. */
  const [availableAjustadoresForOrder, setAvailableAjustadoresForOrder] = useState<Pick<Ajustador, 'idAjustador' | 'nombre'>[]>([]);
  /** Lista de modelos disponibles para la marca seleccionada en el formulario de orden. */
  const [availableModelosForOrder, setAvailableModelosForOrder] = useState<Pick<ModeloVehiculo, 'idModelo' | 'modelo'>[]>([]);
  /** Datos iniciales para el formulario de nueva orden. */
  const initialNewOrderData: OrderFormDataType = {
    proceso: 'pendiente', piso: false, grua: false, aseguradoTerceroString: 'true', // 'true' para Asegurado por defecto
  };
  /** Estado para los datos del formulario de nueva orden. */
  const [newOrderData, setNewOrderData] = useState<OrderFormDataType>(initialNewOrderData);
  /** Estado para los datos del formulario de edición de orden. */
  const [editOrderData, setEditOrderData] = useState<OrderFormDataType>({});

  // --- Datos para Selects de Órdenes ---
  /** Lista de clientes para el select en el formulario de órdenes. */
  const [clients, setClients] = useState<Cliente[]>([]);
  /** Indica si se están cargando los clientes. */
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  /** Lista de empleados con rol ASESOR para selects. */
  const [asesores, setAsesores] = useState<{ _id: string; nombre: string }[]>([]);
  /** Indica si se están cargando los asesores. */
  const [isLoadingAsesores, setIsLoadingAsesores] = useState(true);
  /** Lista de empleados con rol VALUADOR para selects. */
  const [valuadores, setValuadores] = useState<{ _id: string; nombre: string }[]>([]);
  /** Lista de empleados con puesto HOJALATERO para selects. */
  const [hojalateros, setHojalateros] = useState<{ _id: string; nombre: string }[]>([]);
  /** Lista de empleados con puesto PINTOR para selects. */
  const [pintores, setPintores] = useState<{ _id: string; nombre: string }[]>([]);


  // --- Estados para Administración: Marcas y Modelos ---
  /** Lista de marcas de vehículos. */
  const [marcas, setMarcas] = useState<MarcaVehiculo[]>([]);
  /** Indica si se están cargando las marcas. */
  const [isLoadingMarcas, setIsLoadingMarcas] = useState(true);
  /** Controla visibilidad del diálogo "Crear Nueva Marca". */
  const [isCreateMarcaDialogOpen, setIsCreateMarcaDialogOpen] = useState(false);
  /** Controla visibilidad del diálogo "Editar Marca". */
  const [isEditMarcaDialogOpen, setIsEditMarcaDialogOpen] = useState(false);
  /** Controla visibilidad del diálogo "Eliminar Marca". */
  const [isDeleteMarcaDialogOpen, setIsDeleteMarcaDialogOpen] = useState(false);
  /** Marca actual seleccionada para editar/gestionar modelos/eliminar. */
  const [currentMarca, setCurrentMarca] = useState<MarcaVehiculo | null>(null);
  /** _id (string ObjectId) de la marca a eliminar. */
  const [marcaToDeleteId, setMarcaToDeleteId] = useState<string | null>(null);
  /** Datos para el formulario de nueva marca. */
  const [newMarcaData, setNewMarcaData] = useState<MarcaFormDataType>({ marca: '' });
  /** Datos para el formulario de edición de marca. */
  const [editMarcaData, setEditMarcaData] = useState<MarcaFormDataType>({});
  /** Controla visibilidad del diálogo "Gestionar Modelos". */
  const [isManageModelosDialogOpen, setIsManageModelosDialogOpen] = useState(false);
  /** Controla visibilidad del diálogo "Añadir Nuevo Modelo". */
  const [isCreateModeloDialogOpen, setIsCreateModeloDialogOpen] = useState(false);
  /** Controla visibilidad del diálogo "Editar Modelo". */
  const [isEditModeloDialogOpen, setIsEditModeloDialogOpen] = useState(false);
  /** Modelo actual seleccionado para editar. */
  const [currentModelo, setCurrentModelo] = useState<ModeloVehiculo | null>(null);
  /** Datos para el formulario de nuevo modelo. */
  const [newModeloData, setNewModeloData] = useState<Omit<ModeloVehiculo, 'idModelo'>>({ modelo: '' });
  /** Datos para el formulario de edición de modelo. */
  const [editModeloData, setEditModeloData] = useState<Partial<ModeloVehiculo>>({});


  // --- Estados para Administración: Aseguradoras y Ajustadores ---
  /** Lista de aseguradoras. */
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  /** Indica si se están cargando las aseguradoras. */
  const [isLoadingAseguradoras, setIsLoadingAseguradoras] = useState(true);
  /** Controla visibilidad del diálogo "Crear Nueva Aseguradora". */
  const [isCreateAseguradoraDialogOpen, setIsCreateAseguradoraDialogOpen] = useState(false);
  /** Controla visibilidad del diálogo "Editar Aseguradora". */
  const [isEditAseguradoraDialogOpen, setIsEditAseguradoraDialogOpen] = useState(false);
  /** Controla visibilidad del diálogo "Eliminar Aseguradora". */
  const [isDeleteAseguradoraDialogOpen, setIsDeleteAseguradoraDialogOpen] = useState(false);
  /** Aseguradora actual seleccionada para editar/gestionar ajustadores/eliminar. */
  const [currentAseguradora, setCurrentAseguradora] = useState<Aseguradora | null>(null);
  /** _id (string ObjectId) de la aseguradora a eliminar. */
  const [aseguradoraToDeleteId, setAseguradoraToDeleteId] = useState<string | null>(null);
  /** Datos para el formulario de nueva aseguradora. */
  const [newAseguradoraData, setNewAseguradoraData] = useState<AseguradoraFormDataType>({ nombre: '', telefono: '' });
  /** Datos para el formulario de edición de aseguradora. */
  const [editAseguradoraData, setEditAseguradoraData] = useState<AseguradoraFormDataType>({});
  /** Controla visibilidad del diálogo "Gestionar Ajustadores". */
  const [isManageAjustadoresDialogOpen, setIsManageAjustadoresDialogOpen] = useState(false);
  /** Controla visibilidad del diálogo "Añadir Nuevo Ajustador". */
  const [isCreateAjustadorDialogOpen, setIsCreateAjustadorDialogOpen] = useState(false);
  /** Controla visibilidad del diálogo "Editar Ajustador". */
  const [isEditAjustadorDialogOpen, setIsEditAjustadorDialogOpen] = useState(false);
  /** Ajustador actual seleccionado para editar. */
  const [currentAjustador, setCurrentAjustador] = useState<Ajustador | null>(null);
  /** Datos para el formulario de nuevo ajustador. */
  const [newAjustadorData, setNewAjustadorData] = useState<Omit<Ajustador, 'idAjustador'>>({ nombre: '', telefono: '', correo: '' });
  /** Datos para el formulario de edición de ajustador. */
  const [editAjustadorData, setEditAjustadorData] = useState<Partial<Ajustador>>({});


  // --- Estados para Administración: Empleados ---
  /** Lista de empleados. */
  const [empleadosList, setEmpleadosList] = useState<Empleado[]>([]);
  /** Indica si se están cargando los empleados. */
  const [isLoadingEmpleadosList, setIsLoadingEmpleadosList] = useState(true);
  /** Controla visibilidad del diálogo "Crear Nuevo Empleado". */
  const [isCreateEmpleadoDialogOpen, setIsCreateEmpleadoDialogOpen] = useState(false);
  /** Controla visibilidad del diálogo "Editar Empleado". */
  const [isEditEmpleadoDialogOpen, setIsEditEmpleadoDialogOpen] = useState(false);
  /** Controla visibilidad del diálogo "Eliminar Empleado". */
  const [isDeleteEmpleadoDialogOpen, setIsDeleteEmpleadoDialogOpen] = useState(false);
  /** Empleado actual seleccionado para editar. */
  const [currentEmpleadoToEdit, setCurrentEmpleadoToEdit] = useState<Empleado | null>(null);
  /** Datos iniciales para el formulario de nuevo empleado. */
  const initialNewEmpleadoData: EmpleadoFormDataType = {
    nombre: '', puesto: '', createSystemUser: false, systemUserUsuario: '', systemUserContraseña: '', systemUserConfirmContraseña: '', systemUserRol: UserRole.ASESOR,
  };
  /** Estado para los datos del formulario de nuevo empleado. */
  const [newEmpleadoData, setNewEmpleadoData] = useState<EmpleadoFormDataType>(initialNewEmpleadoData);
  /** Estado para los datos del formulario de edición de empleado. */
  const [editEmpleadoData, setEditEmpleadoData] = useState<EditEmpleadoFormDataType>({
    nombre: '', puesto: '', 
  });
  /** _id (string ObjectId) del empleado a eliminar. */
  const [empleadoToDeleteId, setEmpleadoToDeleteId] = useState<string | null>(null);

  // --- Estados para Administración: Clientes (para diálogo de creación rápida) ---
  /** Controla visibilidad del diálogo "Crear Nuevo Cliente" desde el formulario de orden. */
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false);
  /** Datos para el formulario de nuevo cliente. */
  const [newClientData, setNewClientData] = useState<ClienteFormDataType>({ nombre: '', telefono: '', correo: ''});

  // --- ESTADOS PARA CONFIGURACIÓN GENERAL: PUESTOS ---
  /** Lista de puestos de trabajo configurables. */
  const [puestosList, setPuestosList] = useState<Puesto[]>([]);
  /** Indica si se están cargando los puestos. */
  const [isLoadingPuestos, setIsLoadingPuestos] = useState(true);
  /** Controla la visibilidad del diálogo para crear un nuevo puesto. */
  const [isCreatePuestoDialogOpen, setIsCreatePuestoDialogOpen] = useState(false);
  /** Datos para el formulario de nuevo puesto. */
  const [newPuestoData, setNewPuestoData] = useState<PuestoFormDataType>({ nombre: '' });
  /** Controla la visibilidad del diálogo para editar un puesto. */
  const [isEditPuestoDialogOpen, setIsEditPuestoDialogOpen] = useState(false);
  /** Puesto actual seleccionado para editar. */
  const [currentPuestoToEdit, setCurrentPuestoToEdit] = useState<Puesto | null>(null);
  /** Datos para el formulario de edición de puesto. */
  const [editPuestoData, setEditPuestoData] = useState<PuestoFormDataType>({});
  /** Controla la visibilidad del diálogo para eliminar un puesto. */
  const [isDeletePuestoDialogOpen, setIsDeletePuestoDialogOpen] = useState(false);
  /** _id (string ObjectId) del puesto a eliminar. */
  const [puestoToDeleteId, setPuestoToDeleteId] = useState<string | null>(null);


  /**
   * useEffect principal para verificar la sesión del usuario al cargar el componente.
   * Si el usuario no está logueado o faltan datos esenciales, redirige a la página de inicio.
   * Si está logueado, configura los estados de usuario y carga los datos iniciales.
   */
  useEffect(() => {
    console.log("Dashboard useEffect: Verificando sesión...");
    const loggedIn = localStorage.getItem('isLoggedIn');
    const storedUserName = localStorage.getItem('username');
    const storedUserIdEmpleado = localStorage.getItem('empleadoId'); // Este es el _id del empleado
    const storedUserRole = localStorage.getItem('userRole') as UserRoleType | null;

    console.log("Dashboard useEffect: Valores RAW de localStorage:", {
      loggedIn, storedUserName, storedUserIdEmpleado, storedUserRole
    });

    const isUserIdEmpleadoValid = storedUserIdEmpleado && storedUserIdEmpleado.trim() !== '' && storedUserIdEmpleado !== 'null' && storedUserIdEmpleado !== 'undefined';
    const isUserRoleValid = storedUserRole && storedUserRole.trim() !== '' && storedUserRole !== 'null' && storedUserRole !== 'undefined' && Object.values(UserRole).includes(storedUserRole as UserRole);

    console.log("Dashboard useEffect: Validaciones de sesión:", {
      isLoggedIn: loggedIn === 'true',
      isUserNamePresent: !!storedUserName,
      isUserIdEmpleadoValid,
      isUserRoleValid
    });

    if (loggedIn === 'true' && storedUserName && isUserIdEmpleadoValid && isUserRoleValid) {
      console.log("Dashboard useEffect: Usuario logueado. Configurando estado y cargando datos iniciales.");
      setUserName(storedUserName);
      setUserIdEmpleado(storedUserIdEmpleado); // Guardamos el _id del empleado
      setUserRole(storedUserRole);

      // Pre-llenar idAsesor si el usuario es ASESOR
      setNewOrderData(prev => ({
        ...initialNewOrderData,
        idAsesor: storedUserRole === UserRole.ASESOR && storedUserIdEmpleado ? storedUserIdEmpleado : undefined,
      }));

      fetchInitialData(storedUserRole, storedUserIdEmpleado);
    } else {
      console.log("Dashboard useEffect: Sesión inválida o datos faltantes. Redirigiendo a /. Detalles:", 
        { loggedIn, storedUserName, storedEmpleadoId: storedUserIdEmpleado, storedUserRole }
      );
      router.replace('/');
    }
  }, [router]); // Dependencia del router para la redirección


  /**
   * Función de callback para cargar todos los datos iniciales necesarios para el dashboard.
   * Se llama después de verificar que el usuario está logueado.
   * @param {UserRoleType | null} role - Rol del usuario actual.
   * @param {string | null} currentUserIdEmpleado - _id del empleado logueado.
   */
  const fetchInitialData = useCallback(async (role: UserRoleType | null, currentUserIdEmpleado: string | null) => {
    console.log("fetchInitialData: Iniciando carga de datos...", { role, currentUserIdEmpleado });
    // Pre-llenar idAsesor en el formulario de nueva orden si el rol es ASESOR
     setNewOrderData(prev => ({
      ...initialNewOrderData,
      idAsesor: role === UserRole.ASESOR && currentUserIdEmpleado ? currentUserIdEmpleado : undefined,
    }));

    // Establecer todos los estados de carga a true
    setIsLoadingOrders(true); setIsLoadingMarcas(true); setIsLoadingAseguradoras(true);
    setIsLoadingClients(true); setIsLoadingAsesores(true); setIsLoadingEmpleadosList(true);
    setIsLoadingPuestos(true);

    try {
      // Ejecutar todas las cargas de datos en paralelo
      await Promise.all([
        fetchOrders(), fetchMarcas(), fetchAseguradoras(), fetchClients(),
        fetchAsesores(), fetchValuadores(), fetchHojalateros(), fetchPintores(),
        fetchEmpleados(), fetchPuestos(),
      ]);
      console.log("fetchInitialData: Todos los datos cargados exitosamente.");
    } catch (error) {
      console.error("fetchInitialData: Error crítico al cargar datos iniciales:", error);
      toast({ title: "Error Crítico de Carga", description: "No se pudieron cargar los datos iniciales del dashboard. Intente recargar la página.", variant: "destructive" });
    }
  }, [toast]); // Dependencia de toast para mostrar mensajes de error

  // --- Funciones de Carga de Datos Específicas (fetchers) ---
  /** Carga las órdenes de servicio. */
  const fetchOrders = async () => { 
    console.log("fetchOrders: Iniciando...");
    setIsLoadingOrders(true);
    try {
      const result = await getAllOrdersAction();
      console.log("fetchOrders: Resultado:", result);
      if (result.success && result.data) {
        setOrders(result.data);
      } else {
        toast({ title: "Error Órdenes", description: result.error || "No se pudieron cargar las órdenes.", variant: "destructive" });
      }
    } catch (error) {
      console.error("fetchOrders: Error:", error);
      toast({ title: "Error Crítico Órdenes", description: "Fallo al obtener órdenes.", variant: "destructive" });
    } finally {
      setIsLoadingOrders(false);
    }
  };

  /** Carga las marcas de vehículos. */
  const fetchMarcas = async () => {
    console.log("fetchMarcas: Iniciando...");
    setIsLoadingMarcas(true);
    try {
      const result = await getAllMarcasAction();
      console.log("fetchMarcas: Resultado:", result);
      if (result.success && result.data) {
        setMarcas(result.data);
      } else {
        toast({ title: "Error Marcas", description: result.error || "No se pudieron cargar las marcas.", variant: "destructive" });
      }
    } catch (error) {
      console.error("fetchMarcas: Error:", error);
      toast({ title: "Error Crítico Marcas", description: "Fallo al obtener marcas.", variant: "destructive" });
    } finally {
      setIsLoadingMarcas(false);
    }
  };

  /** Carga las aseguradoras. */
  const fetchAseguradoras = async () => {
    console.log("fetchAseguradoras: Iniciando...");
    setIsLoadingAseguradoras(true);
    try {
      const result = await getAllAseguradorasAction();
      console.log("fetchAseguradoras: Resultado:", result);
      if (result.success && result.data) {
        setAseguradoras(result.data);
      } else {
        toast({ title: "Error Aseguradoras", description: result.error || "No se pudieron cargar las aseguradoras.", variant: "destructive" });
      }
    } catch (error) {
      console.error("fetchAseguradoras: Error:", error);
      toast({ title: "Error Crítico Aseguradoras", description: "Fallo al obtener aseguradoras.", variant: "destructive" });
    } finally {
      setIsLoadingAseguradoras(false);
    }
  };

  /** Carga los clientes. */
  const fetchClients = async () => {
    console.log("fetchClients: Iniciando...");
    setIsLoadingClients(true);
    try {
      const result = await getAllClientsAction();
      console.log("fetchClients: Resultado:", result);
      if (result.success && result.data) {
        setClients(result.data);
      } else {
        toast({ title: "Error Clientes", description: result.error || "No se pudieron cargar los clientes.", variant: "destructive" });
      }
    } catch (error) {
      console.error("fetchClients: Error:", error);
      toast({ title: "Error Crítico Clientes", description: "Fallo al obtener clientes.", variant: "destructive" });
    } finally {
      setIsLoadingClients(false);
    }
  };

  /** Carga empleados con rol ASESOR. */
  const fetchAsesores = async () => {
    console.log("fetchAsesores: Iniciando...");
    setIsLoadingAsesores(true);
    try {
      const result = await getEmpleadosByRolAction(UserRole.ASESOR);
      console.log("fetchAsesores: Resultado:", result);
      if (result.success && result.data) {
        setAsesores(result.data);
      } else {
        toast({ title: "Error Asesores", description: result.error || "No se pudieron cargar los asesores.", variant: "destructive" });
      }
    } catch (error) {
      console.error("fetchAsesores: Error:", error);
      toast({ title: "Error Crítico Asesores", description: "Fallo al obtener asesores.", variant: "destructive" });
    } finally {
      setIsLoadingAsesores(false);
    }
  };

  /** Carga empleados con rol VALUADOR. */
  const fetchValuadores = async () => {
    console.log("fetchValuadores: Iniciando...");
    // setIsLoadingValuadores(true); // Debería existir un estado para esto
    try {
      const result = await getEmpleadosByRolAction(UserRole.VALUADOR);
      console.log("fetchValuadores: Resultado:", result);
      if (result.success && result.data) {
        setValuadores(result.data);
      } else {
        toast({ title: "Error Valuadores", description: result.error || "No se pudieron cargar los valuadores.", variant: "destructive" });
      }
    } catch (error) {
      console.error("fetchValuadores: Error:", error);
      toast({ title: "Error Crítico Valuadores", description: "Fallo al obtener valuadores.", variant: "destructive" });
    } finally {
      // setIsLoadingValuadores(false);
    }
  };
  
  /** Carga empleados con puesto HOJALATERO. */
  const fetchHojalateros = async () => {
    console.log("fetchHojalateros: Iniciando...");
    // setIsLoadingHojalateros(true);
    try {
      const result = await getEmpleadosByPuestoAction("Hojalatero");
      console.log("fetchHojalateros: Resultado:", result);
      if (result.success && result.data) {
        setHojalateros(result.data);
      } else {
        toast({ title: "Error Hojalateros", description: result.error || "No se pudieron cargar los hojalateros.", variant: "destructive" });
      }
    } catch (error) {
      console.error("fetchHojalateros: Error:", error);
      toast({ title: "Error Crítico Hojalateros", description: "Fallo al obtener hojalateros.", variant: "destructive" });
    } finally {
      // setIsLoadingHojalateros(false);
    }
  };

  /** Carga empleados con puesto PINTOR. */
  const fetchPintores = async () => {
    console.log("fetchPintores: Iniciando...");
    // setIsLoadingPintores(true);
    try {
      const result = await getEmpleadosByPuestoAction("Pintor");
      console.log("fetchPintores: Resultado:", result);
      if (result.success && result.data) {
        setPintores(result.data);
      } else {
        toast({ title: "Error Pintores", description: result.error || "No se pudieron cargar los pintores.", variant: "destructive" });
      }
    } catch (error) {
      console.error("fetchPintores: Error:", error);
      toast({ title: "Error Crítico Pintores", description: "Fallo al obtener pintores.", variant: "destructive" });
    } finally {
      // setIsLoadingPintores(false);
    }
  };
  
  /** Carga la lista de empleados. */
  const fetchEmpleados = async () => {
    console.log("fetchEmpleados: Iniciando...");
    setIsLoadingEmpleadosList(true);
    try {
      const result = await getAllEmpleadosAction();
      console.log("fetchEmpleados: Resultado:", result);
      if (result.success && result.data) {
        setEmpleadosList(result.data);
      } else {
        toast({ title: "Error Empleados", description: result.error || "No se pudieron cargar los empleados.", variant: "destructive" });
      }
    } catch (error) {
      console.error("fetchEmpleados: Error:", error);
      toast({ title: "Error Crítico Empleados", description: "Fallo al obtener empleados.", variant: "destructive" });
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
      console.log("fetchPuestos: Resultado:", result);
      if (result.success && result.data) {
        setPuestosList(result.data);
      } else {
        toast({ title: "Error Puestos", description: result.error || "No se pudieron cargar los puestos.", variant: "destructive" });
      }
    } catch (error) {
      console.error("fetchPuestos: Error:", error);
      toast({ title: "Error Crítico Puestos", description: "Fallo al obtener puestos.", variant: "destructive" });
    } finally {
      setIsLoadingPuestos(false);
    }
  };

  /**
   * Maneja el cierre de sesión del usuario.
   * Limpia localStorage y redirige a la página de inicio.
   */
  const handleLogout = () => {
    console.log("handleLogout: Cerrando sesión...");
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('empleadoId');
    localStorage.removeItem('userRole');
    setUserName(null);
    setUserIdEmpleado(null);
    setUserRole(null);
    router.replace('/');
    toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
  };

  /**
   * Manejador genérico para cambios en inputs de texto o textarea.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - Evento de cambio.
   * @param {React.Dispatch<React.SetStateAction<any>>} setState - Función para actualizar el estado del formulario.
   */
  const handleInputChangeGeneric = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, setState: React.Dispatch<React.SetStateAction<any>>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;

    if (type === 'number' ) {
      processedValue = value === '' ? '' : Number(value); // Mantener string vacío si es input numérico vacío, sino convertir a número
    }
    // No es necesario el type === 'checkbox' aquí, se maneja con handleCheckboxChangeGeneric

    setState((prev: any) => ({ ...prev, [name]: processedValue }));
  };

  /**
   * Manejador genérico para cambios en checkboxes.
   * @param {string} name - Nombre del campo checkbox.
   * @param {boolean | 'indeterminate'} checked - Nuevo estado del checkbox.
   * @param {React.Dispatch<React.SetStateAction<any>>} setState - Función para actualizar el estado del formulario.
   */
  const handleCheckboxChangeGeneric = (name: string, checked: boolean | 'indeterminate', setState: React.Dispatch<React.SetStateAction<any>>) => {
    // Radix Checkbox devuelve un booleano directamente en onCheckedChange
    setState((prev: any) => ({ ...prev, [name]: checked === 'indeterminate' ? false : checked }));
  };

  /**
   * Manejador genérico para cambios en selects.
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
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - Evento de cambio.
   * @param {'new' | 'edit'} formType - Tipo de formulario ('new' o 'edit').
   */
  const handleOrderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formType: 'new' | 'edit') => {
    const setState = formType === 'new' ? setNewOrderData : setEditOrderData;
    handleInputChangeGeneric(e, setState);
  };

  /**
   * Manejador de cambios para checkboxes en formularios de órdenes.
   * @param {keyof OrderFormDataType} name - Nombre del campo checkbox.
   * @param {boolean} checked - Nuevo estado del checkbox.
   * @param {'new' | 'edit'} formType - Tipo de formulario.
   */
  const handleOrderCheckboxChange = (name: keyof OrderFormDataType, checked: boolean, formType: 'new' | 'edit') => {
    const setState = formType === 'new' ? setNewOrderData : setEditOrderData;
    handleCheckboxChangeGeneric(name, checked, setState);
  };

  /**
   * Manejador de cambios para selects en formularios de órdenes.
   * Carga dinámicamente ajustadores o modelos si se selecciona una aseguradora o marca.
   * @param {keyof OrderFormDataType} name - Nombre del campo select.
   * @param {string | undefined} value - Nuevo valor seleccionado.
   * @param {'new' | 'edit'} formType - Tipo de formulario.
   */
  const handleOrderSelectChange = async (name: keyof OrderFormDataType, value: string | undefined, formType: 'new' | 'edit') => {
    const setState = formType === 'new' ? setNewOrderData : setEditOrderData;
    handleSelectChangeGeneric(name, value, setState);

    // Cargar ajustadores si se selecciona una aseguradora
    if (name === 'idAseguradora' && value) {
      const result = await getAjustadoresByAseguradora(value);
      if (result.success && result.data) {
        setAvailableAjustadoresForOrder(result.data);
      } else {
        setAvailableAjustadoresForOrder([]);
        toast({ title: "Error", description: "No se pudieron cargar los ajustadores.", variant: "destructive" });
      }
    }
    // Cargar modelos si se selecciona una marca
    if (name === 'idMarca' && value) {
      const result = await getModelosByMarcaAction(value);
      if (result.success && result.data) {
        setAvailableModelosForOrder(result.data);
      } else {
        setAvailableModelosForOrder([]);
        toast({ title: "Error", description: "No se pudieron cargar los modelos.", variant: "destructive" });
      }
    }
  };

  /**
   * Maneja la creación de una nueva orden de servicio.
   * Realiza validaciones y llama a la acción del servidor.
   */
  const handleCreateOrder = async () => {
    // Validaciones básicas
    if (!newOrderData.idCliente || !newOrderData.idMarca || !newOrderData.idModelo || !newOrderData.idAsesor || !newOrderData.proceso) {
      toast({ title: "Error de Validación", description: "Cliente, Marca, Modelo, Asesor y Proceso son obligatorios.", variant: "destructive" });
      return;
    }

    const orderToCreate: NewOrderData = {
      ...newOrderData,
      // Convertir campos de string (del formulario) a number donde sea necesario
      año: newOrderData.año ? Number(newOrderData.año) : undefined,
      deducible: newOrderData.deducible ? Number(newOrderData.deducible) : undefined,
      // Convertir aseguradoTerceroString a boolean
      aseguradoTercero: newOrderData.aseguradoTerceroString === 'true',
      // Las fechas se deben enviar como Date objects si se colectan en el form, o undefined si no
      // Para creación, las fechas específicas (valuacion, entrega, etc.) se omiten como se solicitó
      fechaValuacion: undefined,
      fechaReingreso: undefined,
      fechaEntrega: undefined,
      fechaPromesa: undefined,
      fechaBaja: undefined,
    };
    
    // Eliminar campos que no deben enviarse en NewOrderData o que son opcionales y están vacíos
    delete (orderToCreate as any).aseguradoTerceroString;
    if (orderToCreate.idAjustador === '') delete orderToCreate.idAjustador;


    const result = await createOrderAction(orderToCreate, userIdEmpleado || undefined);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || `Orden OT-${result.data?.customOrderId} creada.` });
      setIsCreateOrderDialogOpen(false);
      fetchOrders(); // Recargar lista de órdenes
      setNewOrderData(initialNewOrderData); // Limpiar formulario
      setAvailableAjustadoresForOrder([]);
      setAvailableModelosForOrder([]);
    } else {
      toast({ title: "Error al Crear Orden", description: result.error || "No se pudo crear la orden.", variant: "destructive" });
    }
  };

  /**
   * Abre el diálogo para editar una orden y carga sus datos.
   * @param {string} orderId - _id (string ObjectId) de la orden a editar.
   */
  const openEditOrderDialog = async (orderId: string) => {
    const result = await getOrderByIdAction(orderId);
    if (result.success && result.data) {
      setCurrentOrder(result.data);
      // Preparar datos para el formulario, convirtiendo a string donde sea necesario para inputs
      const orderDataForForm: OrderFormDataType = {
        ...result.data,
        año: result.data.año?.toString(),
        deducible: result.data.deducible?.toString(),
        aseguradoTerceroString: result.data.aseguradoTercero ? 'true' : 'false',
        // Convertir fechas a formato YYYY-MM-DD para inputs type="date"
        fechaValuacion: result.data.fechaValuacion ? formatDate(result.data.fechaValuacion, 'YYYY-MM-DD') : undefined,
        fechaReingreso: result.data.fechaReingreso ? formatDate(result.data.fechaReingreso, 'YYYY-MM-DD') : undefined,
        fechaEntrega: result.data.fechaEntrega ? formatDate(result.data.fechaEntrega, 'YYYY-MM-DD') : undefined,
        fechaPromesa: result.data.fechaPromesa ? formatDate(result.data.fechaPromesa, 'YYYY-MM-DD') : undefined,
        fechaBaja: result.data.fechaBaja ? formatDate(result.data.fechaBaja, 'YYYY-MM-DD') : undefined,
      };
      setEditOrderData(orderDataForForm);

      // Cargar ajustadores y modelos si la orden ya tiene aseguradora y marca
      if (result.data.idAseguradora) {
        const ajustadoresRes = await getAjustadoresByAseguradora(result.data.idAseguradora);
        if (ajustadoresRes.success && ajustadoresRes.data) setAvailableAjustadoresForOrder(ajustadoresRes.data);
      }
      if (result.data.idMarca) {
        const modelosRes = await getModelosByMarcaAction(result.data.idMarca);
        if (modelosRes.success && modelosRes.data) setAvailableModelosForOrder(modelosRes.data);
      }

      setIsEditOrderDialogOpen(true);
    } else {
      toast({ title: "Error", description: "No se pudo cargar la orden para editar.", variant: "destructive" });
    }
  };

  /**
   * Maneja la actualización de una orden existente.
   */
  const handleUpdateOrder = async () => {
    if (!currentOrder || !currentOrder._id) {
      toast({ title: "Error", description: "No hay orden seleccionada para actualizar.", variant: "destructive" });
      return;
    }
    // Validaciones básicas
     if (!editOrderData.idCliente || !editOrderData.idMarca || !editOrderData.idModelo || !editOrderData.idAsesor || !editOrderData.proceso) {
      toast({ title: "Error de Validación", description: "Cliente, Marca, Modelo, Asesor y Proceso son obligatorios.", variant: "destructive" });
      return;
    }

    const orderToUpdate: UpdateOrderData = {
      ...editOrderData,
      año: editOrderData.año ? Number(editOrderData.año) : undefined,
      deducible: editOrderData.deducible ? Number(editOrderData.deducible) : undefined,
      aseguradoTercero: editOrderData.aseguradoTerceroString === 'true',
      // Convertir strings de fecha YYYY-MM-DD a objetos Date
      fechaValuacion: editOrderData.fechaValuacion ? new Date(editOrderData.fechaValuacion + 'T00:00:00') : undefined,
      fechaReingreso: editOrderData.fechaReingreso ? new Date(editOrderData.fechaReingreso + 'T00:00:00') : undefined,
      fechaEntrega: editOrderData.fechaEntrega ? new Date(editOrderData.fechaEntrega + 'T00:00:00') : undefined,
      fechaPromesa: editOrderData.fechaPromesa ? new Date(editOrderData.fechaPromesa + 'T00:00:00') : undefined,
      fechaBaja: editOrderData.fechaBaja ? new Date(editOrderData.fechaBaja + 'T00:00:00') : undefined,
    };
    delete (orderToUpdate as any).aseguradoTerceroString;
    if (orderToUpdate.idAjustador === '') delete orderToUpdate.idAjustador;


    const result = await updateOrderAction(currentOrder._id, orderToUpdate, userIdEmpleado || undefined);
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
   * @param {string} orderId - _id (string ObjectId) de la orden a ver.
   */
  const openViewOrderDialog = async (orderId: string) => {
    const result = await getOrderByIdAction(orderId);
    if (result.success && result.data) {
      setCurrentOrder(result.data);
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
   */
  const handleDeleteOrder = async () => {
    if (!orderToDeleteId) return;
    const result = await deleteOrderAction(orderToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Orden eliminada." });
      fetchOrders();
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar la orden.", variant: "destructive" });
    }
    setIsDeleteOrderDialogOpen(false);
    setOrderToDeleteId(null);
  };

  // --- Funciones de Gestión de Marcas (Administración) ---
  /** Maneja la creación de una nueva marca. */
  const handleCreateMarca = async () => {
    if (!newMarcaData.marca?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre de la marca es obligatorio.", variant: "destructive" });
      return;
    }
    const result = await createMarcaAction({ marca: newMarcaData.marca! });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Marca creada." });
      setIsCreateMarcaDialogOpen(false);
      fetchMarcas();
      setNewMarcaData({ marca: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear la marca.", variant: "destructive" });
    }
  };

  /** Abre el diálogo para editar una marca. */
  const openEditMarcaDialog = (marca: MarcaVehiculo) => {
    setCurrentMarca(marca);
    setEditMarcaData({ marca: marca.marca });
    setIsEditMarcaDialogOpen(true);
  };

  /** Maneja la actualización de una marca existente. */
  const handleUpdateMarca = async () => {
    if (!currentMarca || !currentMarca._id || !editMarcaData.marca?.trim()) {
      toast({ title: "Error de Validación", description: "Datos inválidos para actualizar la marca.", variant: "destructive" });
      return;
    }
    const result = await updateMarcaAction(currentMarca._id, { marca: editMarcaData.marca! });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Marca actualizada." });
      setIsEditMarcaDialogOpen(false);
      fetchMarcas();
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

  /** Confirma y ejecuta la eliminación de una marca. */
  const handleDeleteMarca = async () => {
    if (!marcaToDeleteId) return;
    const result = await deleteMarcaAction(marcaToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Marca eliminada." });
      fetchMarcas();
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar la marca.", variant: "destructive" });
    }
    setIsDeleteMarcaDialogOpen(false);
    setMarcaToDeleteId(null);
  };

  // --- Funciones de Gestión de Modelos (Administración) ---
  /** Abre el diálogo para gestionar modelos de una marca. */
  const openManageModelosDialog = async (marca: MarcaVehiculo) => {
    // Es posible que la marca en la lista `marcas` no tenga los modelos cargados si la lista es grande
    // y se optimiza la carga. Es mejor obtener la marca completa aquí.
    const result = await getMarcaForModelosAction(marca._id);
    if (result.success && result.data) {
        setCurrentMarca(result.data); // Asegura que tenemos los modelos más recientes
        setIsManageModelosDialogOpen(true);
    } else {
        toast({ title: "Error", description: "No se pudo cargar la marca para gestionar modelos.", variant: "destructive" });
    }
  };

  /** Maneja la creación de un nuevo modelo para la marca actual. */
  const handleCreateModelo = async () => {
    if (!currentMarca || !currentMarca._id || !newModeloData.modelo?.trim()) {
      toast({ title: "Error de Validación", description: "Marca no seleccionada o nombre de modelo inválido.", variant: "destructive" });
      return;
    }
    const result = await addModeloToMarcaAction(currentMarca._id, { modelo: newModeloData.modelo! });
    if (result.success && result.data) {
      toast({ title: "Éxito", description: `Modelo "${result.data.modelo}" añadido a ${currentMarca.marca}.` });
      // Actualizar la lista de modelos en currentMarca localmente o recargar la marca
      setCurrentMarca(prev => prev ? {...prev, modelos: [...(prev.modelos || []), result.data!]} : null);
      fetchMarcas(); // Recargar lista general de marcas para actualizar el contador de modelos
      setNewModeloData({ modelo: ''});
      setIsCreateModeloDialogOpen(false); // Cerrar diálogo de creación de modelo
    } else {
      toast({ title: "Error", description: result.error || "No se pudo añadir el modelo.", variant: "destructive" });
    }
  };

  /** Abre el diálogo para editar un modelo. */
  const openEditModeloDialog = (modelo: ModeloVehiculo) => {
    setCurrentModelo(modelo);
    setEditModeloData({ idModelo: modelo.idModelo, modelo: modelo.modelo });
    setIsEditModeloDialogOpen(true);
  };

  /** Maneja la actualización de un modelo existente. */
  const handleUpdateModelo = async () => {
    if (!currentMarca || !currentMarca._id || !currentModelo || !currentModelo.idModelo || !editModeloData.modelo?.trim()) {
      toast({ title: "Error de Validación", description: "Datos inválidos para actualizar modelo.", variant: "destructive" });
      return;
    }
    const result = await updateModeloInMarcaAction(currentMarca._id, currentModelo.idModelo, { modelo: editModeloData.modelo! });
    if (result.success) {
      toast({ title: "Éxito", description: `Modelo "${editModeloData.modelo}" actualizado.` });
      // Actualizar currentMarca localmente o recargar
      setCurrentMarca(prev => prev ? {
          ...prev, 
          modelos: prev.modelos?.map(m => m.idModelo === currentModelo.idModelo ? {...m, modelo: editModeloData.modelo!} : m)
      } : null);
      fetchMarcas(); // Actualiza el contador en la tabla principal si es necesario
      setIsEditModeloDialogOpen(false);
      setCurrentModelo(null);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar el modelo.", variant: "destructive" });
    }
  };

  /** Maneja la eliminación de un modelo. */
  const handleDeleteModelo = async (idModelo: string) => {
    if (!currentMarca || !currentMarca._id) return;
    const result = await removeModeloFromMarcaAction(currentMarca._id, idModelo);
    if (result.success) {
      toast({ title: "Éxito", description: "Modelo eliminado." });
      // Actualizar currentMarca localmente o recargar
      setCurrentMarca(prev => prev ? {...prev, modelos: prev.modelos?.filter(m => m.idModelo !== idModelo)} : null);
      fetchMarcas(); // Actualiza el contador en la tabla principal
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar el modelo.", variant: "destructive" });
    }
  };

  // --- Funciones de Gestión de Aseguradoras (Administración) ---
  /** Maneja la creación de una nueva aseguradora. */
  const handleCreateAseguradora = async () => {
    if (!newAseguradoraData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre de la aseguradora es obligatorio.", variant: "destructive" });
      return;
    }
    const result = await createAseguradoraAction({ nombre: newAseguradoraData.nombre!, telefono: newAseguradoraData.telefono });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Aseguradora creada." });
      setIsCreateAseguradoraDialogOpen(false);
      fetchAseguradoras();
      setNewAseguradoraData({ nombre: '', telefono: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear la aseguradora.", variant: "destructive" });
    }
  };

  /** Abre el diálogo para editar una aseguradora. */
  const openEditAseguradoraDialog = (aseguradora: Aseguradora) => {
    setCurrentAseguradora(aseguradora);
    setEditAseguradoraData({ nombre: aseguradora.nombre, telefono: aseguradora.telefono });
    setIsEditAseguradoraDialogOpen(true);
  };

  /** Maneja la actualización de una aseguradora existente. */
  const handleUpdateAseguradora = async () => {
    if (!currentAseguradora || !currentAseguradora._id || !editAseguradoraData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "Datos inválidos para actualizar la aseguradora.", variant: "destructive" });
      return;
    }
    const result = await updateAseguradoraAction(currentAseguradora._id, { nombre: editAseguradoraData.nombre!, telefono: editAseguradoraData.telefono });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Aseguradora actualizada." });
      setIsEditAseguradoraDialogOpen(false);
      fetchAseguradoras();
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

  /** Confirma y ejecuta la eliminación de una aseguradora. */
  const handleDeleteAseguradora = async () => {
    if (!aseguradoraToDeleteId) return;
    const result = await deleteAseguradoraAction(aseguradoraToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Aseguradora eliminada." });
      fetchAseguradoras();
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar la aseguradora.", variant: "destructive" });
    }
    setIsDeleteAseguradoraDialogOpen(false);
    setAseguradoraToDeleteId(null);
  };

  // --- Funciones de Gestión de Ajustadores (Administración) ---
  /** Abre el diálogo para gestionar ajustadores de una aseguradora. */
  const openManageAjustadoresDialog = async (aseguradora: Aseguradora) => {
     const result = await getAseguradoraForAjustadoresAction(aseguradora._id);
     if (result.success && result.data) {
        setCurrentAseguradora(result.data);
        setIsManageAjustadoresDialogOpen(true);
     } else {
        toast({ title: "Error", description: "No se pudo cargar la aseguradora para gestionar ajustadores.", variant: "destructive" });
     }
  };

  /** Maneja la creación de un nuevo ajustador para la aseguradora actual. */
  const handleCreateAjustador = async () => {
    if (!currentAseguradora || !currentAseguradora._id || !newAjustadorData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "Aseguradora no seleccionada o nombre de ajustador inválido.", variant: "destructive" });
      return;
    }
    const result = await addAjustadorToAseguradoraAction(currentAseguradora._id, newAjustadorData);
    if (result.success && result.data) {
      toast({ title: "Éxito", description: `Ajustador "${result.data.nombre}" añadido.` });
      setCurrentAseguradora(prev => prev ? {...prev, ajustadores: [...(prev.ajustadores || []), result.data!]} : null);
      fetchAseguradoras(); // Actualiza contador en tabla principal
      setNewAjustadorData({ nombre: '', telefono: '', correo: '' });
      setIsCreateAjustadorDialogOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo añadir el ajustador.", variant: "destructive" });
    }
  };

  /** Abre el diálogo para editar un ajustador. */
  const openEditAjustadorDialog = (ajustador: Ajustador) => {
    setCurrentAjustador(ajustador);
    setEditAjustadorData({ ...ajustador });
    setIsEditAjustadorDialogOpen(true);
  };

  /** Maneja la actualización de un ajustador existente. */
  const handleUpdateAjustador = async () => {
    if (!currentAseguradora || !currentAseguradora._id || !currentAjustador || !currentAjustador.idAjustador || !editAjustadorData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "Datos inválidos para actualizar ajustador.", variant: "destructive" });
      return;
    }
    const result = await updateAjustadorInAseguradoraAction(currentAseguradora._id, currentAjustador.idAjustador, editAjustadorData);
    if (result.success) {
      toast({ title: "Éxito", description: "Ajustador actualizado." });
      setCurrentAseguradora(prev => prev ? {
          ...prev, 
          ajustadores: prev.ajustadores?.map(a => a.idAjustador === currentAjustador.idAjustador ? {...a, ...editAjustadorData} : a)
      } : null);
      fetchAseguradoras(); // Actualiza contador si es necesario
      setIsEditAjustadorDialogOpen(false);
      setCurrentAjustador(null);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar el ajustador.", variant: "destructive" });
    }
  };

  /** Maneja la eliminación de un ajustador. */
  const handleDeleteAjustador = async (idAjustador: string) => {
    if (!currentAseguradora || !currentAseguradora._id) return;
    const result = await removeAjustadorFromAseguradoraAction(currentAseguradora._id, idAjustador);
    if (result.success) {
      toast({ title: "Éxito", description: "Ajustador eliminado." });
      setCurrentAseguradora(prev => prev ? {...prev, ajustadores: prev.ajustadores?.filter(a => a.idAjustador !== idAjustador)} : null);
      fetchAseguradoras(); // Actualiza contador
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar el ajustador.", variant: "destructive" });
    }
  };

  // --- Funciones de Gestión de Empleados (Administración) ---
  /**
   * Maneja la creación de un nuevo empleado.
   * Valida los datos y, si se especifica, crea credenciales de sistema.
   */
  const handleCreateEmpleado = async () => {
    // Validaciones básicas
    if (!newEmpleadoData.nombre?.trim() || !newEmpleadoData.puesto?.trim()) {
      toast({ title: "Error de Validación", description: "Nombre y Puesto son obligatorios.", variant: "destructive" });
      return;
    }

    let systemUserDetails: Omit<SystemUserCredentials, '_id' | 'permisos'> | undefined = undefined;
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
    
    const empleadoDataToCreate: Omit<Empleado, '_id' | 'fechaRegistro' | 'user'> = {
        nombre: newEmpleadoData.nombre,
        puesto: newEmpleadoData.puesto,
        telefono: newEmpleadoData.telefono,
        correo: newEmpleadoData.correo,
        sueldo: newEmpleadoData.sueldo ? Number(newEmpleadoData.sueldo) : undefined,
        comision: newEmpleadoData.comision ? Number(newEmpleadoData.comision) : undefined,
    };

    const result = await createEmpleadoAction(empleadoDataToCreate, systemUserDetails);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Empleado creado." });
      setIsCreateEmpleadoDialogOpen(false);
      fetchEmpleados();
      setNewEmpleadoData(initialNewEmpleadoData); // Reset form
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el empleado.", variant: "destructive" });
    }
  };
  
  /**
   * Abre el diálogo para editar un empleado y carga sus datos.
   * @param {string} empleadoIdToEdit - _id (string ObjectId) del empleado a editar.
   */
  const openEditEmpleadoDialog = async (empleadoIdToEdit: string) => {
    const result = await getEmpleadoForEditAction(empleadoIdToEdit);
    if (result.success && result.data) {
      setCurrentEmpleadoToEdit(result.data);
      setEditEmpleadoData({
        nombre: result.data.nombre,
        puesto: result.data.puesto,
        telefono: result.data.telefono,
        correo: result.data.correo,
        sueldo: result.data.sueldo?.toString(),
        comision: result.data.comision?.toString(),
        // Para la UI de credenciales de sistema
        systemUserUsuario: result.data.user?.usuario,
        systemUserRol: result.data.user?.rol,
        // No pre-llenamos contraseñas
      });
      setIsEditEmpleadoDialogOpen(true);
    } else {
      toast({ title: "Error", description: "No se pudo cargar el empleado para editar.", variant: "destructive" });
    }
  };

  /**
   * Maneja la actualización de un empleado existente.
   * Permite actualizar datos básicos y, si el empleado tiene credenciales, su rol o contraseña.
   */
  const handleUpdateEmpleado = async () => {
    if (!currentEmpleadoToEdit || !currentEmpleadoToEdit._id) {
      toast({ title: "Error", description: "No hay empleado seleccionado para actualizar.", variant: "destructive" });
      return;
    }
    if (!editEmpleadoData.nombre?.trim() || !editEmpleadoData.puesto?.trim()) {
      toast({ title: "Error de Validación", description: "Nombre y Puesto son obligatorios.", variant: "destructive" });
      return;
    }

    const empleadoUpdates: Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>> = {
      nombre: editEmpleadoData.nombre,
      puesto: editEmpleadoData.puesto,
      telefono: editEmpleadoData.telefono,
      correo: editEmpleadoData.correo,
      sueldo: editEmpleadoData.sueldo ? Number(editEmpleadoData.sueldo) : undefined,
      comision: editEmpleadoData.comision ? Number(editEmpleadoData.comision) : undefined,
    };

    let systemUserUpdates: Partial<Omit<SystemUserCredentials, 'permisos' | '_id'>> & { contraseña?: string } | undefined = undefined;
    
    // Si el empleado ya tiene un usuario de sistema, podemos actualizarlo
    if (currentEmpleadoToEdit.user) {
        systemUserUpdates = {};
        if (editEmpleadoData.systemUserUsuario && editEmpleadoData.systemUserUsuario !== currentEmpleadoToEdit.user.usuario) {
            systemUserUpdates.usuario = editEmpleadoData.systemUserUsuario;
        }
        if (editEmpleadoData.systemUserRol && editEmpleadoData.systemUserRol !== currentEmpleadoToEdit.user.rol) {
            systemUserUpdates.rol = editEmpleadoData.systemUserRol;
        }
        if (editEmpleadoData.newSystemUserContraseña) {
            if (editEmpleadoData.newSystemUserContraseña !== editEmpleadoData.newSystemUserConfirmContraseña) {
                toast({ title: "Error de Contraseña", description: "Las nuevas contraseñas no coinciden.", variant: "destructive" });
                return;
            }
            systemUserUpdates.contraseña = editEmpleadoData.newSystemUserContraseña;
        }
    } else if (editEmpleadoData.createSystemUser) { // Si se decide crear un usuario para un empleado que no lo tiene
        if (!editEmpleadoData.systemUserUsuario?.trim() || !editEmpleadoData.newSystemUserContraseña?.trim() || !editEmpleadoData.systemUserRol) {
            toast({ title: "Error de Validación de Usuario", description: "Usuario, Contraseña y Rol son obligatorios para crear acceso al sistema.", variant: "destructive" });
            return;
        }
        if (editEmpleadoData.newSystemUserContraseña !== editEmpleadoData.newSystemUserConfirmContraseña) {
            toast({ title: "Error de Contraseña", description: "Las contraseñas no coinciden.", variant: "destructive" });
            return;
        }
        systemUserUpdates = {
            usuario: editEmpleadoData.systemUserUsuario,
            contraseña: editEmpleadoData.newSystemUserContraseña,
            rol: editEmpleadoData.systemUserRol,
        };
    }


    const result = await updateEmpleadoAction(currentEmpleadoToEdit._id, empleadoUpdates, systemUserUpdates);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Empleado actualizado." });
      setIsEditEmpleadoDialogOpen(false);
      fetchEmpleados();
      setCurrentEmpleadoToEdit(null);
      setEditEmpleadoData({}); // Resetear formulario
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar el empleado.", variant: "destructive" });
    }
  };
  
  /**
   * Abre el diálogo de confirmación para eliminar un empleado.
   * @param {string} empleadoIdToDelete - _id (string ObjectId) del empleado a eliminar.
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
      toast({ title: "Éxito", description: result.message || "Empleado eliminado." });
      fetchEmpleados();
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar el empleado.", variant: "destructive" });
    }
    setIsDeleteEmpleadoDialogOpen(false);
    setEmpleadoToDeleteId(null);
  };

  /**
   * Maneja la eliminación del acceso al sistema de un empleado.
   * @param {string} empleadoIdToRemoveAccess - _id (string ObjectId) del empleado.
   */
  const handleRemoveSystemUser = async (empleadoIdToRemoveAccess: string) => {
      const result = await removeSystemUserFromEmpleadoAction(empleadoIdToRemoveAccess);
      if (result.success) {
          toast({ title: "Éxito", description: result.message || "Acceso al sistema removido."});
          fetchEmpleados(); // Recargar para reflejar el cambio
          // Si el empleado que se está editando es este, cerrar el diálogo o actualizar su estado.
          if (currentEmpleadoToEdit && currentEmpleadoToEdit._id === empleadoIdToRemoveAccess) {
              setCurrentEmpleadoToEdit(prev => prev ? {...prev, user: undefined} : null);
              setEditEmpleadoData(prev => ({...prev, systemUserUsuario: undefined, systemUserRol: undefined, newSystemUserContraseña: '', newSystemUserConfirmContraseña: ''}));
          }
      } else {
          toast({ title: "Error", description: result.error || "No se pudo remover el acceso.", variant: "destructive" });
      }
  };


  // --- Funciones de Gestión de Clientes (para diálogo de creación rápida) ---
  /** Abre el diálogo para crear un nuevo cliente desde el formulario de orden. */
  const openCreateClientDialog = () => {
    setNewClientData({ nombre: '', telefono: '', correo: '' }); // Resetear formulario
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
    const result = await createClientForOrderAction({
        nombre: newClientData.nombre!,
        telefono: newClientData.telefono,
        correo: newClientData.correo,
    });

    if (result.success && result.data?.clienteId && result.data.nuevoCliente) {
      toast({ title: "Éxito", description: `Cliente "${result.data.nuevoCliente.nombre}" creado.` });
      fetchClients(); // Recargar la lista de clientes
      setIsCreateClientDialogOpen(false);
      
      // Preseleccionar el nuevo cliente en el formulario de orden activo (nueva o edición)
      if (isCreateOrderDialogOpen) {
        setNewOrderData(prev => ({ ...prev, idCliente: result.data!.clienteId! }));
      } else if (isEditOrderDialogOpen) {
        setEditOrderData(prev => ({ ...prev, idCliente: result.data!.clienteId! }));
      }
      setNewClientData({ nombre: '', telefono: '', correo: ''}); // Limpiar formulario de cliente
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el cliente.", variant: "destructive" });
    }
  };

  // --- FUNCIONES DE GESTIÓN DE PUESTOS (ADMINISTRACIÓN GENERAL) ---
  /**
   * Maneja la creación de un nuevo Puesto.
   * Valida que el nombre no esté vacío.
   */
  const handleCreatePuesto = async () => {
    if (!newPuestoData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "El nombre del puesto es obligatorio.", variant: "destructive" });
      return;
    }
    const result = await createPuestoAction({ nombre: newPuestoData.nombre! });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || `Puesto "${newPuestoData.nombre}" creado.` });
      setIsCreatePuestoDialogOpen(false);
      fetchPuestos(); // Recargar lista de puestos
      setNewPuestoData({ nombre: '' }); // Limpiar formulario
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el puesto.", variant: "destructive" });
    }
  };

  /**
   * Abre el diálogo para editar un Puesto.
   * Pre-llena el formulario con los datos del puesto seleccionado.
   * @param {Puesto} puesto - El objeto Puesto a editar.
   */
  const openEditPuestoDialog = (puesto: Puesto) => {
    setCurrentPuestoToEdit(puesto);
    setEditPuestoData({ nombre: puesto.nombre });
    setIsEditPuestoDialogOpen(true);
  };

  /**
   * Maneja la actualización de un Puesto existente.
   * Valida los datos y llama a la acción del servidor.
   */
  const handleUpdatePuesto = async () => {
    if (!currentPuestoToEdit || !currentPuestoToEdit._id || !editPuestoData.nombre?.trim()) {
      toast({ title: "Error de Validación", description: "Datos inválidos para actualizar el puesto.", variant: "destructive" });
      return;
    }
    const result = await updatePuestoAction(currentPuestoToEdit._id, { nombre: editPuestoData.nombre! });
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Puesto actualizado." });
      setIsEditPuestoDialogOpen(false);
      fetchPuestos(); // Recargar lista
      setCurrentPuestoToEdit(null);
      setEditPuestoData({ nombre: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar el puesto.", variant: "destructive" });
    }
  };

  /**
   * Abre el diálogo de confirmación para eliminar un Puesto.
   * @param {string} puestoId - El _id (string ObjectId) del puesto a eliminar.
   */
  const openDeletePuestoDialog = (puestoId: string) => {
    setPuestoToDeleteId(puestoId);
    setIsDeletePuestoDialogOpen(true);
  };

  /**
   * Confirma y ejecuta la eliminación de un Puesto.
   */
  const handleDeletePuesto = async () => {
    if (!puestoToDeleteId) return;
    const result = await deletePuestoAction(puestoToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Puesto eliminado." });
      fetchPuestos(); // Recargar lista
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar el puesto.", variant: "destructive" });
    }
    setIsDeletePuestoDialogOpen(false);
    setPuestoToDeleteId(null);
  };


  // --- Funciones Auxiliares de Formateo ---
  /**
   * Formatea una fecha a string 'dd/MM/yyyy' o 'yyyy-MM-dd'.
   * Maneja strings de fecha, números (timestamps) y objetos Date.
   * Si la fecha es inválida o no se proporciona, devuelve un string vacío o un placeholder.
   * @param {Date | string | number | undefined} dateInput - La fecha a formatear.
   * @param {'dd/MM/yyyy' | 'YYYY-MM-DD'} format - El formato de salida.
   * @returns {string} La fecha formateada o string vacío/placeholder.
   */
  const formatDate = (dateInput?: Date | string | number, format: 'dd/MM/yyyy' | 'YYYY-MM-DD' = 'dd/MM/yyyy'): string => {
    if (!dateInput) return '';
    let date: Date;
    if (typeof dateInput === 'string') {
      // Si es YYYY-MM-DD (común de input date), añadir T00:00:00 para evitar problemas de timezone al parsear
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        date = new Date(dateInput + 'T00:00:00');
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return 'Fecha inválida';

    if (format === 'YYYY-MM-DD') {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else { // dd/MM/yyyy
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };
  
  /** Formatea una fecha y hora a 'dd/MM/yyyy HH:mm'. */
  const formatDateTime = (dateInput?: Date | string | number): string => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  /** Devuelve la variante de Badge según el proceso de la orden. */
  const getProcesoVariant = (proceso?: Order['proceso']): "default" | "secondary" | "outline" | "destructive" => {
    if (!proceso) return "outline";
    if (['cancelado', 'baja'].includes(proceso)) return "destructive";
    if (['entregado', 'facturado'].includes(proceso)) return "default"; // Consider default as "positive/done"
    if (['pendiente', 'espera_refacciones'].includes(proceso)) return "secondary";
    return "outline"; // Para procesos en curso
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
   * Utilizado para construir diálogos de forma consistente.
   * @param {string} label - Texto de la etiqueta del campo.
   * @param {any} name - Nombre del campo (usado como key en el estado del formulario).
   * @param {string} [type="text"] - Tipo de input HTML (text, number, date, password, select, checkbox).
   * @param {string} [placeholder] - Placeholder para el campo.
   * @param {'newOrder' | ... | 'editPuesto'} formType - Identificador del tipo de formulario para obtener el estado correcto.
   * @param {{ value: string | number; label: string }[]} [options] - Opciones para campos tipo 'select'.
   * @param {boolean} [isTextarea=false] - Si es true, renderiza un Textarea en lugar de Input.
   * @param {boolean} [isDisabled=false] - Si es true, deshabilita el campo.
   * @param {boolean} [isRequired=false] - Si es true, añade un asterisco a la etiqueta.
   * @param {string} [classNameGrid] - Clases CSS adicionales para el div contenedor del campo.
   * @returns {JSX.Element} El campo de formulario renderizado.
   */
  const renderDialogField = (
      label: string, name: any, type: string = "text", placeholder?: string,
      formType: 'newOrder' | 'editOrder' | 'newMarca' | 'editMarca' | 'newModelo' | 'editModelo' | 'newAseguradora' | 'editAseguradora' | 'newAjustador' | 'editAjustador' | 'newEmpleado' | 'editEmpleado' | 'newClient' | 'newPuesto' | 'editPuesto' = 'newOrder',
      options?: { value: string | number; label: string }[],
      isTextarea?: boolean, isDisabled?: boolean, isRequired?: boolean,
      classNameGrid?: string
    ) => {

    let value: any;
    let handleChange: any;
    let handleSelect: any;
    let handleCheckbox: any;

    // Determinar el estado y los manejadores según el tipo de formulario
    switch (formType) {
      case 'newOrder': value = newOrderData[name as keyof OrderFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => handleOrderInputChange(e, 'new'); handleSelect = (val: string | undefined) => handleOrderSelectChange(name as keyof OrderFormDataType, val, 'new'); handleCheckbox = (checked: boolean) => handleOrderCheckboxChange(name as keyof OrderFormDataType, checked, 'new'); break;
      case 'editOrder': value = editOrderData[name as keyof OrderFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => handleOrderInputChange(e, 'edit'); handleSelect = (val: string | undefined) => handleOrderSelectChange(name as keyof OrderFormDataType, val, 'edit'); handleCheckbox = (checked: boolean) => handleOrderCheckboxChange(name as keyof OrderFormDataType, checked, 'edit'); break;
      case 'newMarca': value = newMarcaData[name as keyof MarcaFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewMarcaData); break;
      case 'editMarca': value = editMarcaData[name as keyof MarcaFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditMarcaData); break;
      case 'newModelo': value = newModeloData[name as keyof Omit<ModeloVehiculo, 'idModelo'>]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewModeloData); break;
      case 'editModelo': value = editModeloData[name as keyof ModeloFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditModeloData); break;
      case 'newAseguradora': value = newAseguradoraData[name as keyof AseguradoraFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewAseguradoraData); break;
      case 'editAseguradora': value = editAseguradoraData[name as keyof AseguradoraFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditAseguradoraData); break;
      case 'newAjustador': value = newAjustadorData[name as keyof Omit<Ajustador, 'idAjustador'>]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewAjustadorData); break;
      case 'editAjustador': value = editAjustadorData[name as keyof AjustadorFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditAjustadorData); break;
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
        // handleCheckbox para 'createSystemUser' si se habilita en edit
        handleCheckbox = (checked: boolean) => handleCheckboxChangeGeneric(name, checked, setEditEmpleadoData);
        if (name === 'puesto') options = puestosList.map(p => ({ value: p.nombre, label: p.nombre }));
        if (name === 'systemUserRol') options = userRoleOptions;
        break;
      case 'newClient': value = newClientData[name as keyof ClienteFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewClientData); break;
      case 'newPuesto': value = newPuestoData[name as keyof PuestoFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewPuestoData); break;
      case 'editPuesto': value = editPuestoData[name as keyof PuestoFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditPuestoData); break;
      default: value = ''; handleChange = () => {}; handleSelect = () => {}; handleCheckbox = () => {};
    }

    const fieldId = `${formType}_${name}`;

    // Caso especial para el campo 'idCliente' en formularios de órdenes
    if ((formType === 'newOrder' || formType === 'editOrder') && name === 'idCliente') {
      return (
        <div className={`space-y-1 ${classNameGrid || ''}`}>
          <Label htmlFor={fieldId} className="text-sm font-medium">
            {label}{isRequired && <span className="text-destructive">*</span>}
          </Label>
          <div className="flex items-center space-x-2">
            <Select name={name} onValueChange={handleSelect} value={value || ''} disabled={isDisabled}>
              <SelectTrigger id={fieldId} className="w-full mt-1">
                <SelectValue placeholder={placeholder || "Seleccionar cliente..."} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingClients ? <SelectItem value="loading" disabled>Cargando clientes...</SelectItem> :
                 clients && clients.length > 0 ? clients.map(cli => <SelectItem key={cli._id} value={cli._id}>{cli.nombre}</SelectItem>) :
                 <SelectItem value="no_options" disabled>No hay clientes</SelectItem>}
              </SelectContent>
            </Select>
            <Button type="button" size="sm" variant="outline" onClick={openCreateClientDialog} className="shrink-0 mt-1">
              <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Cliente
            </Button>
          </div>
        </div>
      );
    }
    
    // Caso especial para el campo 'puesto' en formularios de empleado
    if ((formType === 'newEmpleado' || formType === 'editEmpleado') && name === 'puesto') {
      return (
        <div className={`space-y-1 ${classNameGrid || ''}`}>
          <Label htmlFor={fieldId} className="text-sm font-medium">{label}{isRequired && <span className="text-destructive">*</span>}</Label>
          <Select name={name} onValueChange={handleSelect} value={value || ''} disabled={isDisabled}>
            <SelectTrigger id={fieldId} className="w-full mt-1"><SelectValue placeholder={placeholder || "Seleccionar puesto..."} /></SelectTrigger>
            <SelectContent>
              {isLoadingPuestos ? <SelectItem value="loading" disabled>Cargando puestos...</SelectItem> :
               (options && options.length > 0 ? options.map(opt => <SelectItem key={String(opt.value)} value={String(opt.value)}>{opt.label}</SelectItem>) :
               <SelectItem value="no_options" disabled>No hay puestos configurados</SelectItem>)
              }
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Renderizado general para otros tipos de campos
    return (
      <div className={`space-y-1 ${classNameGrid || ''}`}>
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {label}{isRequired && <span className="text-destructive">*</span>}
        </Label>
        {isTextarea ? (
          <Textarea
            id={fieldId}
            name={name}
            placeholder={placeholder}
            value={value || ''}
            onChange={handleChange}
            disabled={isDisabled}
            className="mt-1 w-full"
          />
        ) : type === 'select' ? (
          <Select name={name} onValueChange={handleSelect} value={value || ''} disabled={isDisabled}>
            <SelectTrigger id={fieldId} className="w-full mt-1">
              <SelectValue placeholder={placeholder || `Seleccionar ${label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {options && options.length > 0 ? options.map(opt => (
                <SelectItem key={String(opt.value)} value={String(opt.value)}>{opt.label}</SelectItem>
              )) : <SelectItem value="no_options_available" disabled>No hay opciones</SelectItem>}
            </SelectContent>
          </Select>
        ) : type === 'checkbox' ? (
          <div className="flex items-center space-x-2 mt-1 pt-1"> {/* Añadido pt-1 para alinear con label */}
             <Checkbox
                id={fieldId}
                name={name}
                checked={!!value} // Asegura que el valor sea booleano
                onCheckedChange={(checkedState) => handleCheckbox(checkedState as boolean) }
                disabled={isDisabled}
             />
             {/* Los checkboxes no suelen tener placeholder, la etiqueta principal es suficiente. 
                 Si se necesita texto adicional, se puede añadir fuera del componente Checkbox. */}
          </div>
        ) : (
          <Input
            id={fieldId}
            name={name}
            type={type}
            placeholder={placeholder}
            value={value || (type === 'number' && value !== '' ? value : type === 'number' ? '' : '')} // Manejo para number inputs para permitir vaciar
            onChange={handleChange}
            disabled={isDisabled}
            className="mt-1 w-full"
            min={type === 'number' ? '0' : undefined}
          />
        )}
      </div>
    );
  };

  /**
   * Si los datos de sesión o el rol no están cargados, muestra un mensaje de carga.
   * Esto previene renderizar el dashboard antes de que la sesión sea validada.
   */
  if (!userName || !userRole || !userIdEmpleado) {
    console.log("DashboardPage: userName o userRole o userIdEmpleado faltan. Mostrando 'Cargando...'");
    return <div className="flex h-screen items-center justify-center">Cargando dashboard...</div>;
  }

  const mainTabsListClassName = userRole === UserRole.ADMIN ?
    "grid w-full grid-cols-2 sm:grid-cols-4 mb-6 rounded-lg p-1 bg-muted" :
    "grid w-full grid-cols-1 sm:grid-cols-3 mb-6 rounded-lg p-1 bg-muted";


  return (
    <div className="flex min-h-screen flex-col bg-muted/30 dark:bg-muted/10">
      {/* Header del Dashboard */}
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

      {/* Contenido Principal del Dashboard */}
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <Tabs defaultValue="ordenes" className="w-full">
          <TabsList className={mainTabsListClassName}>
            <TabsTrigger value="citas" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><CalendarDays className="mr-2 h-4 w-4" />Citas</TabsTrigger>
            <TabsTrigger value="ordenes" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Wrench className="mr-2 h-4 w-4" />Órdenes</TabsTrigger>
            <TabsTrigger value="almacen" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Package className="mr-2 h-4 w-4" />Almacén</TabsTrigger>
            {userRole === UserRole.ADMIN && (
              <TabsTrigger value="admin" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Settings className="mr-2 h-4 w-4" />Admin</TabsTrigger>
            )}
          </TabsList>

          {/* Pestaña Citas */}
          <TabsContent value="citas">
            <Card className="shadow-lg border-border/50">
              <CardHeader><CardTitle className="text-xl">Gestión de Citas</CardTitle><CardDescription>Programa y visualiza las citas del taller.</CardDescription></CardHeader>
              <CardContent>
                <p>Contenido de la gestión de citas (ej. Calendario, lista de próximas citas).</p>
                <Button className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Nueva Cita</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña Órdenes de Servicio */}
          <TabsContent value="ordenes">
            <Card className="shadow-lg border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                    <CardTitle className="text-xl">Órdenes de Servicio</CardTitle>
                    <CardDescription>Administra todas las órdenes de trabajo del taller.</CardDescription>
                </div>
                <Button size="sm" onClick={() => { setNewOrderData(initialNewOrderData); setIsCreateOrderDialogOpen(true); }}>
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

          {/* Pestaña Almacén */}
          <TabsContent value="almacen">
            <Card className="shadow-lg border-border/50">
              <CardHeader><CardTitle className="text-xl">Gestión de Almacén</CardTitle><CardDescription>Control de inventario de refacciones y consumibles.</CardDescription></CardHeader>
              <CardContent>
                <p>Contenido de la gestión de almacén (ej. Tabla de refacciones, niveles de stock).</p>
                <Button className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Nueva Refacción</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña Administración (Solo para rol ADMIN) */}
          {userRole === UserRole.ADMIN && (
            <TabsContent value="admin">
              <Tabs defaultValue="empleados" className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-4 rounded-md p-1 bg-muted/70">
                  <TabsTrigger value="general" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Settings className="mr-2 h-4 w-4" />Config. General</TabsTrigger>
                  <TabsTrigger value="marcas" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Car className="mr-2 h-4 w-4" />Marcas/Modelos</TabsTrigger>
                  <TabsTrigger value="aseguradoras" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Shield className="mr-2 h-4 w-4"/>Aseguradoras</TabsTrigger>
                  <TabsTrigger value="empleados" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Users className="mr-2 h-4 w-4"/>Empleados</TabsTrigger>
                </TabsList>

                {/* Admin -> Configuración General */}
                <TabsContent value="general">
                  <Card className="shadow-lg border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <div><CardTitle className="text-xl">Gestión de Puestos</CardTitle><CardDescription>Define los puestos de trabajo disponibles en el taller.</CardDescription></div>
                      <Button size="sm" onClick={() => { setNewPuestoData({nombre: ''}); setIsCreatePuestoDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Puesto</Button>
                    </CardHeader>
                    <CardContent>
                      {isLoadingPuestos ? <p>Cargando puestos...</p> : puestosList.length === 0 ? (
                        <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay puestos registrados.</p></div>
                      ) : (
                        <Table>
                          <TableHeader><TableRow><TableHead>ID Puesto</TableHead><TableHead>Nombre Puesto</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {puestosList.map((puesto) => (
                            <TableRow key={puesto._id}>
                              <TableCell className="font-mono text-xs">{puesto._id}</TableCell>
                              <TableCell className="font-medium">{puesto.nombre}</TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button variant="ghost" size="icon" onClick={() => openEditPuestoDialog(puesto)} title="Editar Puesto"><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => openDeletePuestoDialog(puesto._id)} title="Eliminar Puesto"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </TableCell>
                            </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                  {/* Aquí podrían ir otras configuraciones generales en el futuro */}
                </TabsContent>
                
                {/* Admin -> Marcas/Modelos */}
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
                            <TableHeader><TableRow><TableHead>ID Marca</TableHead><TableHead>Nombre Marca</TableHead><TableHead>Modelos</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                            {marcas.map((marca) => (
                                <TableRow key={marca._id}>
                                    <TableCell className="font-mono text-xs">{marca._id}</TableCell>
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

                {/* Admin -> Aseguradoras */}
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
                                <TableHeader><TableRow><TableHead>ID Aseg.</TableHead><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>Ajustadores</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                                <TableBody>
                                {aseguradoras.map((aseg) => (
                                    <TableRow key={aseg._id}>
                                        <TableCell className="font-mono text-xs">{aseg._id}</TableCell>
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

                {/* Admin -> Empleados */}
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
      <Dialog open={isCreateOrderDialogOpen} onOpenChange={(open) => { setIsCreateOrderDialogOpen(open); if (!open) { setNewOrderData(initialNewOrderData); setAvailableAjustadoresForOrder([]); setAvailableModelosForOrder([]);}}}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear Nueva Orden de Servicio</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {renderDialogField("Cliente*", "idCliente", "select", "Seleccionar cliente...", "newOrder", clients.map(c => ({value: c._id, label: c.nombre})), false, false, true, "col-span-1 md:col-span-2 lg:col-span-1")}
            {renderDialogField("Aseguradora", "idAseguradora", "select", "Seleccionar aseguradora...", "newOrder", aseguradoras.map(a => ({value: a._id, label: a.nombre})), false, false, false, "col-span-1")}
            {renderDialogField("Ajustador", "idAjustador", "select", "Seleccionar ajustador...", "newOrder", availableAjustadoresForOrder.map(a => ({value: a.idAjustador, label: a.nombre})), false, !newOrderData.idAseguradora || availableAjustadoresForOrder.length === 0, false, "col-span-1")}
            {renderDialogField("No. Siniestro", "siniestro", "text", "Número de siniestro", "newOrder", undefined, false, false, false, "col-span-1")}
            {renderDialogField("No. Póliza", "poliza", "text", "Número de póliza", "newOrder", undefined, false, false, false, "col-span-1")}
            {renderDialogField("Folio Aseguradora", "folio", "text", "Folio de la aseguradora", "newOrder", undefined, false, false, false, "col-span-1")}
            {renderDialogField("Deducible ($)", "deducible", "number", "Monto del deducible", "newOrder", undefined, false, false, false, "col-span-1")}
            {renderDialogField("Asegurado/Tercero*", "aseguradoTerceroString", "select", "Indicar tipo", "newOrder", aseguradoTerceroOptions, false, false, true, "col-span-1")}
            {renderDialogField("Marca*", "idMarca", "select", "Seleccionar marca...", "newOrder", marcas.map(m => ({value: m._id, label: m.marca})), false, false, true, "col-span-1")}
            {renderDialogField("Modelo*", "idModelo", "select", "Seleccionar modelo...", "newOrder", availableModelosForOrder.map(m => ({value: m.idModelo, label: m.modelo})), false, !newOrderData.idMarca || availableModelosForOrder.length === 0, true, "col-span-1")}
            {renderDialogField("Año", "año", "number", "Ej: 2020", "newOrder", undefined, false, false, false, "col-span-1")}
            {renderDialogField("Placas", "placas", "text", "Placas del vehículo", "newOrder", undefined, false, false, false, "col-span-1")}
            {renderDialogField("Color", "color", "text", "Color del vehículo", "newOrder", undefined, false, false, false, "col-span-1")}
            {renderDialogField("VIN", "vin", "text", "Número de serie", "newOrder", undefined, false, false, false, "col-span-1")}
            {renderDialogField("Kilometraje", "kilometraje", "text", "KM del vehículo", "newOrder", undefined, false, false, false, "col-span-1")}
            {renderDialogField("¿Piso?", "piso", "checkbox", "", "newOrder", undefined, false, false, false, "col-span-1 flex items-center")}
            {renderDialogField("¿Grúa?", "grua", "checkbox", "", "newOrder", undefined, false, false, false, "col-span-1 flex items-center")}
            {renderDialogField("Proceso Inicial*", "proceso", "select", "Seleccionar proceso...", "newOrder", procesoOptions, false, false, true, "col-span-1")}
            {renderDialogField("Asesor*", "idAsesor", "select", "Seleccionar asesor...", "newOrder", asesores.map(a => ({value: a._id, label: a.nombre})), false, userRole === UserRole.ASESOR, true, "col-span-1")}
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

      <Dialog open={isEditOrderDialogOpen} onOpenChange={(open) => { setIsEditOrderDialogOpen(open); if(!open) { setCurrentOrder(null); setAvailableAjustadoresForOrder([]); setAvailableModelosForOrder([]); } }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Orden de Servicio OT-{currentOrder?.idOrder}</DialogTitle></DialogHeader>
          {currentOrder && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              {renderDialogField("Cliente*", "idCliente", "select", "Seleccionar cliente...", "editOrder", clients.map(c => ({value: c._id, label: c.nombre})), false, false, true, "col-span-1 md:col-span-2 lg:col-span-1")}
              {renderDialogField("Aseguradora", "idAseguradora", "select", "Seleccionar aseguradora...", "editOrder", aseguradoras.map(a => ({value: a._id, label: a.nombre})), false, false, false, "col-span-1")}
              {renderDialogField("Ajustador", "idAjustador", "select", "Seleccionar ajustador...", "editOrder", availableAjustadoresForOrder.map(a => ({value: a.idAjustador, label: a.nombre})), false, !editOrderData.idAseguradora || availableAjustadoresForOrder.length === 0, false, "col-span-1")}
              {renderDialogField("No. Siniestro", "siniestro", "text", "Número de siniestro", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("No. Póliza", "poliza", "text", "Número de póliza", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("Folio Aseguradora", "folio", "text", "Folio de la aseguradora", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("Deducible ($)", "deducible", "number", "Monto del deducible", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("Asegurado/Tercero*", "aseguradoTerceroString", "select", "Indicar tipo", "editOrder", aseguradoTerceroOptions, false, false, true, "col-span-1")}
              {renderDialogField("Marca*", "idMarca", "select", "Seleccionar marca...", "editOrder", marcas.map(m => ({value: m._id, label: m.marca})), false, false, true, "col-span-1")}
              {renderDialogField("Modelo*", "idModelo", "select", "Seleccionar modelo...", "editOrder", availableModelosForOrder.map(m => ({value: m.idModelo, label: m.modelo})), false, !editOrderData.idMarca || availableModelosForOrder.length === 0, true, "col-span-1")}
              {renderDialogField("Año", "año", "number", "Ej: 2020", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("Placas", "placas", "text", "Placas del vehículo", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("Color", "color", "text", "Color del vehículo", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("VIN", "vin", "text", "Número de serie", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("Kilometraje", "kilometraje", "text", "KM del vehículo", "editOrder", undefined, false, false, false, "col-span-1")}
              {renderDialogField("¿Piso?", "piso", "checkbox", "", "editOrder", undefined, false, false, false, "col-span-1 flex items-center")}
              {renderDialogField("¿Grúa?", "grua", "checkbox", "", "editOrder", undefined, false, false, false, "col-span-1 flex items-center")}
              {renderDialogField("Proceso*", "proceso", "select", "Seleccionar proceso...", "editOrder", procesoOptions, false, false, true, "col-span-1")}
              {renderDialogField("Asesor*", "idAsesor", "select", "Seleccionar asesor...", "editOrder", asesores.map(a => ({value: a._id, label: a.nombre})), false, userRole === UserRole.ASESOR && currentOrder?.idAsesor === userIdEmpleado, true, "col-span-1")}
              {renderDialogField("Valuador", "idValuador", "select", "Seleccionar valuador...", "editOrder", valuadores.map(v => ({value: v._id, label: v.nombre})), false, false, false, "col-span-1")}
              {renderDialogField("Hojalatero", "idHojalatero", "select", "Seleccionar hojalatero...", "editOrder", hojalateros.map(h => ({value: h._id, label: h.nombre})), false, false, false, "col-span-1")}
              {renderDialogField("Pintor", "idPintor", "select", "Seleccionar pintor...", "editOrder", pintores.map(p => ({value: p._id, label: p.nombre})), false, false, false, "col-span-1")}
              {/* Campos de fecha */}
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

      <Dialog open={isViewOrderDialogOpen} onOpenChange={(open) => { setIsViewOrderDialogOpen(open); if(!open) setCurrentOrder(null); }}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalles de Orden OT-{currentOrder?.idOrder}</DialogTitle></DialogHeader>
          {currentOrder && (
            <div className="space-y-6 py-4">
              {/* Sección Cliente y Aseguradora */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Cliente</h3>
                  <p><strong>Nombre:</strong> {clients.find(c=>c._id === currentOrder.idCliente)?.nombre || 'N/A'}</p>
                  <p><strong>Teléfono:</strong> {clients.find(c=>c._id === currentOrder.idCliente)?.telefono || 'N/A'}</p>
                  <p><strong>Correo:</strong> {clients.find(c=>c._id === currentOrder.idCliente)?.correo || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Aseguradora / Siniestro</h3>
                  <p><strong>Aseguradora:</strong> {aseguradoras.find(a=>a._id === currentOrder.idAseguradora)?.nombre || 'Particular'}</p>
                  <p><strong>Ajustador:</strong> {aseguradoras.find(a=>a._id === currentOrder.idAseguradora)?.ajustadores?.find(aj => aj.idAjustador === currentOrder.idAjustador)?.nombre || 'N/A'}</p>
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
                  <p><strong>Modelo:</strong> {(marcas.find(m=>m._id === currentOrder.idMarca)?.modelos?.find(mod => mod.idModelo === currentOrder.idModelo)?.modelo) || 'N/A'}</p>
                  <p><strong>Año:</strong> {currentOrder.año || 'N/A'}</p>
                  <p><strong>Placas:</strong> {currentOrder.placas || 'N/A'}</p>
                  <p><strong>VIN:</strong> {currentOrder.vin || 'N/A'}</p>
                  <p><strong>Color:</strong> {currentOrder.color || 'N/A'}</p>
                  <p><strong>Kilometraje:</strong> {currentOrder.kilometraje || 'N/A'}</p>
                  <p><strong>En Piso:</strong> {currentOrder.piso ? 'Sí' : 'No'}</p>
                  <p><strong>Llegó en Grúa:</strong> {currentOrder.grua ? 'Sí' : 'No'}</p>
                </div>
              </div>

              {/* Sección Proceso y Personal Asignado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Estado y Proceso</h3>
                  <p><strong>Proceso Actual:</strong> <Badge variant={getProcesoVariant(currentOrder.proceso)}>{currentOrder.proceso}</Badge></p>
                  <p><strong>Asesor:</strong> {empleadosList.find(e=>e._id === currentOrder.idAsesor)?.nombre || 'N/A'}</p>
                  <p><strong>Valuador:</strong> {empleadosList.find(e=>e._id === currentOrder.idValuador)?.nombre || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Personal Técnico</h3>
                  <p><strong>Hojalatero:</strong> {empleadosList.find(e=>e._id === currentOrder.idHojalatero)?.nombre || 'N/A'}</p>
                  <p><strong>Pintor:</strong> {empleadosList.find(e=>e._id === currentOrder.idPintor)?.nombre || 'N/A'}</p>
                </div>
              </div>
              
              {/* Sección Fechas Importantes */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-primary">Fechas Clave</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <p><strong>Registro:</strong> {formatDate(currentOrder.fechaRegistro)}</p>
                    <p><strong>Valuación:</strong> {formatDate(currentOrder.fechaValuacion) || 'Pendiente'}</p>
                    <p><strong>Promesa:</strong> {formatDate(currentOrder.fechaPromesa) || 'Pendiente'}</p>
                    <p><strong>Reingreso:</strong> {formatDate(currentOrder.fechaReingreso) || 'N/A'}</p>
                    <p><strong>Entrega:</strong> {formatDate(currentOrder.fechaEntrega) || 'Pendiente'}</p>
                    <p><strong>Baja:</strong> {formatDate(currentOrder.fechaBaja) || 'N/A'}</p>
                </div>
              </div>

              {/* Sección Log de Cambios */}
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
              {/* Sección Presupuestos (Placeholder) */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-primary">Presupuestos</h3>
                {currentOrder.presupuestos && currentOrder.presupuestos.length > 0 ? (
                    <Table>
                        <TableHeader><TableRow><TableHead>Concepto</TableHead><TableHead>Cant.</TableHead><TableHead>Precio P.</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {currentOrder.presupuestos.map((item, idx) =>(
                                <TableRow key={idx}>
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
            {renderDialogField("Nombre de la Marca*", "marca", "text", "Ej: Toyota", "newMarca", undefined, false, false, true)}
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
              {renderDialogField("Nombre de la Marca*", "marca", "text", currentMarca.marca, "editMarca", undefined, false, false, true)}
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
                    <TableCell className="font-mono text-xs">{modelo.idModelo}</TableCell>
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
      <Dialog open={isCreateModeloDialogOpen} onOpenChange={setIsCreateModeloDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Añadir Nuevo Modelo a {currentMarca?.marca}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre del Modelo*", "modelo", "text", "Ej: Corolla", "newModelo", undefined, false, false, true)}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateModelo}>Añadir Modelo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditModeloDialogOpen} onOpenChange={(open) => { setIsEditModeloDialogOpen(open); if(!open) setCurrentModelo(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Modelo: {currentModelo?.modelo}</DialogTitle></DialogHeader>
          {currentModelo && (
            <div className="space-y-4 py-4">
              {renderDialogField("Nombre del Modelo*", "modelo", "text", currentModelo.modelo, "editModelo", undefined, false, false, true)}
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
            {renderDialogField("Nombre Aseguradora*", "nombre", "text", "Ej: GNP Seguros", "newAseguradora", undefined, false, false, true)}
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
              {renderDialogField("Nombre Aseguradora*", "nombre", "text", currentAseguradora.nombre, "editAseguradora", undefined, false, false, true)}
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
                    <TableCell className="font-mono text-xs">{aj.idAjustador}</TableCell><TableCell>{aj.nombre}</TableCell><TableCell>{aj.telefono || 'N/A'}</TableCell><TableCell>{aj.correo || 'N/A'}</TableCell>
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
      <Dialog open={isCreateAjustadorDialogOpen} onOpenChange={setIsCreateAjustadorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Añadir Nuevo Ajustador a {currentAseguradora?.nombre}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre Ajustador*", "nombre", "text", "Nombre completo", "newAjustador", undefined, false, false, true)}
            {renderDialogField("Teléfono", "telefono", "text", "Teléfono de contacto", "newAjustador")}
            {renderDialogField("Correo", "correo", "email", "Correo electrónico", "newAjustador")}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateAjustador}>Añadir Ajustador</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditAjustadorDialogOpen} onOpenChange={(open) => { setIsEditAjustadorDialogOpen(open); if(!open) setCurrentAjustador(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Ajustador: {currentAjustador?.nombre}</DialogTitle></DialogHeader>
          {currentAjustador && (<div className="space-y-4 py-4">
            {renderDialogField("Nombre Ajustador*", "nombre", "text", currentAjustador.nombre, "editAjustador", undefined, false, false, true)}
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
            {renderDialogField("Nombre Completo*", "nombre", "text", "Nombre del empleado", "newEmpleado", undefined, false, false, true)}
            {renderDialogField("Puesto*", "puesto", "select", "Seleccionar puesto...", "newEmpleado", puestosList.map(p=>({value: p.nombre, label:p.nombre})), false, false, true)}
            {renderDialogField("Teléfono", "telefono", "text", "Teléfono de contacto", "newEmpleado")}
            {renderDialogField("Correo", "correo", "email", "Correo electrónico", "newEmpleado")}
            {renderDialogField("Sueldo ($)", "sueldo", "number", "Sueldo mensual", "newEmpleado")}
            {renderDialogField("Comisión (%)", "comision", "number", "Porcentaje de comisión", "newEmpleado")}
            
            <div className="my-2 border-t pt-4">
              {renderDialogField("Crear acceso al sistema", "createSystemUser", "checkbox", "", "newEmpleado")}
            </div>

            {newEmpleadoData.createSystemUser && (
              <>
                {renderDialogField("Nombre de Usuario*", "systemUserUsuario", "text", "usuario_login", "newEmpleado", undefined, false, false, true)}
                {renderDialogField("Contraseña*", "systemUserContraseña", "password", "••••••••", "newEmpleado", undefined, false, false, true)}
                {renderDialogField("Confirmar Contraseña*", "systemUserConfirmContraseña", "password", "••••••••", "newEmpleado", undefined, false, false, true)}
                {renderDialogField("Rol en Sistema*", "systemUserRol", "select", "Seleccionar rol...", "newEmpleado", userRoleOptions, false, false, true)}
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
              {renderDialogField("Nombre Completo*", "nombre", "text", currentEmpleadoToEdit.nombre, "editEmpleado", undefined, false, false, true)}
              {renderDialogField("Puesto*", "puesto", "select", currentEmpleadoToEdit.puesto, "editEmpleado", puestosList.map(p=>({value: p.nombre, label:p.nombre})), false, false, true)}
              {renderDialogField("Teléfono", "telefono", "text", currentEmpleadoToEdit.telefono, "editEmpleado")}
              {renderDialogField("Correo", "correo", "email", currentEmpleadoToEdit.correo, "editEmpleado")}
              {renderDialogField("Sueldo ($)", "sueldo", "number", currentEmpleadoToEdit.sueldo?.toString(), "editEmpleado")}
              {renderDialogField("Comisión (%)", "comision", "number", currentEmpleadoToEdit.comision?.toString(), "editEmpleado")}

              <div className="my-2 border-t pt-4">
                {currentEmpleadoToEdit.user ? (
                  <>
                    <h4 className="font-medium text-sm mb-2">Acceso al Sistema Existente</h4>
                    {renderDialogField("Nombre de Usuario", "systemUserUsuario", "text", currentEmpleadoToEdit.user.usuario, "editEmpleado", undefined, true, false, true)} {/* Usuario no editable por ahora */}
                    {renderDialogField("Rol en Sistema", "systemUserRol", "select", currentEmpleadoToEdit.user.rol, "editEmpleado", userRoleOptions, false, false, true)}
                    <div className="mt-2 space-y-1">
                        <Label htmlFor="editEmp_newPass">Nueva Contraseña (dejar en blanco para no cambiar)</Label>
                        <Input id="editEmp_newPass" name="newSystemUserContraseña" type="password" placeholder="••••••••" value={editEmpleadoData.newSystemUserContraseña || ''} onChange={(e) => handleInputChangeGeneric(e, setEditEmpleadoData)} />
                    </div>
                    <div className="mt-2 space-y-1">
                        <Label htmlFor="editEmp_confirmNewPass">Confirmar Nueva Contraseña</Label>
                        <Input id="editEmp_confirmNewPass" name="newSystemUserConfirmContraseña" type="password" placeholder="••••••••" value={editEmpleadoData.newSystemUserConfirmContraseña || ''} onChange={(e) => handleInputChangeGeneric(e, setEditEmpleadoData)} />
                    </div>
                    <Button variant="link" size="sm" className="text-orange-600 p-0 h-auto mt-2" onClick={() => handleRemoveSystemUser(currentEmpleadoToEdit._id)}>Remover Acceso al Sistema</Button>
                  </>
                ) : (
                  <>
                    {renderDialogField("Crear acceso al sistema", "createSystemUser", "checkbox", "", "editEmpleado")}
                    {editEmpleadoData.createSystemUser && (
                      <>
                        {renderDialogField("Nombre de Usuario*", "systemUserUsuario", "text", "usuario_login", "editEmpleado", undefined, false, false, true)}
                        {renderDialogField("Nueva Contraseña*", "newSystemUserContraseña", "password", "••••••••", "editEmpleado", undefined, false, false, true)}
                        {renderDialogField("Confirmar Nueva Contraseña*", "newSystemUserConfirmContraseña", "password", "••••••••", "editEmpleado", undefined, false, false, true)}
                        {renderDialogField("Rol en Sistema*", "systemUserRol", "select", "Seleccionar rol...", "editEmpleado", userRoleOptions, false, false, true)}
                      </>
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
            {renderDialogField("Nombre Completo*", "nombre", "text", "Nombre del cliente", "newClient", undefined, false, false, true)}
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
            {renderDialogField("Nombre del Puesto*", "nombre", "text", "Ej: Hojalatero", "newPuesto", undefined, false, false, true)}
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
              {renderDialogField("Nombre del Puesto*", "nombre", "text", currentPuestoToEdit.nombre, "editPuesto", undefined, false, false, true)}
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

    </div>
  );
}

