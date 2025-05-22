
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
  _id?: string; // ID interno de MongoDB para este subdocumento (generalmente no necesario si es embebido).
  usuario: string; // Nombre de usuario para el login, debe ser único globalmente.
  contraseña?: string; // Contraseña del usuario. IMPORTANTE: Almacenar hasheada.
  rol: UserRole; // Rol del usuario, determina sus permisos por defecto.
  permisos?: UserPermissions; // Permisos específicos asignados al usuario.
}

/**
 * Representa un Empleado en el sistema.
 * Cada empleado tiene detalles personales y profesionales, y opcionalmente,
 * credenciales de acceso al sistema anidadas bajo el campo 'user'.
 * El `_id` es el ObjectId de MongoDB, generado automáticamente.
 */
export interface Empleado {
  _id: string; // ID principal del empleado (MongoDB ObjectId como string).
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
 * Representa una entrada en el historial de cambios (log) de una orden de servicio.
 * Registra quién hizo qué cambio y cuándo.
 */
export interface LogEntry {
  timestamp: Date; // Fecha y hora del cambio.
  userId?: string; // _id (string ObjectId) del Empleado que realizó la acción.
  action: string; // Descripción de la acción realizada (ej. "Proceso cambiado a: pintura", "Folio actualizado: 123 a 456").
}

/**
 * Representa un ítem dentro del array de presupuestos de una orden de servicio.
 */
export interface PresupuestoItem {
  _id?: string; // ObjectId de MongoDB para este item de presupuesto si se decidiera hacerlo un subdocumento con ID propio.
  concepto: string; // ej. "Cambio de cofre", "Reparación de defensa".
  cantidad: number; // Cantidad del concepto.
  precioPublico?: number; // Precio unitario o total para el cliente.
  costoPintura?: number; // Costo de pintura asociado a este concepto.
  costoManoObra?: number; // Costo de mano de obra asociado.
  costoRefaccion?: number; // Costo de la refacción asociada.
  pintura?: boolean; // Indica si este concepto requiere pintura.
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
  idAseguradora?: string; // ObjectId (string) de la Aseguradora.
  idAjustador?: string; // ObjectId (string) del Ajustador (debe pertenecer a idAseguradora).
  poliza?: string; // Número de póliza.
  folio?: string; // Folio de la aseguradora o interno.
  siniestro?: string; // Número de siniestro.
  deducible?: number; // Monto del deducible.
  aseguradoTercero?: boolean; // true si es asegurado, false si es tercero.

  // Datos del vehículo
  idMarca?: string; // ObjectId (string) de la MarcaVehiculo.
  idModelo?: string; // ObjectId (string) del ModeloVehiculo (debe pertenecer a idMarca).
  año?: number; // Año del vehículo.
  vin?: string; // Número de Identificación Vehicular.
  placas?: string; // Placas del vehículo.
  color?: string; // Color del vehículo.
  kilometraje?: string; // Kilometraje del vehículo.
  
  // Datos del cliente
  idCliente?: string; // ObjectId (string) del Cliente.

  // Personal asignado (referencian a Empleado._id como string)
  idValuador?: string; 
  idAsesor?: string; 
  idHojalatero?: string;
  idPintor?: string; 
  
  // Estado y detalles de la orden
  proceso: 'pendiente' | 'valuacion' | 'espera_refacciones' | 'refacciones_listas' | 'hojalateria' | 'preparacion_pintura' | 'pintura' | 'mecanica' | 'armado' | 'detallado_lavado' | 'control_calidad' | 'listo_entrega' | 'entregado' | 'facturado' | 'garantia' | 'cancelado';
  piso?: boolean; // ¿La unidad está en el piso del taller?
  grua?: boolean; // ¿Llegó en grúa?
  urlArchivos?: string; // URL a carpeta de fotos/documentos.
  
  // Fechas relevantes (almacenadas como objetos Date en DB, pueden ser strings en formularios)
  fechaRegistro: Date;
  fechaValuacion?: Date;
  fechaReingreso?: Date; // Fecha de reingreso si aplica.
  fechaEntrega?: Date;
  fechaPromesa?: Date; // Fecha tentativa de entrega.
  fechaBaja?: Date; // Fecha en que se da de baja la orden (ej. cancelada, entregada y finalizada).

  // Historial de cambios
  log?: LogEntry[];

  // Presupuesto (array de items)
  presupuestos?: PresupuestoItem[]; 
}

/** Tipo de datos para crear una nueva orden. El `_id` y `idOrder` se generan automáticamente. */
export type NewOrderData = Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'log' | 'presupuestos'> & {
  presupuestos?: PresupuestoItem[]; // Permitir pasar presupuestos al crear, aunque puede ser opcional.
};
/** Tipo de datos para actualizar una orden existente. */
export type UpdateOrderData = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'log'>>;


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
 * `idCliente` es un ID numérico personalizado, secuencial (considerar si aún es necesario si `_id` es el primario).
 */
export interface Cliente {
  _id: string; // ID principal (MongoDB ObjectId como string).
  idCliente?: number; // ID numérico personalizado y secuencial (opcional, _id es el primario).
  nombre?: string; // Para personas físicas.
  razonSocial?: string; // Para personas morales/empresas.
  rfc?: string;
  telefono?: string;
  correo?: string;
  // ordenes?: { idOrden: number }[]; // Referencia a órdenes, si se decide embeber (actualmente no usado).
}
/** Tipo de datos para crear un nuevo cliente. */
export type NewClienteData = Omit<Cliente, '_id' | 'idCliente'> & { idCliente?: number };
/** Tipo de datos para actualizar un cliente. */
export type UpdateClienteData = Partial<Omit<Cliente, '_id'>>;


// --- Presupuesto Types (Standalone, si se decide tener una colección separada) ---
// La estructura `PresupuestoItem` ya está definida arriba para ser usada embebida en `Order`.
// Si se quisiera una colección `presupuestos` separada, se definiría así:
/*
export interface Presupuesto {
  _id?: string; // ID principal (MongoDB ObjectId como string).
  idPresupuesto: number; // ID numérico personalizado y secuencial.
  idOrder: string; // ObjectId (string) de la Order a la que pertenece.
  conceptos: PresupuestoItem[];
  // Se podrían añadir más campos como: totalCalculado, fechaCreacion, version, estado (aprobado, rechazado), etc.
}
*/

// --- Refaccion Types ---
/**
 * Representa una refacción o parte de repuesto.
 */
export interface Refaccion {
  _id: string; // ID principal (MongoDB ObjectId como string).
  // idRefaccion?: number; // ID numérico personalizado (opcional, _id es el primario).
  idOrder?: string; // ObjectId (string) de la Order a la que pertenece la solicitud de esta refacción.
  refaccion: string; // Nombre o descripción de la refacción.
  cantidad: number;
  idMarca?: string; // ObjectId (string) de la MarcaVehiculo (si es específica de marca).
  idModelo?: string; // ObjectId (string) del ModeloVehiculo (si es específica de modelo).
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
