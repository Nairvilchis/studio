
'use server';

import ServiceOrderManager, { type ServiceOrder } from '@/serviceOrderManager';
import type { Filter } from 'mongodb';

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper function to serialize ObjectId to string for ServiceOrder
function serializeServiceOrder(order: ServiceOrder): ServiceOrder {
  return {
    ...order,
    _id: order._id?.toHexString() as any, // Cast to any because ObjectId will be stringified
  };
}

function serializeServiceOrders(orders: ServiceOrder[]): ServiceOrder[] {
  return orders.map(serializeServiceOrder);
}


export async function getAllServiceOrdersAction(filter?: Filter<ServiceOrder>): Promise<ActionResult<ServiceOrder[]>> {
  const serviceOrderManager = new ServiceOrderManager();
  try {
    const ordersFromDB = await serviceOrderManager.getAllServiceOrders(filter);
    // Serialize _id to string before sending to client component
    const orders = serializeServiceOrders(ordersFromDB);
    return { success: true, data: orders };
  } catch (error) {
    console.error("Server action getAllServiceOrdersAction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener órdenes de servicio.";
    return { success: false, error: errorMessage };
  }
}

export async function createServiceOrderAction(
  orderData: Omit<ServiceOrder, '_id' | 'creationDate' | 'orderIdSequence' | 'status'>
): Promise<ActionResult<{ orderId: string | null, orderSequenceId?: number }>> {
  const serviceOrderManager = new ServiceOrderManager();
  try {
    const newOrderId = await serviceOrderManager.createServiceOrder(orderData);
    if (newOrderId) {
      // Fetch the created order to get the sequence ID
      const createdOrder = await serviceOrderManager.getServiceOrderById(newOrderId.toHexString());
      return { 
        success: true, 
        message: 'Orden de servicio creada exitosamente.', 
        data: { 
          orderId: newOrderId.toHexString(),
          orderSequenceId: createdOrder?.orderIdSequence 
        } 
      };
    } else {
      return { success: false, error: 'No se pudo crear la orden de servicio.' };
    }
  } catch (error) {
    console.error("Server action createServiceOrderAction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear la orden de servicio.";
    return { success: false, error: errorMessage };
  }
}

export async function getServiceOrderByIdAction(id: string): Promise<ActionResult<ServiceOrder | null>> {
  const serviceOrderManager = new ServiceOrderManager();
  try {
    const orderFromDB = await serviceOrderManager.getServiceOrderById(id);
    if (orderFromDB) {
      return { success: true, data: serializeServiceOrder(orderFromDB) };
    }
    return { success: true, data: null, message: "Orden no encontrada." };
  } catch (error)
    {
    console.error("Server action getServiceOrderByIdAction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener la orden de servicio.";
    return { success: false, error: errorMessage };
  }
}

export async function updateServiceOrderStatusAction(id: string, status: ServiceOrder['status']): Promise<ActionResult<null>> {
    const serviceOrderManager = new ServiceOrderManager();
    try {
        const success = await serviceOrderManager.updateServiceOrderStatus(id, status);
        if (success) {
            return { success: true, message: 'Estado de la orden actualizado.' };
        } else {
            return { success: false, error: 'No se pudo actualizar el estado de la orden o no se encontró la orden.' };
        }
    } catch (error) {
        console.error("Server action updateServiceOrderStatusAction error:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido al actualizar el estado.";
        return { success: false, error: errorMessage };
    }
}

export async function updateServiceOrderAction(
  id: string, 
  updateData: Partial<Omit<ServiceOrder, '_id' | 'orderIdSequence' | 'creationDate'>>
): Promise<ActionResult<null>> {
  const serviceOrderManager = new ServiceOrderManager();
  try {
    const success = await serviceOrderManager.updateServiceOrder(id, updateData);
    if (success) {
      return { success: true, message: 'Orden de servicio actualizada exitosamente.' };
    } else {
      return { success: false, error: 'No se pudo actualizar la orden de servicio o no se encontró.' };
    }
  } catch (error) {
    console.error("Server action updateServiceOrderAction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al actualizar la orden.";
    return { success: false, error: errorMessage };
  }
}

export async function deleteServiceOrderAction(id: string): Promise<ActionResult<null>> {
    const serviceOrderManager = new ServiceOrderManager();
    try {
        const success = await serviceOrderManager.deleteServiceOrder(id);
        if (success) {
            return { success: true, message: 'Orden de servicio eliminada exitosamente.' };
        } else {
            return { success: false, error: 'No se pudo eliminar la orden de servicio o no se encontró.' };
        }
    } catch (error) {
        console.error("Server action deleteServiceOrderAction error:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido al eliminar la orden.";
        return { success: false, error: errorMessage };
    }
}

    