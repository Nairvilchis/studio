
'use server';

import OrderManager from '@/serviceOrderManager';
import type { Order, NewOrderData, UpdateOrderData } from '@/lib/types';
import type { Filter, ObjectId } from 'mongodb'; // Keep ObjectId for internal manager types if needed
import UserManager from '@/userManager';


interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface Advisor {
  _id: string;
  usuario: string; // Or whatever field is used for the user's name/identifier
}

interface EmployeeOption {
  _id: string;
  nombre: string; // Using 'nombre' from the unified User interface
}


interface Valuador {
 _id: string;
  usuario: string; // Or whatever field is used for the advisor's name
}

// Helper function to serialize _id to string and ensure dates are client-friendly
// The Order type from lib/types already expects _id as string | undefined
function serializeOrder(orderFromDb: any): Order { // orderFromDb is raw doc from Mongo
  return {
    ...orderFromDb,
    _id: orderFromDb._id ? orderFromDb._id.toHexString() : undefined,
    // Ensure dates are consistently handled, client might expect ISO strings or Date objects
    // For now, assume client handles Date objects if they are passed as such.
    // If client strictly needs ISO strings, convert them here.
    fechaRegistro: orderFromDb.fechaRegistro, // Keep as Date, or .toISOString()
    fechaValuacion: orderFromDb.fechaValuacion ? orderFromDb.fechaValuacion : undefined,
    fechaRengreso: orderFromDb.fechaRengreso ? orderFromDb.fechaRengreso : undefined,
    fechaEntrega: orderFromDb.fechaEntrega ? orderFromDb.fechaEntrega : undefined,
    fechaPromesa: orderFromDb.fechaPromesa ? orderFromDb.fechaPromesa : undefined,
    log: orderFromDb.log?.map((entry: any) => ({ ...entry, timestamp: entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp) }))
  } as Order;
}

function serializeOrders(ordersFromDb: any[]): Order[] {
  return ordersFromDb.map(serializeOrder);
}

function serializeAdvisor(advisorFromDb: any): Advisor {
  return {
 _id: advisorFromDb._id.toHexString(),
 usuario: advisorFromDb.usuario // Assuming 'usuario' is the name field
  };
}

function serializeEmployeeOption(userFromDb: any): EmployeeOption {
 return {
    _id: userFromDb._id.toHexString(),
    nombre: userFromDb.nombre // Using 'nombre' as per the unified User interface
 };
}


export async function getAllOrdersAction(filter?: Filter<Omit<Order, '_id'> & { _id?: ObjectId }>): Promise<ActionResult<Order[]>> {
  const orderManager = new OrderManager();
  try {
    const ordersFromDBRaw = await orderManager.getAllOrders(filter as any); // Manager returns docs with ObjectId
    const ordersForClient = serializeOrders(ordersFromDBRaw);
    return { success: true, data: ordersForClient };
  } catch (error) {
    console.error("Server action getAllOrdersAction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener órdenes.";
    return { success: false, error: errorMessage };
  }
}

export async function createOrderAction(
  orderData: NewOrderData,
  userId?: number
): Promise<ActionResult<{ orderId: string | null, customOrderId?: number }>> {
  const orderManager = new OrderManager();
  try {
    const dataWithDates: NewOrderData = { // Ensure dates are Date objects for manager
      ...orderData,
      fechaValuacion: orderData.fechaValuacion ? new Date(orderData.fechaValuacion) : undefined,
      fechaRengreso: orderData.fechaRengreso ? new Date(orderData.fechaRengreso) : undefined,
      fechaEntrega: orderData.fechaEntrega ? new Date(orderData.fechaEntrega) : undefined,
      fechaPromesa: orderData.fechaPromesa ? new Date(orderData.fechaPromesa) : undefined,
    };

    const newMongoIdObject = await orderManager.createOrder(dataWithDates, userId); // Returns ObjectId
    if (newMongoIdObject) {
      const createdOrderRaw = await orderManager.getOrderById(newMongoIdObject.toHexString()); // Fetch by string _id
      return {
        success: true,
        message: 'Orden creada exitosamente.',
        data: {
          orderId: newMongoIdObject.toHexString(), // String for client
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

export async function getOrderByIdAction(id: string): Promise<ActionResult<Order | null>> {
  const orderManager = new OrderManager();
  try {
    const orderFromDBRaw = await orderManager.getOrderById(id); // `id` is string, manager handles ObjectId
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

export async function updateOrderProcesoAction(id: string, proceso: Order['proceso'], userId?: number): Promise<ActionResult<null>> {
    const orderManager = new OrderManager();
    try {
        // `id` is string, manager.updateOrderProceso expects string
        const success = await orderManager.updateOrderProceso(id, proceso, userId);
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

export async function getValuadores(): Promise<ActionResult<Valuador[]>> {
  const userManager = new UserManager();
  try {
    const users = await userManager.getAllUsers();
    const valuadores = users.filter(user => user.rol === UserRole.VALUADOR).map(serializeAdvisor);
    return { success: true, data: valuadores };
  } catch (error) {
    console.error("Server action getValuadores error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener valuadores.";
    return { success: false, error: errorMessage };
  }
}

import { UserRole } from '@/lib/types';

export async function getAsesores(): Promise<ActionResult<Advisor[]>> {
  const userManager = new UserManager();
  try {
    const users = await userManager.getAllUsers();
    const asesores = users.filter(user => user.rol === UserRole.ASESOR).map(serializeAdvisor);
    return { success: true, data: asesores };
  } catch (error) {
    console.error("Server action getAsesores error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener asesores.";
    return { success: false, error: errorMessage };
  }
}

export async function getEmployeesByPosition(position: string): Promise<ActionResult<EmployeeOption[]>> {
  const userManager = new UserManager();
  try {
    // Fetch from the 'users' collection and filter by the 'puesto' field
    const usersWithPosition = await userManager.getAllUsers(); // Assuming getAllUsers fetches all fields
    const filteredEmployees = usersWithPosition.filter(user => user.puesto === position);
    const employeeOptions = filteredEmployees.map(serializeEmployeeOption);
 return { success: true, data: employeeOptions };
  } catch (error) {
    console.error(`Server action getEmployeesByPosition (${position}) error:`, error);
    // Correctly return the error message
    const errorMessage = error instanceof Error ? error.message : `Error desconocido al obtener empleados con puesto ${position}.`;
 return { success: false, error: errorMessage };
}}

export async function updateOrderAction(
  id: string,
  updateData: UpdateOrderData,
  // This userId parameter seems unused based on the manager call, review its purpose.
  userId?: number
): Promise<ActionResult<null>> {
  const orderManager = new OrderManager();
  try {
    const dataWithDates: UpdateOrderData = { // Ensure dates are Date objects for manager
      ...updateData,
      fechaValuacion: updateData.fechaValuacion ? new Date(updateData.fechaValuacion) : undefined,
      fechaRengreso: updateData.fechaRengreso ? new Date(updateData.fechaRengreso) : undefined,
      fechaEntrega: updateData.fechaEntrega ? new Date(updateData.fechaEntrega) : undefined,
      fechaPromesa: updateData.fechaPromesa ? new Date(updateData.fechaPromesa) : undefined,
    };
    // `id` is string, manager.updateOrder expects string
    const success = await orderManager.updateOrder(id, dataWithDates, userId);
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

export async function deleteOrderAction(id: string): Promise<ActionResult<null>> {
    const orderManager = new OrderManager();
    try {
        // `id` is string, manager.deleteOrder expects string
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
