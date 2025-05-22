
'use server';

import OrderManager from '@/serviceOrderManager';
import type { Order, NewOrderData, UpdateOrderData, Empleado, Ajustador } from '@/lib/types'; 
import { UserRole } from '@/lib/types';
import type { Filter } from 'mongodb';
import EmpleadoManager from '@/empleadoManager'; 
import AseguradoraManager from '@/aseguradoraManager'; // For fetching ajustadores

/**
 * Interface para el resultado de las acciones del servidor.
 * @template T Tipo de datos devueltos en caso de éxito.
 */
interface ActionResult<T> {
  success: boolean; // Indica si la acción fue exitosa.
  data?: T; // Datos devueltos por la acción en caso de éxito.
  error?: string; // Mensaje de error si la acción falló.
  message?: string; // Mensaje opcional de éxito o informativo.
}

/**
 * Opciones de empleado para componentes Select.
 * Contiene el _id (string) y el nombre del empleado.
 */
interface EmployeeOption {
  _id: string; 
  nombre: string; 
}

/**
 * Serializa un objeto Order de la base de datos a un formato amigable para el cliente.
 * Asegura que _id sea string y que las fechas se manejen correctamente.
 * El log de la orden también se serializa.
 * @param {any} orderFromDb - Objeto Order crudo de MongoDB.
 * @returns {Order} Objeto Order serializado.
 */
function serializeOrder(orderFromDb: any): Order {
  const serialized = { 
    ...orderFromDb,
    _id: orderFromDb._id ? orderFromDb._id.toHexString() : undefined,
    // Fechas se mantienen como objetos Date o undefined. El cliente las formateará.
    fechaRegistro: orderFromDb.fechaRegistro, 
    fechaValuacion: orderFromDb.fechaValuacion || undefined,
    fechaRengreso: orderFromDb.fechaRengreso || undefined,
    fechaEntrega: orderFromDb.fechaEntrega || undefined,
    fechaPromesa: orderFromDb.fechaPromesa || undefined,
    // Asegurar que idModelo y ajustador (si existen) sean strings.
    idModelo: orderFromDb.idModelo?.toString(), 
    ajustador: orderFromDb.ajustador?.toString(),
    log: orderFromDb.log?.map((entry: any) => ({ 
        ...entry, 
        timestamp: entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp),
        userId: entry.userId?.toString() 
    })) || []
  };
  return serialized as Order;
}

/**
 * Serializa un array de objetos Order.
 * @param {any[]} ordersFromDb - Array de objetos Order crudos de MongoDB.
 * @returns {Order[]} Array de objetos Order serializados.
 */
function serializeOrders(ordersFromDb: any[]): Order[] {
  return ordersFromDb.map(serializeOrder);
}

/**
 * Serializa un objeto Empleado al formato EmployeeOption para Selects.
 * @param {Empleado} empleado - Objeto Empleado.
 * @returns {EmployeeOption} Objeto con _id y nombre.
 */
function serializeEmpleadoToEmployeeOption(empleado: Empleado): EmployeeOption {
 return {
    _id: empleado._id!, // _id ya es string desde EmpleadoManager o al ser serializado.
    nombre: empleado.nombre
 };
}

/**
 * Acción del servidor para obtener todas las órdenes de servicio.
 * @param {Filter<Order>} [filter] - Filtro opcional de MongoDB.
 * @returns {Promise<ActionResult<Order[]>>} Resultado con un array de órdenes o un error.
 */
export async function getAllOrdersAction(filter?: Filter<Order>): Promise<ActionResult<Order[]>> {
  const orderManager = new OrderManager();
  try {
    const ordersFromDBRaw = await orderManager.getAllOrders(filter);
    const ordersForClient = serializeOrders(ordersFromDBRaw);
    return { success: true, data: ordersForClient };
  } catch (error) {
    console.error("Server action getAllOrdersAction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener órdenes.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Acción del servidor para crear una nueva orden de servicio.
 * @param {NewOrderData} orderData - Datos para la nueva orden.
 * @param {string} [empleadoLogId] - _id (string) del empleado que realiza la acción para el log.
 * @returns {Promise<ActionResult<{ orderId: string | null, customOrderId?: number }>>} Resultado con el _id de la nueva orden y su idOrder, o un error.
 */
export async function createOrderAction(
  orderData: NewOrderData,
  empleadoLogId?: string 
): Promise<ActionResult<{ orderId: string | null, customOrderId?: number }>> {
  const orderManager = new OrderManager();
  try {
    const dataWithDates: NewOrderData = {
      ...orderData,
      fechaValuacion: orderData.fechaValuacion ? new Date(orderData.fechaValuacion) : undefined,
      fechaRengreso: orderData.fechaRengreso ? new Date(orderData.fechaRengreso) : undefined,
      fechaEntrega: orderData.fechaEntrega ? new Date(orderData.fechaEntrega) : undefined,
      fechaPromesa: orderData.fechaPromesa ? new Date(orderData.fechaPromesa) : undefined,
    };

    const newMongoIdObject = await orderManager.createOrder(dataWithDates, empleadoLogId);
    if (newMongoIdObject) {
      const createdOrderRaw = await orderManager.getOrderById(newMongoIdObject.toHexString());
      return {
        success: true,
        message: 'Orden creada exitosamente.',
        data: {
          orderId: newMongoIdObject.toHexString(),
          customOrderId: createdOrderRaw?.idOrder
        }
      };
    } else {
      return { success: false, error: 'No se pudo crear la orden.' };
    }
  } catch (error) {
    console.error("Server action createOrderAction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear la orden.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Acción del servidor para obtener una orden por su _id de MongoDB.
 * @param {string} id - _id (string) de la orden.
 * @returns {Promise<ActionResult<Order | null>>} Resultado con la orden o un error/mensaje.
 */
export async function getOrderByIdAction(id: string): Promise<ActionResult<Order | null>> {
  const orderManager = new OrderManager();
  try {
    const orderFromDBRaw = await orderManager.getOrderById(id);
    if (orderFromDBRaw) {
      return { success: true, data: serializeOrder(orderFromDBRaw) };
    }
    return { success: true, data: null, message: "Orden no encontrada." };
  } catch (error) {
    console.error("Server action getOrderByIdAction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener la orden.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Acción del servidor para actualizar el proceso de una orden.
 * @param {string} id - _id (string) de la orden.
 * @param {Order['proceso']} proceso - Nuevo estado del proceso.
 * @param {string} [empleadoLogId] - _id (string) del empleado para el log.
 * @returns {Promise<ActionResult<null>>} Resultado indicando éxito o error.
 */
export async function updateOrderProcesoAction(id: string, proceso: Order['proceso'], empleadoLogId?: string): Promise<ActionResult<null>> {
    const orderManager = new OrderManager();
    try {
        const success = await orderManager.updateOrderProceso(id, proceso, empleadoLogId);
        if (success) {
            return { success: true, message: 'Proceso de la orden actualizado.' };
        } else {
            const exists = await orderManager.getOrderById(id);
            if (!exists) return { success: false, error: 'No se pudo actualizar: Orden no encontrada.'};
            return { success: true, message: 'Ningún cambio detectado en el proceso de la orden.' };
        }
    } catch (error) {
        console.error("Server action updateOrderProcesoAction error:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido al actualizar el proceso.";
        return { success: false, error: errorMessage };
    }
}

/**
 * Acción del servidor para obtener empleados con rol Valuador.
 * @returns {Promise<ActionResult<EmployeeOption[]>>} Lista de valuadores para Selects.
 */
export async function getValuadores(): Promise<ActionResult<EmployeeOption[]>> {
  const empleadoManager = new EmpleadoManager(); 
  try {
    const empleados = await empleadoManager.getAllEmpleados(); 
    // Filtra empleados que tengan un objeto 'user' y cuyo rol sea VALUADOR.
    const valuadores = empleados
      .filter(emp => emp.user?.rol === UserRole.VALUADOR)
      .map(serializeEmpleadoToEmployeeOption);
    return { success: true, data: valuadores };
  } catch (error) {
    console.error("Server action getValuadores error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener valuadores.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Acción del servidor para obtener empleados con rol Asesor.
 * @returns {Promise<ActionResult<EmployeeOption[]>>} Lista de asesores para Selects.
 */
export async function getAsesores(): Promise<ActionResult<EmployeeOption[]>> {
  const empleadoManager = new EmpleadoManager(); 
  try {
    const empleados = await empleadoManager.getAllEmpleados();
    // Filtra empleados que tengan un objeto 'user' y cuyo rol sea ASESOR.
    const asesores = empleados
        .filter(emp => emp.user?.rol === UserRole.ASESOR)
        .map(serializeEmpleadoToEmployeeOption);
    return { success: true, data: asesores };
  } catch (error) {
    console.error("Server action getAsesores error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener asesores.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Acción del servidor para obtener empleados por un puesto específico.
 * @param {string} position - Puesto a filtrar (ej. "Hojalatero", "Pintor").
 * @returns {Promise<ActionResult<EmployeeOption[]>>} Lista de empleados para Selects.
 */
export async function getEmployeesByPosition(position: string): Promise<ActionResult<EmployeeOption[]>> {
  const empleadoManager = new EmpleadoManager(); 
  try {
    const empleados = await empleadoManager.getAllEmpleados();
    const filteredEmployees = empleados.filter(emp => emp.puesto === position); 
    const employeeOptions = filteredEmployees.map(serializeEmpleadoToEmployeeOption);
    return { success: true, data: employeeOptions };
  } catch (error) {
    console.error(`Server action getEmployeesByPosition (${position}) error:`, error);
    const errorMessage = error instanceof Error ? error.message : `Error desconocido al obtener empleados con puesto ${position}.`;
    return { success: false, error: errorMessage };
  }
}

/**
 * Acción del servidor para actualizar una orden existente.
 * @param {string} id - _id (string) de la orden a actualizar.
 * @param {UpdateOrderData} updateData - Datos a actualizar.
 * @param {string} [empleadoLogId] - _id (string) del empleado para el log.
 * @returns {Promise<ActionResult<null>>} Resultado indicando éxito o error.
 */
export async function updateOrderAction(
  id: string,
  updateData: UpdateOrderData,
  empleadoLogId?: string 
): Promise<ActionResult<null>> {
  const orderManager = new OrderManager();
  try {
    const dataWithDates: UpdateOrderData = {
      ...updateData,
      fechaValuacion: updateData.fechaValuacion ? new Date(updateData.fechaValuacion) : undefined,
      fechaRengreso: updateData.fechaRengreso ? new Date(updateData.fechaRengreso) : undefined,
      fechaEntrega: updateData.fechaEntrega ? new Date(updateData.fechaEntrega) : undefined,
      fechaPromesa: updateData.fechaPromesa ? new Date(updateData.fechaPromesa) : undefined,
    };
    const success = await orderManager.updateOrder(id, dataWithDates, empleadoLogId);
    if (success) {
      return { success: true, message: 'Orden actualizada exitosamente.' };
    } else {
      const exists = await orderManager.getOrderById(id);
      if (!exists) return { success: false, error: 'No se pudo actualizar: Orden no encontrada.'};
      return { success: true, message: 'Ningún cambio detectado en la orden.' };
    }
  } catch (error) {
    console.error("Server action updateOrderAction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al actualizar la orden.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Acción del servidor para eliminar una orden.
 * @param {string} id - _id (string) de la orden a eliminar.
 * @returns {Promise<ActionResult<null>>} Resultado indicando éxito o error.
 */
export async function deleteOrderAction(id: string): Promise<ActionResult<null>> {
    const orderManager = new OrderManager();
    try {
        const success = await orderManager.deleteOrder(id);
        if (success) {
            return { success: true, message: 'Orden eliminada exitosamente.' };
        } else {
            return { success: false, error: 'No se pudo eliminar la orden o no se encontró.' };
        }
    } catch (error) {
        console.error("Server action deleteOrderAction error:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido al eliminar la orden.";
        return { success: false, error: errorMessage };
    }
}

/**
 * Acción del servidor para obtener ajustadores de una aseguradora específica para un Select.
 * @param {string} aseguradoraId - _id (string) de la aseguradora.
 * @returns {Promise<ActionResult<{idAjustador: string, nombre: string}[]>>} Lista de ajustadores (idAjustador, nombre).
 */
export async function getAjustadoresForSelectByAseguradoraAction(aseguradoraId: string): Promise<ActionResult<{idAjustador: string, nombre: string}[]>> {
  const aseguradoraManager = new AseguradoraManager();
  try {
    if (!aseguradoraId) {
      return { success: false, error: "ID de Aseguradora es requerido." };
    }
    const aseguradora = await aseguradoraManager.getAseguradoraById(aseguradoraId); // _id es string
    if (aseguradora && aseguradora.ajustadores) {
      // idAjustador ya es string ObjectId desde el manager
      return { success: true, data: aseguradora.ajustadores.map(aj => ({ idAjustador: aj.idAjustador, nombre: aj.nombre })) };
    }
    return { success: true, data: [] }; // No ajustadores or aseguradora not found
  } catch (error) {
    console.error("Server action getAjustadoresForSelectByAseguradoraAction error:", error);
    return { success: false, error: "Error al obtener ajustadores." };
  }
}
