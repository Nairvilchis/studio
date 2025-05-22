
// --- User & Employee Types ---

/**
 * Enum para los roles de usuario en el sistema.
 * Estos roles determinan los permisos y el acceso a diferentes funcionalidades.
 */
export enum UserRole {
  ADMIN = "admin",
  VALUADOR = "valuador",
  ASESOR = "asesor",
  ALMACENISTA = "almacenista",
  HOJALATERO = "hojalatero",
  PINTOR = "pintor",
}

/**
 * Interfaz para definir los permisos de un usuario.
 * Cada propiedad booleana indica si el usuario tiene acceso a una acción específica.
 */
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
  // Se pueden añadir más permisos específicos según las necesidades del sistema.
  [key: string]: boolean | undefined;
}

/**
 * Interfaz para las credenciales de sistema de un empleado.
 * Esta información se anida dentro del objeto Empleado si el empleado tiene acceso al sistema.
 * El _id de SystemUserCredentials no se usa actualmente pero está como placeholder si se decidiera tratarlo como subdocumento independiente.
 */
export interface SystemUserCredentials {
  _id?: string; // ID interno de MongoDB para este subdocumento si fuera necesario.
  usuario: string; // Nombre de usuario para el login, debe ser único globalmente.
  contraseña?: string; // Contraseña del usuario. IMPORTANTE: Almacenar hasheada.
  rol: UserRole; // Rol del usuario, determina sus permisos por defecto.
  permisos?: UserPermissions; // Permisos específicos asignados al usuario.
}

/**
 * Representa un Empleado en el sistema.
 * Cada empleado tiene detalles personales y profesionales, y opcionalmente,
 * credenciales de acceso al sistema anidadas bajo el campo 'user'.
 */
export interface Empleado {
  _id?: string; // ID principal del empleado, generado por MongoDB (ObjectId como string).
  nombre: string; // Nombre completo del empleado.
  telefono?: string; // Número de teléfono del empleado.
  correo?: string; // Correo electrónico del empleado.
  puesto?: string; // Puesto o cargo del empleado en el taller.
  sueldo?: number; // Sueldo base del empleado.
  comision?: number; // Porcentaje de comisión (si aplica).
  fechaRegistro?: Date; // Fecha en que se registró el empleado en el sistema.
  fechaBaja?: Date; // Fecha en que el empleado fue dado de baja (si aplica).
  user?: SystemUserCredentials; // Credenciales de acceso al sistema (opcional).
}


// --- Order Types ---
/**
 * Representa una entrada en el historial de cambios de una orden de servicio.
 * Registra quién hizo qué cambio y cuándo.
 */
export interface LogEntry {
  timestamp: Date; // Fecha y hora del cambio.
  userId?: string; // _id (string) del Empleado que realizó la acción.
  action: string; // Descripción de la acción realizada.
  details?: string; // Detalles adicionales sobre el cambio.
}

/**
 * Representa una orden de servicio en el taller.
 */
export interface Order {
  _id?: string; // ID principal de la orden (MongoDB ObjectId como string).
  idOrder: number; // ID numérico personalizado y secuencial (ej. OT-1001).
  
  // Datos del vehículo
  vin?: string;
  idMarca?: string; // Refiere a MarcaVehiculo._id (string).
  idModelo?: string; // Refiere a ModeloVehiculo.idModelo (string ObjectId) dentro de la marca.
  año?: number;
  placas?: string;
  color?: string;
  kilometraje?: string;

  // Datos del cliente y aseguradora
  idCliente?: string; // Refiere a Cliente._id (string).
  idAseguradora?: string; // Refiere a Aseguradora._id (string).
  ajustador?: string; // Refiere a Ajustador.idAjustador (string ObjectId) dentro de Aseguradora.
  siniestro?: string;
  poliza?: string;
  folio?: string;
  deducible?: number;
  aseguradoTercero?: 'asegurado' | 'tercero';

  // Detalles de la orden
  piso?: boolean;
  grua?: boolean;
  urlArchivos?: string;
  proceso: 'pendiente' | 'valuacion' | 'espera_refacciones' | 'refacciones_listas' | 'hojalateria' | 'preparacion_pintura' | 'pintura' | 'mecanica' | 'armado' | 'detallado_lavado' | 'control_calidad' | 'listo_entrega' | 'entregado' | 'facturado' | 'garantia' | 'cancelado';

  // Fechas relevantes
  fechaRegistro: Date;
  fechaValuacion?: Date;
  fechaRengreso?: Date;
  fechaEntrega?: Date;
  fechaPromesa?: Date;

  // Personal asignado (referencian a Empleado._id)
  idValuador?: string; 
  idAsesor?: string; 
  idHojalatero?: string;
  idPintor?: string; 
  
  idPresupuesto?: string; // Refiere a Presupuesto._id (string).

  log?: LogEntry[];
}

/** Tipo de datos para crear una nueva orden. */
export type NewOrderData = Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'log'>;
/** Tipo de datos para actualizar una orden existente. */
export type UpdateOrderData = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro'>>;


// --- Marca Types ---
/**
 * Representa un modelo de vehículo dentro de una marca específica.
 * El `idModelo` es un ObjectId de MongoDB (almacenado como string) y es único
 * dentro del array `modelos` de su `MarcaVehiculo` padre.
 */
export interface ModeloVehiculo {
  idModelo: string; // ObjectId de MongoDB (como string) para el modelo.
  modelo: string; // Nombre del modelo (ej. "Corolla", "Civic").
}

/**
 * Representa una marca de vehículos (fabricante).
 * El `_id` (ObjectId de MongoDB, como string) es el identificador principal.
 */
export interface MarcaVehiculo {
  _id: string; // ID principal de la marca (MongoDB ObjectId como string).
  marca: string; // Nombre de la marca (ej. "Toyota", "Honda"), debe ser único.
  modelos?: ModeloVehiculo[]; // Array de modelos pertenecientes a esta marca.
}
/** Tipo de datos para crear una nueva marca. El `_id` es generado automáticamente. */
export type NewMarcaData = Omit<MarcaVehiculo, '_id'>;
/** Tipo de datos para actualizar una marca. El `_id` no es modificable. */
export type UpdateMarcaData = Partial<Omit<MarcaVehiculo, '_id'>>;

// --- Aseguradora Types ---
/**
 * Representa un ajustador asociado a una compañía de seguros.
 * El `idAjustador` es un ObjectId de MongoDB (almacenado como string)
 * y es único dentro del array `ajustadores` de su `Aseguradora` padre.
 */
export interface Ajustador {
  idAjustador: string; // ObjectId de MongoDB (como string) para el ajustador.
  nombre: string; // Nombre completo del ajustador.
  telefono?: string;
  correo?: string;
}

/**
 * Representa una compañía de seguros.
 * El `_id` (ObjectId de MongoDB, como string) es el identificador principal.
 */
export interface Aseguradora {
  _id: string; // ID principal de la aseguradora (MongoDB ObjectId como string).
  nombre: string; // Nombre de la compañía de seguros, debe ser único.
  telefono?: string;
  ajustadores?: Ajustador[];
}
/** Tipo de datos para crear una nueva aseguradora. El `_id` es generado automáticamente. */
export type NewAseguradoraData = Omit<Aseguradora, '_id'>;
/** Tipo de datos para actualizar una aseguradora. El `_id` no es modificable. */
export type UpdateAseguradoraData = Partial<Omit<Aseguradora, '_id'>>;

// --- Cliente Types ---
/**
 * Representa un cliente del taller automotriz.
 * El `_id` (ObjectId de MongoDB, como string) es el identificador principal.
 * `idCliente` es un ID numérico personalizado, secuencial.
 */
export interface Cliente {
  _id?: string; // ID principal (MongoDB ObjectId como string).
  idCliente: number; // ID numérico personalizado y secuencial.
  nombre?: string; // Para personas físicas.
  razonSocial?: string; // Para personas morales/empresas.
  rfc?: string;
  telefono?: string;
  correo?: string;
  // ordenes?: { idOrden: number }[]; // Referencia a órdenes, si se decide embeber.
}
/** Tipo de datos para crear un nuevo cliente. */
export type NewClienteData = Omit<Cliente, '_id' | 'idCliente'>;
/** Tipo de datos para actualizar un cliente. */
export type UpdateClienteData = Partial<Omit<Cliente, '_id' | 'idCliente'>>;


// --- Presupuesto Types ---
/**
 * Representa un concepto o línea de ítem dentro de un presupuesto.
 */
export interface ConceptoPresupuesto {
  concepto: string;
  cantidad: number;
  precio: number;
  pintura: boolean;
  procedimiento: string; // ej. "reparacion", "cambio", "diagnostico"
  idRefaccion?: string; // Refiere a Refaccion._id (string), si aplica.
}

/**
 * Representa un presupuesto o cotización para una orden de servicio.
 */
export interface Presupuesto {
  _id?: string; // ID principal (MongoDB ObjectId como string).
  idPresupuesto: number; // ID numérico personalizado y secuencial.
  idOrder: number; // Refiere a Order.idOrder (numérico).
  conceptos: ConceptoPresupuesto[];
  // Se podrían añadir más campos como: total, fechaCreacion, version, etc.
}

// --- Refaccion Types ---
/**
 * Representa una refacción o parte de repuesto.
 */
export interface Refaccion {
  _id?: string; // ID principal (MongoDB ObjectId como string).
  idRefaccion: number; // ID numérico personalizado y secuencial.
  idOrder: number; // Refiere a Order.idOrder (numérico) a la que pertenece.
  refaccion: string; // Nombre o descripción.
  cantidad: number;
  idMarca?: string; // Refiere a MarcaVehiculo._id (string).
  idModelo?: string; // Refiere a ModeloVehiculo.idModelo (string ObjectId).
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
