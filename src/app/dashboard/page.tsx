
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogOut, CalendarDays, Wrench, Package, PlusCircle, Edit, Trash2, EyeIcon, Car, Shield, Users, Settings, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

import { UserRole, type User } from '@/userManager'; // Changed import type for UserRole

import {
  getAllOrdersAction,
  createOrderAction,
  updateOrderAction,
  deleteOrderAction,
  getOrderByIdAction,
} from './service-orders/actions';
import type { Order, NewOrderData, UpdateOrderData } from '@/serviceOrderManager';

import {
  getAllMarcasAction,
  createMarcaAction,
  updateMarcaAction,
  deleteMarcaAction,
  addModeloToMarcaAction,
  updateModeloInMarcaAction,
  removeModeloFromMarcaAction,
} from './admin/marcas/actions';
import type { MarcaVehiculo, NewMarcaData as NewMarcaType, ModeloVehiculo } from '@/marcaManager';

import {
  getAllAseguradorasAction,
  createAseguradoraAction,
  updateAseguradoraAction,
  deleteAseguradoraAction,
  addAjustadorToAseguradoraAction,
  updateAjustadorInAseguradoraAction,
  removeAjustadorFromAseguradoraAction,
} from './admin/aseguradoras/actions';
import type { Aseguradora, NewAseguradoraData as NewAseguradoraType, Ajustador } from '@/aseguradoraManager';

import {
  getAllUsersAction,
  createUserAction,
  getUserByIdAction as getUserForEditAction, // Renamed to avoid conflict with local function
  updateUserAction,
  deleteUserAction as deleteUserAdminAction, // Renamed to avoid conflict
} from './admin/users/actions';


type OrderFormDataType = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'log'>>;
type MarcaFormDataType = Partial<Omit<MarcaVehiculo, '_id' | 'idMarca' | 'modelos'>>;
type ModeloFormDataType = Partial<ModeloVehiculo>;
type AseguradoraFormDataType = Partial<Omit<Aseguradora, '_id' | 'idAseguradora' | 'ajustadores'>>;
type AjustadorFormDataType = Partial<Ajustador>;
type UserFormDataType = Partial<Pick<User, 'idEmpleado' | 'usuario' | 'contraseña' | 'rol'>>;
type EditUserFormDataType = Partial<Pick<User, 'usuario' | 'contraseña' | 'rol'>>;


export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userName, setUserName] = useState<string | null>(null);
  const [userIdEmpleado, setUserIdEmpleado] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // --- Orders State ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false);
  const [isDeleteOrderDialogOpen, setIsDeleteOrderDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderToDeleteId, setOrderToDeleteId] = useState<string | null>(null);
  const initialNewOrderData: OrderFormDataType = { /* values will be filled by the form or defaults */ };
  const [newOrderData, setNewOrderData] = useState<OrderFormDataType>(initialNewOrderData);
  const [editOrderData, setEditOrderData] = useState<OrderFormDataType>({});

  // --- Marcas State ---
  const [marcas, setMarcas] = useState<MarcaVehiculo[]>([]);
  const [isLoadingMarcas, setIsLoadingMarcas] = useState(true);
  const [isCreateMarcaDialogOpen, setIsCreateMarcaDialogOpen] = useState(false);
  const [isEditMarcaDialogOpen, setIsEditMarcaDialogOpen] = useState(false);
  const [isDeleteMarcaDialogOpen, setIsDeleteMarcaDialogOpen] = useState(false);
  const [currentMarca, setCurrentMarca] = useState<MarcaVehiculo | null>(null);
  const [marcaToDeleteId, setMarcaToDeleteId] = useState<string | null>(null);
  const [newMarcaData, setNewMarcaData] = useState<MarcaFormDataType>({ marca: '' });
  const [editMarcaData, setEditMarcaData] = useState<MarcaFormDataType>({});

  // --- Modelos State (related to a currentMarca) ---
  const [isManageModelosDialogOpen, setIsManageModelosDialogOpen] = useState(false);
  const [isCreateModeloDialogOpen, setIsCreateModeloDialogOpen] = useState(false);
  const [isEditModeloDialogOpen, setIsEditModeloDialogOpen] = useState(false);
  const [currentModelo, setCurrentModelo] = useState<ModeloVehiculo | null>(null);
  const [newModeloData, setNewModeloData] = useState<ModeloFormDataType>({ idModelo: undefined, modelo: '' });
  const [editModeloData, setEditModeloData] = useState<ModeloFormDataType>({});

  // --- Aseguradoras State ---
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  const [isLoadingAseguradoras, setIsLoadingAseguradoras] = useState(true);
  const [isCreateAseguradoraDialogOpen, setIsCreateAseguradoraDialogOpen] = useState(false);
  const [isEditAseguradoraDialogOpen, setIsEditAseguradoraDialogOpen] = useState(false);
  const [isDeleteAseguradoraDialogOpen, setIsDeleteAseguradoraDialogOpen] = useState(false);
  const [currentAseguradora, setCurrentAseguradora] = useState<Aseguradora | null>(null);
  const [aseguradoraToDeleteId, setAseguradoraToDeleteId] = useState<string | null>(null);
  const [newAseguradoraData, setNewAseguradoraData] = useState<AseguradoraFormDataType>({ nombre: '', telefono: '' });
  const [editAseguradoraData, setEditAseguradoraData] = useState<AseguradoraFormDataType>({});

  // --- Ajustadores State (related to currentAseguradora) ---
  const [isManageAjustadoresDialogOpen, setIsManageAjustadoresDialogOpen] = useState(false);
  const [isCreateAjustadorDialogOpen, setIsCreateAjustadorDialogOpen] = useState(false);
  const [isEditAjustadorDialogOpen, setIsEditAjustadorDialogOpen] = useState(false);
  const [currentAjustador, setCurrentAjustador] = useState<Ajustador | null>(null);
  const [newAjustadorData, setNewAjustadorData] = useState<AjustadorFormDataType>({ nombre: '', telefono: '', correo: '' });
  const [editAjustadorData, setEditAjustadorData] = useState<AjustadorFormDataType>({});

  // --- Users (Admin) State ---
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingUsersList, setIsLoadingUsersList] = useState(true);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState<UserFormDataType>({ idEmpleado: undefined, usuario: '', contraseña: '', rol: UserRole.ASESOR });
  const [editUserData, setEditUserData] = useState<EditUserFormDataType>({});
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);


  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('username');
    const storedIdEmpleado = localStorage.getItem('idEmpleado');
    const storedUserRole = localStorage.getItem('userRole') as UserRole;

    if (loggedIn !== 'true' || !storedUser) {
      router.replace('/');
    } else {
      setUserName(storedUser);
      setUserRole(storedUserRole);
      if (storedIdEmpleado) {
        const parsedId = parseInt(storedIdEmpleado, 10);
        setUserIdEmpleado(parsedId);
        setNewOrderData(prev => ({ ...prev, idAsesor: parsedId }));
      }
      fetchOrders();
      if (storedUserRole === UserRole.ADMIN) {
        fetchMarcas();
        fetchAseguradoras();
        fetchUsers();
      }
    }
  }, [router]);

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    const result = await getAllOrdersAction();
    if (result.success && result.data) setOrders(result.data);
    else toast({ title: "Error", description: result.error || "No se pudieron cargar las órdenes.", variant: "destructive" });
    setIsLoadingOrders(false);
  };

  const fetchMarcas = async () => {
    setIsLoadingMarcas(true);
    const result = await getAllMarcasAction();
    if (result.success && result.data) setMarcas(result.data);
    else toast({ title: "Error", description: result.error || "No se pudieron cargar las marcas.", variant: "destructive" });
    setIsLoadingMarcas(false);
  };

  const fetchAseguradoras = async () => {
    setIsLoadingAseguradoras(true);
    const result = await getAllAseguradorasAction();
    if (result.success && result.data) setAseguradoras(result.data);
    else toast({ title: "Error", description: result.error || "No se pudieron cargar las aseguradoras.", variant: "destructive" });
    setIsLoadingAseguradoras(false);
  };

  const fetchUsers = async () => {
    setIsLoadingUsersList(true);
    const result = await getAllUsersAction();
    if (result.success && result.data) setUsersList(result.data);
    else toast({ title: "Error", description: result.error || "No se pudieron cargar los usuarios.", variant: "destructive" });
    setIsLoadingUsersList(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('idEmpleado');
    localStorage.removeItem('userRole');
    router.replace('/');
  };

  const handleInputChangeGeneric = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setState: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;
    if (type === 'number') processedValue = value === '' ? undefined : parseFloat(value);
    if (type === 'checkbox') processedValue = (e.target as HTMLInputElement).checked;
    if (type === 'date') processedValue = value ? new Date(value) : undefined; // Keep as Date
    setState((prev: any) => ({ ...prev, [name]: processedValue }));
  };

  const handleSelectChangeGeneric = (
    name: string, value: string,
    setState: React.Dispatch<React.SetStateAction<any>>
  ) => {
    setState((prev: any) => ({ ...prev, [name]: value }));
  };

  // --- Order Management Functions ---
  const handleOrderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formType: 'new' | 'edit') => {
    handleInputChangeGeneric(e, formType === 'new' ? setNewOrderData : setEditOrderData);
  };
  const handleOrderSelectChange = (name: keyof OrderFormDataType, value: string, formType: 'new' | 'edit') => {
    handleSelectChangeGeneric(name, value, formType === 'new' ? setNewOrderData : setEditOrderData);
  };
  const handleCreateOrder = async () => {
    if (!newOrderData.placas || !newOrderData.idCliente) {
      toast({ title: "Error de Validación", description: "Placas e ID Cliente son obligatorios.", variant: "destructive" });
      return;
    }
    const orderToCreate: NewOrderData = {
      placas: newOrderData.placas,
      idCliente: Number(newOrderData.idCliente),
      vin: newOrderData.vin,
      idMarca: newOrderData.idMarca ? Number(newOrderData.idMarca) : undefined,
      idModelo: newOrderData.idModelo ? Number(newOrderData.idModelo) : undefined,
      año: newOrderData.año ? Number(newOrderData.año) : undefined,
      color: newOrderData.color,
      kilometraje: newOrderData.kilometraje,
      idAseguradora: newOrderData.idAseguradora ? Number(newOrderData.idAseguradora) : undefined,
      ajustador: newOrderData.ajustador ? Number(newOrderData.ajustador) : undefined,
      siniestro: newOrderData.siniestro,
      poliza: newOrderData.poliza,
      folio: newOrderData.folio,
      deducible: newOrderData.deducible ? Number(newOrderData.deducible) : undefined,
      aseguradoTercero: newOrderData.aseguradoTercero,
      piso: newOrderData.piso,
      grua: newOrderData.grua,
      fechaValuacion: newOrderData.fechaValuacion,
      fechaRengreso: newOrderData.fechaRengreso,
      fechaEntrega: newOrderData.fechaEntrega,
      fechaPromesa: newOrderData.fechaPromesa,
      idValuador: newOrderData.idValuador ? Number(newOrderData.idValuador) : undefined,
      idAsesor: newOrderData.idAsesor ? Number(newOrderData.idAsesor) : userIdEmpleado,
      idHojalatero: newOrderData.idHojalatero ? Number(newOrderData.idHojalatero) : undefined,
      idPintor: newOrderData.idPintor ? Number(newOrderData.idPintor) : undefined,
      idPresupuesto: newOrderData.idPresupuesto ? Number(newOrderData.idPresupuesto) : undefined,
      urlArchivos: newOrderData.urlArchivos,
      proceso: newOrderData.proceso
    };

    const result = await createOrderAction(orderToCreate, userIdEmpleado || undefined);
    if (result.success && result.data) {
      toast({ title: "Éxito", description: `Orden OT-${String(result.data.customOrderId || '').padStart(4, '0')} creada.` });
      setIsCreateOrderDialogOpen(false); fetchOrders(); setNewOrderData({ ...initialNewOrderData, idAsesor: userIdEmpleado || undefined });
    } else {
      toast({ title: "Error al Crear", description: result.error || "No se pudo crear la orden.", variant: "destructive" });
    }
  };
  const openEditOrderDialog = async (orderId: string) => {
    const result = await getOrderByIdAction(orderId);
    if (result.success && result.data) {
      const order = result.data;
      setCurrentOrder(order);
      setEditOrderData({
        ...order,
        fechaValuacion: order.fechaValuacion ? new Date(order.fechaValuacion) : undefined,
        fechaRengreso: order.fechaRengreso ? new Date(order.fechaRengreso) : undefined,
        fechaEntrega: order.fechaEntrega ? new Date(order.fechaEntrega) : undefined,
        fechaPromesa: order.fechaPromesa ? new Date(order.fechaPromesa) : undefined,
      });
      setIsEditOrderDialogOpen(true);
    } else {
      toast({ title: "Error", description: "No se pudo cargar la orden para editar.", variant: "destructive" });
    }
  };
  const handleUpdateOrder = async () => {
    if (!currentOrder || !currentOrder._id) return;
    const dataToUpdate: UpdateOrderData = { ...editOrderData, };
    Object.keys(dataToUpdate).forEach(key => {
      const k = key as keyof UpdateOrderData;
      if (['idCliente', 'idMarca', 'idModelo', 'año', 'idAseguradora', 'ajustador', 'deducible', 'idValuador', 'idAsesor', 'idHojalatero', 'idPintor', 'idPresupuesto'].includes(k)) {
        if (dataToUpdate[k] !== undefined && dataToUpdate[k] !== null && dataToUpdate[k] !== '') {
          (dataToUpdate as any)[k] = Number(dataToUpdate[k]);
        } else {
           (dataToUpdate as any)[k] = undefined;
        }
      }
      if (dataToUpdate[k] === undefined) delete dataToUpdate[k];
    });

    const result = await updateOrderAction(currentOrder._id.toString(), dataToUpdate, userIdEmpleado || undefined);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsEditOrderDialogOpen(false); fetchOrders(); setCurrentOrder(null); setEditOrderData({});
    } else {
      toast({ title: "Error al Actualizar", description: result.error, variant: "destructive" });
    }
  };
  const openViewOrderDialog = async (orderId: string) => {
    const result = await getOrderByIdAction(orderId);
    if (result.success && result.data) { setCurrentOrder(result.data); setIsViewOrderDialogOpen(true); }
    else { toast({ title: "Error", description: "No se pudo cargar la orden.", variant: "destructive" });}
  };
  const openDeleteOrderDialog = (orderId: string) => { setOrderToDeleteId(orderId); setIsDeleteOrderDialogOpen(true); };
  const handleDeleteOrder = async () => {
    if (!orderToDeleteId) return;
    const result = await deleteOrderAction(orderToDeleteId);
    if (result.success) { toast({ title: "Éxito", description: result.message }); fetchOrders(); }
    else { toast({ title: "Error", description: result.error, variant: "destructive" }); }
    setIsDeleteOrderDialogOpen(false); setOrderToDeleteId(null);
  };

  // --- Marca Management Functions ---
  const handleCreateMarca = async () => {
    if (!newMarcaData.marca?.trim()) {
      toast({ title: "Error", description: "El nombre de la marca es obligatorio.", variant: "destructive" }); return;
    }
    const result = await createMarcaAction(newMarcaData as NewMarcaType);
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
    else { toast({ title: "Error", description: result.error, variant: "destructive" }); }
    setIsDeleteMarcaDialogOpen(false); setMarcaToDeleteId(null);
  };

  // --- Modelo Management ---
  const openManageModelosDialog = (marca: MarcaVehiculo) => { setCurrentMarca(marca); setIsManageModelosDialogOpen(true); };
  const handleCreateModelo = async () => {
    if (!currentMarca || !currentMarca._id || !newModeloData.idModelo || !newModeloData.modelo?.trim()) {
      toast({ title: "Error", description: "ID Modelo y Nombre son requeridos.", variant: "destructive" }); return;
    }
    const result = await addModeloToMarcaAction(currentMarca._id.toString(), { ...newModeloData, idModelo: Number(newModeloData.idModelo) } as ModeloVehiculo);
    if (result.success) {
      toast({ title: "Éxito", description: "Modelo añadido." });
      fetchMarcas().then(() => { const updatedMarca = marcas.find(m => m._id === currentMarca._id); if (updatedMarca) setCurrentMarca(updatedMarca); });
      setNewModeloData({ idModelo: undefined, modelo: '' });
      setIsCreateModeloDialogOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el modelo.", variant: "destructive" });
    }
  };
  const openEditModeloDialog = (modelo: ModeloVehiculo) => { setCurrentModelo(modelo); setEditModeloData({ idModelo: modelo.idModelo, modelo: modelo.modelo }); setIsEditModeloDialogOpen(true); };
  const handleUpdateModelo = async () => {
    if (!currentMarca?._id || !currentModelo?.idModelo || !editModeloData.modelo?.trim()) {
      toast({ title: "Error", description: "Datos de modelo inválidos.", variant: "destructive" }); return;
    }
    const result = await updateModeloInMarcaAction(currentMarca._id.toString(), currentModelo.idModelo, { modelo: editModeloData.modelo });
    if (result.success) {
      toast({ title: "Éxito", description: "Modelo actualizado." });
      fetchMarcas().then(() => { const updatedMarca = marcas.find(m => m._id === currentMarca._id); if (updatedMarca) setCurrentMarca(updatedMarca); });
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
      fetchMarcas().then(() => { const updatedMarca = marcas.find(m => m._id === currentMarca._id); if (updatedMarca) setCurrentMarca(updatedMarca); });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar el modelo.", variant: "destructive" });
    }
  };

  // --- Aseguradora Management Functions ---
  const handleCreateAseguradora = async () => {
    if (!newAseguradoraData.nombre?.trim()) {
      toast({ title: "Error", description: "El nombre de la aseguradora es obligatorio.", variant: "destructive" }); return;
    }
    const result = await createAseguradoraAction(newAseguradoraData as NewAseguradoraType);
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
    else { toast({ title: "Error", description: result.error, variant: "destructive" }); }
    setIsDeleteAseguradoraDialogOpen(false); setAseguradoraToDeleteId(null);
  };

  // --- Ajustador Management ---
  const openManageAjustadoresDialog = (aseguradora: Aseguradora) => { setCurrentAseguradora(aseguradora); setIsManageAjustadoresDialogOpen(true); };
  const handleCreateAjustador = async () => {
    if (!currentAseguradora?._id || !newAjustadorData.nombre?.trim()) {
      toast({ title: "Error", description: "Nombre del ajustador es requerido.", variant: "destructive" }); return;
    }
    const result = await addAjustadorToAseguradoraAction(currentAseguradora._id.toString(), { nombre: newAjustadorData.nombre, telefono: newAjustadorData.telefono, correo: newAjustadorData.correo });
    if (result.success && result.data) {
      toast({ title: "Éxito", description: "Ajustador añadido." });
      fetchAseguradoras().then(() => { const updatedAseguradora = aseguradoras.find(a => a._id === currentAseguradora._id); if (updatedAseguradora) setCurrentAseguradora(updatedAseguradora); });
      setNewAjustadorData({ nombre: '', telefono: '', correo: '' }); setIsCreateAjustadorDialogOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo crear el ajustador.", variant: "destructive" });
    }
  };
  const openEditAjustadorDialog = (ajustador: Ajustador) => { setCurrentAjustador(ajustador); setEditAjustadorData(ajustador); setIsEditAjustadorDialogOpen(true); };
  const handleUpdateAjustador = async () => {
    if (!currentAseguradora?._id || !currentAjustador?.idAjustador || !editAjustadorData.nombre?.trim()) {
      toast({ title: "Error", description: "Datos de ajustador inválidos.", variant: "destructive" }); return;
    }
    const result = await updateAjustadorInAseguradoraAction(currentAseguradora._id.toString(), currentAjustador.idAjustador, { nombre: editAjustadorData.nombre, telefono: editAjustadorData.telefono, correo: editAjustadorData.correo });
    if (result.success) {
      toast({ title: "Éxito", description: "Ajustador actualizado." });
       fetchAseguradoras().then(() => { const updatedAseguradora = aseguradoras.find(a => a._id === currentAseguradora._id); if (updatedAseguradora) setCurrentAseguradora(updatedAseguradora); });
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
      fetchAseguradoras().then(() => { const updatedAseguradora = aseguradoras.find(a => a._id === currentAseguradora._id); if (updatedAseguradora) setCurrentAseguradora(updatedAseguradora); });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar el ajustador.", variant: "destructive" });
    }
  };

  // --- User (Admin) Management Functions ---
  const handleCreateUser = async () => {
    if (!newUserData.idEmpleado || !newUserData.usuario?.trim() || !newUserData.contraseña?.trim() || !newUserData.rol) {
      toast({ title: "Error de Validación", description: "Todos los campos son obligatorios para crear un usuario.", variant: "destructive" });
      return;
    }
    const result = await createUserAction(newUserData as Required<UserFormDataType>);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsCreateUserDialogOpen(false); fetchUsers(); setNewUserData({ idEmpleado: undefined, usuario: '', contraseña: '', rol: UserRole.ASESOR });
    } else {
      toast({ title: "Error al Crear Usuario", description: result.error, variant: "destructive" });
    }
  };

  const openEditUserDialog = async (userId: string) => {
    const result = await getUserForEditAction(userId);
    if (result.success && result.data) {
      setCurrentUserToEdit(result.data);
      setEditUserData({
        usuario: result.data.usuario,
        rol: result.data.rol,
        contraseña: '' // Dejar vacío para no cambiarla por defecto
      });
      setIsEditUserDialogOpen(true);
    } else {
      toast({ title: "Error", description: result.error || "No se pudo cargar el usuario para editar.", variant: "destructive" });
    }
  };

  const handleUpdateUser = async () => {
    if (!currentUserToEdit || !currentUserToEdit._id) return;
    if (!editUserData.usuario?.trim() || !editUserData.rol) {
       toast({ title: "Error de Validación", description: "Usuario y Rol son obligatorios.", variant: "destructive" });
       return;
    }
    const dataToUpdate: EditUserFormDataType = {
        usuario: editUserData.usuario,
        rol: editUserData.rol,
    };
    if (editUserData.contraseña && editUserData.contraseña.trim() !== '') {
        dataToUpdate.contraseña = editUserData.contraseña;
    }

    const result = await updateUserAction(currentUserToEdit._id.toString(), dataToUpdate);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      setIsEditUserDialogOpen(false); fetchUsers(); setCurrentUserToEdit(null); setEditUserData({});
    } else {
      toast({ title: "Error al Actualizar Usuario", description: result.error, variant: "destructive" });
    }
  };

  const openDeleteUserDialog = (userId: string) => {
    setUserToDeleteId(userId);
    setIsDeleteUserDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDeleteId) return;
    const result = await deleteUserAdminAction(userToDeleteId);
    if (result.success) {
      toast({ title: "Éxito", description: result.message });
      fetchUsers();
    } else {
      toast({ title: "Error al Eliminar Usuario", description: result.error, variant: "destructive" });
    }
    setIsDeleteUserDialogOpen(false);
    setUserToDeleteId(null);
  };


  const formatDate = (dateInput?: Date | string): string => {
    if (!dateInput) return 'N/A';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Fecha Inválida';
    // Force interpretation as local time if it's a 'yyyy-mm-dd' string
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.valueOf() + timezoneOffset);
    return localDate.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };
  const formatDateTime = (dateInput?: Date | string): string => {
    if (!dateInput) return 'N/A';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Fecha Inválida';
    return date.toLocaleString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  };
  const getProcesoVariant = (proceso?: Order['proceso']): "default" | "secondary" | "outline" | "destructive" => {
    switch (proceso) {
      case 'entregado': case 'facturado': return 'default';
      case 'listo_entrega': return 'default';
      case 'hojalateria': case 'pintura': case 'mecanica': case 'armado': case 'detallado_lavado': case 'control_calidad': case 'refacciones_listas': case 'preparacion_pintura': return 'secondary';
      case 'espera_refacciones': case 'valuacion': case 'garantia': return 'outline';
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
  const userRoleOptions = Object.values(UserRole).map(role => ({ value: role, label: role.charAt(0).toUpperCase() + role.slice(1) }));


  const renderDialogField = (
      label: string, name: any, type: string = "text", placeholder?: string,
      formType: 'newOrder' | 'editOrder' | 'newMarca' | 'editMarca' | 'newModelo' | 'editModelo' | 'newAseguradora' | 'editAseguradora' | 'newAjustador' | 'editAjustador' | 'newUser' | 'editUser' = 'newOrder',
      options?: { value: string; label: string }[], isCheckbox?: boolean, isTextarea?: boolean
    ) => {
    let data: any;
    let handler: any;
    let selectHandler: any;

    switch (formType) {
        case 'newOrder': data = newOrderData; handler = handleOrderInputChange; selectHandler = handleOrderSelectChange; break;
        case 'editOrder': data = editOrderData; handler = handleOrderInputChange; selectHandler = handleOrderSelectChange; break;
        case 'newMarca': data = newMarcaData; handler = (e:any) => handleInputChangeGeneric(e, setNewMarcaData); break;
        case 'editMarca': data = editMarcaData; handler = (e:any) => handleInputChangeGeneric(e, setEditMarcaData); break;
        case 'newModelo': data = newModeloData; handler = (e:any) => handleInputChangeGeneric(e, setNewModeloData); break;
        case 'editModelo': data = editModeloData; handler = (e:any) => handleInputChangeGeneric(e, setEditModeloData); break;
        case 'newAseguradora': data = newAseguradoraData; handler = (e:any) => handleInputChangeGeneric(e, setNewAseguradoraData); break;
        case 'editAseguradora': data = editAseguradoraData; handler = (e:any) => handleInputChangeGeneric(e, setEditAseguradoraData); break;
        case 'newAjustador': data = newAjustadorData; handler = (e:any) => handleInputChangeGeneric(e, setNewAjustadorData); break;
        case 'editAjustador': data = editAjustadorData; handler = (e:any) => handleInputChangeGeneric(e, setEditAjustadorData); break;
        case 'newUser': data = newUserData; handler = (e:any) => handleInputChangeGeneric(e, setNewUserData); selectHandler = (n:any,v:any) => handleSelectChangeGeneric(n,v, setNewUserData); break;
        case 'editUser': data = editUserData; handler = (e:any) => handleInputChangeGeneric(e, setEditUserData); selectHandler = (n:any,v:any) => handleSelectChangeGeneric(n,v, setEditUserData); break;
        default: data = {}; handler = () => {}; selectHandler = () => {};
    }
    const value = data[name] as any;
    const currentFormType = formType.endsWith('Order') ? formType.substring(0, formType.length - 5) as 'new' | 'edit' : formType;


    if (isCheckbox) {
      return (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={`${formType}_${name}`} className="text-right col-span-3">{label}</Label>
          <Checkbox id={`${formType}_${name}`} name={name} checked={!!value} onCheckedChange={(checked) => handler({ target: { name, value: checked, type: 'checkbox' } }, currentFormType)} className="col-span-1 justify-self-start" />
        </div>
      );
    }
    if (isTextarea) {
      return (
        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor={`${formType}_${name}`} className="text-right pt-2">{label}</Label>
          <Textarea id={`${formType}_${name}`} name={name} value={value || ''} onChange={(e) => handler(e, currentFormType)} className="col-span-3" placeholder={placeholder} />
        </div>
      );
    }
    if (options) {
      return (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={`${formType}_${name}`} className="text-right">{label}</Label>
          <Select name={name} value={String(value || '')} onValueChange={(val) => selectHandler(name, val, currentFormType )}>
            <SelectTrigger className="col-span-3"> <SelectValue placeholder={placeholder || "Seleccionar..."} /> </SelectTrigger>
            <SelectContent> {options.map(opt => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)} </SelectContent>
          </Select>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${formType}_${name}`} className="text-right">{label}</Label>
        <Input id={`${formType}_${name}`} name={name} type={type}
          value={type === 'date' && value instanceof Date ? value.toISOString().split('T')[0] : (value || '')}
          onChange={(e) => handler(e, currentFormType)}
          className="col-span-3" placeholder={placeholder}
          disabled={formType === 'editUser' && name === 'idEmpleado'}
        />
      </div>
    );
  };


  if (!userName || !userRole) {
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


  return (
    <div className="flex min-h-screen flex-col bg-muted/30 dark:bg-muted/10">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 shadow-sm">
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Panel del Taller Automotriz</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Bienvenido, <span className="font-medium text-foreground">{userName} (ID: {userIdEmpleado}, Rol: {userRole})</span>!
            </span>
            <Button onClick={handleLogout} variant="outline" size="sm"><LogOut className="mr-2 h-4 w-4" />Cerrar Sesión</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <Tabs defaultValue="ordenes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 mb-6 rounded-lg p-1 bg-muted">
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
                    <Button size="sm" onClick={() => { setNewOrderData({...initialNewOrderData, idAsesor: userIdEmpleado || undefined, proceso: 'pendiente' }); setIsCreateOrderDialogOpen(true);}}><PlusCircle className="mr-2 h-4 w-4" /> Nueva Orden</Button>
                </CardHeader>
                <CardContent>
                    {isLoadingOrders ? <p>Cargando órdenes...</p> : orders.length === 0 ?
                    <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay órdenes de servicio registradas.</p></div>
                    : (
                    <Table>
                        <TableCaption>Listado de órdenes de servicio.</TableCaption>
                        <TableHeader><TableRow><TableHead>OT</TableHead><TableHead>Cliente ID</TableHead><TableHead>Placas</TableHead><TableHead>Proceso</TableHead><TableHead>Registro</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order._id?.toString()}>
                            <TableCell className="font-medium">OT-{String(order.idOrder).padStart(4, '0')}</TableCell>
                            <TableCell>{order.idCliente || 'N/A'}</TableCell>
                            <TableCell>{order.placas || 'N/A'}</TableCell>
                            <TableCell><Badge variant={getProcesoVariant(order.proceso)}>{order.proceso || 'N/A'}</Badge></TableCell>
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
              <Tabs defaultValue="marcas" className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-4 rounded-md p-1 bg-muted/70">
                  <TabsTrigger value="marcas" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Car className="mr-2 h-4 w-4" />Marcas/Modelos</TabsTrigger>
                  <TabsTrigger value="aseguradoras" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Shield className="mr-2 h-4 w-4"/>Aseguradoras</TabsTrigger>
                  <TabsTrigger value="usuarios" className="data-[state=active]:bg-background data-[state=active]:shadow-sm"><Users className="mr-2 h-4 w-4"/>Usuarios</TabsTrigger>
                </TabsList>
                <TabsContent value="marcas">
                  <Card className="shadow-lg border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <div><CardTitle className="text-xl">Gestión de Marcas y Modelos</CardTitle><CardDescription>Añade, edita o elimina marcas de vehículos y sus modelos.</CardDescription></div>
                      <Button size="sm" onClick={() => { setNewMarcaData({marca: ''}); setIsCreateMarcaDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Nueva Marca</Button>
                    </CardHeader>
                    <CardContent>
                      {isLoadingMarcas ? <p>Cargando marcas...</p> : marcas.length === 0 ?
                        <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay marcas registradas.</p></div>
                        : (
                          <Table>
                            <TableHeader><TableRow><TableHead>ID Marca</TableHead><TableHead>Nombre Marca</TableHead><TableHead>Modelos</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
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
                        <div><CardTitle className="text-xl">Gestión de Aseguradoras</CardTitle><CardDescription>Administra compañías aseguradoras y sus ajustadores.</CardDescription></div>
                        <Button size="sm" onClick={() => { setNewAseguradoraData({nombre: '', telefono: ''}); setIsCreateAseguradoraDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Nueva Aseguradora</Button>
                        </CardHeader>
                        <CardContent>
                        {isLoadingAseguradoras ? <p>Cargando aseguradoras...</p> : aseguradoras.length === 0 ?
                            <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay aseguradoras registradas.</p></div>
                            : (
                            <Table>
                                <TableHeader><TableRow><TableHead>ID Aseg.</TableHead><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>Ajustadores</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
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
                <TabsContent value="usuarios">
                    <Card className="shadow-lg border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div><CardTitle className="text-xl">Gestión de Usuarios</CardTitle><CardDescription>Administra los usuarios del sistema.</CardDescription></div>
                        <Button size="sm" onClick={() => { setNewUserData({idEmpleado: undefined, usuario: '', contraseña: '', rol: UserRole.ASESOR }); setIsCreateUserDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Usuario</Button>
                        </CardHeader>
                        <CardContent>
                        {isLoadingUsersList ? <p>Cargando usuarios...</p> : usersList.length === 0 ?
                            <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50"><p className="text-muted-foreground">No hay usuarios registrados.</p></div>
                            : (
                            <Table>
                                <TableHeader><TableRow><TableHead>ID Empleado</TableHead><TableHead>Usuario</TableHead><TableHead>Rol</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                                <TableBody>
                                {usersList.map((user) => (
                                    <TableRow key={user._id?.toString()}>
                                    <TableCell>{user.idEmpleado}</TableCell>
                                    <TableCell className="font-medium">{user.usuario}</TableCell>
                                    <TableCell>{user.rol}</TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="icon" onClick={() => openEditUserDialog(user._id!.toString())}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => openDeleteUserDialog(user._id!.toString())}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <h3 className="font-semibold text-lg border-b pb-2 mb-2">Datos del Vehículo</h3>
            {renderDialogField("Placas*", "placas", "text", "Ej: ABC-123", "newOrder")}
            {renderDialogField("VIN", "vin", "text", "Número de Identificación Vehicular", "newOrder")}
            {renderDialogField("ID Marca", "idMarca", "number", "ID numérico de la marca", "newOrder")}
            {renderDialogField("ID Modelo", "idModelo", "number", "ID numérico del modelo", "newOrder")}
            {renderDialogField("Año", "año", "number", "Ej: 2020", "newOrder")}
            {renderDialogField("Color", "color", "text", "Ej: Rojo", "newOrder")}
            {renderDialogField("Kilometraje", "kilometraje", "text", "Ej: 55000 km", "newOrder")}
            
            <h3 className="font-semibold text-lg border-b pb-2 mb-2 mt-4">Datos del Cliente</h3>
            {renderDialogField("ID Cliente*", "idCliente", "number", "ID numérico del cliente", "newOrder")}
            
            <h3 className="font-semibold text-lg border-b pb-2 mb-2 mt-4">Datos de Aseguradora (Opcional)</h3>
            {renderDialogField("ID Aseguradora", "idAseguradora", "number", "ID numérico", "newOrder")}
            {renderDialogField("ID Ajustador", "ajustador", "number", "ID numérico", "newOrder")}
            {renderDialogField("Siniestro", "siniestro", "text", "No. Siniestro", "newOrder")}
            {renderDialogField("Póliza", "poliza", "text", "No. Póliza", "newOrder")}
            {renderDialogField("Folio", "folio", "text", "Folio dictamen/pase", "newOrder")}
            {renderDialogField("Deducible", "deducible", "number", "Monto deducible", "newOrder")}
            {renderDialogField("Tipo", "aseguradoTercero", "select", "Tipo de cliente", "newOrder", [{value: 'asegurado', label: 'Asegurado'}, {value: 'tercero', label: 'Tercero'}])}

            <h3 className="font-semibold text-lg border-b pb-2 mb-2 mt-4">Detalles Adicionales y Asignaciones</h3>
            {renderDialogField("¿Es de piso?", "piso", "checkbox", "", "newOrder", undefined, true)}
            {renderDialogField("¿Llegó en grúa?", "grua", "checkbox", "", "newOrder", undefined, true)}
            {renderDialogField("URL Archivos", "urlArchivos", "text", "Link a carpeta de archivos", "newOrder")}
            {renderDialogField("Proceso Inicial", "proceso", "select", "Seleccionar proceso", "newOrder", procesoOptions.map(p => ({value: p, label: p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())})))}
            {renderDialogField("ID Valuador", "idValuador", "number", "ID Empleado", "newOrder")}
            {renderDialogField("ID Asesor", "idAsesor", "number", `ID Empleado (def: ${userIdEmpleado})`, "newOrder")}
            {renderDialogField("ID Hojalatero", "idHojalatero", "number", "ID Empleado", "newOrder")}
            {renderDialogField("ID Pintor", "idPintor", "number", "ID Empleado", "newOrder")}
            {renderDialogField("ID Presupuesto", "idPresupuesto", "number", "ID del presupuesto asociado", "newOrder")}

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
            <h3 className="font-semibold text-lg border-b pb-2 mb-2">Datos del Vehículo</h3>
            {renderDialogField("Placas*", "placas", "text", "Ej: ABC-123", "editOrder")}
            {renderDialogField("VIN", "vin", "text", "Número de Identificación Vehicular", "editOrder")}
            {renderDialogField("ID Marca", "idMarca", "number", "ID numérico de la marca", "editOrder")}
            {renderDialogField("ID Modelo", "idModelo", "number", "ID numérico del modelo", "editOrder")}
            {renderDialogField("Año", "año", "number", "Ej: 2020", "editOrder")}
            {renderDialogField("Color", "color", "text", "Ej: Rojo", "editOrder")}
            {renderDialogField("Kilometraje", "kilometraje", "text", "Ej: 55000 km", "editOrder")}
            
            <h3 className="font-semibold text-lg border-b pb-2 mb-2 mt-4">Datos del Cliente</h3>
            {renderDialogField("ID Cliente*", "idCliente", "number", "ID numérico del cliente", "editOrder")}
            
            <h3 className="font-semibold text-lg border-b pb-2 mb-2 mt-4">Datos de Aseguradora</h3>
            {renderDialogField("ID Aseguradora", "idAseguradora", "number", "ID numérico", "editOrder")}
            {renderDialogField("ID Ajustador", "ajustador", "number", "ID numérico", "editOrder")}
            {renderDialogField("Siniestro", "siniestro", "text", "No. Siniestro", "editOrder")}
            {renderDialogField("Póliza", "poliza", "text", "No. Póliza", "editOrder")}
            {renderDialogField("Folio", "folio", "text", "Folio dictamen/pase", "editOrder")}
            {renderDialogField("Deducible", "deducible", "number", "Monto deducible", "editOrder")}
            {renderDialogField("Tipo", "aseguradoTercero", "select", "Tipo de cliente", "editOrder", [{value: 'asegurado', label: 'Asegurado'}, {value: 'tercero', label: 'Tercero'}])}

            <h3 className="font-semibold text-lg border-b pb-2 mb-2 mt-4">Detalles Adicionales y Asignaciones</h3>
            {renderDialogField("¿Es de piso?", "piso", "checkbox", "", "editOrder", undefined, true)}
            {renderDialogField("¿Llegó en grúa?", "grua", "checkbox", "", "editOrder", undefined, true)}
            {renderDialogField("URL Archivos", "urlArchivos", "text", "Link a carpeta de archivos", "editOrder")}
            {renderDialogField("Proceso Actual", "proceso", "select", "Seleccionar proceso", "editOrder", procesoOptions.map(p => ({value: p, label: p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())})))}
            {renderDialogField("ID Valuador", "idValuador", "number", "ID Empleado", "editOrder")}
            {renderDialogField("ID Asesor", "idAsesor", "number", "ID Empleado", "editOrder")}
            {renderDialogField("ID Hojalatero", "idHojalatero", "number", "ID Empleado", "editOrder")}
            {renderDialogField("ID Pintor", "idPintor", "number", "ID Empleado", "editOrder")}
            {renderDialogField("ID Presupuesto", "idPresupuesto", "number", "ID presupuesto asociado", "editOrder")}

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
            <DialogHeader><DialogTitle>Detalles de Orden: OT-{String(currentOrder?.idOrder || '').padStart(4, '0')}</DialogTitle><DialogDescription>Proceso actual: <Badge variant={getProcesoVariant(currentOrder?.proceso)}>{currentOrder?.proceso || 'N/A'}</Badge></DialogDescription></DialogHeader>
            {currentOrder && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm py-4">
                    <div className="col-span-1 md:col-span-2 mb-2 border-b pb-2"> <p className="font-semibold text-base">Vehículo:</p></div>
                    <p><span className="font-medium">Placas:</span> {currentOrder.placas}</p>
                    <p><span className="font-medium">VIN:</span> {currentOrder.vin || 'N/A'}</p>
                    <p><span className="font-medium">Marca ID:</span> {currentOrder.idMarca || 'N/A'}</p>
                    <p><span className="font-medium">Modelo ID:</span> {currentOrder.idModelo || 'N/A'}</p>
                    <p><span className="font-medium">Año:</span> {currentOrder.año || 'N/A'}</p>
                    <p><span className="font-medium">Color:</span> {currentOrder.color || 'N/A'}</p>
                    <p><span className="font-medium">Kilometraje:</span> {currentOrder.kilometraje || 'N/A'}</p>
                    
                    <div className="col-span-1 md:col-span-2 mt-3 mb-2 border-b pb-2"> <p className="font-semibold text-base">Cliente:</p></div>
                    <p><span className="font-medium">ID Cliente:</span> {currentOrder.idCliente}</p>

                    {currentOrder.idAseguradora && (<>
                        <div className="col-span-1 md:col-span-2 mt-3 mb-2 border-b pb-2"> <p className="font-semibold text-base">Aseguradora:</p></div>
                        <p><span className="font-medium">ID Aseguradora:</span> {currentOrder.idAseguradora}</p>
                        <p><span className="font-medium">ID Ajustador:</span> {currentOrder.ajustador || 'N/A'}</p>
                        <p><span className="font-medium">Siniestro:</span> {currentOrder.siniestro || 'N/A'}</p>
                        <p><span className="font-medium">Póliza:</span> {currentOrder.poliza || 'N/A'}</p>
                        <p><span className="font-medium">Folio:</span> {currentOrder.folio || 'N/A'}</p>
                        <p><span className="font-medium">Deducible:</span> {currentOrder.deducible != null ? `$${currentOrder.deducible.toFixed(2)}` : 'N/A'}</p>
                        <p><span className="font-medium">Tipo:</span> {currentOrder.aseguradoTercero || 'N/A'}</p>
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
                    <p><span className="font-medium">ID Valuador:</span> {currentOrder.idValuador || 'N/A'}</p>
                    <p><span className="font-medium">ID Asesor:</span> {currentOrder.idAsesor || 'N/A'}</p>
                    <p><span className="font-medium">ID Hojalatero:</span> {currentOrder.idHojalatero || 'N/A'}</p>
                    <p><span className="font-medium">ID Pintor:</span> {currentOrder.idPintor || 'N/A'}</p>
                    
                    <div className="col-span-1 md:col-span-2 mt-3 mb-2 border-b pb-2"> <p className="font-semibold text-base">Presupuesto:</p></div>
                    <p><span className="font-medium">ID Presupuesto:</span> {currentOrder.idPresupuesto || 'N/A'}</p>

                    <div className="col-span-1 md:col-span-2 mt-3 mb-2 border-b pb-2"> <p className="font-semibold text-base">Log de Cambios:</p></div>
                    <div className="col-span-1 md:col-span-2 max-h-32 overflow-y-auto bg-muted/50 p-2 rounded-md">
                        {currentOrder.log && currentOrder.log.length > 0 ? currentOrder.log.map((entry, index) => (
                            <p key={index} className="text-xs mb-1">
                                <span className="font-medium">{formatDateTime(entry.timestamp)}</span> (Usr: {entry.userId || 'Sis'}): {entry.action} {entry.details && `- ${entry.details}`}
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
            <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Seguro que deseas eliminar la orden OT-{String(orders.find(o=>o._id === orderToDeleteId)?.idOrder || '').padStart(4, '0')}?</DialogDescription></DialogHeader>
            <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteOrder}>Eliminar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Marca Dialogs --- */}
      <Dialog open={isCreateMarcaDialogOpen} onOpenChange={setIsCreateMarcaDialogOpen}>
        <DialogContent className="sm:max-w-md"> <DialogHeader><DialogTitle>Crear Nueva Marca</DialogTitle></DialogHeader> <div className="grid gap-4 py-4">{renderDialogField("Nombre Marca", "marca", "text", "Ej: Toyota", "newMarca")}</div> <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateMarca}>Crear Marca</Button></DialogFooter> </DialogContent>
      </Dialog>
      <Dialog open={isEditMarcaDialogOpen} onOpenChange={(open) => { setIsEditMarcaDialogOpen(open); if (!open) setCurrentMarca(null); }}>
        <DialogContent className="sm:max-w-md"> <DialogHeader><DialogTitle>Editar Marca: {currentMarca?.marca}</DialogTitle></DialogHeader> {currentMarca && <div className="grid gap-4 py-4">{renderDialogField("Nombre Marca", "marca", "text", "Ej: Toyota", "editMarca")}</div>} <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateMarca}>Actualizar Marca</Button></DialogFooter> </DialogContent>
      </Dialog>
      <Dialog open={isDeleteMarcaDialogOpen} onOpenChange={setIsDeleteMarcaDialogOpen}>
        <DialogContent className="sm:max-w-md"> <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Seguro que deseas eliminar la marca {marcas.find(m=>m._id === marcaToDeleteId)?.marca}? Se eliminarán también sus modelos.</DialogDescription></DialogHeader> <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteMarca}>Eliminar</Button></DialogFooter> </DialogContent>
      </Dialog>
      <Dialog open={isManageModelosDialogOpen} onOpenChange={(open) => { setIsManageModelosDialogOpen(open); if (!open) setCurrentMarca(null); }}>
        <DialogContent className="sm:max-w-lg"> <DialogHeader><DialogTitle>Gestionar Modelos para: {currentMarca?.marca}</DialogTitle><DialogDescription>Añade, edita o elimina modelos para esta marca.</DialogDescription></DialogHeader> <div className="my-4"><Button size="sm" onClick={() => { setNewModeloData({idModelo: undefined, modelo: ''}); setIsCreateModeloDialogOpen(true);}}><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Modelo</Button></div> {currentMarca?.modelos && currentMarca.modelos.length > 0 ? (<Table><TableHeader><TableRow><TableHead>ID Modelo</TableHead><TableHead>Nombre Modelo</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader><TableBody>{currentMarca.modelos.map(modelo => (<TableRow key={modelo.idModelo}><TableCell>{modelo.idModelo}</TableCell><TableCell>{modelo.modelo}</TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" onClick={() => openEditModeloDialog(modelo)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteModelo(modelo.idModelo)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody></Table>) : <p className="text-sm text-muted-foreground text-center py-4">No hay modelos para esta marca.</p>} <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter> </DialogContent>
      </Dialog>
      <Dialog open={isCreateModeloDialogOpen} onOpenChange={setIsCreateModeloDialogOpen}>
          <DialogContent className="sm:max-w-md"> <DialogHeader><DialogTitle>Añadir Nuevo Modelo a {currentMarca?.marca}</DialogTitle></DialogHeader> <div className="grid gap-4 py-4">{renderDialogField("ID Modelo*", "idModelo", "number", "Ej: 101", "newModelo")}{renderDialogField("Nombre Modelo*", "modelo", "text", "Ej: Corolla", "newModelo")}</div> <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateModelo}>Añadir Modelo</Button></DialogFooter> </DialogContent>
      </Dialog>
      <Dialog open={isEditModeloDialogOpen} onOpenChange={(open) => { setIsEditModeloDialogOpen(open); if (!open) setCurrentModelo(null); }}>
          <DialogContent className="sm:max-w-md"> <DialogHeader><DialogTitle>Editar Modelo: {currentModelo?.modelo}</DialogTitle></DialogHeader> {currentModelo && (<div className="grid gap-4 py-4">{renderDialogField("Nombre Modelo*", "modelo", "text", "Ej: Corolla", "editModelo")}</div>)} <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateModelo}>Actualizar Modelo</Button></DialogFooter> </DialogContent>
      </Dialog>

      {/* --- Aseguradora Dialogs --- */}
      <Dialog open={isCreateAseguradoraDialogOpen} onOpenChange={setIsCreateAseguradoraDialogOpen}>
        <DialogContent className="sm:max-w-md"> <DialogHeader><DialogTitle>Crear Nueva Aseguradora</DialogTitle></DialogHeader> <div className="grid gap-4 py-4">{renderDialogField("Nombre Aseguradora*", "nombre", "text", "Ej: GNP Seguros", "newAseguradora")}{renderDialogField("Teléfono", "telefono", "text", "Ej: 5512345678", "newAseguradora")}</div> <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateAseguradora}>Crear Aseguradora</Button></DialogFooter> </DialogContent>
      </Dialog>
      <Dialog open={isEditAseguradoraDialogOpen} onOpenChange={(open) => { setIsEditAseguradoraDialogOpen(open); if (!open) setCurrentAseguradora(null); }}>
        <DialogContent className="sm:max-w-md"> <DialogHeader><DialogTitle>Editar Aseguradora: {currentAseguradora?.nombre}</DialogTitle></DialogHeader> {currentAseguradora && <div className="grid gap-4 py-4">{renderDialogField("Nombre Aseguradora*", "nombre", "text", "Ej: GNP Seguros", "editAseguradora")}{renderDialogField("Teléfono", "telefono", "text", "Ej: 5512345678", "editAseguradora")}</div>} <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateAseguradora}>Actualizar Aseguradora</Button></DialogFooter> </DialogContent>
      </Dialog>
      <Dialog open={isDeleteAseguradoraDialogOpen} onOpenChange={setIsDeleteAseguradoraDialogOpen}>
        <DialogContent className="sm:max-w-md"> <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Seguro que deseas eliminar la aseguradora {aseguradoras.find(a=>a._id === aseguradoraToDeleteId)?.nombre}? Se eliminarán también sus ajustadores.</DialogDescription></DialogHeader> <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteAseguradora}>Eliminar</Button></DialogFooter> </DialogContent>
      </Dialog>
      <Dialog open={isManageAjustadoresDialogOpen} onOpenChange={(open) => { setIsManageAjustadoresDialogOpen(open); if (!open) setCurrentAseguradora(null); }}>
        <DialogContent className="sm:max-w-lg"> <DialogHeader><DialogTitle>Gestionar Ajustadores para: {currentAseguradora?.nombre}</DialogTitle><DialogDescription>Añade, edita o elimina ajustadores para esta aseguradora.</DialogDescription></DialogHeader> <div className="my-4"><Button size="sm" onClick={() => { setNewAjustadorData({nombre: '', telefono: '', correo: ''}); setIsCreateAjustadorDialogOpen(true);}}><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Ajustador</Button></div> {currentAseguradora?.ajustadores && currentAseguradora.ajustadores.length > 0 ? (<Table><TableHeader><TableRow><TableHead>ID Ajust.</TableHead><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>Correo</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader><TableBody>{currentAseguradora.ajustadores.map(aj => (<TableRow key={aj.idAjustador}><TableCell>{aj.idAjustador}</TableCell><TableCell>{aj.nombre}</TableCell><TableCell>{aj.telefono || 'N/A'}</TableCell><TableCell>{aj.correo || 'N/A'}</TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" onClick={() => openEditAjustadorDialog(aj)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteAjustador(aj.idAjustador)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody></Table>) : <p className="text-sm text-muted-foreground text-center py-4">No hay ajustadores para esta aseguradora.</p>} <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter> </DialogContent>
      </Dialog>
      <Dialog open={isCreateAjustadorDialogOpen} onOpenChange={setIsCreateAjustadorDialogOpen}>
          <DialogContent className="sm:max-w-md"> <DialogHeader><DialogTitle>Añadir Nuevo Ajustador a {currentAseguradora?.nombre}</DialogTitle></DialogHeader> <div className="grid gap-4 py-4">{renderDialogField("Nombre Ajustador*", "nombre", "text", "Ej: Juan Pérez", "newAjustador")}{renderDialogField("Teléfono", "telefono", "text", "Ej: 5587654321", "newAjustador")}{renderDialogField("Correo", "correo", "email", "Ej: juan.perez@email.com", "newAjustador")}</div> <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateAjustador}>Añadir Ajustador</Button></DialogFooter> </DialogContent>
      </Dialog>
      <Dialog open={isEditAjustadorDialogOpen} onOpenChange={(open) => { setIsEditAjustadorDialogOpen(open); if (!open) setCurrentAjustador(null); }}>
          <DialogContent className="sm:max-w-md"> <DialogHeader><DialogTitle>Editar Ajustador: {currentAjustador?.nombre}</DialogTitle></DialogHeader> {currentAjustador && (<div className="grid gap-4 py-4">{renderDialogField("Nombre Ajustador*", "nombre", "text", "Ej: Juan Pérez", "editAjustador")}{renderDialogField("Teléfono", "telefono", "text", "Ej: 5587654321", "editAjustador")}{renderDialogField("Correo", "correo", "email", "Ej: juan.perez@email.com", "editAjustador")}</div>)} <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateAjustador}>Actualizar Ajustador</Button></DialogFooter> </DialogContent>
      </Dialog>

      {/* --- User (Admin) Dialogs --- */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Crear Nuevo Usuario</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            {renderDialogField("ID Empleado*", "idEmpleado", "number", "Ej: 101", "newUser")}
            {renderDialogField("Nombre de Usuario*", "usuario", "text", "Ej: juan.perez", "newUser")}
            {renderDialogField("Contraseña*", "contraseña", "password", "Mínimo 6 caracteres", "newUser")}
            {renderDialogField("Rol*", "rol", "select", "Seleccionar rol", "newUser", userRoleOptions)}
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleCreateUser}>Crear Usuario</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditUserDialogOpen} onOpenChange={(open) => { setIsEditUserDialogOpen(open); if (!open) setCurrentUserToEdit(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Usuario: {currentUserToEdit?.usuario}</DialogTitle></DialogHeader>
          {currentUserToEdit && (
            <div className="grid gap-4 py-4">
              {renderDialogField("ID Empleado", "idEmpleado", "number", "", "editUser")}
              {renderDialogField("Nombre de Usuario*", "usuario", "text", "Ej: juan.perez", "editUser")}
              {renderDialogField("Nueva Contraseña", "contraseña", "password", "Dejar en blanco para no cambiar", "editUser")}
              {renderDialogField("Rol*", "rol", "select", "Seleccionar rol", "editUser", userRoleOptions)}
            </div>
          )}
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleUpdateUser}>Actualizar Usuario</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteUserDialogOpen} onOpenChange={(open) => { setIsDeleteUserDialogOpen(open); if(!open) setUserToDeleteId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle><DialogDescription>¿Seguro que deseas eliminar al usuario {usersList.find(u => u._id === userToDeleteId)?.usuario} (ID: {usersList.find(u => u._id === userToDeleteId)?.idEmpleado})? Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" onClick={handleDeleteUser}>Eliminar Usuario</Button></DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
