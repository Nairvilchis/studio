
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
 */
export interface SystemUserCredentials {
  _id?: string; // ID interno de MongoDB para este subdocumento si fuera necesario (actualmente no usado).
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
 * Los IDs de referencia a otras entidades (idCliente, idMarca, etc.) son strings que
 * corresponden a los `_id` de MongoDB de esas entidades.
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
  fechaRengreso?: Date; // R-Engreso (reingreso)
  fechaEntrega?: Date;
  fechaPromesa?: Date;

  // Personal asignado (referencian a Empleado._id como string)
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
 * El `idModelo` es un ObjectId de MongoDB (almacenado como string) generado automáticamente
 * y es único dentro del array `modelos` de su `MarcaVehiculo` padre.
 */
export interface ModeloVehiculo {
  idModelo: string; // ObjectId de MongoDB (como string hexadecimal) para el modelo, generado automáticamente.
  modelo: string; // Nombre del modelo (ej. "Corolla", "Civic"), debe ser único dentro de la marca.
}

/**
 * Representa una marca de vehículos (fabricante).
 * El `_id` (ObjectId de MongoDB, como string) es el identificador principal, generado automáticamente.
 */
export interface MarcaVehiculo {
  _id: string; // ID principal de la marca (MongoDB ObjectId como string hexadecimal), generado automáticamente.
  marca: string; // Nombre de la marca (ej. "Toyota", "Honda"), debe ser único.
  modelos?: ModeloVehiculo[]; // Array de modelos pertenecientes a esta marca.
}
/** Tipo de datos para crear una nueva marca. El `_id` es generado automáticamente. */
export type NewMarcaData = Omit<MarcaVehiculo, '_id'>;
/** Tipo de datos para actualizar una marca (solo el nombre de la marca). El `_id` no es modificable. */
export type UpdateMarcaData = Pick<MarcaVehiculo, 'marca'>; // Solo se permite actualizar 'marca' nombre.


// --- Aseguradora Types ---
/**
 * Representa un ajustador asociado a una compañía de seguros.
 * El `idAjustador` es un ObjectId de MongoDB (almacenado como string) generado automáticamente
 * y es único dentro del array `ajustadores` de su `Aseguradora` padre.
 */
export interface Ajustador {
  idAjustador: string; // ObjectId de MongoDB (como string hexadecimal) para el ajustador, generado automáticamente.
  nombre: string; // Nombre completo del ajustador, debe ser único dentro de la aseguradora.
  telefono?: string;
  correo?: string;
}

/**
 * Representa una compañía de seguros.
 * El `_id` (ObjectId de MongoDB, como string) es el identificador principal, generado automáticamente.
 */
export interface Aseguradora {
  _id: string; // ID principal de la aseguradora (MongoDB ObjectId como string hexadecimal), generado automáticamente.
  nombre: string; // Nombre de la compañía de seguros, debe ser único.
  telefono?: string;
  ajustadores?: Ajustador[]; // Array de ajustadores pertenecientes a esta aseguradora.
}
/** Tipo de datos para crear una nueva aseguradora. El `_id` es generado automáticamente. */
export type NewAseguradoraData = Omit<Aseguradora, '_id'>;
/** Tipo de datos para actualizar una aseguradora (nombre, teléfono). El `_id` no es modificable. */
export type UpdateAseguradoraData = Partial<Pick<Aseguradora, 'nombre' | 'telefono'>>;


// --- Cliente Types ---
/**
 * Representa un cliente del taller automotriz.
 * El `_id` (ObjectId de MongoDB, como string) es el identificador principal.
 * `idCliente` es un ID numérico personalizado, secuencial.
 */
export interface Cliente {
  _id?: string; // ID principal (MongoDB ObjectId como string).
  idCliente: number; // ID numérico personalizado y secuencial (este podría eliminarse si se usa solo _id).
  nombre?: string; // Para personas físicas.
  razonSocial?: string; // Para personas morales/empresas.
  rfc?: string;
  telefono?: string;
  correo?: string;
  // ordenes?: { idOrden: number }[]; // Referencia a órdenes, si se decide embeber (actualmente no usado).
}
/** Tipo de datos para crear un nuevo cliente. */
export type NewClienteData = Omit<Cliente, '_id' | 'idCliente'>; // idCliente podría ser manejado por una secuencia si se mantiene.
/** Tipo de datos para actualizar un cliente. */
export type UpdateClienteData = Partial<Omit<Cliente, '_id' | 'idCliente'>>;


// --- Presupuesto Types ---
/**
 * Representa un concepto o línea de ítem dentro de un presupuesto.
 */
export interface ConceptoPresupuesto {
  concepto: string; // Nombre o descripción del concepto.
  cantidad: number;
  precio: number;
  pintura: boolean; // Indica si el concepto requiere pintura.
  procedimiento: string; // ej. "reparacion", "cambio", "diagnostico".
  idRefaccion?: string; // Refiere a Refaccion._id (string), si aplica para un cambio de pieza.
}

/**
 * Representa un presupuesto o cotización para una orden de servicio.
 */
export interface Presupuesto {
  _id?: string; // ID principal (MongoDB ObjectId como string).
  idPresupuesto: number; // ID numérico personalizado y secuencial.
  idOrder: number; // Refiere a Order.idOrder (numérico).
  conceptos: ConceptoPresupuesto[];
  // Se podrían añadir más campos como: totalCalculado, fechaCreacion, version, estado (aprobado, rechazado), etc.
}

// --- Refaccion Types ---
/**
 * Representa una refacción o parte de repuesto.
 */
export interface Refaccion {
  _id?: string; // ID principal (MongoDB ObjectId como string).
  idRefaccion: number; // ID numérico personalizado y secuencial (podría eliminarse si se usa solo _id).
  idOrder: number; // Refiere a Order.idOrder (numérico) a la que pertenece la solicitud de esta refacción.
  refaccion: string; // Nombre o descripción de la refacción.
  cantidad: number;
  idMarca?: string; // Refiere a MarcaVehiculo._id (string) de la marca de la refacción (si es específica).
  idModelo?: string; // Refiere a ModeloVehiculo.idModelo (string ObjectId) del modelo (si es específico).
  año?: number; // Año del vehículo para el que es la refacción.
  proveedor?: string;
  precio?: number;
  fechaPromesa?: Date; // Fecha prometida de llegada.
  fechaAlta?: Date; // Fecha en que se registra la refacción en el sistema/inventario.
  fechaBaja?: Date; // Fecha en que se da de baja (usada, devuelta).
  numGuia?: string;   // Número de guía del envío.
  fechaDevolucion?: Date;
  surtido?: boolean; // Indica si la refacción fue surtida para la orden.
  observaciones?: string; // Notas adicionales (ej. "no surtido", "dañado al recibir", etc.).
}
