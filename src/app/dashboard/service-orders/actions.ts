
'use server';

import OrderManager from '@/serviceOrderManager';
import type { Order, NewOrderData, UpdateOrderData, Empleado, Ajustador } from '@/lib/types'; 
import { UserRole } from '@/lib/types';
import type { Filter, ObjectId as MongoObjectIdType } from 'mongodb'; // For MongoDB ObjectId type
import { ObjectId } from 'mongodb'; // For ObjectId validation and construction
import EmpleadoManager from '@/empleadoManager'; 
import AseguradoraManager from '@/aseguradoraManager'; 

/**
 * Interface for the result of server actions.
 * @template T Type of data returned on success.
 */
interface ActionResult<T> {
  success: boolean; // Indicates if the action was successful.
  data?: T; // Data returned by the action on success.
  error?: string; // Error message if the action failed.
  message?: string; // Optional success or informational message.
}

/**
 * Options for employee-related select components.
 * Contains the _id (string ObjectId) and the name of the employee.
 */
interface EmployeeOption {
  _id: string; 
  nombre: string; 
}

/**
 * Serializes an Order object from the database format (with MongoDB ObjectId for _id and Date objects)
 * to a client-friendly format (with _id as string and dates as Date objects or undefined).
 * The log entries and presupuesto items are also processed.
 * @param {any} orderFromDb - Raw Order object from MongoDB.
 * @returns {Order} Serialized Order object.
 */
function serializeOrder(orderFromDb: any): Order {
  const serialized: Order = { 
    ...orderFromDb,
    _id: orderFromDb._id ? (orderFromDb._id instanceof ObjectId ? orderFromDb._id.toHexString() : orderFromDb._id) : undefined,
    // Convert all ObjectId-string fields to ensure they are strings
    idAseguradora: orderFromDb.idAseguradora?.toString(),
    idAjustador: orderFromDb.idAjustador?.toString(),
    idMarca: orderFromDb.idMarca?.toString(),
    idModelo: orderFromDb.idModelo?.toString(),
    idCliente: orderFromDb.idCliente?.toString(),
    idValuador: orderFromDb.idValuador?.toString(),
    idAsesor: orderFromDb.idAsesor?.toString(),
    idHojalatero: orderFromDb.idHojalatero?.toString(),
    idPintor: orderFromDb.idPintor?.toString(),

    // Dates are already Date objects from the manager, or should be converted if string
    fechaRegistro: orderFromDb.fechaRegistro instanceof Date ? orderFromDb.fechaRegistro : new Date(orderFromDb.fechaRegistro), 
    fechaValuacion: orderFromDb.fechaValuacion ? (orderFromDb.fechaValuacion instanceof Date ? orderFromDb.fechaValuacion : new Date(orderFromDb.fechaValuacion)) : undefined,
    fechaReingreso: orderFromDb.fechaReingreso ? (orderFromDb.fechaReingreso instanceof Date ? orderFromDb.fechaReingreso : new Date(orderFromDb.fechaReingreso)) : undefined,
    fechaEntrega: orderFromDb.fechaEntrega ? (orderFromDb.fechaEntrega instanceof Date ? orderFromDb.fechaEntrega : new Date(orderFromDb.fechaEntrega)) : undefined,
    fechaPromesa: orderFromDb.fechaPromesa ? (orderFromDb.fechaPromesa instanceof Date ? orderFromDb.fechaPromesa : new Date(orderFromDb.fechaPromesa)) : undefined,
    fechaBaja: orderFromDb.fechaBaja ? (orderFromDb.fechaBaja instanceof Date ? orderFromDb.fechaBaja : new Date(orderFromDb.fechaBaja)) : undefined,
    
    log: orderFromDb.log?.map((entry: any) => ({ 
        ...entry, 
        timestamp: entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp),
        userId: entry.userId?.toString() // Ensure userId in log is string
    })) || [],
    presupuestos: orderFromDb.presupuestos?.map((item: any) => ({
        ...item,
        idRefaccion: item.idRefaccion?.toString() // Ensure idRefaccion in presupuesto is string
    })) || [],
  };
  return serialized;
}

/**
 * Serializes an array of Order objects.
 * @param {any[]} ordersFromDb - Array of raw Order objects from MongoDB.
 * @returns {Order[]} Array of serialized Order objects.
 */
function serializeOrders(ordersFromDb: any[]): Order[] {
  return ordersFromDb.map(serializeOrder);
}

/**
 * Serializes an Empleado object to the EmployeeOption format for Selects.
 * @param {Empleado} empleado - Empleado object (assumes _id is already string or will be).
 * @returns {EmployeeOption} Object with _id and nombre.
 */
function serializeEmpleadoToEmployeeOption(empleado: Empleado): EmployeeOption {
 return {
    _id: empleado._id!, // _id is already string from Empleado type def
    nombre: empleado.nombre
 };
}

/**
 * Server Action to get all service orders.
 * @param {Filter<Order>} [filter] - Optional MongoDB filter.
 * @returns {Promise<ActionResult<Order[]>>} Result object with an array of orders or an error.
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
 * Server Action to create a new service order.
 * @param {NewOrderData} orderData - Data for the new order.
 * @param {string} [empleadoLogId] - _id (string ObjectId) of the employee performing the action for the log.
 * @returns {Promise<ActionResult<{ orderId: string | null, customOrderId?: number }>>} Result with the MongoDB _id of the new order and its custom idOrder, or an error.
 */
export async function createOrderAction(
  orderData: NewOrderData,
  empleadoLogId?: string 
): Promise<ActionResult<{ orderId: string | null, customOrderId?: number }>> {
  const orderManager = new OrderManager();
  try {
    // Convert date strings from form to Date objects if necessary
    const dataWithDates: NewOrderData = {
      ...orderData,
      fechaValuacion: orderData.fechaValuacion ? new Date(orderData.fechaValuacion) : undefined,
      fechaReingreso: orderData.fechaReingreso ? new Date(orderData.fechaReingreso) : undefined,
      fechaEntrega: orderData.fechaEntrega ? new Date(orderData.fechaEntrega) : undefined,
      fechaPromesa: orderData.fechaPromesa ? new Date(orderData.fechaPromesa) : undefined,
      fechaBaja: orderData.fechaBaja ? new Date(orderData.fechaBaja) : undefined,
      // Ensure boolean for aseguradoTercero if it's coming from a select that might send string 'true'/'false'
      aseguradoTercero: typeof orderData.aseguradoTercero === 'string' ? orderData.aseguradoTercero === 'true' : orderData.aseguradoTercero,
    };

    const newMongoIdObject: MongoObjectIdType | null = await orderManager.createOrder(dataWithDates, empleadoLogId);
    if (newMongoIdObject) {
      const createdOrderRaw = await orderManager.getOrderById(newMongoIdObject.toHexString()); // Fetch by string _id
      return {
        success: true,
        message: `Orden OT-${createdOrderRaw?.idOrder} creada exitosamente.`,
        data: {
          orderId: newMongoIdObject.toHexString(), // MongoDB _id as string
          customOrderId: createdOrderRaw?.idOrder // Custom numeric idOrder
        }
      };
    } else {
      return { success: false, error: 'No se pudo crear la orden (manager retornó null).' };
    }
  } catch (error) {
    console.error("Server action createOrderAction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear la orden.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to get an order by its MongoDB _id (string).
 * @param {string} id - The MongoDB _id (as a hex string) of the order.
 * @returns {Promise<ActionResult<Order | null>>} Result object with the order data or an error/message.
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
 * Server Action to update the process of an order.
 * @param {string} id - The MongoDB _id (string) of the order.
 * @param {Order['proceso']} proceso - New process state.
 * @param {string} [empleadoLogId] - _id (string ObjectId) of the employee for the log.
 * @returns {Promise<ActionResult<null>>} Result indicating success or error.
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
            // If it exists but modifiedCount was 0, it means no actual data changed.
            return { success: true, message: 'Ningún cambio detectado en el proceso de la orden.' };
        }
    } catch (error) {
        console.error("Server action updateOrderProcesoAction error:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido al actualizar el proceso.";
        return { success: false, error: errorMessage };
    }
}

/**
 * Server Action to get employees with rol 'VALUADOR'.
 * @returns {Promise<ActionResult<EmployeeOption[]>>} List of valuadores for Selects.
 */
export async function getValuadores(): Promise<ActionResult<EmployeeOption[]>> {
  const empleadoManager = new EmpleadoManager(); 
  try {
    const empleados = await empleadoManager.getAllEmpleados(); // Returns Empleado[] with _id as string.
    // Filter employees who have a 'user' object and whose role is VALUADOR.
    const valuadores = empleados
      .filter(emp => emp.user?.rol === UserRole.VALUADOR)
      .map(serializeEmpleadoToEmployeeOption); // _id is already string here
    return { success: true, data: valuadores };
  } catch (error) {
    console.error("Server action getValuadores error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener valuadores.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to get employees with rol 'ASESOR'.
 * @returns {Promise<ActionResult<EmployeeOption[]>>} List of asesores for Selects.
 */
export async function getAsesores(): Promise<ActionResult<EmployeeOption[]>> {
  const empleadoManager = new EmpleadoManager(); 
  try {
    const empleados = await empleadoManager.getAllEmpleados();
    // Filter employees who have a 'user' object and whose role is ASESOR.
    const asesores = empleados
        .filter(emp => emp.user?.rol === UserRole.ASESOR)
        .map(serializeEmpleadoToEmployeeOption); // _id is already string
    return { success: true, data: asesores };
  } catch (error) {
    console.error("Server action getAsesores error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener asesores.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to get employees by a specific position.
 * @param {string} position - Position to filter (e.g., "Hojalatero", "Pintor").
 * @returns {Promise<ActionResult<EmployeeOption[]>>} List of employees for Selects.
 */
export async function getEmployeesByPosition(position: string): Promise<ActionResult<EmployeeOption[]>> {
  const empleadoManager = new EmpleadoManager(); 
  try {
    const empleados = await empleadoManager.getAllEmpleados(); // Empleado[] with _id as string
    const filteredEmployees = empleados.filter(emp => emp.puesto === position); 
    const employeeOptions = filteredEmployees.map(serializeEmpleadoToEmployeeOption); // _id is string
    return { success: true, data: employeeOptions };
  } catch (error) {
    console.error(`Server action getEmployeesByPosition (${position}) error:`, error);
    const errorMessage = error instanceof Error ? error.message : `Error desconocido al obtener empleados con puesto ${position}.`;
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to update an existing order.
 * @param {string} id - The MongoDB _id (string) of the order to update.
 * @param {UpdateOrderData} updateData - Data to update.
 * @param {string} [empleadoLogId] - _id (string ObjectId) of the employee for the log.
 * @returns {Promise<ActionResult<null>>} Result indicating success or error.
 */
export async function updateOrderAction(
  id: string,
  updateData: UpdateOrderData,
  empleadoLogId?: string 
): Promise<ActionResult<null>> {
  const orderManager = new OrderManager();
  try {
    // Convert date strings from form to Date objects if necessary
    const dataWithDates: UpdateOrderData = {
      ...updateData,
      fechaValuacion: updateData.fechaValuacion ? new Date(updateData.fechaValuacion) : undefined,
      fechaReingreso: updateData.fechaReingreso ? new Date(updateData.fechaReingreso) : undefined,
      fechaEntrega: updateData.fechaEntrega ? new Date(updateData.fechaEntrega) : undefined,
      fechaPromesa: updateData.fechaPromesa ? new Date(updateData.fechaPromesa) : undefined,
      fechaBaja: updateData.fechaBaja ? new Date(updateData.fechaBaja) : undefined,
      // Ensure boolean for aseguradoTercero
      aseguradoTercero: typeof updateData.aseguradoTercero === 'string' ? updateData.aseguradoTercero === 'true' : updateData.aseguradoTercero,
    };

    const success = await orderManager.updateOrder(id, dataWithDates, empleadoLogId);
    if (success) {
      return { success: true, message: 'Orden actualizada exitosamente.' };
    } else {
      const existsResult = await orderManager.getOrderById(id);
      if (!existsResult) return { success: false, error: 'No se pudo actualizar: Orden no encontrada.'};
      // If it exists but modifiedCount was 0 (or success was false for other reasons like no change)
      return { success: true, message: 'Ningún cambio detectado en la orden o la orden no fue encontrada.' };
    }
  } catch (error) {
    console.error("Server action updateOrderAction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al actualizar la orden.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to delete an order.
 * @param {string} id - The MongoDB _id (string) of the order to delete.
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function deleteOrderAction(id: string): Promise<ActionResult<null>> {
    const orderManager = new OrderManager();
    try {
        const success = await orderManager.deleteOrder(id);
        if (success) {
            return { success: true, message: 'Orden eliminada exitosamente.' };
        } else {
            // Could mean not found or other deletion failure.
            return { success: false, error: 'No se pudo eliminar la orden o no se encontró.' };
        }
    } catch (error) {
        console.error("Server action deleteOrderAction error:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido al eliminar la orden.";
        return { success: false, error: errorMessage };
    }
}

/**
 * Server Action to get ajustadores for a specific aseguradora, returning only idAjustador and nombre.
 * Used for populating select/dropdown components in the UI.
 * @param {string} aseguradoraId - The MongoDB _id (string) of the aseguradora.
 * @returns {Promise<ActionResult<Pick<Ajustador, 'idAjustador' | 'nombre'>[]>>} Result object with an array of ajustadores (idAjustador, nombre) or an error.
 */
export async function getAjustadoresByAseguradora(aseguradoraId: string): Promise<ActionResult<Pick<Ajustador, 'idAjustador' | 'nombre'>[]>> {
 const aseguradoraManager = new AseguradoraManager();
 try {
    if (!aseguradoraId) {
        return { success: false, error: "Se requiere el ID de la aseguradora." };
    }
    // The manager's method returns the Aseguradora object with _id as string and ajustadores with idAjustador as string.
    const aseguradora = await aseguradoraManager.getAseguradoraById(aseguradoraId); 
    if (aseguradora && aseguradora.ajustadores) {
        // Map to the desired structure for the select component.
        return { success: true, data: aseguradora.ajustadores.map(adj => ({ idAjustador: adj.idAjustador, nombre: adj.nombre })) };
    }
    return { success: true, data: [], message: "Aseguradora no encontrada o sin ajustadores." };
 } catch (error) {
    console.error("Server action getAjustadoresByAseguradora error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener ajustadores." };
 }
}

