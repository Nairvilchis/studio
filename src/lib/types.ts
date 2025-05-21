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

// This interface represents the document in the 'users' collection
export interface User {
  _id?: string; // MongoDB ObjectId as string
  idEmpleado: number; // Custom numeric ID for the employee
  usuario: string;
  contraseña?: string; // Should be hashed in a real app
  rol: UserRole;
  nombre: string; // Full name of the employee/user
  puesto?: string; // Job title, e.g., "Hojalatero", "Pintor"
  telefono?: string;
  correo?: string;
  tipo?: string; // Could be 'interno', 'externo'
  sueldo?: number;
  comision?: number;
  fechaRegistro?: Date;
  fechaBaja?: Date;
  permisos?: UserPermissions;
  workstation?: string;
}


// --- Order Types ---
export interface LogEntry {
  timestamp: Date;
  userId?: number; // User's custom idEmpleado
  action: string;
  details?: string;
}

export interface Order {
  _id?: string;
  idOrder: number;
  idCliente?: string; // References Cliente._id
  vin?: string;
  idMarca?: string; // References MarcaVehiculo._id
  idModelo?: number; // Numeric ID of the modelo within the marca
  año?: number;
  placas?: string;
  color?: string;
  kilometraje?: string; // Kept as string as per user schema
  idAseguradora?: string; // References Aseguradora._id
  ajustador?: number; // Numeric ID of the ajustador within the aseguradora
  siniestro?: string;
  poliza?: string;
  folio?: string;
  deducible?: number;
  aseguradoTercero?: 'asegurado' | 'tercero';
  piso?: boolean;
  grua?: boolean;
  fechaRegistro: Date;
  fechaValuacion?: Date;
  fechaRengreso?: Date;
  fechaEntrega?: Date;
  fechaPromesa?: Date;
  idValuador?: string; // References User._id (for valuador role)
  idAsesor?: string; // References User._id (for asesor role)
  idHojalatero?: string; // References User._id (for hojalatero role)
  idPintor?: string; // References User._id (for pintor role)
  idPresupuesto?: string; // Reference to a Presupuesto._id
  proceso: 'pendiente' | 'valuacion' | 'espera_refacciones' | 'refacciones_listas' | 'hojalateria' | 'preparacion_pintura' | 'pintura' | 'mecanica' | 'armado' | 'detallado_lavado' | 'control_calidad' | 'listo_entrega' | 'entregado' | 'facturado' | 'garantia' | 'cancelado';
  urlArchivos?: string;
  log?: LogEntry[];
}

export type NewOrderData = Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'log'>;
export type UpdateOrderData = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro'>>;


// --- Marca Types ---
export interface ModeloVehiculo {
  idModelo: number; // Custom numeric ID, unique within the Marca
  modelo: string;
}

export interface MarcaVehiculo {
  _id?: string; // MongoDB ObjectId as string
  idMarca: number; // Custom numeric ID
  marca: string;
  modelos?: ModeloVehiculo[];
}
export type NewMarcaData = Omit<MarcaVehiculo, '_id' | 'idMarca'>;
export type UpdateMarcaData = Partial<Omit<MarcaVehiculo, '_id' | 'idMarca'>>;

// --- Aseguradora Types ---
export interface Ajustador {
  idAjustador: number; // Custom numeric ID, unique within the Aseguradora
  nombre: string;
  telefono?: string;
  correo?: string;
}

export interface Aseguradora {
  _id?: string; // MongoDB ObjectId as string
  idAseguradora: number; // Custom numeric ID
  nombre: string;
  telefono?: string;
  ajustadores?: Ajustador[];
}
export type NewAseguradoraData = Omit<Aseguradora, '_id' | 'idAseguradora'>;
export type UpdateAseguradoraData = Partial<Omit<Aseguradora, '_id' | 'idAseguradora'>>;

// --- Cliente Types ---
export interface Cliente {
  _id?: string; // MongoDB ObjectId as string
  idCliente: number; // Custom numeric ID
  nombre?: string; // For individual clients
  razonSocial?: string; // For business clients
  rfc?: string;
  telefono?: string;
  correo?: string;
  // ordenes?: { idOrden: number }[]; // Example if embedding order IDs
}
export type NewClienteData = Omit<Cliente, '_id' | 'idCliente'>;
export type UpdateClienteData = Partial<Omit<Cliente, '_id' | 'idCliente'>>;


// --- Presupuesto Types ---
export interface ConceptoPresupuesto {
  concepto: string;
  cantidad: number;
  precio: number;
  pintura: boolean;
  procedimiento: string; // "reparacion", "cambio", etc.
  idRefaccion?: string; // or number, depending on refaccion ID type
}

export interface Presupuesto {
  _id?: string; // MongoDB ObjectId as string
  idPresupuesto: number; // Custom numeric ID
  idOrder: number; // References Order.idOrder
  conceptos: ConceptoPresupuesto[];
  // other fields like total, fecha, etc.
}

// --- Refaccion Types ---
export interface Refaccion {
  _id?: string; // MongoDB ObjectId as string
  idRefaccion: number; // Custom numeric ID, or could be string from supplier
  idOrder: number; // References Order.idOrder
  refaccion: string;
  cantidad: number;
  idMarca?: string; // References MarcaVehiculo._id (if for a specific brand of part)
  idModelo?: number; // References ModeloVehiculo.idModelo
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
