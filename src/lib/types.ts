
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
  contraseña?: string; // Se omite en las respuestas al cliente generalmente
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
  _id: string; // MongoDB ObjectId como string
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
 * @property {string} action - Descripción de la acción realizada (ej. "Proceso cambiado a: Hojalatería", "Cliente actualizado: Nombre de 'Juan' a 'Juan Pérez'").
 */
export interface LogEntry {
  timestamp: Date;
  userId?: string; // _id del Empleado que realizó la acción
  action: string;
}

/**
 * Representa un ítem dentro del array de presupuestos de una orden de servicio.
 * @property {string} [_id] - ObjectId de MongoDB para este item de presupuesto (generado al añadir).
 * @property {string} concepto - Descripción del concepto (ej. "Cambio de cofre").
 * @property {number} cantidad - Cantidad del concepto.
 * @property {number} [precioPublico] - Precio unitario al público.
 * @property {number} [costoPintura] - Costo de pintura para este ítem.
 * @property {number} [costoManoObra] - Costo de mano de obra.
 * @property {number} [costoRefaccion] - Costo de la refacción.
 * @property {boolean} [pintura] - Indica si el ítem requiere pintura.
 * @property {string} [procedimiento] - Tipo de procedimiento (ej. 'reparacion', 'cambio', 'diagnostico').
 * @property {string} [Refaccion] - _id (string ObjectId) de la refacción asociada, si aplica (de la colección `refacciones`).
 */
export interface PresupuestoItem {
  _id?: string; // ObjectId string de MongoDB, opcional si es un nuevo ítem.
  concepto: string;
  cantidad: number;
  precioPublico?: number;
  costoPintura?: number;
  costoManoObra?: number;
  costoRefaccion?: number;
  pintura?: boolean;
  procedimiento?: string;
  Refaccion?: string; // _id (string ObjectId) de la Refaccion
}

/**
 * Representa una orden de servicio en el taller.
 * Los IDs de referencia a otras entidades son ObjectId de MongoDB, almacenados como strings.
 * @property {string} _id - ID principal de la orden (MongoDB ObjectId como string), generado automáticamente.
 * @property {number} idOrder - ID numérico personalizado y secuencial (ej. OT-1001), generado por el sistema.
 * @property {string} [idAseguradora] - _id (string ObjectId) de la Aseguradora.
 * @property {string} [idAjustador] - idAjustador (string ObjectId) del Ajustador (del array de la Aseguradora).
 * @property {string} [poliza] - Número de póliza.
 * @property {string} [folio] - Folio de la aseguradora.
 * @property {string} [siniestro] - Número de siniestro.
 * @property {boolean} [piso] - ¿La unidad está en el piso del taller? (Default: false).
 * @property {boolean} [grua] - ¿Llegó en grúa? (Default: false).
 * @property {number} [deducible] - Monto del deducible.
 * @property {boolean} aseguradoTercero - true si es asegurado, false si es tercero. (Default: true).
 * @property {string} [idMarca] - _id (string ObjectId) de la MarcaVehiculo.
 * @property {string} [idModelo] - idModelo (string ObjectId) del ModeloVehiculo (del array de la Marca).
 * @property {number} [año] - Año del vehículo.
 * @property {string} [vin] - Número de Identificación Vehicular.
 * @property {string} [placas] - Placas del vehículo.
 * @property {string} [color] - Color del vehículo (debería ser un valor de la lista de colores configurados).
 * @property {string} [kilometraje] - Kilometraje del vehículo.
 * @property {string} [idCliente] - _id (string ObjectId) del Cliente.
 * @property {string} [idValuador] - _id (string ObjectId) del Empleado valuador.
 * @property {string} [idAsesor] - _id (string ObjectId) del Empleado asesor.
 * @property {string} [idHojalatero] - _id (string ObjectId) del Empleado hojalatero.
 * @property {string} [idPintor] - _id (string ObjectId) del Empleado pintor.
 * @property {string} proceso - Estado actual del proceso de la orden (Default: 'pendiente').
 * @property {Date} fechaRegistro - Fecha de creación de la orden (automática).
 * @property {Date} [fechaValuacion] - Fecha de valuación.
 * @property {Date} [fechaReingreso] - Fecha de reingreso.
 * @property {Date} [fechaEntrega] - Fecha de entrega al cliente.
 * @property {Date} [fechaPromesa] - Fecha promesa de entrega.
 * @property {Date} [fechaBaja] - Fecha de baja de la orden (si se cancela o similar).
 * @property {string} [urlArchivos] - URL a una carpeta de almacenamiento de archivos (fotos, documentos).
 * @property {LogEntry[]} [Log] - Historial de cambios de la orden.
 * @property {PresupuestoItem[]} [presupuestos] - Array de ítems del presupuesto.
 */
export interface Order {
  _id: string; // MongoDB ObjectId como string
  idOrder: number; // ID numérico personalizado y secuencial (ej. OT-1001)

  // Detalles de la Aseguradora
  idAseguradora?: string; // _id (string ObjectId) de la Aseguradora
  idAjustador?: string; // idAjustador (string ObjectId) del Ajustador (del array de la Aseguradora)
  poliza?: string;
  folio?: string;
  siniestro?: string;
  deducible?: number;
  aseguradoTercero: boolean; // true si es asegurado, false si es tercero.

  // Detalles del Vehículo
  idMarca?: string; // _id (string ObjectId) de la MarcaVehiculo
  idModelo?: string; // idModelo (string ObjectId) del ModeloVehiculo (del array de la Marca)
  año?: number;
  vin?: string;
  placas?: string;
  color?: string; // Nombre del color (idealmente de una lista predefinida)
  kilometraje?: string;

  // Referencia al Cliente
  idCliente?: string; // _id (string ObjectId) del Cliente

  // Personal Asignado
  idValuador?: string; // _id (string ObjectId) del Empleado valuador
  idAsesor?: string; // _id (string ObjectId) del Empleado asesor
  idHojalatero?: string; // _id (string ObjectId) del Empleado hojalatero
  idPintor?: string; // _id (string ObjectId) del Empleado pintor

  // Estado y Logística
  piso?: boolean;
  grua?: boolean;
  proceso: 'pendiente' | 'valuacion' | 'espera_refacciones' | 'refacciones_listas' | 'hojalateria' | 'preparacion_pintura' | 'pintura' | 'mecanica' | 'armado' | 'detallado_lavado' | 'control_calidad' | 'listo_entrega' | 'entregado' | 'facturado' | 'garantia' | 'cancelado' | string;
  urlArchivos?: string; // URL a carpeta de almacenamiento (ej. Google Drive, S3)

  // Fechas
  fechaRegistro: Date; // Automática al crear
  fechaValuacion?: Date;
  fechaReingreso?: Date;
  fechaEntrega?: Date;
  fechaPromesa?: Date;
  fechaBaja?: Date; // Para cancelaciones o bajas lógicas

  // Historial y Presupuesto
  Log?: LogEntry[];
  presupuestos?: PresupuestoItem[];
}

/** Tipo de datos para crear una nueva orden. `_id`, `idOrder`, `fechaRegistro`, `Log` se generan/manejan automáticamente. */
export type NewOrderData = Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'Log'>;

/** Tipo de datos para actualizar una orden existente. */
export type UpdateOrderData = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'Log'>>;


// --- Marca Types ---
/**
 * Representa un modelo de vehículo dentro de una marca específica.
 * @property {string} idModelo - ObjectId de MongoDB (como string hexadecimal), generado automáticamente al añadir a una marca.
 * @property {string} modelo - Nombre del modelo (ej. "Corolla"), único dentro de la marca.
 */
export interface ModeloVehiculo {
  idModelo: string; // ObjectId string de MongoDB, único dentro de la marca
  modelo: string;
}

/**
 * Representa una marca de vehículos (fabricante).
 * @property {string} _id - ID principal de la marca (MongoDB ObjectId como string hexadecimal), generado por MongoDB.
 * @property {string} marca - Nombre de la marca (ej. "Toyota"), debe ser único.
 * @property {ModeloVehiculo[]} [modelos] - Array de modelos de esta marca.
 */
export interface MarcaVehiculo {
  _id: string; // MongoDB ObjectId como string
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
 * El `idAjustador` es un ObjectId de MongoDB (como string hexadecimal) generado al añadirlo.
 * Es único dentro del array `ajustadores` de su Aseguradora padre.
 * @property {string} idAjustador - ObjectId string de MongoDB, único dentro de la aseguradora.
 * @property {string} nombre - Nombre completo del ajustador, debe ser único dentro de la aseguradora.
 * @property {string} [telefono] - Teléfono del ajustador.
 * @property {string} [correo] - Correo electrónico del ajustador.
 */
export interface Ajustador {
  idAjustador: string; // ObjectId string de MongoDB, único dentro de la aseguradora.
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
  _id: string; // MongoDB ObjectId como string
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
 * @property {{ orderId: string }[]} [ordenes] - Array de referencias a órdenes asociadas (almacena el _id (string ObjectId) de la Order).
 */
export interface Cliente {
  _id: string; // MongoDB ObjectId como string
  nombre: string;
  telefono?: string;
  correo?: string;
  // rfc?: string; // RFC eliminado según solicitud previa
  ordenes?: { orderId: string }[]; // orderId es el _id (string ObjectId) de la Order
}
/** Tipo de datos para crear un nuevo cliente. `_id` y `ordenes` son generados/manejados automáticamente. */
export type NewClienteData = Pick<Cliente, 'nombre' | 'telefono' | 'correo'>;
/** Tipo de datos para actualizar un cliente. */
export type UpdateClienteData = Partial<NewClienteData>;


// --- Refaccion Types --- (Placeholder)
/**
 * Representa una refacción o parte de repuesto.
 * @property {string} _id - ObjectId de MongoDB.
 * @property {string} [idOrder] - _id (string ObjectId) de la Orden a la que pertenece.
 * @property {string} refaccion - Nombre o descripción de la refacción.
 * @property {number} cantidad - Cantidad necesaria.
 * @property {string} [idMarca] - _id (string ObjectId) de la MarcaVehiculo de la refacción (si aplica).
 * @property {string} [idModelo] - idModelo (string ObjectId) del ModeloVehiculo de la refacción (si aplica).
 * @property {number} [año] - Año de la refacción o del vehículo para el que aplica.
 * @property {string} [proveedor] - Proveedor de la refacción.
 * @property {number} [precio] - Precio de la refacción.
 * @property {Date} [fechaPromesa] - Fecha promesa de llegada de la refacción.
 * @property {Date} [fechaAlta] - Fecha de alta de la refacción en el sistema/almacén.
 * @property {Date} [fechaBaja] - Fecha de baja (ej. por uso, devolución).
 * @property {string} [numGuia] - Número de guía del envío de la refacción.
 * @property {Date} [fechaDevolucion] - Fecha de devolución de la refacción.
 * @property {boolean} [surtido] - Indica si la refacción fue surtida/entregada.
 * @property {string} [observaciones] - Observaciones adicionales.
 */
export interface Refaccion {
  _id: string; // MongoDB ObjectId como string
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
  _id: string; // MongoDB ObjectId como string
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
  _id: string; // MongoDB ObjectId como string
  nombre: string;
}
/** Tipo de datos para crear un nuevo Color de Vehículo. `_id` es generado automáticamente. */
export type NewColorVehiculoData = Pick<ColorVehiculo, 'nombre'>;
/** Tipo de datos para actualizar un Color de Vehículo (solo el nombre). */
export type UpdateColorVehiculoData = Partial<Pick<ColorVehiculo, 'nombre'>>;
