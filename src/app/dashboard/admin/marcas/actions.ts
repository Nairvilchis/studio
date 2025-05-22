
'use server';

import MarcaManager from '@/marcaManager';
import type { MarcaVehiculo, NewMarcaData, UpdateMarcaData, ModeloVehiculo } from '@/lib/types';
import { ObjectId } from 'mongodb'; // Import ObjectId for validation

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
 * Serializes a MarcaVehiculo object from the database format to a client-friendly format.
 * Ensures _id and modelos.idModelo are strings.
 * @param {any} marcaFromDb - The raw marca object from MongoDB.
 * @returns {MarcaVehiculo} The serialized marca object.
 */
function serializeMarca(marcaFromDb: any): MarcaVehiculo { 
  return {
    ...marcaFromDb,
    // Ensure _id is a string. If it's already a string (from manager), it's fine.
    _id: marcaFromDb._id ? (marcaFromDb._id instanceof ObjectId ? marcaFromDb._id.toHexString() : marcaFromDb._id) : undefined,
    modelos: marcaFromDb.modelos?.map((modelo: any) => ({ 
        ...modelo,
        // idModelo should already be a string (ObjectId hex string) from the manager methods.
    })) || [],
  } as MarcaVehiculo;
}

/**
 * Serializes an array of MarcaVehiculo objects.
 * @param {any[]} marcasFromDb - Array of raw marca objects from MongoDB.
 * @returns {MarcaVehiculo[]} Array of serialized marca objects.
 */
function serializeMarcas(marcasFromDb: any[]): MarcaVehiculo[] {
  return marcasFromDb.map(serializeMarca);
}

/**
 * Server Action to get all marcas.
 * @returns {Promise<ActionResult<MarcaVehiculo[]>>} Result object with an array of marcas or an error.
 */
export async function getAllMarcasAction(): Promise<ActionResult<MarcaVehiculo[]>> {
  const marcaManager = new MarcaManager();
  try {
    // The manager's getAllMarcas method already returns _id as string.
    const marcasFromDBRaw = await marcaManager.getAllMarcas();
    const marcasForClient = serializeMarcas(marcasFromDBRaw); // Ensures consistency
    return { success: true, data: marcasForClient };
  } catch (error) {
    console.error("Server action getAllMarcasAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener marcas." };
  }
}

/**
 * Server Action to create a new marca.
 * @param {NewMarcaData} marcaData - Data for the new marca (marca name, optional modelos).
 * @returns {Promise<ActionResult<{ marcaId: string | null }>>} Result object with the new marca's MongoDB _id (as string) or an error.
 */
export async function createMarcaAction(marcaData: NewMarcaData): Promise<ActionResult<{ marcaId: string | null }>> {
  const marcaManager = new MarcaManager();
  try {
    // The manager's createMarca method returns the MongoDB ObjectId of the new document.
    const newMongoIdObject = await marcaManager.createMarca(marcaData); 
    if (newMongoIdObject) {
      return {
        success: true,
        message: 'Marca creada exitosamente.',
        data: {
          marcaId: newMongoIdObject.toHexString(), // Convert ObjectId to string for the client.
        }
      };
    } else {
      return { success: false, error: 'No se pudo crear la marca.' };
    }
  } catch (error) {
    console.error("Server action createMarcaAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al crear la marca." };
  }
}

/**
 * Server Action to get a marca by its MongoDB _id (string).
 * @param {string} id - The MongoDB _id (as a hex string) of the marca.
 * @returns {Promise<ActionResult<MarcaVehiculo | null>>} Result object with the marca data or an error/message.
 */
export async function getMarcaByIdAction(id: string): Promise<ActionResult<MarcaVehiculo | null>> {
  const marcaManager = new MarcaManager();
  try {
    // The manager's getMarcaById method expects a string _id and returns _id as string.
    const marcaFromDBRaw = await marcaManager.getMarcaById(id); 
    if (marcaFromDBRaw) {
      return { success: true, data: serializeMarca(marcaFromDBRaw) }; // Ensure consistent serialization
    }
    return { success: true, data: null, message: "Marca no encontrada." };
  } catch (error) {
    console.error("Server action getMarcaByIdAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener la marca." };
  }
}

/**
 * Server Action to update a marca.
 * @param {string} id - The MongoDB _id (as string) of the marca to update.
 * @param {UpdateMarcaData} updateData - Data to update (marca name).
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function updateMarcaAction(id: string, updateData: UpdateMarcaData): Promise<ActionResult<null>> {
  const marcaManager = new MarcaManager();
  try {
    const success = await marcaManager.updateMarca(id, updateData);
    if (success) {
      return { success: true, message: 'Marca actualizada exitosamente.' };
    } else {
      const exists = await marcaManager.getMarcaById(id);
      if (!exists) return { success: false, error: 'No se pudo actualizar la marca: Marca no encontrada.'};
      return { success: true, message: 'Ningún cambio detectado en la marca.' };
    }
  } catch (error) {
    console.error("Server action updateMarcaAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar la marca." };
  }
}

/**
 * Server Action to delete a marca.
 * @param {string} id - The MongoDB _id (as string) of the marca to delete.
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function deleteMarcaAction(id: string): Promise<ActionResult<null>> {
  const marcaManager = new MarcaManager();
  try {
    const success = await marcaManager.deleteMarca(id);
    if (success) {
      return { success: true, message: 'Marca eliminada exitosamente.' };
    } else {
      return { success: false, error: 'No se pudo eliminar la marca o no se encontró.' };
    }
  } catch (error) {
    console.error("Server action deleteMarcaAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al eliminar la marca." };
  }
}

// --- Modelo Actions ---

/**
 * Server Action to add a modelo to a marca.
 * The `idModelo` is generated by the manager and returned.
 * @param {string} marcaId - The MongoDB _id (string) of the parent marca.
 * @param {Omit<ModeloVehiculo, 'idModelo'>} modeloData - Data for the new modelo (modelo name).
 * @returns {Promise<ActionResult<ModeloVehiculo>>} Result object with the new modelo (including its generated `idModelo`) or an error.
 */
export async function addModeloToMarcaAction(marcaId: string, modeloData: Omit<ModeloVehiculo, 'idModelo'>): Promise<ActionResult<ModeloVehiculo>> {
    const marcaManager = new MarcaManager();
    try {
        // Basic validation for modelo name.
        if (!modeloData.modelo?.trim()) {
            return { success: false, error: "Nombre del Modelo es requerido."};
        }
        // The manager's method handles ObjectId generation for idModelo.
        const newModelo = await marcaManager.addModeloToMarca(marcaId, modeloData);
        if (newModelo) {
            // newModelo already has idModelo as a string (ObjectId hex string).
            return { success: true, message: "Modelo añadido exitosamente.", data: newModelo };
        } else {
            return { success: false, error: "No se pudo añadir el modelo a la marca." };
        }
    } catch (error) {
        console.error("Server action addModeloToMarcaAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido al añadir modelo."};
    }
}

/**
 * Server Action to update a modelo within a marca.
 * @param {string} marcaId - The MongoDB _id (string) of the parent marca.
 * @param {string} idModelo - The ObjectId string of the modelo to update.
 * @param {Partial<Omit<ModeloVehiculo, 'idModelo'>>} modeloUpdateData - Data to update (modelo name).
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function updateModeloInMarcaAction(marcaId: string, idModelo: string, modeloUpdateData: Partial<Omit<ModeloVehiculo, 'idModelo'>>): Promise<ActionResult<null>> {
    const marcaManager = new MarcaManager();
    try {
        // Basic validation for modelo name if provided.
        if (modeloUpdateData.modelo !== undefined && !modeloUpdateData.modelo?.trim()) {
             return { success: false, error: "El nombre del modelo no puede estar vacío."};
        }
        const success = await marcaManager.updateModeloInMarca(marcaId, idModelo, modeloUpdateData);
        if (success) {
            return { success: true, message: "Modelo actualizado exitosamente." };
        } else {
            // Could mean modelo/marca not found, or no actual change.
            return { success: false, error: "No se pudo actualizar el modelo o no se encontró/modificó." };
        }
    } catch (error) {
        console.error("Server action updateModeloInMarcaAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar modelo."};
    }
}

/**
 * Server Action to remove a modelo from a marca.
 * @param {string} marcaId - The MongoDB _id (string) of the parent marca.
 * @param {string} idModelo - The ObjectId string of the modelo to remove.
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function removeModeloFromMarcaAction(marcaId: string, idModelo: string): Promise<ActionResult<null>> {
    const marcaManager = new MarcaManager();
    try {
        const success = await marcaManager.removeModeloFromMarca(marcaId, idModelo);
        if (success) {
            return { success: true, message: "Modelo eliminado exitosamente." };
        } else {
            return { success: false, error: "No se pudo eliminar el modelo de la marca." };
        }
    } catch (error) {
        console.error("Server action removeModeloFromMarcaAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido al eliminar modelo."};
    }
}
