
'use server';
/**
 * @fileOverview Server Actions for managing Aseguradora (insurance company) operations.
 * These actions interact with AseguradoraManager to perform CRUD operations.
 * They ensure data is properly serialized for client consumption, especially ObjectIds.
 */

import AseguradoraManager from '@/aseguradoraManager';
import type { Aseguradora, NewAseguradoraData, UpdateAseguradoraData, Ajustador } from '@/lib/types';
// Eliminamos la importación directa de ObjectId de mongodb, ya que el manager se encarga de la conversión.

/**
 * Interface for the result of server actions.
 * @template T The type of data returned on success.
 */
interface ActionResult<T> {
  success: boolean; // Indicates if the action was successful.
  data?: T; // Data returned by the action on success.
  error?: string; // Error message if the action failed.
  message?: string; // Optional success or informational message.
}

/**
 * Serializes an Aseguradora object to ensure it matches the client-side expected type.
 * Assumes that the manager methods have already converted MongoDB ObjectIds to strings.
 * @param {any} aseguradoraFromDb - The raw aseguradora object, ideally with _id already as a string.
 * @returns {Aseguradora} The serialized aseguradora object.
 * @remarks The main purpose here is type assertion and structure conformity.
 */
function serializeAseguradora(aseguradoraFromDb: any): Aseguradora {
  // El manager ya debería haber convertido _id a string y los idAjustador también.
  // Esta función ahora sirve más como una afirmación de tipo y para asegurar la estructura.
  return {
    ...aseguradoraFromDb,
    // _id ya debería ser un string desde el manager.
    // ajustadores ya debería tener idAjustador como string desde el manager.
  } as Aseguradora;
}

/**
 * Serializes an array of Aseguradora objects.
 * @param {any[]} aseguradorasFromDb - Array of raw aseguradora objects.
 * @returns {Aseguradora[]} Array of serialized aseguradora objects.
 */
function serializeAseguradoras(aseguradorasFromDb: any[]): Aseguradora[] {
  return aseguradorasFromDb.map(serializeAseguradora);
}

/**
 * Server Action to get all aseguradoras.
 * @returns {Promise<ActionResult<Aseguradora[]>>} Result object with an array of aseguradoras or an error.
 * @example const { data } = await getAllAseguradorasAction();
 */
export async function getAllAseguradorasAction(): Promise<ActionResult<Aseguradora[]>> {
  const manager = new AseguradoraManager();
  try {
    // El método getAllAseguradoras del manager ya devuelve _id como string.
    const dataFromDBRaw = await manager.getAllAseguradoras();
    // La serialización aquí asegura consistencia y conformidad con el tipo Aseguradora.
    const dataForClient = serializeAseguradoras(dataFromDBRaw);
    return { success: true, data: dataForClient };
  } catch (error) {
    console.error("Server action getAllAseguradorasAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener aseguradoras." };
  }
}

/**
 * Server Action to create a new aseguradora.
 * @param {NewAseguradoraData} data - Data for the new aseguradora (nombre, telefono, optional ajustadores).
 * @returns {Promise<ActionResult<{ aseguradoraId: string | null }>>} Result object with the new aseguradora's MongoDB _id (as string) or an error.
 */
export async function createAseguradoraAction(data: NewAseguradoraData): Promise<ActionResult<{ aseguradoraId: string | null }>> {
  const manager = new AseguradoraManager();
  try {
    // El método createAseguradora del manager devuelve el ObjectId de MongoDB del nuevo documento.
    const newMongoIdObject = await manager.createAseguradora(data);
    if (newMongoIdObject) {
      return {
        success: true,
        message: 'Aseguradora creada exitosamente.',
        data: {
          aseguradoraId: newMongoIdObject.toHexString(), // Convertir ObjectId a string para el cliente.
        }
      };
    } else {
      return { success: false, error: 'No se pudo crear la aseguradora.' };
    }
  } catch (error) {
    console.error("Server action createAseguradoraAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al crear la aseguradora." };
  }
}

/**
 * Server Action to get an aseguradora by its MongoDB _id (string).
 * @param {string} id - The MongoDB _id (as a hex string) of the aseguradora.
 * @returns {Promise<ActionResult<Aseguradora | null>>} Result object with the aseguradora data or an error/message.
 */
export async function getAseguradoraByIdAction(id: string): Promise<ActionResult<Aseguradora | null>> {
  const manager = new AseguradoraManager();
  try {
    // El método getAseguradoraById del manager espera un _id string y devuelve _id como string.
    const dataFromDBRaw = await manager.getAseguradoraById(id);
    if (dataFromDBRaw) {
      return { success: true, data: serializeAseguradora(dataFromDBRaw) };
    }
    return { success: true, data: null, message: "Aseguradora no encontrada." };
  } catch (error) {
    console.error("Server action getAseguradoraByIdAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener la aseguradora." };
  }
}

/**
 * Server Action to update an aseguradora.
 * @param {string} id - The MongoDB _id (as string) of the aseguradora to update.
 * @param {UpdateAseguradoraData} updateData - Data to update (nombre, telefono).
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function updateAseguradoraAction(id: string, updateData: UpdateAseguradoraData): Promise<ActionResult<null>> {
  const manager = new AseguradoraManager();
  try {
    const success = await manager.updateAseguradora(id, updateData);
    if (success) {
      return { success: true, message: 'Aseguradora actualizada exitosamente.' };
    } else {
      const exists = await manager.getAseguradoraById(id);
      if (!exists) return { success: false, error: 'No se pudo actualizar: Aseguradora no encontrada.'};
      return { success: true, message: 'Ningún cambio detectado en la aseguradora.' };
    }
  } catch (error) {
    console.error("Server action updateAseguradoraAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar la aseguradora." };
  }
}

/**
 * Server Action to delete an aseguradora.
 * @param {string} id - The MongoDB _id (as string) of the aseguradora to delete.
 * @returns {Promise<ActionResult<null>>} Result object indicating success or error.
 */
export async function deleteAseguradoraAction(id: string): Promise<ActionResult<null>> {
  const manager = new AseguradoraManager();
  try {
    const success = await manager.deleteAseguradora(id);
    if (success) {
      return { success: true, message: 'Aseguradora eliminada exitosamente.' };
    } else {
      return { success: false, error: 'No se pudo eliminar la aseguradora o no se encontró.' };
    }
  } catch (error) {
    console.error("Server action deleteAseguradoraAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al eliminar la aseguradora." };
  }
}

// --- Ajustador Actions ---

/**
 * Server Action to add an ajustador to an aseguradora.
 * El `idAjustador` es generado por el manager y devuelto como string.
 * @param {string} aseguradoraId - El `_id` (string) de MongoDB de la aseguradora padre.
 * @param {Omit<Ajustador, 'idAjustador'>} ajustadorData - Datos para el nuevo ajustador (nombre, telefono, correo).
 * @returns {Promise<ActionResult<Ajustador>>} Result object con el nuevo ajustador (incluyendo su `idAjustador` generado) o un error.
 */
export async function addAjustadorToAseguradoraAction(aseguradoraId: string, ajustadorData: Omit<Ajustador, 'idAjustador'>): Promise<ActionResult<Ajustador>> {
    const manager = new AseguradoraManager();
    try {
        if (!ajustadorData.nombre?.trim()) {
            return { success: false, error: "Nombre del ajustador es requerido."};
        }
        // El manager ya se encarga de la generación de ObjectId para idAjustador y lo devuelve como string.
        const newAjustador = await manager.addAjustadorToAseguradora(aseguradoraId, ajustadorData);
        if (newAjustador) {
            return { success: true, message: "Ajustador añadido exitosamente.", data: newAjustador };
        } else {
            return { success: false, error: "No se pudo añadir el ajustador." };
        }
    } catch (error) {
        console.error("Server action addAjustadorToAseguradoraAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido al añadir ajustador."};
    }
}

/**
 * Server Action to update an ajustador within an aseguradora.
 * @param {string} aseguradoraId - El `_id` (string) de MongoDB de la aseguradora padre.
 * @param {string} idAjustador - El `idAjustador` (string ObjectId) del ajustador a actualizar.
 * @param {Partial<Omit<Ajustador, 'idAjustador'>>} ajustadorUpdateData - Datos a actualizar (nombre, telefono, correo).
 * @returns {Promise<ActionResult<null>>} Result object indicando éxito o error.
 */
export async function updateAjustadorInAseguradoraAction(aseguradoraId: string, idAjustador: string, ajustadorUpdateData: Partial<Omit<Ajustador, 'idAjustador'>>): Promise<ActionResult<null>> {
    const manager = new AseguradoraManager();
    try {
        if (ajustadorUpdateData.nombre !== undefined && !ajustadorUpdateData.nombre?.trim()) {
             return { success: false, error: "El nombre del ajustador no puede estar vacío."};
        }
        const success = await manager.updateAjustadorInAseguradora(aseguradoraId, idAjustador, ajustadorUpdateData);
        if (success) {
            return { success: true, message: "Ajustador actualizado exitosamente." };
        } else {
            return { success: false, error: "No se pudo actualizar el ajustador o no se encontró/modificó." };
        }
    } catch (error) {
        console.error("Server action updateAjustadorInAseguradoraAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar ajustador."};
    }
}

/**
 * Server Action to remove an ajustador from an aseguradora.
 * @param {string} aseguradoraId - El `_id` (string) de MongoDB de la aseguradora padre.
 * @param {string} idAjustador - El `idAjustador` (string ObjectId) del ajustador a eliminar.
 * @returns {Promise<ActionResult<null>>} Result object indicando éxito o error.
 */
export async function removeAjustadorFromAseguradoraAction(aseguradoraId: string, idAjustador: string): Promise<ActionResult<null>> {
    const manager = new AseguradoraManager();
    try {
        const success = await manager.removeAjustadorFromAseguradora(aseguradoraId, idAjustador);
        if (success) {
            return { success: true, message: "Ajustador eliminado exitosamente." };
        } else {
            return { success: false, error: "No se pudo eliminar el ajustador o no se encontró." };
        }
    } catch (error) {
        console.error("Server action removeAjustadorFromAseguradoraAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido al eliminar ajustador."};
    }
}

/**
 * Server Action to get ajustadores for a specific aseguradora, returning only idAjustador and nombre.
 * Used for populating select/dropdown components in the UI.
 * @param {string} aseguradoraId - The MongoDB _id (string) of the aseguradora.
 * @returns {Promise<ActionResult<Pick<Ajustador, 'idAjustador' | 'nombre'>[]>>} Result object with an array of ajustadores (idAjustador, nombre) or an error.
 */
export async function getAjustadoresByAseguradora(aseguradoraId: string): Promise<ActionResult<Pick<Ajustador, 'idAjustador' | 'nombre'>[]>> {
 const manager = new AseguradoraManager();
 try {
 if (!aseguradoraId) {
 return { success: false, error: "Se requiere el ID de la aseguradora." };
 }
 // El método del manager devuelve el objeto Aseguradora con _id como string y ajustadores con idAjustador como string.
 const aseguradora = await manager.getAseguradoraById(aseguradoraId);
 if (aseguradora && aseguradora.ajustadores) {
 // Mapear a la estructura deseada para el componente select.
 return { success: true, data: aseguradora.ajustadores.map(adj => ({ idAjustador: adj.idAjustador, nombre: adj.nombre })) };
 }
 return { success: true, data: [], message: "Aseguradora no encontrada o sin ajustadores." };
 } catch (error) {
 console.error("Server action getAjustadoresByAseguradora error:", error);
 return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener ajustadores." };
 }
}
