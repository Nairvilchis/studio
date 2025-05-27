
'use server';
/**
 * @fileOverview Server Actions for managing Puestos (Job Positions).
 * These actions interact with PuestoManager to perform CRUD operations.
 */

import PuestoManager from '@/puestoManager';
import type { Puesto, NewPuestoData, UpdatePuestoData } from '@/lib/types';

/**
 * Interface for the result of server actions.
 * @template T The type of data returned on success.
 */
interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Server Action to create a new Puesto.
 * @param {NewPuestoData} data - Data for the new puesto (nombre).
 * @returns {Promise<ActionResult<{ puestoId: string | null }>>} Result object with the new puesto's MongoDB _id (as string) or an error.
 */
export async function createPuestoAction(data: NewPuestoData): Promise<ActionResult<{ puestoId: string | null }>> {
  const manager = new PuestoManager();
  try {
    const newPuestoIdString = await manager.createPuesto(data); // Manager returns string ID or null
    if (newPuestoIdString) {
      return {
        success: true,
        message: 'Puesto creado exitosamente.',
        data: { puestoId: newPuestoIdString } // Use string ID directly
      };
    } else {
      return { success: false, error: 'No se pudo crear el puesto.' };
    }
  } catch (error) {
    console.error("Server action createPuestoAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al crear el puesto." };
  }
}

/**
 * Server Action to get all puestos.
 * @returns {Promise<ActionResult<Puesto[]>>} Result object with an array of puestos or an error.
 */
export async function getAllPuestosAction(): Promise<ActionResult<Puesto[]>> {
  const manager = new PuestoManager();
  try {
    const dataFromDB = await manager.getAllPuestos(); // Manager already returns _id as string.
    return { success: true, data: dataFromDB };
  } catch (error) {
    console.error("Server action getAllPuestosAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener puestos." };
  }
}

/**
 * Server Action to update a Puesto.
 * @param {string} id - The MongoDB _id (as string) of the puesto to update.
 * @param {UpdatePuestoData} data - Data to update (nombre).
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function updatePuestoAction(id: string, data: UpdatePuestoData): Promise<ActionResult<null>> {
  const manager = new PuestoManager();
  try {
    const success = await manager.updatePuesto(id, data);
    if (success) {
      return { success: true, message: 'Puesto actualizado exitosamente.' };
    } else {
      const exists = await manager.getPuestoById(id);
      if (!exists) return { success: false, error: 'No se pudo actualizar: Puesto no encontrado.'};
      return { success: true, message: 'Ningún cambio detectado en el puesto.' };
    }
  } catch (error) {
    console.error("Server action updatePuestoAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar el puesto." };
  }
}

/**
 * Server Action to delete a Puesto.
 * @param {string} id - The MongoDB _id (as string) of the puesto to delete.
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function deletePuestoAction(id: string): Promise<ActionResult<null>> {
  const manager = new PuestoManager();
  try {
    const success = await manager.deletePuesto(id);
    if (success) {
      return { success: true, message: 'Puesto eliminado exitosamente.' };
    } else {
      return { success: false, error: 'No se pudo eliminar el puesto o no se encontró.' };
    }
  } catch (error) {
    console.error("Server action deletePuestoAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al eliminar el puesto." };
  }
}
