
'use server';
/**
 * @fileOverview Server Actions for managing ColorVehiculo (Vehicle Colors).
 * These actions interact with ColorVehiculoManager to perform CRUD operations.
 */

import ColorVehiculoManager from '@/colorVehiculoManager'; // Asegúrate que este manager exista
import type { ColorVehiculo, NewColorVehiculoData, UpdateColorVehiculoData } from '@/lib/types';

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
 * Server Action to create a new ColorVehiculo.
 * @param {NewColorVehiculoData} data - Data for the new color (nombre).
 * @returns {Promise<ActionResult<{ colorId: string | null }>>} Result object with the new color's MongoDB _id (as string) or an error.
 */
export async function createColorVehiculoAction(data: NewColorVehiculoData): Promise<ActionResult<{ colorId: string | null }>> {
  const manager = new ColorVehiculoManager();
  try {
    const newMongoIdObject = await manager.createColor(data);
    if (newMongoIdObject) {
      return {
        success: true,
        message: 'Color de vehículo creado exitosamente.',
        data: { colorId: newMongoIdObject.toHexString() }
      };
    } else {
      return { success: false, error: 'No se pudo crear el color del vehículo.' };
    }
  } catch (error) {
    console.error("Server action createColorVehiculoAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al crear el color del vehículo." };
  }
}

/**
 * Server Action to get all coloresVehiculo.
 * @returns {Promise<ActionResult<ColorVehiculo[]>>} Result object with an array of colores or an error.
 */
export async function getAllColoresVehiculoAction(): Promise<ActionResult<ColorVehiculo[]>> {
  const manager = new ColorVehiculoManager();
  try {
    const dataFromDB = await manager.getAllColores(); // Manager already returns _id as string.
    return { success: true, data: dataFromDB };
  } catch (error) {
    console.error("Server action getAllColoresVehiculoAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener colores de vehículos." };
  }
}

/**
 * Server Action to update a ColorVehiculo.
 * @param {string} id - The MongoDB _id (as string) of the color to update.
 * @param {UpdateColorVehiculoData} data - Data to update (nombre).
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function updateColorVehiculoAction(id: string, data: UpdateColorVehiculoData): Promise<ActionResult<null>> {
  const manager = new ColorVehiculoManager();
  try {
    const success = await manager.updateColor(id, data);
    if (success) {
      return { success: true, message: 'Color de vehículo actualizado exitosamente.' };
    } else {
      // Intentar obtener para ver si no existía o no hubo cambios
      const exists = await manager.getColorById(id); // Necesitarías un método getColorById en el manager
      if (!exists) return { success: false, error: 'No se pudo actualizar: Color no encontrado.'};
      return { success: true, message: 'Ningún cambio detectado en el color del vehículo.' };
    }
  } catch (error) {
    console.error("Server action updateColorVehiculoAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar el color del vehículo." };
  }
}

/**
 * Server Action to delete a ColorVehiculo.
 * @param {string} id - The MongoDB _id (as string) of the color to delete.
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function deleteColorVehiculoAction(id: string): Promise<ActionResult<null>> {
  const manager = new ColorVehiculoManager();
  try {
    const success = await manager.deleteColor(id);
    if (success) {
      return { success: true, message: 'Color de vehículo eliminado exitosamente.' };
    } else {
      return { success: false, error: 'No se pudo eliminar el color del vehículo o no se encontró.' };
    }
  } catch (error) {
    console.error("Server action deleteColorVehiculoAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al eliminar el color del vehículo." };
  }
}
