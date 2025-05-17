
// Removed: import type { ObjectId } from 'mongodb';

// --- User Types ---
export enum UserRole {
  ADMIN = "admin",
  VALUADOR = "valuador",
  ASESOR = "asesor",
  ALMACENISTA = "almacenista",
  HOJALATERO = "hojalatero",
  PINTOR = "pintor",
}

export interface UserPermissions {
  verOrdenes?: boolean;
  crearOrdenes?: boolean;
  editarOrdenes?: boolean;
  eliminarOrdenes?: boolean;
  verPresupuestos?: boolean;
  crearPresupuestos?: boolean;
  editarPresupuestos?: boolean;
  eliminarPresupuestos?: boolean;
  verRefacciones?: boolean;
  crearRefacciones?: boolean;
  editarRefacciones?: boolean;
  eliminarRefacciones?: boolean;
  [key: string]: boolean | undefined;
}

export interface User {
  _id?: string; // Changed from ObjectId
  idEmpleado: number;
  usuario: string;
  contraseña?: string;
  rol: UserRole;
  permisos?: UserPermissions;
  workstation?: string;
}

// --- Order Types ---
export interface LogEntry {
  timestamp: Date; // Will be stringified by actions for client, or keep as Date if client handles it
  userId?: number;
  action: string;
  details?: string;
}

export interface Order {
  _id?: string; // Changed from ObjectId
  idOrder: number;
  idCliente?: number;
  vin?: string;
  idMarca?: number;
  idModelo?: number;
  año?: number;
  placas?: string;
  color?: string;
  kilometraje?: string;
  idAseguradora?: number;
  ajustador?: number; // Assuming this is the idAjustador
  siniestro?: string;
  poliza?: string;
  folio?: string;
  deducible?: number;
  aseguradoTercero?: 'asegurado' | 'tercero';
  piso?: boolean;
  grua?: boolean;
  fechaRegistro: Date; // Will be stringified by actions for client
  fechaValuacion?: Date; // Will be stringified
  fechaRengreso?: Date; // Will be stringified
  fechaEntrega?: Date; // Will be stringified
  fechaPromesa?: Date; // Will be stringified
  idValuador?: number;
  idAsesor?: number;
  idHojalatero?: number;
  idPintor?: number;
  idPresupuesto?: number;
  proceso: 'pendiente' | 'valuacion' | 'espera_refacciones' | 'refacciones_listas' | 'hojalateria' | 'preparacion_pintura' | 'pintura' | 'mecanica' | 'armado' | 'detallado_lavado' | 'control_calidad' | 'listo_entrega' | 'entregado' | 'facturado' | 'garantia' | 'cancelado';
  urlArchivos?: string;
  log?: LogEntry[];
}

// For data sent to create/update actions, _id might not be present or relevant if it's a string from client
export type NewOrderData = Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'log' | 'proceso'> & { proceso?: Order['proceso'] };
export type UpdateOrderData = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro'>>;


// --- Marca Types ---
export interface ModeloVehiculo {
  idModelo: number;
  modelo: string;
}

export interface MarcaVehiculo {
  _id?: string; // Changed from ObjectId
  idMarca: number;
  marca: string;
  modelos?: ModeloVehiculo[];
}
export type NewMarcaData = Omit<MarcaVehiculo, '_id' | 'idMarca'>;
export type UpdateMarcaData = Partial<Omit<MarcaVehiculo, '_id' | 'idMarca'>>;


// --- Aseguradora Types ---
export interface Ajustador {
  idAjustador: number;
  nombre: string;
  telefono?: string;
  correo?: string;
}

export interface Aseguradora {
  _id?: string; // Changed from ObjectId
  idAseguradora: number;
  nombre: string;
  telefono?: string;
  ajustadores?: Ajustador[];
}
export type NewAseguradoraData = Omit<Aseguradora, '_id' | 'idAseguradora'>;
export type UpdateAseguradoraData = Partial<Omit<Aseguradora, '_id' | 'idAseguradora'>>;

// Placeholder for other types if needed in the future
export interface Cliente {
  _id?: string; // Changed from ObjectId
  idCliente: number;
  nombre: string;
  telefono?: string;
  correo?: string;
  // ordenes?: { idOrden: number }[]; // Example if embedding order IDs
}

export interface Empleado {
  _id?: string; // Changed from ObjectId
  idUser: number; // Corresponds to User.idEmpleado
  nombre: string;
  telefono?: string;
  correo?: string;
  tipo?: string;
  puesto?: string;
  sueldo?: number;
  comision?: number;
  fechaRegistro?: Date;
  fechaBaja?: Date;
}

export interface ConceptoPresupuesto {
  concepto: string;
  cantidad: number;
  precio: number;
  pintura: boolean;
  procedimiento: string; // "reparacion", "cambio", etc.
  idRefaccion?: string; // or number, depending on refaccion ID type
}

export interface Presupuesto {
  _id?: string; // Changed from ObjectId
  idPresupuesto: number;
  idOrder: number;
  conceptos: ConceptoPresupuesto[];
  // other fields like total, fecha, etc.
}

export interface Refaccion {
  _id?: string; // Changed from ObjectId
  idRefaccion: string; // or number
  idOrder?: number;
  refaccion: string;
  cantidad: number;
  idMarca?: number;
  idModelo?: number;
  año?: number;
  proveedor?: string;
  precio?: number;
  fechaPromesa?: Date;
  fechaAlta?: Date;
  fechaBaja?: Date;
  numGuia?: string;
  fechaDevolucion?: Date;
  surtido?: boolean;
  observaciones?: string;
}
