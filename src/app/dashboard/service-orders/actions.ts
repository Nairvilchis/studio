
'use server';

import OrderManager from '@/serviceOrderManager';
import type { Order, NewOrderData, UpdateOrderData, Empleado, Ajustador } from '@/lib/types'; 
import { UserRole } from '@/lib/types';
import type { Filter } from 'mongodb';
import EmpleadoManager from '@/empleadoManager'; 
import AseguradoraManager from '@/aseguradoraManager'; // For fetching ajustadores

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface EmployeeOption {
  _id: string; 
  nombre: string; 
}


// Helper function to serialize _id to string and ensure dates are client-friendly
function serializeOrder(orderFromDb: any): Order {
  const serialized = { 
    ...orderFromDb,
    _id: orderFromDb._id ? orderFromDb._id.toHexString() : undefined,
    fechaRegistro: orderFromDb.fechaRegistro, 
    fechaValuacion: orderFromDb.fechaValuacion ? orderFromDb.fechaValuacion : undefined,
    fechaRengreso: orderFromDb.fechaRengreso ? orderFromDb.fechaRengreso : undefined,
    fechaEntrega: orderFromDb.fechaEntrega ? orderFromDb.fechaEntrega : undefined,
    fechaPromesa: orderFromDb.fechaPromesa ? orderFromDb.fechaPromesa : undefined,
    log: orderFromDb.log?.map((entry: any) => ({ 
        ...entry, 
        timestamp: entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp),
        userId: entry.userId?.toString() 
    }))
  };
  return serialized as Order;
}


function serializeOrders(ordersFromDb: any[]): Order[] {
  return ordersFromDb.map(serializeOrder);
}

// Serializer for Empleado to EmployeeOption
function serializeEmpleadoToEmployeeOption(empleado: Empleado): EmployeeOption {
 return {
    _id: empleado._id!, 
    nombre: empleado.nombre
 };
}


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

export async function createOrderAction(
  orderData: NewOrderData,
  empleadoLogId?: string 
): Promise<ActionResult<{ orderId: string | null, customOrderId?: number }>> {
  const orderManager = new OrderManager();
  try {
    // Ensure dates are Date objects if provided as strings
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

export async function getValuadores(): Promise<ActionResult<EmployeeOption[]>> {
  const empleadoManager = new EmpleadoManager(); 
  try {
    const empleados = await empleadoManager.getAllEmpleados(); 
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


export async function getAsesores(): Promise<ActionResult<EmployeeOption[]>> {
  const empleadoManager = new EmpleadoManager(); 
  try {
    const empleados = await empleadoManager.getAllEmpleados();
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

export async function updateOrderAction(
  id: string,
  updateData: UpdateOrderData,
  empleadoLogId?: string 
): Promise<ActionResult<null>> {
  const orderManager = new OrderManager();
  try {
    // Ensure dates are Date objects if provided as strings
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

export async function getAjustadoresForSelectByAseguradoraAction(aseguradoraId: string): Promise<ActionResult<{idAjustador: string, nombre: string}[]>> {
  const aseguradoraManager = new AseguradoraManager();
  try {
    if (!aseguradoraId) {
      return { success: false, error: "ID de Aseguradora es requerido." };
    }
    const aseguradora = await aseguradoraManager.getAseguradoraById(aseguradoraId);
    if (aseguradora && aseguradora.ajustadores) {
      return { success: true, data: aseguradora.ajustadores.map(aj => ({ idAjustador: aj.idAjustador, nombre: aj.nombre })) };
    }
    return { success: true, data: [] }; // No ajustadores or aseguradora not found
  } catch (error) {
    console.error("Server action getAjustadoresForSelectByAseguradoraAction error:", error);
    return { success: false, error: "Error al obtener ajustadores." };
  }
}
