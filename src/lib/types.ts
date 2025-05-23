
// --- User & Employee Types ---
import type { ObjectId as MongoObjectId } from 'mongodb'; // Solo para referencia de tipo en managers

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
  gestionarEmpleados?: boolean;
  gestionarMarcas?: boolean;
  gestionarAseguradoras?: boolean;
  gestionarConfigGeneral?: boolean;
  [key: string]: boolean | undefined;
}

/**
 * Interfaz para las credenciales de sistema de un empleado (anidada en Empleado).
 * @property {string} usuario - Nombre de usuario para el login, debe ser único globalmente.
 * @property {string} [contraseña] - Contraseña (IMPORTANTE: Almacenar hasheada). No se devuelve al cliente.
 * @property {UserRole} rol - Rol del usuario, determina permisos por defecto.
 * @property {UserPermissions} [permisos] - Permisos específicos.
 */
export interface SystemUserCredentials {
  usuario: string;
  contraseña?: string;
  rol: UserRole;
  permisos?: UserPermissions;
}

/**
 * Representa un Empleado en el sistema.
 * `_id` es el ObjectId de MongoDB (string), generado automáticamente.
 * Puede tener credenciales de sistema anidadas en el campo `user`.
 * @property {string} _id - ID principal del empleado (MongoDB ObjectId como string).
 * @property {string} nombre - Nombre completo del empleado.
 * @property {string} [telefono] - Número de teléfono.
 * @property {string} [correo] - Correo electrónico.
 * @property {string} [puesto] - Puesto o cargo del empleado (ej. "Hojalatero", "Pintor", "Asesor").
 * @property {number} [sueldo] - Sueldo base.
 * @property {number} [comision] - Porcentaje de comisión.
 * @property {Date} [fechaRegistro] - Fecha de registro en el sistema.
 * @property {Date} [fechaBaja] - Fecha de baja (si aplica).
 * @property {SystemUserCredentials} [user] - Credenciales de acceso al sistema (opcional).
 */
export interface Empleado {
  _id: string;
  nombre: string;
  telefono?: string;
  correo?: string;
  puesto?: string;
  sueldo?: number;
  comision?: number;
  fechaRegistro?: Date;
  fechaBaja?: Date;
  user?: SystemUserCredentials;
}


// --- Order Types ---
/**
 * Representa una entrada en el historial de cambios (log) de una orden de servicio.
 * @property {Date} timestamp - Fecha y hora del cambio.
 * @property {string} [userId] - _id (string ObjectId) del Empleado que realizó la acción.
 * @property {string} action - Descripción de la acción realizada.
 */
export interface LogEntry {
  timestamp: Date;
  userId?: string; // _id del Empleado
  action: string;
}

/**
 * Representa un ítem dentro del array de presupuestos de una orden de servicio.
 * @property {string} [_id] - ObjectId de MongoDB para este item de presupuesto (generado al añadir).
 * @property {string} concepto - ej. "Cambio de cofre".
 * @property {number} cantidad - Cantidad del concepto.
 * @property {number} [precioPublico] - Precio unitario al público.
 * @property {number} [costoPintura] - Costo de pintura para este ítem.
 * @property {number} [costoManoObra] - Costo de mano de obra.
 * @property {number} [costoRefaccion] - Costo de la refacción.
 * @property {boolean} [pintura] - ¿Requiere pintura?
 * @property {string} [procedimiento] - Tipo de procedimiento (ej. 'reparacion', 'cambio', 'diagnostico').
 * @property {string} [idRefaccion] - ObjectId (string) de la refacción, si aplica (de la colección `refacciones`).
 */
export interface PresupuestoItem {
  _id?: string;
  concepto: string;
  cantidad: number;
  precioPublico?: number;
  costoPintura?: number;
  costoManoObra?: number;
  costoRefaccion?: number;
  pintura?: boolean;
  procedimiento?: string;
  idRefaccion?: string; // ObjectId (string) de la Refaccion
}


/**
 * Representa una orden de servicio en el taller.
 * Los IDs de referencia a otras entidades son ObjectId de MongoDB, almacenados como strings.
 * @property {string} _id - ID principal de la orden (MongoDB ObjectId como string), generado automáticamente.
 * @property {number} idOrder - ID numérico personalizado y secuencial (ej. OT-1001).
 * @property {string} [idAseguradora] - _id (string ObjectId) de la Aseguradora.
 * @property {string} [idAjustador] - idAjustador (string ObjectId) del Ajustador (del array de la Aseguradora).
 * @property {string} [poliza] - Número de póliza.
 * @property {string} [folio] - Folio de la aseguradora.
 * @property {string} [siniestro] - Número de siniestro.
 * @property {boolean} [piso] - ¿La unidad está en el piso del taller?
 * @property {boolean} [grua] - ¿Llegó en grúa?
 * @property {number} [deducible] - Monto del deducible.
 * @property {boolean} aseguradoTercero - true si es asegurado, false si es tercero.
 * @property {string} [idMarca] - _id (string ObjectId) de la MarcaVehiculo.
 * @property {string} [idModelo] - idModelo (string ObjectId) del ModeloVehiculo (del array de la Marca).
 * @property {number} [año] - Año del vehículo.
 * @property {string} [vin] - Número de Identificación Vehicular.
 * @property {string} [placas] - Placas del vehículo.
 * @property {string} [color] - Color del vehículo.
 * @property {string} [kilometraje] - Kilometraje del vehículo.
 * @property {string} [idCliente] - _id (string ObjectId) del Cliente.
 * @property {string} [idValuador] - _id (string ObjectId) del Empleado valuador.
 * @property {string} [idAsesor] - _id (string ObjectId) del Empleado asesor.
 * @property {string} [idHojalatero] - _id (string ObjectId) del Empleado hojalatero.
 * @property {string} [idPintor] - _id (string ObjectId) del Empleado pintor.
 * @property {string} [proceso] - Estado actual del proceso de la orden.
 * @property {Date} fechaRegistro - Fecha de creación de la orden.
 * @property {Date} [fechaValuacion] - Fecha de valuación.
 * @property {Date} [fechaReingreso] - Fecha de reingreso.
 * @property {Date} [fechaEntrega] - Fecha de entrega al cliente.
 * @property {Date} [fechaPromesa] - Fecha promesa de entrega.
 * @property {Date} [fechaBaja] - Fecha de baja de la orden (si se cancela o similar).
 * @property {string} [idPresupuesto] - _id (string ObjectId) de un presupuesto principal asociado (si aplica).
 * @property {LogEntry[]} [Log] - Historial de cambios de la orden.
 * @property {PresupuestoItem[]} [presupuestos] - Array de ítems del presupuesto.
 */
export interface Order {
  _id: string;
  idOrder: number;

  idAseguradora?: string;
  idAjustador?: string;
  poliza?: string;
  folio?: string;
  siniestro?: string;
  piso?: boolean;
  grua?: boolean;
  deducible?: number;
  aseguradoTercero: boolean;

  idMarca?: string;
  idModelo?: string;
  año?: number;
  vin?: string;
  placas?: string;
  color?: string;
  kilometraje?: string;

  idCliente?: string;

  idValuador?: string;
  idAsesor?: string;
  idHojalatero?: string;
  idPintor?: string;

  proceso: 'pendiente' | 'valuacion' | 'espera_refacciones' | 'refacciones_listas' | 'hojalateria' | 'preparacion_pintura' | 'pintura' | 'mecanica' | 'armado' | 'detallado_lavado' | 'control_calidad' | 'listo_entrega' | 'entregado' | 'facturado' | 'garantia' | 'cancelado' | string;

  fechaRegistro: Date;
  fechaValuacion?: Date;
  fechaReingreso?: Date;
  fechaEntrega?: Date;
  fechaPromesa?: Date;
  fechaBaja?: Date;

  idPresupuesto?: string;
  Log?: LogEntry[];
  presupuestos?: PresupuestoItem[];
}

/** Tipo de datos para crear una nueva orden. `_id` y `idOrder` se generan automáticamente. */
export type NewOrderData = Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'Log' | 'presupuestos'> & {
  presupuestos?: Omit<PresupuestoItem, '_id'>[];
};
/** Tipo de datos para actualizar una orden existente. */
export type UpdateOrderData = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'Log'>>;


// --- Marca Types ---
/**
 * Representa un modelo de vehículo dentro de una marca específica.
 * @property {string} idModelo - ObjectId de MongoDB (como string hexadecimal), generado automáticamente al añadir a una marca.
 * @property {string} modelo - Nombre del modelo (ej. "Corolla"), único dentro de la marca.
 */
export interface ModeloVehiculo {
  idModelo: string;
  modelo: string;
}

/**
 * Representa una marca de vehículos (fabricante).
 * @property {string} _id - ID principal de la marca (MongoDB ObjectId como string hexadecimal), generado por MongoDB.
 * @property {string} marca - Nombre de la marca (ej. "Toyota"), debe ser único.
 * @property {ModeloVehiculo[]} [modelos] - Array de modelos de esta marca.
 */
export interface MarcaVehiculo {
  _id: string;
  marca: string;
  modelos?: ModeloVehiculo[];
}
/** Tipo de datos para crear una nueva marca. `_id` es generado automáticamente. `modelos` son opcionales al crear. */
export type NewMarcaData = Pick<MarcaVehiculo, 'marca'> & { modelos?: Omit<ModeloVehiculo, 'idModelo'>[] };
/** Tipo de datos para actualizar una marca (solo el nombre). */
export type UpdateMarcaData = Pick<MarcaVehiculo, 'marca'>;


// --- Aseguradora Types ---
/**
 * Representa un ajustador asociado a una compañía de seguros.
 * @property {string} idAjustador - ObjectId de MongoDB (como string hexadecimal), generado automáticamente al añadir a una aseguradora.
 * @property {string} nombre - Nombre completo del ajustador, único dentro de la aseguradora.
 * @property {string} [telefono] - Teléfono del ajustador.
 * @property {string} [correo] - Correo electrónico del ajustador.
 */
export interface Ajustador {
  idAjustador: string; // Este es un string ObjectId, único dentro de la aseguradora
  nombre: string;
  telefono?: string;
  correo?: string;
}

/**
 * Representa una compañía de seguros.
 * @property {string} _id - ID principal (MongoDB ObjectId como string hexadecimal), generado por MongoDB.
 * @property {string} nombre - Nombre de la compañía, debe ser único.
 * @property {string} [telefono] - Teléfono de la compañía.
 * @property {Ajustador[]} [ajustadores] - Array de ajustadores de esta aseguradora.
 */
export interface Aseguradora {
  _id: string; // Este es el ObjectId de MongoDB para la Aseguradora
  nombre: string;
  telefono?: string;
  ajustadores?: Ajustador[];
}
/** Tipo de datos para crear una nueva aseguradora. `_id` es generado automáticamente. `ajustadores` son opcionales al crear. */
export type NewAseguradoraData = Pick<Aseguradora, 'nombre' | 'telefono'> & { ajustadores?: Omit<Ajustador, 'idAjustador'>[] };
/** Tipo de datos para actualizar una aseguradora (nombre y/o teléfono). */
export type UpdateAseguradoraData = Partial<Pick<Aseguradora, 'nombre' | 'telefono'>>;


// --- Cliente Types ---
/**
 * Representa un cliente del taller automotriz.
 * @property {string} _id - ID principal (MongoDB ObjectId como string).
 * @property {string} nombre - Nombre completo o razón social del cliente.
 * @property {string} [telefono] - Número de teléfono.
 * @property {string} [correo] - Correo electrónico.
 * @property {string} [rfc] - RFC del cliente (opcional).
 * @property {{ orderId: string }[]} [ordenes] - Array de referencias a órdenes asociadas (almacena el _id de la orden).
 */
export interface Cliente {
  _id: string;
  nombre: string;
  telefono?: string;
  correo?: string;
  rfc?: string; // RFC es opcional
  ordenes?: { orderId: string }[]; // orderId es el _id (string ObjectId) de la Order
}
/** Tipo de datos para crear un nuevo cliente. `_id` y `ordenes` son generados/manejados automáticamente. */
export type NewClienteData = Pick<Cliente, 'nombre' | 'telefono' | 'correo' | 'rfc'>;
/** Tipo de datos para actualizar un cliente. */
export type UpdateClienteData = Partial<NewClienteData>;


// --- Refaccion Types --- (Placeholder)
/**
 * Representa una refacción o parte de repuesto.
 */
export interface Refaccion {
  _id: string;
  idOrder?: string; // _id de la Order
  refaccion: string;
  cantidad: number;
  idMarca?: string; // _id de MarcaVehiculo
  idModelo?: string; // idModelo del ModeloVehiculo
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

// --- Puesto Types ---
/**
 * Representa un puesto de trabajo configurable en el sistema.
 * Se utiliza para poblar opciones en los formularios de creación/edición de empleados.
 * @property {string} _id - ObjectId de MongoDB, como string.
 * @property {string} nombre - Nombre del puesto, debe ser único.
 */
export interface Puesto {
  _id: string;
  nombre: string;
}
/** Tipo de datos para crear un nuevo Puesto. `_id` es generado automáticamente. */
export type NewPuestoData = Pick<Puesto, 'nombre'>;
/** Tipo de datos para actualizar un Puesto (solo el nombre). */
export type UpdatePuestoData = Partial<Pick<Puesto, 'nombre'>>;

// --- ColorVehiculo Types ---
/**
 * Representa un color de vehículo configurable en el sistema.
 * @property {string} _id - ObjectId de MongoDB, como string.
 * @property {string} nombre - Nombre del color, debe ser único (ej. "Rojo Brillante", "Azul Metálico").
 */
export interface ColorVehiculo {
  _id: string;
  nombre: string;
}
/** Tipo de datos para crear un nuevo Color de Vehículo. `_id` es generado automáticamente. */
export type NewColorVehiculoData = Pick<ColorVehiculo, 'nombre'>;
/** Tipo de datos para actualizar un Color de Vehículo (solo el nombre). */
export type UpdateColorVehiculoData = Partial<Pick<ColorVehiculo, 'nombre'>>;
