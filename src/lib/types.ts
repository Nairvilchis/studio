import { ObjectId } from "mongodb";
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

export interface EmployeeUser {
  contraseña?: string;
  usuario: string;
  rol: UserRole;
  permisos?: UserPermissions;
}

export interface User {
  _id?: ObjectId;
  usuario: string;
  contraseña?: string;
  rol: UserRole;
  permisos?: UserPermissions;
  workstation?: string;
  // Fields from Empleado interface
  nombre: string;
  telefono?: string;
  correo?: string;
  tipo?: string;
  puesto?: string;
  sueldo?: number;
  comision?: number;
  fechaRegistro?: Date;
  fechaBaja?: Date;
  user: EmployeeUser;
}

// --- Order Types ---
export interface LogEntry {
  timestamp: Date; // Will be stringified by actions for client, or keep as Date if client handles it
  userId?: string; // Assuming userId is also ObjectId string
  action: string;
  details?: string;
}

export interface Order {
  _id?: string; // Changed from ObjectId
  idOrder: number;
  idCliente?: number;
  vin?: string;
  idMarca?: string; // Changed from number to string based on MarcaVehiculo _id
  idModelo?: number;
  año?: number;
  placas?: string;
  color?: string;
  kilometraje?: string;
  idAseguradora?: string; // Changed from number to string
  ajustador?: number; // Assuming this is the idAjustador
  siniestro?: string; // Changed from number to string based on Aseguradora _id
  poliza?: string; // Changed from number to string
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
  idValuador?: string; // Changed from number to string
  idAsesor?: string; // Changed from number to string
  idHojalatero?: string; // Changed from number to string
  idPintor?: string; // Changed from number to string
  idPresupuesto?: number;
  proceso: 'pendiente' | 'valuacion' | 'espera_refacciones' | 'refacciones_listas' | 'hojalateria' | 'preparacion_pintura' | 'pintura' | 'mecanica' | 'armado' | 'detallado_lavado' | 'control_calidad' | 'listo_entrega' | 'entregado' | 'facturado' | 'garantia' | 'cancelado';
  urlArchivos?: string;
  log?: LogEntry[];
}

// For data sent to create/update actions, _id might not be present or relevant if it's a string from client
export type NewOrderData = Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'log' | 'proceso' | 'idMarca' | 'idAseguradora' | 'siniestro' | 'idValuador' | 'idAsesor' | 'idHojalatero' | 'idPintor'> & { proceso?: Order['proceso'], idMarca?: string, idAseguradora?: string, siniestro?: string, idValuador?: string, idAsesor?: string, idHojalatero?: string, idPintor?: string };
export type UpdateOrderData = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro'>>;


// --- Marca Types ---
export interface ModeloVehiculo {
  idModelo: number;
  modelo: string;
}

export interface MarcaVehiculo {
  _id?: string; // Changed from ObjectId
  idMarca?: string; // Changed from number to string based on rule, made optional if not always present
  marca: string;
  modelos?: ModeloVehiculo[];
}
export type NewMarcaData = Omit<MarcaVehiculo, '_id' | 'idMarca'>;
export type UpdateMarcaData = Partial<Omit<MarcaVehiculo, '_id' | 'idMarca'>>;


export interface Aseguradora {
  _id?: string; // Changed from ObjectId
  idAseguradora: string; // Changed from number to string
  nombre: string;
  telefono?: string;
  ajustadores?: Ajustador[];
}
export type NewAseguradoraData = Omit<Aseguradora, '_id' | 'idAseguradora'>;
export type UpdateAseguradoraData = Partial<Omit<Aseguradora, '_id' | 'idAseguradora'>>;

// Placeholder for other types if needed in the future
export interface Cliente {
  _id?: string; // Changed from ObjectId
  idCliente?: string; // Changed from number to string based on rule, made optional
  nombre: string;
  telefono?: string;
  correo?: string;
  // ordenes?: { idOrden: number }[]; // Example if embedding order IDs
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
  idPresupuesto?: string; // Changed from number to string based on rule, made optional
  idOrder: number;
  conceptos: ConceptoPresupuesto[];
  // other fields like total, fecha, etc.
}

export interface Refaccion {
  _id?: ObjectId; // Changed from ObjectId
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
