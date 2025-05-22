
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogOut, CalendarDays, Wrench, Package, PlusCircle, Edit, Trash2, EyeIcon, Car, Shield, Users, Settings, Building, UserX, AlertTriangle } from 'lucide-react';
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
  LogEntry,
  PresupuestoItem,
} from '@/lib/types';
import { UserRole } from '@/lib/types'; // Enum para usar sus valores.

// Acciones del servidor.
import {
  getAllOrdersAction,
  createOrderAction,
  updateOrderAction,
  deleteOrderAction,
  getOrderByIdAction,
  getAjustadoresByAseguradora, 
} from './service-orders/actions';

import {
  getAllMarcasAction,
  createMarcaAction,
  updateMarcaAction,
  deleteMarcaAction,
  addModeloToMarcaAction,
  updateModeloInMarcaAction,
  removeModeloFromMarcaAction,
  getMarcaByIdAction as getMarcaForModelosAction, // Renombrado para claridad
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
  getAseguradoraByIdAction as getAseguradoraForAjustadoresAction, // Renombrado para claridad
} from './admin/aseguradoras/actions';

import { getClients } from './admin/clients/actions';

import {
  getAllEmpleadosAction,
  createEmpleadoAction,
  getEmpleadoByIdAction as getEmpleadoForEditAction, // Renombrado para claridad
  updateEmpleadoAction,
  deleteEmpleadoAction,
  removeSystemUserFromEmpleadoAction,
  // Importar funciones para obtener empleados por puesto/rol para los Selects de órdenes.
  // Estas se asumen que existen o se crearán en empleados/actions.ts
  // Para este ejemplo, se usarán las que ya estaban definidas en service-orders/actions.ts
  // pero idealmente pertenecerían a empleados/actions.ts.
  // Ejemplo: getAsesores, getValuadores, getHojalateros, getPintores
} from './admin/empleados/actions'; 
// Asumimos que estas funciones se moverán a empleados/actions.ts o se crearán allí.
// Por ahora, las importamos desde service-orders/actions.ts si aún existen allí
// o esperamos que estén en empleados/actions.ts
import { getAsesores, getValuadores, getEmployeesByPosition } from './admin/empleados/actions'; // Ajustar si las funciones están en otro lado


/**
 * Tipo de datos para el formulario de creación/edición de Órdenes de Servicio.
 * Los IDs de entidades relacionadas (ej. `idCliente`, `idMarca`) son strings que representan ObjectIds de MongoDB.
 * Las fechas se manejan como strings en el formulario (formato 'YYYY-MM-DD') y se convierten a objetos `Date` para el backend.
 * Los campos numéricos (ej. `año`, `deducible`) se manejan como strings en el formulario y se convierten a `Number` para el backend.
 * `aseguradoTercero` se maneja con 'true'/'false' strings en el Select y se convierte a boolean.
 */
type OrderFormDataType = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'log' | 'presupuestos'>> & {
  /** Año del vehículo, como string en el formulario. */
  año?: string;
  /** Monto del deducible, como string en el formulario. */
  deducible?: string;
  /** Indica si es asegurado ('true') o tercero ('false'), como string en el formulario. */
  aseguradoTercero?: string; 
  // Los campos de fecha para el formulario, como string.
  fechaValuacion?: string;
  fechaReingreso?: string;
  fechaEntrega?: string;
  fechaPromesa?: string;
  fechaBaja?: string;
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
 * Incluye campos para los datos básicos del empleado y, opcionalmente,
 * para las credenciales de sistema si se decide crear un usuario.
 */
type EmpleadoFormDataType = Omit<Empleado, '_id' | 'fechaRegistro' | 'user'> & {
  createSystemUser?: boolean; // Checkbox para indicar si se crean credenciales de sistema.
  systemUserUsuario?: string; // Nombre de usuario para el sistema.
  systemUserContraseña?: string; // Contraseña para el sistema.
  systemUserConfirmContraseña?: string; // Confirmación de contraseña.
  systemUserRol?: UserRoleType; // Rol del usuario en el sistema.
};

/**
 * Tipo de datos para el formulario de edición de Empleados.
 * Permite modificar datos básicos y detalles del usuario de sistema si existe.
 */
type EditEmpleadoFormDataType = Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>> & {
  systemUserUsuario?: string; // Nombre de usuario (informativo, no editable directamente aquí).
  systemUserRol?: UserRoleType; // Rol del usuario (informativo, no editable directamente aquí).
  newSystemUserContraseña?: string; // Para establecer una nueva contraseña.
  newSystemUserConfirmContraseña?: string; // Confirmación de la nueva contraseña.
  createSystemUser?: boolean; // Para permitir añadir acceso a sistema si no lo tiene.
};


/**
 * Componente principal de la página del Dashboard.
 * Maneja la lógica de la interfaz de usuario, la carga de datos y las interacciones del usuario.
 */
export default function DashboardPage() {
  console.log("DashboardPage: Renderizando componente...");
  const router = useRouter();
  const { toast } = useToast();

  // --- Estados de Sesión y Usuario ---
  /** Nombre del usuario logueado. */
  const [userName, setUserName] = useState<string | null>(null);
  /** _id (string ObjectId) del empleado logueado. */
  const [empleadoId, setEmpleadoId] = useState<string | null>(null);
  /** Rol del usuario logueado. */
  const [userRole, setUserRole] = useState<UserRoleType | null>(null);

  // --- Estados para Órdenes de Servicio ---
  /** Lista de órdenes de servicio. */
  const [orders, setOrders] = useState<Order[]>([]);
  /** Indica si se están cargando las órdenes. */
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  /** Controla la visibilidad del diálogo para crear órdenes. */
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  /** Controla la visibilidad del diálogo para editar órdenes. */
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  /** Controla la visibilidad del diálogo para ver detalles de una orden. */
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false);
  /** Controla la visibilidad del diálogo para eliminar órdenes. */
  const [isDeleteOrderDialogOpen, setIsDeleteOrderDialogOpen] = useState(false);
  /** Orden actual seleccionada para ver o editar. */
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  /** _id (string ObjectId) de la orden a eliminar. */
  const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null);
  
  /** Estado para los ajustadores disponibles cuando se selecciona una aseguradora en el formulario de orden. */
  const [availableAjustadoresForOrder, setAvailableAjustadoresForOrder] = useState<Pick<Ajustador, 'idAjustador' | 'nombre'>[]>([]);
  /** Estado para los modelos disponibles cuando se selecciona una marca en el formulario de orden. */
  const [availableModelosForOrder, setAvailableModelosForOrder] = useState<Pick<ModeloVehiculo, 'idModelo' | 'modelo'>[]>([]);


  /** Datos iniciales para el formulario de creación de una nueva orden. */
  const initialNewOrderData: OrderFormDataType = {
    proceso: 'pendiente', // Valor por defecto
    piso: false, 
    grua: false,
    aseguradoTercero: 'true', // Valor por defecto para el select ('true' para Asegurado)
  };
  /** Estado para los datos del formulario de nueva orden. */
  const [newOrderData, setNewOrderData] = useState<OrderFormDataType>(initialNewOrderData);
  /** Estado para los datos del formulario de edición de orden. */
  const [editOrderData, setEditOrderData] = useState<OrderFormDataType>({});

  // Datos para Selects de Órdenes
  /** Lista de clientes para selectores. */
  const [clients, setClients] = useState<Cliente[]>([]);
  /** Indica si se están cargando los clientes. */
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  /** Lista de empleados con rol Asesor para selectores. */
  const [asesores, setAsesores] = useState<{ _id: string; nombre: string }[]>([]);
  /** Indica si se están cargando los asesores. */
  const [isLoadingAsesores, setIsLoadingAsesores] = useState(true); 
  /** Lista de empleados con rol Valuador para selectores. */
  const [valuadores, setValuadores] = useState<{ _id: string; nombre: string }[]>([]);
  /** Lista de empleados con puesto Hojalatero para selectores. */
  const [hojalateros, setHojalateros] = useState<{ _id: string; nombre: string }[]>([]);
  /** Lista de empleados con puesto Pintor para selectores. */
  const [pintores, setPintores] = useState<{ _id: string; nombre: string }[]>([]);

  // --- Estados para Administración: Marcas y Modelos ---
  /** Lista de marcas de vehículos. */
  const [marcas, setMarcas] = useState<MarcaVehiculo[]>([]);
  /** Indica si se están cargando las marcas. */
  const [isLoadingMarcas, setIsLoadingMarcas] = useState(true);
  /** Controla la visibilidad del diálogo para crear marcas. */
  const [isCreateMarcaDialogOpen, setIsCreateMarcaDialogOpen] = useState(false);
  /** Controla la visibilidad del diálogo para editar marcas. */
  const [isEditMarcaDialogOpen, setIsEditMarcaDialogOpen] = useState(false);
  /** Controla la visibilidad del diálogo para eliminar marcas. */
  const [isDeleteMarcaDialogOpen, setIsDeleteMarcaDialogOpen] = useState(false);
  /** Marca actual seleccionada para editar o gestionar modelos. */
  const [currentMarca, setCurrentMarca] = useState<MarcaVehiculo | null>(null);
  /** _id (string ObjectId) de la marca a eliminar. */
  const [marcaToDeleteId, setMarcaToDeleteId] = useState<string | null>(null);
  /** Estado para los datos del formulario de nueva marca. */
  const [newMarcaData, setNewMarcaData] = useState<MarcaFormDataType>({ marca: '' });
  /** Estado para los datos del formulario de edición de marca. */
  const [editMarcaData, setEditMarcaData] = useState<MarcaFormDataType>({});
  
  /** Controla la visibilidad del diálogo para gestionar modelos. */
  const [isManageModelosDialogOpen, setIsManageModelosDialogOpen] = useState(false);
  /** Controla la visibilidad del diálogo para crear modelos. */
  const [isCreateModeloDialogOpen, setIsCreateModeloDialogOpen] = useState(false);
  /** Controla la visibilidad del diálogo para editar modelos. */
  const [isEditModeloDialogOpen, setIsEditModeloDialogOpen] = useState(false);
  /** Modelo actual seleccionado para editar. */
  const [currentModelo, setCurrentModelo] = useState<ModeloVehiculo | null>(null);
  /** Estado para los datos del formulario de nuevo modelo. */
  const [newModeloData, setNewModeloData] = useState<Omit<ModeloVehiculo, 'idModelo'>>({ modelo: '' });
  /** Estado para los datos del formulario de edición de modelo. */
  const [editModeloData, setEditModeloData] = useState<Partial<ModeloVehiculo>>({});
  
  // --- Estados para Administración: Aseguradoras y Ajustadores ---
  /** Lista de aseguradoras. */
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  /** Indica si se están cargando las aseguradoras. */
  const [isLoadingAseguradoras, setIsLoadingAseguradoras] = useState(true);
  /** Controla la visibilidad del diálogo para crear aseguradoras. */
  const [isCreateAseguradoraDialogOpen, setIsCreateAseguradoraDialogOpen] = useState(false);
  /** Controla la visibilidad del diálogo para editar aseguradoras. */
  const [isEditAseguradoraDialogOpen, setIsEditAseguradoraDialogOpen] = useState(false);
  /** Controla la visibilidad del diálogo para eliminar aseguradoras. */
  const [isDeleteAseguradoraDialogOpen, setIsDeleteAseguradoraDialogOpen] = useState(false);
  /** Aseguradora actual seleccionada para editar o gestionar ajustadores. */
  const [currentAseguradora, setCurrentAseguradora] = useState<Aseguradora | null>(null);
  /** _id (string ObjectId) de la aseguradora a eliminar. */
  const [aseguradoraToDeleteId, setAseguradoraToDeleteId] = useState<string | null>(null);
  /** Estado para los datos del formulario de nueva aseguradora. */
  const [newAseguradoraData, setNewAseguradoraData] = useState<AseguradoraFormDataType>({ nombre: '', telefono: '' });
  /** Estado para los datos del formulario de edición de aseguradora. */
  const [editAseguradoraData, setEditAseguradoraData] = useState<AseguradoraFormDataType>({});
  
  /** Controla la visibilidad del diálogo para gestionar ajustadores. */
  const [isManageAjustadoresDialogOpen, setIsManageAjustadoresDialogOpen] = useState(false);
  /** Controla la visibilidad del diálogo para crear ajustadores. */
  const [isCreateAjustadorDialogOpen, setIsCreateAjustadorDialogOpen] = useState(false);
  /** Controla la visibilidad del diálogo para editar ajustadores. */
  const [isEditAjustadorDialogOpen, setIsEditAjustadorDialogOpen] = useState(false);
  /** Ajustador actual seleccionado para editar. */
  const [currentAjustador, setCurrentAjustador] = useState<Ajustador | null>(null);
  /** Estado para los datos del formulario de nuevo ajustador. */
  const [newAjustadorData, setNewAjustadorData] = useState<Omit<Ajustador, 'idAjustador'>>({ nombre: '', telefono: '', correo: '' });
  /** Estado para los datos del formulario de edición de ajustador. */
  const [editAjustadorData, setEditAjustadorData] = useState<Partial<Ajustador>>({});

  // --- Estados para Administración: Empleados ---
  /** Lista de empleados. */
  const [empleadosList, setEmpleadosList] = useState<Empleado[]>([]);
  /** Indica si se están cargando los empleados. */
  const [isLoadingEmpleadosList, setIsLoadingEmpleadosList] = useState(true);
  /** Controla la visibilidad del diálogo para crear empleados. */
  const [isCreateEmpleadoDialogOpen, setIsCreateEmpleadoDialogOpen] = useState(false);
  /** Controla la visibilidad del diálogo para editar empleados. */
  const [isEditEmpleadoDialogOpen, setIsEditEmpleadoDialogOpen] = useState(false);
  /** Controla la visibilidad del diálogo para eliminar empleados. */
  const [isDeleteEmpleadoDialogOpen, setIsDeleteEmpleadoDialogOpen] = useState(false);
  /** Empleado actual seleccionado para editar. */
  const [currentEmpleadoToEdit, setCurrentEmpleadoToEdit] = useState<Empleado | null>(null);
  /** Datos iniciales para el formulario de creación de un nuevo empleado. */
  const initialNewEmpleadoData: EmpleadoFormDataType = {
    nombre: '', puesto: '', createSystemUser: false, systemUserUsuario: '', systemUserContraseña: '', systemUserConfirmContraseña: '', systemUserRol: UserRole.ASESOR,
  };
  /** Estado para los datos del formulario de nuevo empleado. */
  const [newEmpleadoData, setNewEmpleadoData] = useState<EmpleadoFormDataType>(initialNewEmpleadoData);
  /** Estado para los datos del formulario de edición de empleado. */
  const [editEmpleadoData, setEditEmpleadoData] = useState<EditEmpleadoFormDataType>({
    nombre: '', puesto: '', createSystemUser: false 
  });
  /** _id (string ObjectId) del empleado a eliminar. */
  const [empleadoToDeleteId, setEmpleadoToDeleteId] = useState<string | null>(null);

  /**
   * useEffect para verificar la sesión del usuario al cargar la página.
   * Si no hay sesión válida (isLoggedIn, username, empleadoId, userRole en localStorage),
   * redirige a la página de inicio ('/').
   * Si la sesión es válida, establece los datos del usuario en el estado y carga los datos iniciales del dashboard.
   */
  useEffect(() => {
    console.log("Dashboard useEffect: Verificando sesión...");
    const loggedIn = localStorage.getItem('isLoggedIn');
    const storedUserName = localStorage.getItem('username');
    const storedEmpleadoId = localStorage.getItem('empleadoId'); // Este debería ser el _id del Empleado
    const storedUserRole = localStorage.getItem('userRole') as UserRoleType | null;

    console.log("Dashboard useEffect: Valores RAW de localStorage:", {
      loggedIn, storedUserName, storedEmpleadoId, storedUserRole
    });
    
    // Validaciones más estrictas
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
      setUserRole(storedUserRole);

      // Pre-llenar idAsesor si el rol es ASESOR y tenemos el empleadoId.
      if (storedUserRole === UserRole.ASESOR && storedEmpleadoId) {
        console.log("Dashboard useEffect: Rol Asesor. Pre-llenando idAsesor con Empleado._id:", storedEmpleadoId);
        setNewOrderData(prev => ({ ...prev, idAsesor: storedEmpleadoId }));
      }
      fetchInitialData(storedUserRole, storedEmpleadoId);
    } else {
      console.log("Dashboard useEffect: Sesión inválida o datos faltantes. Redirigiendo a /. Detalles:", { loggedIn, storedUserName, storedEmpleadoId, storedUserRole });
      router.replace('/');
    }
  }, [router]); // router como dependencia para el redirect y el pre-llenado de idAsesor.

  /**
   * Carga todos los datos iniciales necesarios para el dashboard.
   * Esto incluye órdenes, marcas, aseguradoras, clientes y listas de empleados (asesores, valuadores, etc.).
   * @param {UserRoleType | null} role Rol del usuario actual.
   * @param {string | null} currentEmpleadoLogId _id (string ObjectId) del empleado actual, usado para pre-llenar campos.
   */
  const fetchInitialData = useCallback(async (role: UserRoleType | null, currentEmpleadoLogId: string | null) => {
    console.log("fetchInitialData: Iniciando carga de datos...", { role, currentEmpleadoId: currentEmpleadoLogId });
    
    // Restablecer el estado de newOrderData, pre-llenando idAsesor si el rol es ASESOR.
    // Asegura que todos los campos vuelvan a su estado inicial por defecto.
    setNewOrderData(prev => ({ 
        ...initialNewOrderData, 
        idAsesor: role === UserRole.ASESOR && currentEmpleadoLogId ? currentEmpleadoLogId : undefined,
    }));

    // Establecer estados de carga
    setIsLoadingOrders(true); setIsLoadingMarcas(true); setIsLoadingAseguradoras(true);
    setIsLoadingClients(true); setIsLoadingAsesores(true); setIsLoadingEmpleadosList(true); 

    try {
      // Ejecutar todas las cargas de datos en paralelo.
      await Promise.all([
        fetchOrders(), fetchMarcas(), fetchAseguradoras(), fetchClients(),
        fetchAsesores(), fetchValuadores(), fetchHojalateros(), fetchPintores(),
        fetchEmpleados(), // Cargar siempre para lookup de nombres en logs, selects de personal, etc.
      ]);
      console.log("fetchInitialData: Todos los datos cargados.");
    } catch (error) {
      console.error("fetchInitialData: Error al cargar datos iniciales:", error);
      toast({ title: "Error Crítico", description: "No se pudieron cargar los datos iniciales del dashboard.", variant: "destructive" });
    }
  }, [toast]); // Dependencias de useCallback: toast.

  // --- Funciones de Carga de Datos Específicas (fetchers) ---
  /** Carga las órdenes de servicio. */
  const fetchOrders = async () => {
    console.log("fetchOrders: Iniciando...");
    setIsLoadingOrders(true);
    try {
      const result = await getAllOrdersAction();
      console.log("fetchOrders: Resultado:", result);
      if (result.success && result.data) setOrders(result.data);
      else toast({ title: "Error Órdenes", description: result.error || "No se pudieron cargar las órdenes.", variant: "destructive" });
    } catch (error) { console.error("fetchOrders: Error:", error); toast({ title: "Error Crítico Órdenes", description: "Fallo al obtener órdenes.", variant: "destructive" });
    } finally { setIsLoadingOrders(false); }
  };
  /** Carga las marcas de vehículos. */
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
  /** Carga las aseguradoras. */
  const fetchAseguradoras = async () => {
    console.log("fetchAseguradoras: Iniciando...");
    setIsLoadingAseguradoras(true);
    try {
      const result = await getAllAseguradorasAction();
      console.log("fetchAseguradoras: Resultado:", result);
      if (result.success && result.data) setAseguradoras(result.data);
      else toast({ title: "Error Aseguradoras", description: result.error || "No se pudieron cargar las aseguradoras.", variant: "destructive" });
    } catch (error) { console.error("fetchAseguradoras: Error:", error); toast({ title: "Error Crítico Aseguradoras", description: "Fallo al obtener aseguradoras.", variant: "destructive" });
    } finally { setIsLoadingAseguradoras(false); }
  };
  /** Carga los clientes. */
  const fetchClients = async () => {
    console.log("fetchClients: Iniciando...");
    setIsLoadingClients(true);
    try {
      const result = await getClients();
      console.log("fetchClients: Resultado:", result);
      if (result.success && result.data) setClients(result.data);
      else toast({ title: "Error Clientes", description: result.error || "No se pudieron cargar los clientes.", variant: "destructive" });
    } catch (error) { console.error("fetchClients: Error:", error); toast({ title: "Error Crítico Clientes", description: "Fallo al obtener clientes.", variant: "destructive" });
    } finally { setIsLoadingClients(false); }
  };
  /** Carga los empleados con rol Asesor. */
  const fetchAsesores = async () => {
    console.log("fetchAsesores: Iniciando...");
    setIsLoadingAsesores(true);
    try {
      const result = await getAsesores(); 
      console.log("fetchAsesores: Resultado:", result);
      if (result.success && result.data) setAsesores(result.data);
      else toast({ title: "Error Asesores", description: result.error || "No se pudieron cargar los asesores.", variant: "destructive" });
    } catch (error) { console.error("fetchAsesores: Error:", error); toast({ title: "Error Crítico Asesores", description: "Fallo al obtener asesores.", variant: "destructive" });
    } finally { setIsLoadingAsesores(false); }
  };
  /** Carga los empleados con rol Valuador. */
  const fetchValuadores = async () => {
    console.log("fetchValuadores: Iniciando...");
    try {
      const result = await getValuadores(); 
      console.log("fetchValuadores: Resultado:", result);
      if (result.success && result.data) setValuadores(result.data);
      else toast({ title: "Error Valuadores", description: result.error || "No se pudieron cargar los valuadores.", variant: "destructive" });
    } catch (error) { console.error("fetchValuadores: Error:", error); toast({ title: "Error Crítico Valuadores", description: "Fallo al obtener valuadores.", variant: "destructive" }); }
  };
  /** Carga los empleados con puesto Hojalatero. */
  const fetchHojalateros = async () => {
    console.log("fetchHojalateros: Iniciando...");
    try {
      const result = await getEmployeesByPosition("Hojalatero");
      console.log("fetchHojalateros: Resultado:", result);
      if (result.success && result.data) setHojalateros(result.data);
      else toast({ title: "Error Hojalateros", description: result.error || "No se pudieron cargar los hojalateros.", variant: "destructive" });
    } catch (error) { console.error("fetchHojalateros: Error:", error); toast({ title: "Error Crítico Hojalateros", description: "Fallo al obtener hojalateros.", variant: "destructive" }); }
  };
  /** Carga los empleados con puesto Pintor. */
  const fetchPintores = async () => {
    console.log("fetchPintores: Iniciando...");
    try {
      const result = await getEmployeesByPosition("Pintor");
      console.log("fetchPintores: Resultado:", result);
      if (result.success && result.data) setPintores(result.data);
      else toast({ title: "Error Pintores", description: result.error || "No se pudieron cargar los pintores.", variant: "destructive" });
    } catch (error) { console.error("fetchPintores: Error:", error); toast({ title: "Error Crítico Pintores", description: "Fallo al obtener pintores.", variant: "destructive" }); }
  };
  /** Carga la lista completa de empleados. */
  const fetchEmpleados = async () => {
    console.log("fetchEmpleados: Iniciando...");
    setIsLoadingEmpleadosList(true);
    try {
      const result = await getAllEmpleadosAction();
      console.log("fetchEmpleados: Resultado:", result);
      if (result.success && result.data) setEmpleadosList(result.data);
      else toast({ title: "Error Empleados", description: result.error || "No se pudieron cargar los empleados.", variant: "destructive" });
    } catch (error) { console.error("fetchEmpleados: Error:", error); toast({ title: "Error Crítico Empleados", description: "Fallo al obtener empleados.", variant: "destructive" });
    } finally { setIsLoadingEmpleadosList(false); }
  };
  
  /** Maneja el cierre de sesión del usuario. Limpia localStorage y redirige. */
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('empleadoId');
    localStorage.removeItem('userRole');
    toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
    router.replace('/');
  };

  /**
   * Manejador genérico para cambios en inputs, textareas.
   * Actualiza el estado de un formulario genérico.
   * @param e Evento de cambio del input/textarea.
   * @param setState Función `React.Dispatch` para actualizar el estado del formulario.
   */
  const handleInputChangeGeneric = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setState: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const { name, value, type } = e.target;
    // Para checkboxes, el valor viene de `checked`. Para otros, es `value`.
    const processedValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setState((prev: any) => ({ ...prev, [name]: processedValue }));
  };

  /**
   * Manejador genérico para cambios en componentes Checkbox de ShadCN.
   * @param name Nombre del campo en el estado del formulario.
   * @param checked Nuevo valor booleano (o 'indeterminate', aunque aquí se fuerza a boolean).
   * @param setState Función `React.Dispatch` para actualizar el estado del formulario.
   */
  const handleCheckboxChangeGeneric = (
    name: string,
    checked: boolean | 'indeterminate', 
    setState: React.Dispatch<React.SetStateAction<any>>
  ) => {
    // Asegurarse de que solo se procese un valor booleano
    const booleanChecked = typeof checked === 'boolean' ? checked : false;
    console.log(`handleCheckboxChangeGeneric: name=${name}, checked=${booleanChecked}`);
    setState((prev: any) => ({ ...prev, [name]: booleanChecked }));
  };


  /**
   * Manejador genérico para cambios en componentes Select de ShadCN.
   * Actualiza el estado de un formulario genérico.
   * @param name Nombre del campo en el estado del formulario.
   * @param value Nuevo valor seleccionado (puede ser string o undefined si se usa un placeholder).
   * @param setState Función `React.Dispatch` para actualizar el estado del formulario.
   */
  const handleSelectChangeGeneric = (
    name: string, value: string | undefined,
    setState: React.Dispatch<React.SetStateAction<any>>
  ) => { 
    // Si el valor es un placeholder específico (ej. 'null_value_placeholder'), tratarlo como undefined.
    setState((prev: any) => ({ ...prev, [name]: value === 'null_value_placeholder' ? undefined : value })); 
  };


  // --- Funciones de Gestión de Órdenes de Servicio ---
  /**
   * Actualiza el estado `newOrderData` o `editOrderData` al cambiar un input o textarea en el formulario de orden.
   * @param e Evento de cambio del input/textarea.
   * @param formType Indica si es el formulario de 'new' o 'edit'.
   */
  const handleOrderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formType: 'new' | 'edit') => {
    handleInputChangeGeneric(e, formType === 'new' ? setNewOrderData : setEditOrderData);
  };

  /**
   * Actualiza el estado `newOrderData` o `editOrderData` al cambiar un checkbox en el formulario de orden.
   * @param name Nombre del campo del checkbox (clave de `OrderFormDataType`).
   * @param checked Valor booleano del checkbox.
   * @param formType Indica si es el formulario de 'new' o 'edit'.
   */
  const handleOrderCheckboxChange = (name: keyof OrderFormDataType, checked: boolean, formType: 'new' | 'edit') => {
    handleCheckboxChangeGeneric(name, checked, formType === 'new' ? setNewOrderData : setEditOrderData);
  };
  
  /**
   * Actualiza el estado `newOrderData` o `editOrderData` al cambiar un select en el formulario de orden.
   * También maneja la carga de ajustadores si se cambia la aseguradora, o modelos si cambia la marca.
   * @param name Nombre del campo del select (clave de `OrderFormDataType`).
   * @param value Valor seleccionado (string ObjectId o undefined).
   * @param formType Indica si es el formulario de 'new' o 'edit'.
   */
  const handleOrderSelectChange = async (name: keyof OrderFormDataType, value: string | undefined, formType: 'new' | 'edit') => {
    const setState = formType === 'new' ? setNewOrderData : setEditOrderData;
    handleSelectChangeGeneric(name, value, setState); // Actualiza el campo principal.

    // Si se cambia la Aseguradora, cargar sus ajustadores y limpiar selección de ajustador.
    if (name === 'idAseguradora') {
      if (value) {
        const result = await getAjustadoresByAseguradora(value);
        if (result.success && result.data) {
          setAvailableAjustadoresForOrder(result.data);
          setState((prev: any) => ({ ...prev, idAjustador: undefined })); // Limpiar ajustador
        } else {
          setAvailableAjustadoresForOrder([]);
          toast({ title: "Error", description: result.error || "No se pudieron cargar los ajustadores.", variant: "destructive" });
        }
      } else { // Si se deselecciona la aseguradora
          setAvailableAjustadoresForOrder([]);
          setState((prev: any) => ({ ...prev, idAjustador: undefined }));
      }
    }
    // Si se cambia la Marca, cargar sus modelos y limpiar selección de modelo.
    if (name === 'idMarca') {
        if (value) {
            const result = await getModelosByMarcaAction(value);
            if (result.success && result.data) {
                setAvailableModelosForOrder(result.data);
                setState((prev: any) => ({ ...prev, idModelo: undefined })); // Limpiar modelo
            } else {
                setAvailableModelosForOrder([]);
                toast({ title: "Error", description: result.error || "No se pudieron cargar los modelos.", variant: "destructive" });
            }
        } else { // Si se deselecciona la marca
            setAvailableModelosForOrder([]);
            setState((prev: any) => ({ ...prev, idModelo: undefined }));
        }
    }
  };

  /**
   * Maneja la creación de una nueva orden de servicio.
   * Valida los datos y llama a la acción del servidor `createOrderAction`.
   */
  const handleCreateOrder = async () => {
    // Validación de campos obligatorios (IDs son strings aquí)
    if (!newOrderData.idCliente || !newOrderData.idMarca || !newOrderData.idAsesor) {
      toast({ title: "Error de Validación", description: "Cliente, Marca y Asesor son obligatorios.", variant: "destructive" }); return;
    }

    // Conversión de datos del formulario (strings) a los tipos esperados por NewOrderData (Number, Date, boolean)
    const dataToCreate: NewOrderData = {
      // Campos que son strings ObjectId y se mantienen como strings
      idCliente: newOrderData.idCliente,
      idMarca: newOrderData.idMarca,
      idModelo: newOrderData.idModelo, 
      idAseguradora: newOrderData.idAseguradora,
      idAjustador: newOrderData.idAjustador, 
      idAsesor: newOrderData.idAsesor,
      idValuador: newOrderData.idValuador,
      idHojalatero: newOrderData.idHojalatero,
      idPintor: newOrderData.idPintor,
      // Campos de texto
      placas: newOrderData.placas,
      color: newOrderData.color,
      vin: newOrderData.vin,
      kilometraje: newOrderData.kilometraje,
      siniestro: newOrderData.siniestro,
      poliza: newOrderData.poliza,
      folio: newOrderData.folio,
      // Campos numéricos (convertir de string)
      año: newOrderData.año ? Number(newOrderData.año) : undefined,
      deducible: newOrderData.deducible ? Number(newOrderData.deducible) : undefined,
      // Campos booleanos
      aseguradoTercero: newOrderData.aseguradoTercero === 'true', // Convertir string 'true'/'false' a boolean
      piso: newOrderData.piso || false, // Checkbox
      grua: newOrderData.grua || false, // Checkbox
      // Campos de fecha (convertir de string 'YYYY-MM-DD')
      // Las fechas se envían como string, el backend/manager las convertirá a Date si es necesario.
      // Opcionalmente, se pueden convertir aquí si NewOrderData espera Date.
      // Por ahora, se asume que NewOrderData puede manejar strings o que el manager lo hace.
      fechaValuacion: newOrderData.fechaValuacion ? new Date(newOrderData.fechaValuacion + 'T00:00:00') : undefined,
      fechaReingreso: newOrderData.fechaReingreso ? new Date(newOrderData.fechaReingreso + 'T00:00:00') : undefined,
      fechaEntrega: newOrderData.fechaEntrega ? new Date(newOrderData.fechaEntrega + 'T00:00:00') : undefined,
      fechaPromesa: newOrderData.fechaPromesa ? new Date(newOrderData.fechaPromesa + 'T00:00:00') : undefined,
      fechaBaja: newOrderData.fechaBaja ? new Date(newOrderData.fechaBaja + 'T00:00:00') : undefined,
      // Campos que se inicializan en el backend o se gestionan por separado
      proceso: newOrderData.proceso || 'pendiente', // Proceso inicial
    };
    
    const result = await createOrderAction(dataToCreate, empleadoId || undefined); // empleadoId es el _id del empleado logueado
    if (result.success) {
      toast({ title: "Éxito", description: result.message || `Orden OT-${result.data?.customOrderId} creada.` });
      setIsCreateOrderDialogOpen(false); 
      fetchOrders(); 
      setNewOrderData(initialNewOrderData); // Resetear formulario
      // Resetear selects dependientes
      setAvailableAjustadoresForOrder([]);
      setAvailableModelosForOrder([]);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear la orden.", variant: "destructive" });
    }
  };

  /**
   * Abre el diálogo para editar una orden. Carga los datos de la orden.
   * @param orderId _id (string ObjectId) de la orden a editar.
   */
  const openEditOrderDialog = async (orderId: string) => {
    const result = await getOrderByIdAction(orderId);
    if (result.success && result.data) {
      const orderData = result.data;
      setCurrentOrder(orderData); // Guardar la orden completa original
      // Preparar datos para el formulario (conversión a strings para inputs)
      setEditOrderData({ 
        ...orderData,
        // Convertir números y fechas a string para los inputs del formulario
        año: orderData.año ? String(orderData.año) : undefined,
        deducible: orderData.deducible ? String(orderData.deducible) : undefined,
        aseguradoTercero: String(orderData.aseguradoTercero), // Convertir boolean a 'true'/'false' string
        // Formatear fechas a 'YYYY-MM-DD' para input type="date"
        fechaValuacion: orderData.fechaValuacion ? formatDate(orderData.fechaValuacion, 'YYYY-MM-DD') : undefined,
        fechaReingreso: orderData.fechaReingreso ? formatDate(orderData.fechaReingreso, 'YYYY-MM-DD') : undefined,
        fechaEntrega: orderData.fechaEntrega ? formatDate(orderData.fechaEntrega, 'YYYY-MM-DD') : undefined,
        fechaPromesa: orderData.fechaPromesa ? formatDate(orderData.fechaPromesa, 'YYYY-MM-DD') : undefined,
        fechaBaja: orderData.fechaBaja ? formatDate(orderData.fechaBaja, 'YYYY-MM-DD') : undefined,
      });
      
      // Cargar ajustadores si hay una aseguradora seleccionada
      if (orderData.idAseguradora) {
        const ajustadoresResult = await getAjustadoresByAseguradora(orderData.idAseguradora);
        if (ajustadoresResult.success && ajustadoresResult.data) {
          setAvailableAjustadoresForOrder(ajustadoresResult.data);
        }
      } else {
        setAvailableAjustadoresForOrder([]);
      }
      // Cargar modelos si hay una marca seleccionada
      if (orderData.idMarca) {
        const modelosResult = await getModelosByMarcaAction(orderData.idMarca);
        if (modelosResult.success && modelosResult.data) {
            setAvailableModelosForOrder(modelosResult.data);
        }
      } else {
        setAvailableModelosForOrder([]);
      }

      setIsEditOrderDialogOpen(true);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo cargar la orden para editar.", variant: "destructive" });
    }
  };

  /**
   * Maneja la actualización de una orden existente.
   * Valida datos y llama a la acción del servidor `updateOrderAction`.
   */
  const handleUpdateOrder = async () => {
    if (!currentOrder || !currentOrder._id) return;
    // Validación de campos obligatorios
    if (!editOrderData.idCliente || !editOrderData.idMarca || !editOrderData.idAsesor) {
      toast({ title: "Error de Validación", description: "Cliente, Marca y Asesor son obligatorios.", variant: "destructive" }); return;
    }

    // Conversión de datos del formulario de edición a los tipos esperados por UpdateOrderData
    const dataToUpdate: UpdateOrderData = {
      // Campos que son strings ObjectId y se mantienen como strings
      idCliente: editOrderData.idCliente,
      idMarca: editOrderData.idMarca,
      idModelo: editOrderData.idModelo,
      idAseguradora: editOrderData.idAseguradora,
      idAjustador: editOrderData.idAjustador,
      idAsesor: editOrderData.idAsesor,
      idValuador: editOrderData.idValuador,
      idHojalatero: editOrderData.idHojalatero,
      idPintor: editOrderData.idPintor,
      // Campos de texto
      placas: editOrderData.placas,
      color: editOrderData.color,
      vin: editOrderData.vin,
      kilometraje: editOrderData.kilometraje,
      siniestro: editOrderData.siniestro,
      poliza: editOrderData.poliza,
      folio: editOrderData.folio,
      proceso: editOrderData.proceso,
      // Campos numéricos (convertir de string)
      año: editOrderData.año ? Number(editOrderData.año) : undefined,
      deducible: editOrderData.deducible ? Number(editOrderData.deducible) : undefined,
      // Campos booleanos
      aseguradoTercero: editOrderData.aseguradoTercero === 'true',
      piso: editOrderData.piso || false,
      grua: editOrderData.grua || false,
      // Campos de fecha (convertir de string 'YYYY-MM-DD')
      fechaValuacion: editOrderData.fechaValuacion ? new Date(editOrderData.fechaValuacion + 'T00:00:00') : undefined,
      fechaReingreso: editOrderData.fechaReingreso ? new Date(editOrderData.fechaReingreso + 'T00:00:00') : undefined,
      fechaEntrega: editOrderData.fechaEntrega ? new Date(editOrderData.fechaEntrega + 'T00:00:00') : undefined,
      fechaPromesa: editOrderData.fechaPromesa ? new Date(editOrderData.fechaPromesa + 'T00:00:00') : undefined,
      fechaBaja: editOrderData.fechaBaja ? new Date(editOrderData.fechaBaja + 'T00:00:00') : undefined,
      // `presupuestos` y `log` no se actualizan directamente desde este formulario general.
    };

    const result = await updateOrderAction(currentOrder._id, dataToUpdate, empleadoId || undefined);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Orden actualizada." });
      setIsEditOrderDialogOpen(false); 
      fetchOrders(); 
      setCurrentOrder(null); 
      setEditOrderData({});
      setAvailableAjustadoresForOrder([]);
      setAvailableModelosForOrder([]);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar la orden.", variant: "destructive" });
    }
  };

  /** Abre el diálogo para ver los detalles de una orden. */
  const openViewOrderDialog = async (orderId: string) => {
    const result = await getOrderByIdAction(orderId);
    if (result.success && result.data) { setCurrentOrder(result.data); setIsViewOrderDialogOpen(true); }
    else { toast({ title: "Error", description: result.error || "No se pudo cargar la orden.", variant: "destructive" }); }
  };

  /** Abre el diálogo de confirmación para eliminar una orden. */
  const openDeleteOrderDialog = (orderId: string) => { setOrderToDeleteId(orderId); setIsDeleteOrderDialogOpen(true); };

  /** Confirma y ejecuta la eliminación de una orden. */
  const handleDeleteOrder = async () => {
    if (!orderToDeleteId) return;
    const result = await deleteOrderAction(orderToDeleteId);
    if (result.success) { toast({ title: "Éxito", description: result.message || "Orden eliminada." }); fetchOrders(); }
    else { toast({ title: "Error", description: result.error || "No se pudo eliminar la orden.", variant: "destructive" }); }
    setIsDeleteOrderDialogOpen(false); setOrderToDeleteId(null);
  };


  // --- Funciones de Gestión de Marcas (Administración) ---
  /** Maneja la creación de una nueva marca. Valida que el nombre no esté vacío. */
  const handleCreateMarca = async () => {
    if (!newMarcaData.marca?.trim()) {
      toast({ title: "Error", description: "El nombre de la marca es obligatorio.", variant: "destructive" }); return;
    }
    const result = await createMarcaAction({ marca: newMarcaData.marca! }); 
    if (result.success) {
      toast({ title: "Éxito", description: result.message || `Marca "${newMarcaData.marca}" creada.` });
      setIsCreateMarcaDialogOpen(false); fetchMarcas(); setNewMarcaData({ marca: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear la marca.", variant: "destructive" });
    }
  };
  /** Abre el diálogo para editar una marca. Pre-llena el formulario con datos de la marca. */
  const openEditMarcaDialog = (marca: MarcaVehiculo) => { 
    setCurrentMarca(marca); 
    setEditMarcaData({ marca: marca.marca });
    setIsEditMarcaDialogOpen(true); 
  };
  /** Maneja la actualización de una marca. Valida datos y llama a la acción del servidor. */
  const handleUpdateMarca = async () => {
    if (!currentMarca || !currentMarca._id || !editMarcaData.marca?.trim()) {
      toast({ title: "Error", description: "Datos inválidos para actualizar marca.", variant: "destructive" }); return;
    }
    const result = await updateMarcaAction(currentMarca._id, { marca: editMarcaData.marca! });
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsEditMarcaDialogOpen(false); fetchMarcas(); setCurrentMarca(null); setEditMarcaData({ marca: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar la marca.", variant: "destructive" });
    }
  };
  /** Abre el diálogo de confirmación para eliminar una marca. */
  const openDeleteMarcaDialog = (marcaId: string) => { setMarcaToDeleteId(marcaId); setIsDeleteMarcaDialogOpen(true); };
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
    const result = await addModeloToMarcaAction(currentMarca._id, { modelo: newModeloData.modelo! });
    if (result.success && result.data) {
      toast({ title: "Éxito", description: "Modelo añadido." });
      const marcaRes = await getMarcaForModelosAction(currentMarca._id); 
      if (marcaRes.success && marcaRes.data) setCurrentMarca(marcaRes.data); else fetchMarcas(); 
      setNewModeloData({ modelo: '' }); 
      setIsCreateModeloDialogOpen(false); 
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el modelo.", variant: "destructive" });
    }
  };
  /** Abre el diálogo para editar un modelo. */
  const openEditModeloDialog = (modelo: ModeloVehiculo) => { 
    setCurrentModelo(modelo); 
    setEditModeloData({ idModelo: modelo.idModelo, modelo: modelo.modelo }); 
    setIsEditModeloDialogOpen(true); 
  };
  /** Maneja la actualización de un modelo. Valida datos y llama a la acción. */
  const handleUpdateModelo = async () => {
    if (!currentMarca?._id || !currentModelo?.idModelo || !editModeloData.modelo?.trim()) {
      toast({ title: "Error", description: "Datos de modelo inválidos.", variant: "destructive" }); return;
    }
    const result = await updateModeloInMarcaAction(currentMarca._id, currentModelo.idModelo, { modelo: editModeloData.modelo });
    if (result.success) {
      toast({ title: "Éxito", description: "Modelo actualizado." });
      const marcaRes = await getMarcaForModelosAction(currentMarca._id);
      if (marcaRes.success && marcaRes.data) setCurrentMarca(marcaRes.data); else fetchMarcas();
      setIsEditModeloDialogOpen(false); setCurrentModelo(null);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar el modelo.", variant: "destructive" });
    }
  };
  /** Maneja la eliminación de un modelo de la marca actual. */
  const handleDeleteModelo = async (idModelo: string) => {
    if (!currentMarca?._id) return;
    const result = await removeModeloFromMarcaAction(currentMarca._id, idModelo);
    if (result.success) {
      toast({ title: "Éxito", description: "Modelo eliminado." });
      const marcaRes = await getMarcaForModelosAction(currentMarca._id);
      if (marcaRes.success && marcaRes.data) setCurrentMarca(marcaRes.data); else fetchMarcas();
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar el modelo.", variant: "destructive" });
    }
  };

  // --- Funciones de Gestión de Aseguradoras (Administración) ---
  /** Maneja la creación de una nueva aseguradora. Valida datos obligatorios. */
  const handleCreateAseguradora = async () => {
    if (!newAseguradoraData.nombre?.trim()) {
      toast({ title: "Error", description: "El nombre de la aseguradora es obligatorio.", variant: "destructive" }); return;
    }
    const result = await createAseguradoraAction(newAseguradoraData as NewAseguradoraData);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || `Aseguradora "${newAseguradoraData.nombre}" creada.` });
      setIsCreateAseguradoraDialogOpen(false); fetchAseguradoras(); setNewAseguradoraData({ nombre: '', telefono: '' });
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
  /** Maneja la actualización de una aseguradora. */
  const handleUpdateAseguradora = async () => {
    if (!currentAseguradora || !currentAseguradora._id || !editAseguradoraData.nombre?.trim()) {
      toast({ title: "Error", description: "Datos inválidos para actualizar aseguradora.", variant: "destructive" }); return;
    }
    const result = await updateAseguradoraAction(currentAseguradora._id, editAseguradoraData as UpdateAseguradoraData);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsEditAseguradoraDialogOpen(false); fetchAseguradoras(); setCurrentAseguradora(null); setEditAseguradoraData({ nombre: '', telefono: '' });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar la aseguradora.", variant: "destructive" });
    }
  };
  /** Abre el diálogo de confirmación para eliminar una aseguradora. */
  const openDeleteAseguradoraDialog = (aseguradoraId: string) => { setAseguradoraToDeleteId(aseguradoraId); setIsDeleteAseguradoraDialogOpen(true); };
  /** Confirma y ejecuta la eliminación de una aseguradora. */
  const handleDeleteAseguradora = async () => {
    if (!aseguradoraToDeleteId) return;
    const result = await deleteAseguradoraAction(aseguradoraToDeleteId);
    if (result.success) { toast({ title: "Éxito", description: result.message }); fetchAseguradoras(); }
    else { toast({ title: "Error", description: result.error || "Error al eliminar", variant: "destructive" }); }
    setIsDeleteAseguradoraDialogOpen(false); setAseguradoraToDeleteId(null);
  };

  // --- Funciones de Gestión de Ajustadores (Administración) ---
  /** Abre el diálogo para gestionar los ajustadores de una aseguradora. */
  const openManageAjustadoresDialog = (aseguradora: Aseguradora) => { setCurrentAseguradora(aseguradora); setIsManageAjustadoresDialogOpen(true); };
  /** Maneja la creación de un nuevo ajustador. */
  const handleCreateAjustador = async () => {
    if (!currentAseguradora?._id || !newAjustadorData.nombre?.trim()) {
      toast({ title: "Error", description: "Nombre del Ajustador es requerido.", variant: "destructive" }); return;
    }
    const result = await addAjustadorToAseguradoraAction(currentAseguradora._id, newAjustadorData);
    if (result.success && result.data) {
      toast({ title: "Éxito", description: "Ajustador añadido." });
      const aseguradoraRes = await getAseguradoraForAjustadoresAction(currentAseguradora._id);
      if (aseguradoraRes.success && aseguradoraRes.data) setCurrentAseguradora(aseguradoraRes.data); else fetchAseguradoras();
      setNewAjustadorData({ nombre: '', telefono: '', correo: '' });
      setIsCreateAjustadorDialogOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el ajustador.", variant: "destructive" });
    }
  };
  /** Abre el diálogo para editar un ajustador. */
  const openEditAjustadorDialog = (ajustador: Ajustador) => { 
    setCurrentAjustador(ajustador); 
    setEditAjustadorData({ idAjustador: ajustador.idAjustador, nombre: ajustador.nombre, telefono: ajustador.telefono, correo: ajustador.correo }); 
    setIsEditAjustadorDialogOpen(true); 
  };
  /** Maneja la actualización de un ajustador. */
  const handleUpdateAjustador = async () => {
    if (!currentAseguradora?._id || !currentAjustador?.idAjustador || !editAjustadorData.nombre?.trim()) {
      toast({ title: "Error", description: "Datos de ajustador inválidos.", variant: "destructive" }); return;
    }
    const {idAjustador, ...dataToUpdate} = editAjustadorData; 
    const result = await updateAjustadorInAseguradoraAction(currentAseguradora._id, currentAjustador.idAjustador, dataToUpdate);
    if (result.success) {
      toast({ title: "Éxito", description: "Ajustador actualizado." });
      const aseguradoraRes = await getAseguradoraForAjustadoresAction(currentAseguradora._id);
      if (aseguradoraRes.success && aseguradoraRes.data) setCurrentAseguradora(aseguradoraRes.data); else fetchAseguradoras();
      setIsEditAjustadorDialogOpen(false); setCurrentAjustador(null);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar el ajustador.", variant: "destructive" });
    }
  };
  /** Maneja la eliminación de un ajustador. */
  const handleDeleteAjustador = async (idAjustador: string) => {
    if (!currentAseguradora?._id) return;
    const result = await removeAjustadorFromAseguradoraAction(currentAseguradora._id, idAjustador);
    if (result.success) {
      toast({ title: "Éxito", description: "Ajustador eliminado." });
      const aseguradoraRes = await getAseguradoraForAjustadoresAction(currentAseguradora._id);
      if (aseguradoraRes.success && aseguradoraRes.data) setCurrentAseguradora(aseguradoraRes.data); else fetchAseguradoras();
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar el ajustador.", variant: "destructive" });
    }
  };

  // --- Funciones de Gestión de Empleados (Administración) ---
  /**
   * Maneja la creación de un nuevo empleado.
   * Valida los campos obligatorios y las credenciales de sistema si se indica.
   * Llama a la acción del servidor `createEmpleadoAction`.
   */
  const handleCreateEmpleado = async () => {
    const { nombre, puesto, createSystemUser, systemUserUsuario, systemUserContraseña, systemUserConfirmContraseña, systemUserRol, ...restEmpleadoData } = newEmpleadoData;
    // Validaciones básicas para el empleado
    if (!nombre?.trim() || !puesto?.trim()) {
      toast({ title: "Error de Validación", description: "Nombre y Puesto son obligatorios.", variant: "destructive" }); return;
    }
    let systemUserDetails: Omit<SystemUserCredentials, 'permisos' | '_id'> | undefined = undefined;
    // Validaciones para las credenciales del sistema si se indica
    if (createSystemUser) {
      if (!systemUserUsuario?.trim() || !systemUserContraseña?.trim() || !systemUserRol) {
        toast({ title: "Error de Validación de Usuario", description: "Usuario, Contraseña y Rol son obligatorios si se crea acceso al sistema.", variant: "destructive" }); return;
      }
      if (systemUserContraseña !== systemUserConfirmContraseña) {
        toast({ title: "Error de Contraseña", description: "Las contraseñas no coinciden.", variant: "destructive" }); return;
      }
      systemUserDetails = { usuario: systemUserUsuario, contraseña: systemUserContraseña, rol: systemUserRol };
    }
    // Preparar datos del empleado para la acción
    const empleadoDataToCreate: Omit<Empleado, '_id' | 'fechaRegistro' | 'user'> = { nombre, puesto, ...restEmpleadoData };
    // Llamar a la acción del servidor
    const result = await createEmpleadoAction(empleadoDataToCreate, systemUserDetails);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || `Empleado "${nombre}" creado.` });
      setIsCreateEmpleadoDialogOpen(false); // Cerrar diálogo
      fetchEmpleados(); // Recargar lista de empleados
      setNewEmpleadoData(initialNewEmpleadoData); // Resetear formulario
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el empleado.", variant: "destructive" });
    }
  };
  /**
   * Abre el diálogo para editar un empleado.
   * Carga los datos del empleado usando `getEmpleadoForEditAction` y los establece en `editEmpleadoData`.
   * @param empleadoIdToEdit _id (string ObjectId) del empleado a editar.
   */
  const openEditEmpleadoDialog = async (empleadoIdToEdit: string) => {
    const result = await getEmpleadoForEditAction(empleadoIdToEdit);
    if (result.success && result.data) {
      setCurrentEmpleadoToEdit(result.data); // Guardar empleado original
      const emp = result.data;
      // Pre-llenar formulario de edición
      setEditEmpleadoData({
        nombre: emp.nombre, puesto: emp.puesto, telefono: emp.telefono, correo: emp.correo,
        sueldo: emp.sueldo, comision: emp.comision,
        // Si el empleado tiene usuario, pre-llenar campos de sistema (informativo, no editable aquí excepto contraseña)
        systemUserUsuario: emp.user?.usuario,
        systemUserRol: emp.user?.rol,
        // Indica si el empleado ya tiene usuario, para mostrar la UI correcta.
        createSystemUser: !!emp.user, 
      });
      setIsEditEmpleadoDialogOpen(true); // Abrir diálogo
    } else {
      toast({ title: "Error", description: result.error || "No se pudo cargar el empleado para editar.", variant: "destructive" });
    }
  };
  /**
   * Maneja la actualización de un empleado existente.
   * Incluye lógica para actualizar datos básicos del empleado y/o sus credenciales de sistema.
   * Llama a la acción del servidor `updateEmpleadoAction`.
   */
  const handleUpdateEmpleado = async () => {
    if (!currentEmpleadoToEdit?._id) return; // Asegurar que hay un empleado actual para editar.
    const { nombre, puesto, systemUserUsuario, systemUserRol, newSystemUserContraseña, newSystemUserConfirmContraseña, createSystemUser, ...restData } = editEmpleadoData;
    
    // Validar campos básicos
    if (!nombre?.trim() || !puesto?.trim()) {
      toast({ title: "Error de Validación", description: "Nombre y Puesto son obligatorios.", variant: "destructive" }); return;
    }
    
    // Preparar datos básicos del empleado para actualizar.
    const empleadoUpdate: Partial<Omit<Empleado, '_id' | 'fechaRegistro' | 'user'>> = { nombre, puesto, ...restData };
    let systemUserUpdate: Partial<Omit<SystemUserCredentials, 'permisos' | '_id' | 'contraseña'>> & { contraseña?: string } | undefined = undefined;

    // Lógica para manejar la creación/actualización de credenciales de sistema.
    // Si se marcó 'createSystemUser' (y no tenía usuario) O si ya tenía usuario y se intenta modificar algo de él.
    if ( (createSystemUser && !currentEmpleadoToEdit.user) || (currentEmpleadoToEdit.user && (newSystemUserContraseña || systemUserUsuario || systemUserRol) ) ) {
        systemUserUpdate = {}; // Inicializar objeto para actualizaciones de usuario.
        
        // Caso 1: Se está creando un nuevo usuario para un empleado existente que no tenía.
        if (createSystemUser && !currentEmpleadoToEdit.user) {
            if (!systemUserUsuario?.trim() || !newSystemUserContraseña?.trim() || !systemUserRol) {
                toast({ title: "Error de Validación de Usuario", description: "Usuario, Contraseña y Rol son obligatorios para crear acceso.", variant: "destructive" }); return;
            }
            if (newSystemUserContraseña !== newSystemUserConfirmContraseña) {
                toast({ title: "Error de Contraseña", description: "Las nuevas contraseñas no coinciden.", variant: "destructive" }); return;
            }
            systemUserUpdate.usuario = systemUserUsuario;
            systemUserUpdate.contraseña = newSystemUserContraseña;
            systemUserUpdate.rol = systemUserRol;
        } else if (currentEmpleadoToEdit.user) { // Caso 2: Se está actualizando un usuario existente.
            // Campos de usuario y rol (estos no se cambian directamente desde aquí según el diseño actual, pero se podría añadir)
            // systemUserUpdate.usuario = systemUserUsuario; 
            // systemUserUpdate.rol = systemUserRol;

            // Actualizar contraseña si se proporcionó una nueva.
            if (newSystemUserContraseña) {
                if (newSystemUserContraseña !== newSystemUserConfirmContraseña) {
                    toast({ title: "Error de Contraseña", description: "Las nuevas contraseñas no coinciden.", variant: "destructive" }); return;
                }
                systemUserUpdate.contraseña = newSystemUserContraseña;
            }
        }
    }
    
    // Llamar a la acción del servidor
    const result = await updateEmpleadoAction(currentEmpleadoToEdit._id, empleadoUpdate, systemUserUpdate);
    if (result.success) {
      toast({ title: "Éxito", description: result.message || "Empleado actualizado." });
      setIsEditEmpleadoDialogOpen(false); fetchEmpleados(); setCurrentEmpleadoToEdit(null); setEditEmpleadoData({});
    } else {
      toast({ title: "Error", description: result.error || "No se pudo actualizar el empleado.", variant: "destructive" });
    }
  };
  /** Abre el diálogo de confirmación para eliminar un empleado. */
  const openDeleteEmpleadoDialog = (empleadoIdToDelete: string) => { setEmpleadoToDeleteId(empleadoIdToDelete); setIsDeleteEmpleadoDialogOpen(true); };
  /** Confirma y ejecuta la eliminación de un empleado. */
  const handleDeleteEmpleado = async () => {
    if (!empleadoToDeleteId) return;
    const result = await deleteEmpleadoAction(empleadoToDeleteId);
    if (result.success) { toast({ title: "Éxito", description: result.message }); fetchEmpleados(); }
    else { toast({ title: "Error", description: result.error || "Error al eliminar", variant: "destructive" }); }
    setIsDeleteEmpleadoDialogOpen(false); setEmpleadoToDeleteId(null);
  };
  /**
   * Remueve el acceso al sistema de un empleado.
   * Llama a la acción del servidor `removeSystemUserFromEmpleadoAction`.
   * @param empleadoIdToRemoveAccess _id (string ObjectId) del empleado al que se le removerá el acceso.
   */
  const handleRemoveSystemUser = async (empleadoIdToRemoveAccess: string) => {
    const result = await removeSystemUserFromEmpleadoAction(empleadoIdToRemoveAccess);
    if (result.success) {
        toast({ title: "Éxito", description: result.message });
        fetchEmpleados(); // Recargar lista de empleados
        // Si el empleado actualmente en edición es al que se le quitó el acceso, actualizar su estado en el formulario.
        if (currentEmpleadoToEdit?._id === empleadoIdToRemoveAccess) {
            setCurrentEmpleadoToEdit(prev => prev ? ({ ...prev, user: undefined }) : null);
            setEditEmpleadoData(prev => ({ ...prev, systemUserUsuario: undefined, systemUserRol: undefined, createSystemUser: false }));
        }
    } else {
        toast({ title: "Error", description: result.error || "No se pudo remover el acceso.", variant: "destructive" });
    }
  };

  // --- Funciones Auxiliares de Formateo ---
  /**
   * Formatea una fecha a un string legible 'dd/MM/yyyy' o 'yyyy-MM-dd'.
   * Maneja entradas de tipo Date, string o number.
   * @param dateInput Fecha como Date, string o número.
   * @param format String de formato deseado ('dd/MM/yyyy' o 'YYYY-MM-DD'). Por defecto 'dd/MM/yyyy'.
   * @returns String de la fecha formateada o string vacío si la entrada es inválida.
   */
  const formatDate = (dateInput?: Date | string | number, format: 'dd/MM/yyyy' | 'YYYY-MM-DD' = 'dd/MM/yyyy'): string => {
    if (!dateInput) return '';
    try {
      let date: Date;
      // Si la entrada es un string, intentar convertirla a Date.
      // Se añade 'T00:00:00' (hora local) a los strings 'YYYY-MM-DD' para parsearlos correctamente como fecha local.
      if (typeof dateInput === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) { // Formato YYYY-MM-DD
          // Split para evitar problemas de timezone al crear la Date.
          // new Date(year, monthIndex, day)
          const parts = dateInput.split('-');
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          date = new Date(dateInput); // Intentar parseo normal para otros formatos
        }
      } else {
        date = new Date(dateInput); // Si es Date o number, convertir directamente.
      }
      
      if (isNaN(date.getTime())) return ''; // Fecha inválida

      // Formato para input type="date" (YYYY-MM-DD)
      if (format === 'YYYY-MM-DD') {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      // Formato por defecto 'dd/MM/yyyy'
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (error) {
      console.error("Error formateando fecha:", dateInput, error);
      return '';
    }
  };

  /**
   * Formatea una fecha y hora a un string legible 'dd/mm/yyyy hh:mm:ss a'.
   * @param dateInput Fecha como Date, string o número.
   * @returns String de fecha y hora formateada o string vacío si la entrada es inválida.
   */
  const formatDateTime = (dateInput?: Date | string | number): string => {
    if (!dateInput) return '';
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return ''; // Fecha inválida.
      // Formatear a 'es-MX'.
      return date.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    } catch (error) {
      console.error("Error formateando fecha y hora:", dateInput, error);
      return '';
    }
  };

  /** Devuelve la variante de Badge según el proceso de la orden. */
  const getProcesoVariant = (proceso?: Order['proceso']): "default" | "secondary" | "outline" | "destructive" => {
    switch (proceso) {
      case 'pendiente': return 'default';
      case 'entregado': case 'facturado': return 'secondary'; 
      case 'cancelado': return 'destructive';
      default: return 'outline'; 
    }
  };

  /** Opciones para el select de proceso de orden. */
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
  /** Opciones para el select de rol de usuario (usado en creación/edición de empleados). */
  const userRoleOptions = Object.values(UserRole).map(role => ({ value: role, label: role.charAt(0).toUpperCase() + role.slice(1) }));
  /** Opciones para el select de Asegurado/Tercero en formularios de orden. */
  const aseguradoTerceroOptions: {value: string; label: string}[] = [
    {value: 'true', label: 'Asegurado'},
    {value: 'false', label: 'Tercero'},
  ];
  
  /**
   * Renderiza un campo de formulario (Input, Select, Textarea, Checkbox) para un diálogo.
   * @param label Etiqueta del campo.
   * @param name Nombre del campo (usado para el estado y como ID parcial).
   * @param type Tipo de input HTML (text, number, date, etc.) o 'select', 'textarea', 'checkbox'.
   * @param placeholder Placeholder para el campo.
   * @param formType Identificador del tipo de formulario (usado para seleccionar el estado y manejador correctos).
   * @param options Array de opciones para el Select (si type es 'select'). Cada opción debe tener `value` y `label`.
   * @param isTextarea Indica si es un Textarea. (Obsoleto si se usa type='textarea').
   * @param isDisabled Indica si el campo está deshabilitado.
   * @param isRequired Indica si el campo es obligatorio (solo visual, la validación se maneja por separado).
   * @param classNameGrid Col clases de grid para este campo dentro de un layout de grid.
   */
  const renderDialogField = (
      label: string, name: any, type: string = "text", placeholder?: string,
      formType: 'newOrder' | 'editOrder' | 'newMarca' | 'editMarca' | 'newModelo' | 'editModelo' | 'newAseguradora' | 'editAseguradora' | 'newAjustador' | 'editAjustador' | 'newEmpleado' | 'editEmpleado' = 'newOrder',
      options?: { value: string | number; label: string }[], 
      isTextarea?: boolean, isDisabled?: boolean, isRequired?: boolean,
      classNameGrid?: string
    ) => {
    
    let value: any; // Valor actual del campo.
    let handleChange: any; // Manejador para Inputs y Textareas.
    let handleSelect: any; // Manejador para Selects.
    let handleCheckbox: any; // Manejador para Checkboxes.

    // Determinar el estado y los manejadores basados en formType.
    switch (formType) {
      case 'newOrder': value = newOrderData[name as keyof OrderFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => handleOrderInputChange(e, 'new'); handleSelect = (val: string | undefined) => handleOrderSelectChange(name as keyof OrderFormDataType, val, 'new'); handleCheckbox = (checked: boolean) => handleOrderCheckboxChange(name as keyof OrderFormDataType, checked, 'new'); break;
      case 'editOrder': value = editOrderData[name as keyof OrderFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => handleOrderInputChange(e, 'edit'); handleSelect = (val: string | undefined) => handleOrderSelectChange(name as keyof OrderFormDataType, val, 'edit'); handleCheckbox = (checked: boolean) => handleOrderCheckboxChange(name as keyof OrderFormDataType, checked, 'edit'); break;
      case 'newMarca': value = newMarcaData[name as keyof MarcaFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewMarcaData); break;
      case 'editMarca': value = editMarcaData[name as keyof MarcaFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditMarcaData); break;
      case 'newModelo': value = newModeloData[name as keyof Omit<ModeloVehiculo, 'idModelo'>]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewModeloData); break;
      case 'editModelo': value = editModeloData[name as keyof ModeloVehiculo]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditModeloData); break;
      case 'newAseguradora': value = newAseguradoraData[name as keyof AseguradoraFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewAseguradoraData); break;
      case 'editAseguradora': value = editAseguradoraData[name as keyof AseguradoraFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditAseguradoraData); break;
      case 'newAjustador': value = newAjustadorData[name as keyof Omit<Ajustador, 'idAjustador'>]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewAjustadorData); break;
      case 'editAjustador': value = editAjustadorData[name as keyof Ajustador]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditAjustadorData); break;
      case 'newEmpleado': value = newEmpleadoData[name as keyof EmpleadoFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setNewEmpleadoData); handleSelect = (val: string | undefined) => handleSelectChangeGeneric(name, val, setNewEmpleadoData); handleCheckbox = (checked: boolean) => handleCheckboxChangeGeneric(name, checked, setNewEmpleadoData); break;
      case 'editEmpleado': value = editEmpleadoData[name as keyof EditEmpleadoFormDataType]; handleChange = (e: React.ChangeEvent<HTMLInputElement>) => handleInputChangeGeneric(e, setEditEmpleadoData); handleSelect = (val: string | undefined) => handleSelectChangeGeneric(name, val, setEditEmpleadoData); handleCheckbox = (checked: boolean) => handleCheckboxChangeGeneric(name, checked, setEditEmpleadoData); break;
      default: value = ''; handleChange = () => {}; handleSelect = () => {}; handleCheckbox = () => {};
    }

    const fieldId = `${formType}_${name}`; // Crear un ID único para el campo.

    return (
      <div className={`space-y-1 ${classNameGrid || ''}`}>
        <Label htmlFor={fieldId} className="text-sm font-medium">{label}{isRequired && <span className="text-destructive">*</span>}</Label>
        {type === 'select' && options ? (
          <Select name={name} onValueChange={handleSelect} value={value || ''} disabled={isDisabled}>
            <SelectTrigger id={fieldId} className="w-full mt-1"><SelectValue placeholder={placeholder || "Seleccionar..."} /></SelectTrigger>
            <SelectContent>
              {options.map(opt => <SelectItem key={String(opt.value)} value={String(opt.value)}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : type === 'textarea' || isTextarea ? ( // isTextarea es por compatibilidad, type='textarea' es preferido.
          <Textarea id={fieldId} name={name} placeholder={placeholder} value={value || ''} onChange={handleChange} disabled={isDisabled} className="mt-1 w-full" />
        ) : type === 'checkbox' ? (
           <div className="flex items-center space-x-2 mt-1"> {/* Envolver Checkbox y Label si es necesario */}
             <Checkbox id={fieldId} name={name} checked={!!value} onCheckedChange={(checked) => handleCheckbox(checked as boolean)} disabled={isDisabled} />
             {/* Label para checkbox ya está arriba, o se puede añadir una específica aquí si es diferente. */}
           </div>
        ) : (
          <Input id={fieldId} name={name} type={type} placeholder={placeholder} value={value || ''} onChange={handleChange} disabled={isDisabled} className="mt-1 w-full" />
        )}
      </div>
    );
  };


  // --- Lógica de Renderizado del Componente ---
  // Muestra "Cargando..." si los datos del usuario aún no están disponibles.
  if (!userName || !userRole) {
    console.log("DashboardPage: userName o userRole faltan. Mostrando 'Cargando...' Detalles:", { userName, userRole });
    return <div className="flex min-h-screen items-center justify-center bg-background"><p>Cargando...</p></div>;
  }

  // Datos de ejemplo para Citas (se reemplazarán con datos reales).
  const dummyCitas = [
    { id: 1, fecha: new Date(), cliente: "Juan Pérez", vehiculo: "Toyota Corolla", servicio: "Cambio de aceite", estado: "Confirmada" },
    { id: 2, fecha: new Date(new Date().setDate(new Date().getDate() + 1)), cliente: "Ana Gómez", vehiculo: "Honda CRV", servicio: "Revisión frenos", estado: "Pendiente" },
  ];
  // Datos de ejemplo para Almacén (se reemplazarán con datos reales).
  const inventoryItems = [
    { id: 'REF001', name: 'Filtro de Aceite X', quantity: 15, category: 'Filtros', location: 'Estante A-1' },
    { id: 'REF002', name: 'Pastillas de Freno Y', quantity: 8, category: 'Frenos', location: 'Estante B-3' },
  ];
  
  // Clases dinámicas para la lista de pestañas principal, ajustando columnas según si el rol es Admin.
   const mainTabsListClassName = userRole === UserRole.ADMIN ? 
    "grid w-full grid-cols-2 sm:grid-cols-4 mb-6 rounded-lg p-1 bg-muted" : 
    "grid w-full grid-cols-1 sm:grid-cols-3 mb-6 rounded-lg p-1 bg-muted";


  return (
    <div className="flex min-h-screen flex-col bg-muted/30 dark:bg-muted/10">
      {/* Encabezado del Dashboard */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 shadow-sm">
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Panel del Taller Automotriz</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Bienvenido, <span className="font-medium text-foreground">{userName} ({empleadoId?.substring(0,8)}... Rol: {userRole})</span>
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
            {/* Pestaña Admin solo visible para rol 'admin' */}
            {userRole === UserRole.ADMIN && (
              <TabsTrigger value="admin" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Settings className="h-5 w-5" /> Admin
              </TabsTrigger>
            )}
          </TabsList>

          {/* Contenido Pestaña Citas */}
          <TabsContent value="citas">
            <Card className="shadow-lg border-border/50">
              <CardHeader><CardTitle className="text-xl">Gestión de Citas</CardTitle><CardDescription>Programa y visualiza las citas del taller.</CardDescription></CardHeader>
              <CardContent>
                <Button size="sm" className="mb-4"><PlusCircle className="mr-2 h-4 w-4" /> Nueva Cita</Button>
                <div className="rounded-md border bg-background p-4">
                  <p className="text-center text-muted-foreground">Calendario de citas (funcionalidad pendiente)...</p>
                  <Table>
                    <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Fecha</TableHead><TableHead>Cliente</TableHead><TableHead>Vehículo</TableHead><TableHead>Servicio</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {dummyCitas.map(cita => <TableRow key={cita.id}><TableCell>{cita.id}</TableCell><TableCell>{formatDate(cita.fecha)}</TableCell><TableCell>{cita.cliente}</TableCell><TableCell>{cita.vehiculo}</TableCell><TableCell>{cita.servicio}</TableCell><TableCell><Badge variant={cita.estado === "Confirmada" ? "default" : "outline"}>{cita.estado}</Badge></TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contenido Pestaña Órdenes de Servicio */}
          <TabsContent value="ordenes">
            <Card className="shadow-lg border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div><CardTitle className="text-xl">Órdenes de Servicio</CardTitle><CardDescription>Visualiza y gestiona las órdenes de servicio activas.</CardDescription></div>
                <Button size="sm" onClick={() => { setNewOrderData(initialNewOrderData); setIsCreateOrderDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Nueva Orden</Button>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? <p>Cargando órdenes...</p> : orders.length === 0 ? (
                  <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay órdenes de servicio registradas.</p></div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>OT</TableHead><TableHead>Cliente</TableHead><TableHead>Vehículo (Placas)</TableHead><TableHead>Proceso</TableHead><TableHead>Fecha Reg.</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">OT-{order.idOrder}</TableCell>
                        <TableCell>{clients.find(c => c._id === order.idCliente)?.nombre || order.idCliente?.substring(0,6) || 'N/A'}</TableCell>
                        <TableCell>{marcas.find(m => m._id === order.idMarca)?.marca} {order.placas ? `(${order.placas})` : ''}</TableCell>
                        <TableCell><Badge variant={getProcesoVariant(order.proceso)}>{procesoOptions.find(p => p.value === order.proceso)?.label || order.proceso}</Badge></TableCell>
                        <TableCell>{formatDate(order.fechaRegistro)}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openViewOrderDialog(order._id!)}><EyeIcon className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditOrderDialog(order._id!)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteOrderDialog(order._id!)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contenido Pestaña Almacén */}
          <TabsContent value="almacen">
            <Card className="shadow-lg border-border/50">
              <CardHeader><CardTitle className="text-xl">Gestión de Almacén</CardTitle><CardDescription>Controla el inventario de refacciones y materiales.</CardDescription></CardHeader>
              <CardContent>
                <Button size="sm" className="mb-4"><PlusCircle className="mr-2 h-4 w-4" /> Nueva Refacción</Button>
                <Table>
                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Nombre</TableHead><TableHead>Cantidad</TableHead><TableHead>Categoría</TableHead><TableHead>Ubicación</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {inventoryItems.map(item => <TableRow key={item.id}><TableCell>{item.id}</TableCell><TableCell>{item.name}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{item.category}</TableCell><TableCell>{item.location}</TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Contenido de la Pestaña "Admin" (solo visible para rol 'admin') */}
          {userRole === UserRole.ADMIN && (
            <TabsContent value="admin">
              <Tabs defaultValue="empleados" className="w-full"> 
                {/* Sub-pestañas dentro de Admin */}
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-4 rounded-md p-1 bg-muted/70">
                  <TabsTrigger value="marcas" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Car className="mr-2 h-4 w-4" />Marcas/Modelos</TabsTrigger>
                  <TabsTrigger value="aseguradoras" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Shield className="mr-2 h-4 w-4"/>Aseguradoras</TabsTrigger>
                  <TabsTrigger value="empleados" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Users className="mr-2 h-4 w-4"/>Empleados</TabsTrigger>
                </TabsList>
                
                {/* Admin -> Marcas/Modelos */}
                <TabsContent value="marcas">
                  <Card className="shadow-lg border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-4"><div><CardTitle className="text-xl">Gestión de Marcas y Modelos</CardTitle></div><Button size="sm" onClick={() => { setNewMarcaData({marca: ''}); setIsCreateMarcaDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Nueva Marca</Button></CardHeader>
                    <CardContent>
                      {isLoadingMarcas ? <p>Cargando marcas...</p> : marcas.length === 0 ? (<div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay marcas registradas.</p></div>) : (
                        <Table>
                          <TableHeader><TableRow><TableHead>ID Marca (_id)</TableHead><TableHead>Nombre Marca</TableHead><TableHead>Modelos</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {marcas.map((marca) => (
                            <TableRow key={marca._id}>
                              <TableCell>{marca._id.substring(0, 8)}...</TableCell>
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

                {/* Admin -> Aseguradoras */}
                <TabsContent value="aseguradoras">
                  <Card className="shadow-lg border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-4"><div><CardTitle className="text-xl">Gestión de Aseguradoras</CardTitle></div><Button size="sm" onClick={() => { setNewAseguradoraData({nombre: '', telefono: ''}); setIsCreateAseguradoraDialogOpen(true);}}><PlusCircle className="mr-2 h-4 w-4" /> Nueva Aseguradora</Button></CardHeader>
                    <CardContent>
                      {isLoadingAseguradoras ? <p>Cargando aseguradoras...</p> : aseguradoras.length === 0 ? (<div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay aseguradoras registradas.</p></div>) : (
                        <Table>
                          <TableHeader><TableRow><TableHead>ID Aseg. (_id)</TableHead><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>Ajustadores</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {aseguradoras.map((aseg) => (
                            <TableRow key={aseg._id}>
                              <TableCell>{aseg._id.substring(0,8)}...</TableCell>
                              <TableCell className="font-medium">{aseg.nombre}</TableCell>
                              <TableCell>{aseg.telefono || 'N/A'}</TableCell>
                              <TableCell>{aseg.ajustadores?.length || 0}</TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button variant="outline" size="sm" onClick={() => openManageAjustadoresDialog(aseg)}>Ajustadores</Button>
                                <Button variant="ghost" size="icon" onClick={() => openEditAseguradoraDialog(aseg)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => openDeleteAseguradoraDialog(aseg._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
                    <CardHeader className="flex flex-row items-center justify-between pb-4"><div><CardTitle className="text-xl">Gestión de Empleados</CardTitle></div><Button size="sm" onClick={() => { setNewEmpleadoData(initialNewEmpleadoData); setIsCreateEmpleadoDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Empleado</Button></CardHeader>
                    <CardContent>
                      {isLoadingEmpleadosList ? <p>Cargando empleados...</p> : empleadosList.length === 0 ? (<div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay empleados registrados.</p></div>) : (
                        <Table>
                          <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Puesto</TableHead><TableHead>Usuario Sistema</TableHead><TableHead>Rol</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {empleadosList.map((emp) => (
                            <TableRow key={emp._id}>
                              <TableCell className="font-medium">{emp.nombre}</TableCell>
                              <TableCell>{emp.puesto}</TableCell>
                              <TableCell>{emp.user?.usuario || 'N/A'}</TableCell>
                              <TableCell>{emp.user?.rol || 'N/A'}</TableCell>
                              <TableCell className="text-right space-x-1">
                                <Button variant="ghost" size="icon" onClick={() => openEditEmpleadoDialog(emp._id!)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => openDeleteEmpleadoDialog(emp._id!)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
      <Dialog open={isCreateOrderDialogOpen} onOpenChange={setIsCreateOrderDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear Nueva Orden de Servicio</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {renderDialogField("Cliente", "idCliente", "select", "Seleccionar cliente...", "newOrder", clients.map(c=>({value: c._id!, label: `${c.nombre || c.razonSocial || 'N/A'} (ID: ${c._id.substring(0,6)}...)`})), false, false, true, "lg:col-span-1")}
            {renderDialogField("Aseguradora", "idAseguradora", "select", "Seleccionar aseguradora...", "newOrder", aseguradoras.map(a=>({value: a._id, label: a.nombre})), false, false, false, "lg:col-span-1")}
            {renderDialogField("Ajustador", "idAjustador", "select", "Seleccionar ajustador...", "newOrder", availableAjustadoresForOrder.map(aj => ({value: aj.idAjustador, label: aj.nombre})), false, !newOrderData.idAseguradora, false, "lg:col-span-1" )}
            {renderDialogField("No. Siniestro", "siniestro", "text", "Ej: 12345", "newOrder", undefined, false, false, false, "lg:col-span-1")}
            {renderDialogField("No. Póliza", "poliza", "text", "Ej: 98765", "newOrder", undefined, false, false, false, "lg:col-span-1")}
            {renderDialogField("Folio Aseguradora", "folio", "text", "Ej: XYZ789", "newOrder", undefined, false, false, false, "lg:col-span-1")}
            {renderDialogField("Deducible ($)", "deducible", "number", "Ej: 5000", "newOrder", undefined, false, false, false, "lg:col-span-1")}
            {renderDialogField("Asegurado/Tercero", "aseguradoTercero", "select", "Seleccionar tipo...", "newOrder", aseguradoTerceroOptions, false, false, true, "lg:col-span-1")}
            {renderDialogField("Marca", "idMarca", "select", "Seleccionar marca...", "newOrder", marcas.map(m=>({value: m._id, label: m.marca})), false, false, true, "lg:col-span-1")}
            {renderDialogField("Modelo", "idModelo", "select", "Seleccionar modelo...", "newOrder", availableModelosForOrder.map(mod => ({value: mod.idModelo, label: mod.modelo})), false, !newOrderData.idMarca, false, "lg:col-span-1")}
            {renderDialogField("Año", "año", "number", "Ej: 2020", "newOrder", undefined, false, false, false, "lg:col-span-1")}
            {renderDialogField("Placas", "placas", "text", "Ej: ABC-123", "newOrder", undefined, false, false, false, "lg:col-span-1")}
            {renderDialogField("Color", "color", "text", "Ej: Rojo", "newOrder", undefined, false, false, false, "lg:col-span-1")}
            {renderDialogField("VIN", "vin", "text", "Número de Identificación Vehicular", "newOrder", undefined, false, false, false, "lg:col-span-2")}
            {renderDialogField("Kilometraje", "kilometraje", "text", "Ej: 55000", "newOrder", undefined, false, false, false, "lg:col-span-1")}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                    <Checkbox id="newOrder_piso" name="piso" checked={!!newOrderData.piso} onCheckedChange={(checked) => handleOrderCheckboxChange('piso', checked as boolean, 'new')} />
                    <Label htmlFor="newOrder_piso">¿Piso?</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="newOrder_grua" name="grua" checked={!!newOrderData.grua} onCheckedChange={(checked) => handleOrderCheckboxChange('grua', checked as boolean, 'new')} />
                    <Label htmlFor="newOrder_grua">¿Grúa?</Label>
                </div>
            </div>
            {renderDialogField("Proceso Inicial", "proceso", "select", "Seleccionar proceso...", "newOrder", procesoOptions, false, false, true, "lg:col-span-1")}
            {renderDialogField("Asesor", "idAsesor", "select", "Seleccionar asesor...", "newOrder", asesores.map(a=>({value: a._id, label: a.nombre})),false, userRole === UserRole.ASESOR, true, "lg:col-span-1")}
            {renderDialogField("Valuador", "idValuador", "select", "Seleccionar valuador...", "newOrder", valuadores.map(v=>({value: v._id, label: v.nombre})), false, false, false, "lg:col-span-1")}
            {renderDialogField("Hojalatero", "idHojalatero", "select", "Seleccionar hojalatero...", "newOrder", hojalateros.map(h=>({value: h._id, label: h.nombre})), false, false, false, "lg:col-span-1")}
            {renderDialogField("Pintor", "idPintor", "select", "Seleccionar pintor...", "newOrder", pintores.map(p=>({value: p._id, label: p.nombre})), false, false, false, "lg:col-span-1")}
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateOrder}>Crear Orden</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOrderDialogOpen} onOpenChange={(open) => { setIsEditOrderDialogOpen(open); if (!open) { setCurrentOrder(null); setAvailableAjustadoresForOrder([]); setAvailableModelosForOrder([]);} }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Orden de Servicio: OT-{currentOrder?.idOrder}</DialogTitle></DialogHeader>
          {currentOrder && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              {renderDialogField("Cliente", "idCliente", "select", "Seleccionar cliente...", "editOrder", clients.map(c=>({value: c._id!, label: `${c.nombre || c.razonSocial || 'N/A'} (ID: ${c._id.substring(0,6)}...)`})), false, false, true, "lg:col-span-1")}
              {renderDialogField("Aseguradora", "idAseguradora", "select", "Seleccionar aseguradora...", "editOrder", aseguradoras.map(a=>({value: a._id, label: a.nombre})), false, false, false, "lg:col-span-1")}
              {renderDialogField("Ajustador", "idAjustador", "select", "Seleccionar ajustador...", "editOrder", availableAjustadoresForOrder.map(aj => ({value: aj.idAjustador, label: aj.nombre})), false, !editOrderData.idAseguradora, false, "lg:col-span-1" )}
              {renderDialogField("No. Siniestro", "siniestro", "text", "Ej: 12345", "editOrder", undefined, false, false, false, "lg:col-span-1")}
              {renderDialogField("No. Póliza", "poliza", "text", "Ej: 98765", "editOrder", undefined, false, false, false, "lg:col-span-1")}
              {renderDialogField("Folio Aseguradora", "folio", "text", "Ej: XYZ789", "editOrder", undefined, false, false, false, "lg:col-span-1")}
              {renderDialogField("Deducible ($)", "deducible", "number", "Ej: 5000", "editOrder", undefined, false, false, false, "lg:col-span-1")}
              {renderDialogField("Asegurado/Tercero", "aseguradoTercero", "select", "Seleccionar tipo...", "editOrder", aseguradoTerceroOptions, false, false, true, "lg:col-span-1")}
              {renderDialogField("Marca", "idMarca", "select", "Seleccionar marca...", "editOrder", marcas.map(m=>({value: m._id, label: m.marca})), false, false, true, "lg:col-span-1")}
              {renderDialogField("Modelo", "idModelo", "select", "Seleccionar modelo...", "editOrder", availableModelosForOrder.map(mod => ({value: mod.idModelo, label: mod.modelo})), false, !editOrderData.idMarca, false, "lg:col-span-1")}
              {renderDialogField("Año", "año", "number", "Ej: 2020", "editOrder", undefined, false, false, false, "lg:col-span-1")}
              {renderDialogField("Placas", "placas", "text", "Ej: ABC-123", "editOrder", undefined, false, false, false, "lg:col-span-1")}
              {renderDialogField("Color", "color", "text", "Ej: Rojo", "editOrder", undefined, false, false, false, "lg:col-span-1")}
              {renderDialogField("VIN", "vin", "text", "Número de Identificación Vehicular", "editOrder", undefined, false, false, false, "lg:col-span-2")}
              {renderDialogField("Kilometraje", "kilometraje", "text", "Ej: 55000", "editOrder", undefined, false, false, false, "lg:col-span-1")}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                    <Checkbox id="editOrder_piso" name="piso" checked={!!editOrderData.piso} onCheckedChange={(checked) => handleOrderCheckboxChange('piso', checked as boolean, 'edit')} />
                    <Label htmlFor="editOrder_piso">¿Piso?</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="editOrder_grua" name="grua" checked={!!editOrderData.grua} onCheckedChange={(checked) => handleOrderCheckboxChange('grua', checked as boolean, 'edit')} />
                    <Label htmlFor="editOrder_grua">¿Grúa?</Label>
                </div>
              </div>
              {renderDialogField("Proceso", "proceso", "select", "Seleccionar proceso...", "editOrder", procesoOptions, false, false, true, "lg:col-span-1")}
              {renderDialogField("Asesor", "idAsesor", "select", "Seleccionar asesor...", "editOrder", asesores.map(a=>({value: a._id, label: a.nombre})),false, userRole === UserRole.ASESOR && currentOrder?.idAsesor === empleadoId, true, "lg:col-span-1")}
              {renderDialogField("Valuador", "idValuador", "select", "Seleccionar valuador...", "editOrder", valuadores.map(v=>({value: v._id, label: v.nombre})), false, false, false, "lg:col-span-1")}
              {renderDialogField("Hojalatero", "idHojalatero", "select", "Seleccionar hojalatero...", "editOrder", hojalateros.map(h=>({value: h._id, label: h.nombre})), false, false, false, "lg:col-span-1")}
              {renderDialogField("Pintor", "idPintor", "select", "Seleccionar pintor...", "editOrder", pintores.map(p=>({value: p._id, label: p.nombre})), false, false, false, "lg:col-span-1")}
              {renderDialogField("Fecha Valuación", "fechaValuacion", "date", undefined, "editOrder", undefined, false, false, false, "lg:col-span-1")}
              {renderDialogField("Fecha Reingreso", "fechaReingreso", "date", undefined, "editOrder", undefined, false, false, false, "lg:col-span-1")}
              {renderDialogField("Fecha Promesa", "fechaPromesa", "date", undefined, "editOrder", undefined, false, false, false, "lg:col-span-1")}
              {renderDialogField("Fecha Entrega", "fechaEntrega", "date", undefined, "editOrder", undefined, false, false, false, "lg:col-span-1")}
              {renderDialogField("Fecha Baja", "fechaBaja", "date", undefined, "editOrder", undefined, false, false, false, "lg:col-span-1")}
            </div>
          )}
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateOrder}>Actualizar Orden</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOrderDialogOpen} onOpenChange={(open) => { setIsViewOrderDialogOpen(open); if(!open) setCurrentOrder(null);}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalles de Orden: OT-{currentOrder?.idOrder}</DialogTitle></DialogHeader>
          {currentOrder && (
            <div className="space-y-4 py-4 text-sm">
              {/* Sección Cliente y Vehículo */}
              <Card><CardHeader><CardTitle className="text-base">Cliente y Vehículo</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><strong>Cliente:</strong> {clients.find(c => c._id === currentOrder.idCliente)?.nombre || currentOrder.idCliente || 'N/A'}</div>
                  <div><strong>Marca:</strong> {marcas.find(m => m._id === currentOrder.idMarca)?.marca || 'N/A'}</div>
                  <div><strong>Modelo:</strong> { (currentOrder.idMarca && currentOrder.idModelo) ? (marcas.find(m => m._id === currentOrder.idMarca)?.modelos?.find(mod => mod.idModelo === currentOrder.idModelo)?.modelo || 'N/A') : 'N/A'}</div>
                  <div><strong>Año:</strong> {currentOrder.año || 'N/A'}</div>
                  <div><strong>Placas:</strong> {currentOrder.placas || 'N/A'}</div>
                  <div><strong>Color:</strong> {currentOrder.color || 'N/A'}</div>
                  <div><strong>VIN:</strong> {currentOrder.vin || 'N/A'}</div>
                  <div><strong>Kilometraje:</strong> {currentOrder.kilometraje || 'N/A'}</div>
                </CardContent>
              </Card>

              {/* Sección Aseguradora */}
              <Card><CardHeader><CardTitle className="text-base">Datos de Aseguradora</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><strong>Aseguradora:</strong> {aseguradoras.find(a => a._id === currentOrder.idAseguradora)?.nombre || 'N/A'}</div>
                  <div><strong>Ajustador:</strong> { (currentOrder.idAseguradora && currentOrder.idAjustador) ? (aseguradoras.find(a => a._id === currentOrder.idAseguradora)?.ajustadores?.find(aj => aj.idAjustador === currentOrder.idAjustador)?.nombre || 'N/A') : 'N/A'}</div>
                  <div><strong>Siniestro:</strong> {currentOrder.siniestro || 'N/A'}</div>
                  <div><strong>Póliza:</strong> {currentOrder.poliza || 'N/A'}</div>
                  <div><strong>Folio:</strong> {currentOrder.folio || 'N/A'}</div>
                  <div><strong>Deducible:</strong> ${currentOrder.deducible?.toLocaleString() || '0.00'}</div>
                  <div><strong>Tipo:</strong> {currentOrder.aseguradoTercero ? 'Asegurado' : 'Tercero'}</div>
                </CardContent>
              </Card>

              {/* Sección Detalles de la Orden */}
              <Card><CardHeader><CardTitle className="text-base">Detalles de la Orden</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><strong>Proceso:</strong> {procesoOptions.find(p=>p.value === currentOrder.proceso)?.label || currentOrder.proceso}</div>
                  <div><strong>Piso:</strong> {currentOrder.piso ? 'Sí' : 'No'}</div>
                  <div><strong>Grúa:</strong> {currentOrder.grua ? 'Sí' : 'No'}</div>
                  <div><strong>URL Archivos:</strong> {currentOrder.urlArchivos ? <a href={currentOrder.urlArchivos} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ver Archivos</a> : 'N/A'}</div>
                </CardContent>
              </Card>
              
              {/* Sección Personal Asignado */}
              <Card><CardHeader><CardTitle className="text-base">Personal Asignado</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><strong>Asesor:</strong> {empleadosList.find(e => e._id === currentOrder.idAsesor)?.nombre || 'N/A'}</div>
                  <div><strong>Valuador:</strong> {empleadosList.find(e => e._id === currentOrder.idValuador)?.nombre || 'N/A'}</div>
                  <div><strong>Hojalatero:</strong> {empleadosList.find(e => e._id === currentOrder.idHojalatero)?.nombre || 'N/A'}</div>
                  <div><strong>Pintor:</strong> {empleadosList.find(e => e._id === currentOrder.idPintor)?.nombre || 'N/A'}</div>
                </CardContent>
              </Card>

              {/* Sección Fechas */}
              <Card><CardHeader><CardTitle className="text-base">Fechas Importantes</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><strong>Fecha Registro:</strong> {formatDate(currentOrder.fechaRegistro)}</div>
                  <div><strong>Fecha Valuación:</strong> {currentOrder.fechaValuacion ? formatDate(currentOrder.fechaValuacion) : 'N/A'}</div>
                  <div><strong>Fecha Reingreso:</strong> {currentOrder.fechaReingreso ? formatDate(currentOrder.fechaReingreso) : 'N/A'}</div>
                  <div><strong>Fecha Promesa:</strong> {currentOrder.fechaPromesa ? formatDate(currentOrder.fechaPromesa) : 'N/A'}</div>
                  <div><strong>Fecha Entrega:</strong> {currentOrder.fechaEntrega ? formatDate(currentOrder.fechaEntrega) : 'N/A'}</div>
                  <div><strong>Fecha Baja:</strong> {currentOrder.fechaBaja ? formatDate(currentOrder.fechaBaja) : 'N/A'}</div>
                </CardContent>
              </Card>
              
              {/* Sección Presupuestos */}
              {currentOrder.presupuestos && currentOrder.presupuestos.length > 0 && (
                <Card><CardHeader><CardTitle className="text-base">Resumen de Presupuesto</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      {currentOrder.presupuestos.map((item, index) => (
                        <li key={item._id || index}> {/* Usar _id si está disponible, sino index */}
                          {item.cantidad} x {item.concepto} - Proc: {item.procedimiento} (Pintura: {item.pintura ? 'Sí':'No'})
                          {/* Aquí se podrían mostrar más detalles como precios si estuvieran disponibles */}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Sección Historial de Cambios (Log) */}
              {currentOrder.Log && currentOrder.Log.length > 0 && (
                <Card><CardHeader><CardTitle className="text-base">Historial de Cambios</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1 text-xs max-h-40 overflow-y-auto">
                      {currentOrder.Log.map((entry, index) => (
                        <li key={index}>
                          {formatDateTime(entry.timestamp)} - {empleadosList.find(e => e._id === entry.userId)?.nombre || entry.userId || 'Sistema'}: {entry.action}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOrderDialogOpen} onOpenChange={setIsDeleteOrderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Seguro que deseas eliminar la orden OT-{orders.find(o=>o._id === orderToDeleteId)?.idOrder}?</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteOrder}>Eliminar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Diálogos para Marcas (Admin) --- */}
      <Dialog open={isCreateMarcaDialogOpen} onOpenChange={setIsCreateMarcaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nueva Marca</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">{renderDialogField("Nombre Marca", "marca", "text", "Ej: Toyota", "newMarca",undefined,false,false,true)}</div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateMarca}>Crear Marca</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditMarcaDialogOpen} onOpenChange={(open) => { setIsEditMarcaDialogOpen(open); if (!open) setCurrentMarca(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Marca: {currentMarca?.marca}</DialogTitle></DialogHeader>
          {currentMarca && <div className="space-y-4 py-4">{renderDialogField("Nombre Marca", "marca", "text", "Ej: Toyota", "editMarca",undefined,false,false,true)}</div>}
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
              <TableHeader><TableRow><TableHead>ID Modelo</TableHead><TableHead>Nombre Modelo</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {currentMarca.modelos.map(modelo => (
                <TableRow key={modelo.idModelo}>
                  <TableCell>{modelo.idModelo.substring(0,8)}...</TableCell>
                  <TableCell>{modelo.modelo}</TableCell>
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
            <div className="space-y-4 py-4">{renderDialogField("Nombre Modelo", "modelo", "text", "Ej: Corolla", "newModelo",undefined,false,false,true)}</div>
            <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateModelo}>Añadir Modelo</Button></DialogFooter>
          </DialogContent>
      </Dialog>
      {/* Diálogo para Editar Modelo */}
      <Dialog open={isEditModeloDialogOpen} onOpenChange={(open) => { setIsEditModeloDialogOpen(open); if (!open) setCurrentModelo(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Editar Modelo: {currentModelo?.modelo}</DialogTitle></DialogHeader>
            {currentModelo && (<div className="space-y-4 py-4">{renderDialogField("Nombre Modelo", "modelo", "text", "Ej: Corolla", "editModelo",undefined,false,false,true)}</div>)}
            <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateModelo}>Actualizar Modelo</Button></DialogFooter>
          </DialogContent>
      </Dialog>

      {/* --- Diálogos para Aseguradoras (Admin) --- */}
      <Dialog open={isCreateAseguradoraDialogOpen} onOpenChange={setIsCreateAseguradoraDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nueva Aseguradora</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {renderDialogField("Nombre Aseguradora", "nombre", "text", "Ej: Quálitas", "newAseguradora",undefined,false,false,true)}
            {renderDialogField("Teléfono", "telefono", "text", "Ej: 5512345678", "newAseguradora")}
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateAseguradora}>Crear Aseguradora</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditAseguradoraDialogOpen} onOpenChange={(open) => { setIsEditAseguradoraDialogOpen(open); if (!open) setCurrentAseguradora(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Aseguradora: {currentAseguradora?.nombre}</DialogTitle></DialogHeader>
          {currentAseguradora && (
            <div className="space-y-4 py-4">
              {renderDialogField("Nombre Aseguradora", "nombre", "text", "Ej: Quálitas", "editAseguradora",undefined,false,false,true)}
              {renderDialogField("Teléfono", "telefono", "text", "Ej: 5512345678", "editAseguradora")}
            </div>
          )}
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateAseguradora}>Actualizar Aseguradora</Button></DialogFooter>
        </DialogContent>
      </Dialog>
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
          <div className="my-4"><Button size="sm" onClick={() => { setNewAjustadorData({ nombre: '', telefono: '', correo: '' }); setIsCreateAjustadorDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Ajustador</Button></div>
          {currentAseguradora?.ajustadores && currentAseguradora.ajustadores.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>ID Ajustador</TableHead><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>Correo</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {currentAseguradora.ajustadores.map(aj => (
                <TableRow key={aj.idAjustador}>
                  <TableCell>{aj.idAjustador.substring(0,8)}...</TableCell>
                  <TableCell>{aj.nombre}</TableCell>
                  <TableCell>{aj.telefono || 'N/A'}</TableCell>
                  <TableCell>{aj.correo || 'N/A'}</TableCell>
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
      <Dialog open={isCreateAjustadorDialogOpen} onOpenChange={(open) => {setIsCreateAjustadorDialogOpen(open); if(!open) setNewAjustadorData({ nombre: '', telefono: '', correo: '' });}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Añadir Nuevo Ajustador a {currentAseguradora?.nombre}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              {renderDialogField("Nombre Ajustador", "nombre", "text", "Ej: Juan Pérez", "newAjustador",undefined,false,false,true)}
              {renderDialogField("Teléfono", "telefono", "text", "Ej: 5587654321", "newAjustador")}
              {renderDialogField("Correo Electrónico", "correo", "email", "Ej: juan.perez@example.com", "newAjustador")}
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
              {renderDialogField("Nombre Ajustador", "nombre", "text", "Ej: Juan Pérez", "editAjustador",undefined,false,false,true)}
              {renderDialogField("Teléfono", "telefono", "text", "Ej: 5587654321", "editAjustador")}
              {renderDialogField("Correo Electrónico", "correo", "email", "Ej: juan.perez@example.com", "editAjustador")}
            </div>)}
            <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateAjustador}>Actualizar Ajustador</Button></DialogFooter>
          </DialogContent>
      </Dialog>

      {/* --- Diálogos para Empleados (Admin) --- */}
      {/* Diálogo para Crear Nuevo Empleado */}
      <Dialog open={isCreateEmpleadoDialogOpen} onOpenChange={setIsCreateEmpleadoDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Empleado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              {renderDialogField("Nombre Completo", "nombre", "text", "Nombre del empleado", "newEmpleado", undefined, false, false, true)}
            </div>
            <div className="space-y-1">
              {renderDialogField("Puesto", "puesto", "text", "Puesto del empleado", "newEmpleado", undefined, false, false, true)}
            </div>
            <div className="space-y-1">
              {renderDialogField("Teléfono", "telefono", "text", "Número de teléfono", "newEmpleado")}
            </div>
            <div className="space-y-1">
              {renderDialogField("Correo Electrónico", "correo", "email", "Correo electrónico", "newEmpleado")}
            </div>
            <div className="space-y-1">
              {renderDialogField("Sueldo ($)", "sueldo", "number", "0.00", "newEmpleado")}
            </div>
            <div className="space-y-1">
              {renderDialogField("Comisión (%)", "comision", "number", "0", "newEmpleado")}
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="newEmpleado_createSystemUser" name="createSystemUser" checked={!!newEmpleadoData.createSystemUser} onCheckedChange={(checked) => handleCheckboxChangeGeneric('createSystemUser', checked as boolean, setNewEmpleadoData)} />
              <Label htmlFor="newEmpleado_createSystemUser" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Crear acceso al sistema</Label>
            </div>

            {newEmpleadoData.createSystemUser && (
              <>
                <hr className="my-3"/>
                <div className="space-y-1">
                  {renderDialogField("Nombre de Usuario (sistema)", "systemUserUsuario", "text", "usuario_sistema", "newEmpleado",undefined,false,false,true)}
                </div>
                <div className="space-y-1">
                  {renderDialogField("Contraseña (sistema)", "systemUserContraseña", "password", "••••••••", "newEmpleado",undefined,false,false,true)}
                </div>
                <div className="space-y-1">
                  {renderDialogField("Confirmar Contraseña", "systemUserConfirmContraseña", "password", "••••••••", "newEmpleado",undefined,false,false,true)}
                </div>
                <div className="space-y-1">
                  {renderDialogField("Rol en Sistema", "systemUserRol", "select", "Seleccionar rol...", "newEmpleado", userRoleOptions,false,false,true)}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateEmpleado}>Crear Empleado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diálogo para Editar Empleado */}
      <Dialog open={isEditEmpleadoDialogOpen} onOpenChange={(open) => { setIsEditEmpleadoDialogOpen(open); if (!open) setCurrentEmpleadoToEdit(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Empleado: {currentEmpleadoToEdit?.nombre}</DialogTitle></DialogHeader>
          {currentEmpleadoToEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-1">{renderDialogField("Nombre Completo", "nombre", "text", undefined, "editEmpleado",undefined,false,false,true)}</div>
              <div className="space-y-1">{renderDialogField("Puesto", "puesto", "text", undefined, "editEmpleado",undefined,false,false,true)}</div>
              <div className="space-y-1">{renderDialogField("Teléfono", "telefono", "text", undefined, "editEmpleado")}</div>
              <div className="space-y-1">{renderDialogField("Correo Electrónico", "correo", "email", undefined, "editEmpleado")}</div>
              <div className="space-y-1">{renderDialogField("Sueldo ($)", "sueldo", "number", undefined, "editEmpleado")}</div>
              <div className="space-y-1">{renderDialogField("Comisión (%)", "comision", "number", undefined, "editEmpleado")}</div>
              
              <hr className="my-3"/>
              {currentEmpleadoToEdit.user ? (
                <>
                  <p className="text-sm font-medium text-muted-foreground">Acceso al Sistema:</p>
                  <div className="space-y-1">{renderDialogField("Nombre de Usuario", "systemUserUsuario", "text", undefined, "editEmpleado", undefined, true, false, true)}</div>
                  <div className="space-y-1">{renderDialogField("Rol", "systemUserRol", "select", undefined, "editEmpleado", userRoleOptions, false, true, true)}</div>
                  <div className="space-y-1">{renderDialogField("Nueva Contraseña (opcional)", "newSystemUserContraseña", "password", "Dejar en blanco para no cambiar", "editEmpleado")}</div>
                  <div className="space-y-1">{renderDialogField("Confirmar Nueva Contraseña", "newSystemUserConfirmContraseña", "password", "Repetir nueva contraseña", "editEmpleado")}</div>
                  <Button variant="outline" size="sm" onClick={() => handleRemoveSystemUser(currentEmpleadoToEdit._id!)} className="mt-2 text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10">
                    <UserX className="mr-2 h-4 w-4"/>Remover Acceso al Sistema
                  </Button>
                </>
              ) : (
                <div className="flex items-center space-x-2 pt-2">
                   <Checkbox id="editEmpleado_createSystemUser" name="createSystemUser" checked={!!editEmpleadoData.createSystemUser} onCheckedChange={(checked) => handleCheckboxChangeGeneric('createSystemUser', checked as boolean, setEditEmpleadoData)} />
                   <Label htmlFor="editEmpleado_createSystemUser" className="text-sm font-medium">Añadir acceso al sistema</Label>
                </div>
              )}
              {/* Campos para añadir acceso si no lo tiene y createSystemUser es true */}
              {editEmpleadoData.createSystemUser && !currentEmpleadoToEdit.user && (
                <>
                  <div className="space-y-1">{renderDialogField("Nombre de Usuario (sistema)", "systemUserUsuario", "text", "usuario_sistema", "editEmpleado",undefined,false,false,true)}</div>
                  <div className="space-y-1">{renderDialogField("Contraseña (sistema)", "newSystemUserContraseña", "password", "••••••••", "editEmpleado",undefined,false,false,true)}</div>
                  <div className="space-y-1">{renderDialogField("Confirmar Contraseña", "newSystemUserConfirmContraseña", "password", "••••••••", "editEmpleado",undefined,false,false,true)}</div>
                  <div className="space-y-1">{renderDialogField("Rol en Sistema", "systemUserRol", "select", "Seleccionar rol...", "editEmpleado", userRoleOptions,false,false,true)}</div>
                </>
              )}
            </div>
          )}
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateEmpleado}>Actualizar Empleado</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteEmpleadoDialogOpen} onOpenChange={setIsDeleteEmpleadoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Seguro que deseas eliminar al empleado {empleadosList.find(e=>e._id === empleadoToDeleteId)?.nombre}?</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteEmpleado}>Eliminar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}


    