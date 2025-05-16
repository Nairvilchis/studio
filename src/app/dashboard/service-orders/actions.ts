
'use server';

// Renamed ServiceOrderManager to OrderManager conceptually, but class name might be the same
// Using OrderManager and Order type, assuming serviceOrderManager.ts has been updated.
import OrderManager, { type Order, type NewOrderData, type UpdateOrderData } from '@/serviceOrderManager';
import type { Filter } from 'mongodb';

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper function to serialize ObjectId to string for Order
function serializeOrder(order: Order): Order {
  return {
    ...order,
    _id: order._id?.toHexString() as any, // Cast to any because ObjectId will be stringified
    // Ensure Date objects are preserved or converted to ISO strings if needed by client
    fechaRegistro: order.fechaRegistro, // Keep as Date object or convert: new Date(order.fechaRegistro).toISOString(),
    fechaValuacion: order.fechaValuacion ? order.fechaValuacion : undefined,
    fechaRengreso: order.fechaRengreso ? order.fechaRengreso : undefined,
    fechaEntrega: order.fechaEntrega ? order.fechaEntrega : undefined,
    fechaPromesa: order.fechaPromesa ? order.fechaPromesa : undefined,
  };
}

function serializeOrders(orders: Order[]): Order[] {
  return orders.map(serializeOrder);
}


export async function getAllOrdersAction(filter?: Filter<Order>): Promise<ActionResult<Order[]>> {
  const orderManager = new OrderManager();
  try {
    const ordersFromDB = await orderManager.getAllOrders(filter);
    const orders = serializeOrders(ordersFromDB);
    return { success: true, data: orders };
  } catch (error) {
    console.error("Server action getAllOrdersAction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener órdenes.";
    return { success: false, error: errorMessage };
  }
}

export async function createOrderAction(
  orderData: NewOrderData, // Use the new type for creating orders
  userId?: number // Optional userId for logging who created the order
): Promise<ActionResult<{ orderId: string | null, customOrderId?: number }>> {
  const orderManager = new OrderManager();
  try {
    const newMongoId = await orderManager.createOrder(orderData, userId);
    if (newMongoId) {
      const createdOrder = await orderManager.getOrderById(newMongoId.toHexString());
      return { 
        success: true, 
        message: 'Orden creada exitosamente.', 
        data: { 
          orderId: newMongoId.toHexString(), // MongoDB _id
          customOrderId: createdOrder?.idOrder // Custom human-readable idOrder
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

export async function getOrderByIdAction(id: string): Promise<ActionResult<Order | null>> { // Gets by MongoDB _id
  const orderManager = new OrderManager();
  try {
    const orderFromDB = await orderManager.getOrderById(id);
    if (orderFromDB) {
      return { success: true, data: serializeOrder(orderFromDB) };
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
        const success = await orderManager.updateOrderProceso(id, proceso, userId);
        if (success) {
            return { success: true, message: 'Proceso de la orden actualizado.' };
        } else {
            return { success: false, error: 'No se pudo actualizar el proceso de la orden o no se encontró.' };
        }
    } catch (error) {
        console.error("Server action updateOrderProcesoAction error:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido al actualizar el proceso.";
        return { success: false, error: errorMessage };
    }
}

export async function updateOrderAction(
  id: string, // MongoDB _id
  updateData: UpdateOrderData, // Use the new type for updating orders
  userId?: number // Optional userId for logging who updated
): Promise<ActionResult<null>> {
  const orderManager = new OrderManager();
  try {
    const success = await orderManager.updateOrder(id, updateData, userId);
    if (success) {
      return { success: true, message: 'Orden actualizada exitosamente.' };
    } else {
      return { success: false, error: 'No se pudo actualizar la orden o no se encontró.' };
    }
  } catch (error) {
    console.error("Server action updateOrderAction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al actualizar la orden.";
    return { success: false, error: errorMessage };
  }
}

export async function deleteOrderAction(id: string): Promise<ActionResult<null>> { // Deletes by MongoDB _id
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
