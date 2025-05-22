
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
 * Interfaz para las credenciales de sistema de un empleado (anidada en Empleado).
 */
export interface SystemUserCredentials {
  _id?: string; // ID interno de MongoDB (generalmente no se usa si está embebido).
  usuario: string; // Nombre de usuario para el login, debe ser único globalmente.
  contraseña?: string; // Contraseña (IMPORTANTE: Almacenar hasheada).
  rol: UserRole; // Rol del usuario, determina permisos por defecto.
  permisos?: UserPermissions; // Permisos específicos.
}

/**
 * Representa un Empleado en el sistema.
 * `_id` es el ObjectId de MongoDB, generado automáticamente.
 * Puede tener credenciales de sistema anidadas en el campo `user`.
 */
export interface Empleado {
  _id: string; // ID principal del empleado (MongoDB ObjectId como string).
  nombre: string; // Nombre completo del empleado.
  telefono?: string; // Número de teléfono.
  correo?: string; // Correo electrónico.
  puesto?: string; // Puesto o cargo del empleado.
  sueldo?: number; // Sueldo base.
  comision?: number; // Porcentaje de comisión.
  fechaRegistro?: Date; // Fecha de registro en el sistema.
  fechaBaja?: Date; // Fecha de baja (si aplica).
  user?: SystemUserCredentials; // Credenciales de acceso al sistema (opcional).
}


// --- Order Types ---
/**
 * Representa una entrada en el historial de cambios (log) de una orden de servicio.
 */
export interface LogEntry {
  timestamp: Date; // Fecha y hora del cambio.
  userId?: string; // _id (string ObjectId) del Empleado que realizó la acción.
  action: string; // Descripción de la acción realizada.
}

/**
 * Representa un ítem dentro del array de presupuestos de una orden de servicio.
 */
export interface PresupuestoItem {
  _id?: string; // ObjectId de MongoDB para este item de presupuesto.
  concepto: string; // ej. "Cambio de cofre".
  cantidad: number;
  precioPublico?: number;
  costoPintura?: number;
  costoManoObra?: number;
  costoRefaccion?: number;
  pintura?: boolean; // ¿Requiere pintura?
  procedimiento?: 'reparacion' | 'cambio' | 'diagnostico' | string; // Tipo de procedimiento.
  idRefaccion?: string; // ObjectId (string) de la refacción, si aplica.
}


/**
 * Representa una orden de servicio en el taller.
 * Los IDs de referencia a otras entidades son generalmente ObjectId de MongoDB, almacenados como strings.
 */
export interface Order {
  _id: string; // ID principal de la orden (MongoDB ObjectId como string), generado automáticamente.
  idOrder: number; // ID numérico personalizado y secuencial (ej. OT-1001).
  
  // Datos de la aseguradora y siniestro
  idAseguradora?: string; // _id (string ObjectId) de la Aseguradora.
  idAjustador?: string; // idAjustador (string ObjectId, del array de la Aseguradora).
  poliza?: string;
  folio?: string;
  siniestro?: string;
  deducible?: number;
  aseguradoTercero: boolean; // true si es asegurado, false si es tercero.

  // Datos del vehículo
  idMarca?: string; // _id (string ObjectId) de la MarcaVehiculo.
  idModelo?: string; // idModelo (string ObjectId, del array de la Marca).
  año?: number;
  vin?: string;
  placas?: string;
  color?: string;
  kilometraje?: string;
  
  // Datos del cliente
  idCliente?: string; // _id (string ObjectId) del Cliente.

  // Personal asignado (referencian a Empleado._id como string)
  idValuador?: string; 
  idAsesor?: string; 
  idHojalatero?: string;
  idPintor?: string; 
  
  // Estado y detalles de la orden
  proceso: 'pendiente' | 'valuacion' | 'espera_refacciones' | 'refacciones_listas' | 'hojalateria' | 'preparacion_pintura' | 'pintura' | 'mecanica' | 'armado' | 'detallado_lavado' | 'control_calidad' | 'listo_entrega' | 'entregado' | 'facturado' | 'garantia' | 'cancelado';
  piso?: boolean; // ¿La unidad está en el piso del taller?
  grua?: boolean; // ¿Llegó en grúa?
  
  // Fechas relevantes
  fechaRegistro: Date;
  fechaValuacion?: Date;
  fechaReingreso?: Date;
  fechaEntrega?: Date;
  fechaPromesa?: Date;
  fechaBaja?: Date;

  // Historial de cambios
  Log?: LogEntry[]; // Renombrado de 'log' a 'Log' para coincidir con tu última estructura.

  // Presupuesto (array de items)
  presupuestos?: PresupuestoItem[]; 
}

/** Tipo de datos para crear una nueva orden. `_id` y `idOrder` se generan automáticamente. */
export type NewOrderData = Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'Log' | 'presupuestos'> & {
  presupuestos?: Omit<PresupuestoItem, '_id'>[]; // Al crear, los _id de PresupuestoItem no existen
};
/** Tipo de datos para actualizar una orden existente. */
export type UpdateOrderData = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'Log'>>;


// --- Marca Types ---
/**
 * Representa un modelo de vehículo dentro de una marca específica.
 * `idModelo` es un ObjectId de MongoDB (almacenado como string), único dentro de su MarcaVehiculo padre.
 */
export interface ModeloVehiculo {
  idModelo: string; // ObjectId de MongoDB (como string hexadecimal), generado automáticamente.
  modelo: string; // Nombre del modelo (ej. "Corolla"), único dentro de la marca.
}

/**
 * Representa una marca de vehículos (fabricante).
 * `_id` (ObjectId de MongoDB, como string) es el identificador principal.
 */
export interface MarcaVehiculo {
  _id: string; // ID principal de la marca (MongoDB ObjectId como string hexadecimal).
  marca: string; // Nombre de la marca (ej. "Toyota"), debe ser único.
  modelos?: ModeloVehiculo[]; // Array de modelos de esta marca.
}
/** Tipo de datos para crear una nueva marca. `_id` es generado automáticamente. */
export type NewMarcaData = Pick<MarcaVehiculo, 'marca'> & { modelos?: Omit<ModeloVehiculo, 'idModelo'>[] };
/** Tipo de datos para actualizar una marca (solo el nombre). */
export type UpdateMarcaData = Pick<MarcaVehiculo, 'marca'>;


// --- Aseguradora Types ---
/**
 * Representa un ajustador asociado a una compañía de seguros.
 * `idAjustador` es un ObjectId de MongoDB (almacenado como string), único dentro de su Aseguradora padre.
 */
export interface Ajustador {
  idAjustador: string; // ObjectId de MongoDB (como string hexadecimal), generado automáticamente.
  nombre: string; // Nombre completo del ajustador, único dentro de la aseguradora.
  telefono?: string;
  correo?: string;
}

/**
 * Representa una compañía de seguros.
 * `_id` (ObjectId de MongoDB, como string) es el identificador principal.
 */
export interface Aseguradora {
  _id: string; // ID principal (MongoDB ObjectId como string hexadecimal).
  nombre: string; // Nombre de la compañía, debe ser único.
  telefono?: string;
  ajustadores?: Ajustador[]; // Array de ajustadores de esta aseguradora.
}
/** Tipo de datos para crear una nueva aseguradora. `_id` es generado automáticamente. */
export type NewAseguradoraData = Pick<Aseguradora, 'nombre' | 'telefono'> & { ajustadores?: Omit<Ajustador, 'idAjustador'>[] };
/** Tipo de datos para actualizar una aseguradora. */
export type UpdateAseguradoraData = Partial<Pick<Aseguradora, 'nombre' | 'telefono'>>;


// --- Cliente Types ---
/**
 * Representa un cliente del taller automotriz.
 * `_id` (MongoDB ObjectId, como string) es el identificador principal.
 */
export interface Cliente {
  _id: string; // ID principal (MongoDB ObjectId como string).
  nombre: string; // Nombre completo o razón social del cliente.
  telefono?: string;
  correo?: string;
  rfc?: string; // RFC del cliente.
  /** Array de IDs de órdenes asociadas a este cliente. Se almacena el _id de la orden. */
  ordenes?: { orderId: string }[]; 
}
/** Tipo de datos para crear un nuevo cliente. `_id` y `ordenes` son generados/manejados automáticamente. */
export type NewClienteData = Pick<Cliente, 'nombre' | 'telefono' | 'correo' | 'rfc'>;
/** Tipo de datos para actualizar un cliente. */
export type UpdateClienteData = Partial<NewClienteData>;


// --- Refaccion Types --- (Placeholder, no implementada completamente aún)
/**
 * Representa una refacción o parte de repuesto.
 */
export interface Refaccion {
  _id: string; // ID principal (MongoDB ObjectId como string).
  idOrder?: string; // _id (string ObjectId) de la Order a la que pertenece.
  refaccion: string; // Nombre o descripción.
  cantidad: number;
  idMarca?: string; // _id (string ObjectId) de la MarcaVehiculo.
  idModelo?: string; // idModelo (string ObjectId) del ModeloVehiculo.
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

    