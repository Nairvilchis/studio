

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
  _id?: string; // ID interno de MongoDB para este subdocumento si fuera necesario (no es el _id del Empleado)
  usuario: string; // Nombre de usuario para el login, debe ser único.
  contraseña?: string; // Contraseña del usuario. IMPORTANTE: Debería almacenarse hasheada.
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
  action: string; // Descripción de la acción realizada (ej. "Orden Creada", "Proceso cambiado a: Pintura").
  details?: string; // Detalles adicionales sobre el cambio (ej. campos modificados).
}

/**
 * Representa una orden de servicio en el taller.
 * Contiene toda la información relevante sobre el vehículo, cliente, aseguradora,
 * trabajo a realizar, estado actual y personal asignado.
 */
export interface Order {
  _id?: string; // ID principal de la orden, generado por MongoDB (ObjectId como string).
  idOrder: number; // ID numérico personalizado y secuencial para la orden (ej. OT-1001).
  
  // Datos del vehículo
  vin?: string; // Número de Identificación Vehicular.
  idMarca?: string; // Referencia al _id (string) de MarcaVehiculo.
  idModelo?: number; // ID numérico del modelo (referencia a ModeloVehiculo.idModelo dentro de la marca).
  año?: number; // Año del vehículo.
  placas?: string; // Placas del vehículo.
  color?: string; // Color del vehículo.
  kilometraje?: string; // Kilometraje del vehículo (puede ser texto como "55000 km").

  // Datos del cliente y aseguradora
  idCliente?: string; // Referencia al _id (string) de Cliente.
  idAseguradora?: string; // Referencia al _id (string) de Aseguradora.
  ajustador?: string; // Referencia al idAjustador (string ObjectId) del Ajustador dentro de la Aseguradora.
  siniestro?: string; // Número de siniestro proporcionado por la aseguradora.
  poliza?: string; // Número de póliza del seguro.
  folio?: string; // Folio de dictamen o pase de la aseguradora.
  deducible?: number; // Monto del deducible (si aplica).
  aseguradoTercero?: 'asegurado' | 'tercero'; // Indica si el cliente es el asegurado o un tercero.

  // Detalles de la orden
  piso?: boolean; // Indica si el vehículo fue ingresado como "de piso" (sin cita previa/aseguradora).
  grua?: boolean; // Indica si el vehículo llegó en grúa.
  urlArchivos?: string; // URL a una carpeta compartida con archivos relevantes (fotos, documentos).
  proceso: 'pendiente' | 'valuacion' | 'espera_refacciones' | 'refacciones_listas' | 'hojalateria' | 'preparacion_pintura' | 'pintura' | 'mecanica' | 'armado' | 'detallado_lavado' | 'control_calidad' | 'listo_entrega' | 'entregado' | 'facturado' | 'garantia' | 'cancelado'; // Estado actual del proceso de reparación.

  // Fechas relevantes
  fechaRegistro: Date; // Fecha y hora de creación de la orden.
  fechaValuacion?: Date; // Fecha de la valuación.
  fechaRengreso?: Date; // Fecha de reingreso (si aplica).
  fechaEntrega?: Date; // Fecha de entrega final del vehículo.
  fechaPromesa?: Date; // Fecha promesa de entrega.

  // Personal asignado
  idValuador?: string; // Referencia al _id (string) del Empleado (Valuador).
  idAsesor?: string; // Referencia al _id (string) del Empleado (Asesor).
  idHojalatero?: string; // Referencia al _id (string) del Empleado (Hojalatero).
  idPintor?: string; // Referencia al _id (string) del Empleado (Pintor).
  
  // Referencias a otras entidades
  idPresupuesto?: string; // Referencia al _id (string) de un Presupuesto.

  // Historial de cambios
  log?: LogEntry[]; // Array de entradas de log para rastrear modificaciones.
}

/** Tipo de datos para crear una nueva orden. Omite campos generados automáticamente o gestionados internamente. */
export type NewOrderData = Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'log'>;
/** Tipo de datos para actualizar una orden existente. Todos los campos son opcionales. */
export type UpdateOrderData = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro'>>;


// --- Marca Types ---
/**
 * Representa un modelo de vehículo dentro de una marca específica.
 */
export interface ModeloVehiculo {
  idModelo: number; // ID numérico personalizado para el modelo, único dentro de su marca.
  modelo: string; // Nombre del modelo (ej. "Corolla", "Civic").
}

/**
 * Representa una marca de vehículos (fabricante).
 */
export interface MarcaVehiculo {
  _id?: string; // ID principal de la marca, generado por MongoDB (ObjectId como string).
  idMarca: number; // ID numérico personalizado y secuencial para la marca.
  marca: string; // Nombre de la marca (ej. "Toyota", "Honda"), debe ser único.
  modelos?: ModeloVehiculo[]; // Array de modelos pertenecientes a esta marca.
}
/** Tipo de datos para crear una nueva marca. Omite campos generados por el sistema. */
export type NewMarcaData = Omit<MarcaVehiculo, '_id' | 'idMarca'>;
/** Tipo de datos para actualizar una marca. El `idMarca` no es modificable. */
export type UpdateMarcaData = Partial<Omit<MarcaVehiculo, '_id' | 'idMarca'>>;

// --- Aseguradora Types ---
/**
 * Representa un ajustador asociado a una compañía de seguros.
 * El `idAjustador` es un ObjectId string generado por MongoDB y es único.
 */
export interface Ajustador {
  idAjustador: string; // ID único del ajustador, generado por MongoDB (ObjectId como string).
  nombre: string; // Nombre completo del ajustador.
  telefono?: string; // Número de teléfono del ajustador.
  correo?: string; // Correo electrónico del ajustador.
}

/**
 * Representa una compañía de seguros.
 * El `_id` (ObjectId string) es el identificador principal.
 */
export interface Aseguradora {
  _id: string; // ID principal de la aseguradora, generado por MongoDB (ObjectId como string).
  nombre: string; // Nombre de la compañía de seguros, debe ser único.
  telefono?: string; // Número de teléfono de la aseguradora.
  ajustadores?: Ajustador[]; // Array de ajustadores asociados a esta aseguradora.
}
/** Tipo de datos para crear una nueva aseguradora. El `_id` es generado automáticamente. */
export type NewAseguradoraData = Omit<Aseguradora, '_id'>;
/** Tipo de datos para actualizar una aseguradora. El `_id` no es modificable. */
export type UpdateAseguradoraData = Partial<Omit<Aseguradora, '_id'>>;

// --- Cliente Types ---
/**
 * Representa un cliente del taller automotriz.
 */
export interface Cliente {
  _id?: string; // ID principal del cliente, generado por MongoDB (ObjectId como string).
  idCliente: number; // ID numérico personalizado y secuencial para el cliente.
  nombre?: string; // Nombre completo (para personas físicas).
  razonSocial?: string; // Razón social (para personas morales/empresas).
  rfc?: string; // RFC del cliente.
  telefono?: string; // Número de teléfono del cliente.
  correo?: string; // Correo electrónico del cliente.
  // ordenes?: { idOrden: number }[]; // Ejemplo si se decidiera embeber referencias a órdenes.
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
  concepto: string; // Descripción del concepto (ej. "Cambio de facia delantera").
  cantidad: number; // Cantidad del concepto (ej. 1 pieza, 2 horas).
  precio: number; // Precio unitario o total del concepto.
  pintura: boolean; // Indica si el concepto requiere trabajo de pintura.
  procedimiento: string; // Tipo de procedimiento (ej. "reparacion", "cambio", "diagnostico").
  idRefaccion?: string; // Referencia al _id (string) de una Refaccion (si aplica, ej. para "cambio").
}

/**
 * Representa un presupuesto o cotización para una orden de servicio.
 */
export interface Presupuesto {
  _id?: string; // ID principal del presupuesto, generado por MongoDB (ObjectId como string).
  idPresupuesto: number; // ID numérico personalizado y secuencial para el presupuesto.
  idOrder: number; // Referencia al idOrder (numérico) de la Order asociada.
  conceptos: ConceptoPresupuesto[]; // Array de conceptos que componen el presupuesto.
  // Se podrían añadir más campos como: total, fechaCreacion, version, etc.
}

// --- Refaccion Types ---
/**
 * Representa una refacción o parte de repuesto utilizada en una orden de servicio.
 */
export interface Refaccion {
  _id?: string; // ID principal de la refacción, generado por MongoDB (ObjectId como string).
  idRefaccion: number; // ID numérico personalizado y secuencial para la refacción.
  idOrder: number; // Referencia al idOrder (numérico) de la Order a la que pertenece.
  refaccion: string; // Nombre o descripción de la refacción.
  cantidad: number; // Cantidad necesaria o utilizada.
  idMarca?: string; // Referencia al _id (string) de MarcaVehiculo (si es una refacción específica de marca).
  idModelo?: number; // Referencia al idModelo (numérico) de ModeloVehiculo.
  año?: number; // Año de la refacción o del vehículo para el que aplica.
  proveedor?: string; // Nombre del proveedor.
  precio?: number; // Costo de la refacción.
  fechaPromesa?: Date; // Fecha promesa de llegada por parte del proveedor.
  fechaAlta?: Date; // Fecha en que se registró la refacción en el sistema.
  fechaBaja?: Date; // Fecha en que se dio de baja (ej. por uso o devolución).
  numGuia?: string; // Número de guía del envío (si aplica).
  fechaDevolucion?: Date; // Fecha de devolución al proveedor (si aplica).
  surtido?: boolean; // Indica si la refacción ya fue surtida/recibida.
  observaciones?: string; // Comentarios adicionales (ej. "Dañado", "Pedido especial").
}

