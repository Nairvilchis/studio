
// --- User & Employee Types ---
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

export interface SystemUserCredentials {
  _id?: string; // Internal ID for this subdocument if ever needed, not primary
  usuario: string;
  contraseña?: string; // Should be hashed
  rol: UserRole;
  permisos?: UserPermissions;
}

/**
 * Represents an Employee in the system.
 * Each employee has personal and professional details, and optionally,
 * system access credentials nested under the 'user' field.
 */
export interface Empleado {
  _id?: string; // MongoDB ObjectId as string, primary ID for empleado
  nombre: string;
  telefono?: string;
  correo?: string;
  puesto?: string;
  sueldo?: number;
  comision?: number;
  fechaRegistro?: Date;
  fechaBaja?: Date;
  user?: SystemUserCredentials; // Optional system access credentials
}


// --- Order Types ---
/**
 * Represents a log entry for changes made to a service order.
 */
export interface LogEntry {
  timestamp: Date;
  userId?: string; // Empleado._id who performed the action
  action: string;
  details?: string;
}

/**
 * Represents a service order in the workshop.
 */
export interface Order {
  _id?: string; // MongoDB ObjectId as string
  idOrder: number; // Custom numeric ID, e.g., OT-1001
  idCliente?: string; // References Cliente._id (string)
  vin?: string;
  idMarca?: string; // References MarcaVehiculo._id (string)
  idModelo?: number; // Numeric ID of the modelo within the marca
  año?: number;
  placas?: string;
  color?: string;
  kilometraje?: string;
  idAseguradora?: string; // References Aseguradora._id (string)
  ajustador?: string; // References Ajustador.idAjustador (string, ObjectId of adjuster)
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
  idValuador?: string; // References Empleado._id (string)
  idAsesor?: string; // References Empleado._id (string)
  idHojalatero?: string; // References Empleado._id (string)
  idPintor?: string; // References Empleado._id (string)
  idPresupuesto?: string; // Reference to a Presupuesto._id (string)
  proceso: 'pendiente' | 'valuacion' | 'espera_refacciones' | 'refacciones_listas' | 'hojalateria' | 'preparacion_pintura' | 'pintura' | 'mecanica' | 'armado' | 'detallado_lavado' | 'control_calidad' | 'listo_entrega' | 'entregado' | 'facturado' | 'garantia' | 'cancelado';
  urlArchivos?: string;
  log?: LogEntry[];
}

export type NewOrderData = Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'log'>;
export type UpdateOrderData = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro'>>;


// --- Marca Types ---
/**
 * Represents a vehicle model within a brand.
 */
export interface ModeloVehiculo {
  idModelo: number; // Custom numeric ID, unique within the Marca
  modelo: string;
}

/**
 * Represents a vehicle brand (make).
 */
export interface MarcaVehiculo {
  _id?: string; // MongoDB ObjectId as string
  idMarca: number; // Custom numeric ID for display/reference, unique
  marca: string;
  modelos?: ModeloVehiculo[];
}
export type NewMarcaData = Omit<MarcaVehiculo, '_id' | 'idMarca'>;
export type UpdateMarcaData = Partial<Omit<MarcaVehiculo, '_id' | 'idMarca'>>;

// --- Aseguradora Types ---
/**
 * Represents an adjuster associated with an insurance company.
 */
export interface Ajustador {
  idAjustador: string; // MongoDB ObjectId as string, unique within the Aseguradora's ajustadores array
  nombre: string;
  telefono?: string;
  correo?: string;
}

/**
 * Represents an insurance company.
 */
export interface Aseguradora {
  _id: string; // MongoDB ObjectId as string, primary ID
  nombre: string;
  telefono?: string;
  ajustadores?: Ajustador[];
}
export type NewAseguradoraData = Omit<Aseguradora, '_id'>; // _id is auto-generated
export type UpdateAseguradoraData = Partial<Omit<Aseguradora, '_id'>>;

// --- Cliente Types ---
/**
 * Represents a client of the workshop.
 */
export interface Cliente {
  _id?: string; // MongoDB ObjectId as string
  idCliente: number; // Custom numeric ID for display/reference, unique
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
/**
 * Represents a line item in a budget/quote.
 */
export interface ConceptoPresupuesto {
  concepto: string;
  cantidad: number;
  precio: number;
  pintura: boolean;
  procedimiento: string; // "reparacion", "cambio", etc.
  idRefaccion?: string; // or number, depending on refaccion ID type
}

/**
 * Represents a budget or quote for a service order.
 */
export interface Presupuesto {
  _id?: string; // MongoDB ObjectId as string
  idPresupuesto: number; // Custom numeric ID
  idOrder: number; // References Order.idOrder
  conceptos: ConceptoPresupuesto[];
  // other fields like total, fecha, etc.
}

// --- Refaccion Types ---
/**
 * Represents a spare part used in a service order.
 */
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
