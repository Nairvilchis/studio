
'use server';

import MarcaManager, { type MarcaVehiculo, type NewMarcaData, type UpdateMarcaData, type ModeloVehiculo } from '@/marcaManager';
import type { ObjectId } from 'mongodb';

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper to serialize ObjectId to string
function serializeMarca(marca: MarcaVehiculo): MarcaVehiculo {
  return {
    ...marca,
    _id: marca._id?.toHexString() as any,
    modelos: marca.modelos?.map(modelo => ({ ...modelo })) || [],
  };
}

function serializeMarcas(marcas: MarcaVehiculo[]): MarcaVehiculo[] {
  return marcas.map(serializeMarca);
}

export async function getAllMarcasAction(): Promise<ActionResult<MarcaVehiculo[]>> {
  const marcaManager = new MarcaManager();
  try {
    const marcasFromDB = await marcaManager.getAllMarcas();
    const marcas = serializeMarcas(marcasFromDB);
    return { success: true, data: marcas };
  } catch (error) {
    console.error("Server action getAllMarcasAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener marcas." };
  }
}

export async function createMarcaAction(marcaData: NewMarcaData): Promise<ActionResult<{ marcaId: string | null, customIdMarca?: number }>> {
  const marcaManager = new MarcaManager();
  try {
    const newMongoId = await marcaManager.createMarca(marcaData);
    if (newMongoId) {
      const createdMarca = await marcaManager.getMarcaById(newMongoId.toHexString());
      return {
        success: true,
        message: 'Marca creada exitosamente.',
        data: {
          marcaId: newMongoId.toHexString(),
          customIdMarca: createdMarca?.idMarca
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

export async function getMarcaByIdAction(id: string): Promise<ActionResult<MarcaVehiculo | null>> {
  const marcaManager = new MarcaManager();
  try {
    const marcaFromDB = await marcaManager.getMarcaById(id);
    if (marcaFromDB) {
      return { success: true, data: serializeMarca(marcaFromDB) };
    }
    return { success: true, data: null, message: "Marca no encontrada." };
  } catch (error) {
    console.error("Server action getMarcaByIdAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener la marca." };
  }
}

export async function updateMarcaAction(id: string, updateData: UpdateMarcaData): Promise<ActionResult<null>> {
  const marcaManager = new MarcaManager();
  try {
    const success = await marcaManager.updateMarca(id, updateData);
    if (success) {
      return { success: true, message: 'Marca actualizada exitosamente.' };
    } else {
      // This might happen if the document wasn't found or no fields were changed.
      // Check if it exists first if a more specific error is needed.
      const exists = await marcaManager.getMarcaById(id);
      if (!exists) return { success: false, error: 'No se pudo actualizar la marca: Marca no encontrada.'};
      return { success: true, message: 'Ningún cambio detectado en la marca.' };
    }
  } catch (error) {
    console.error("Server action updateMarcaAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar la marca." };
  }
}

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

// --- Model Actions ---
export async function addModeloToMarcaAction(marcaId: string, modeloData: ModeloVehiculo): Promise<ActionResult<null>> {
    const marcaManager = new MarcaManager();
    try {
        // Basic validation for modeloData
        if (!modeloData.idModelo || !modeloData.modelo?.trim()) {
            return { success: false, error: "ID Modelo y Nombre del Modelo son requeridos."};
        }
        const success = await marcaManager.addModeloToMarca(marcaId, modeloData);
        if (success) {
            return { success: true, message: "Modelo añadido exitosamente." };
        } else {
            return { success: false, error: "No se pudo añadir el modelo a la marca." };
        }
    } catch (error) {
        console.error("Server action addModeloToMarcaAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido al añadir modelo."};
    }
}

export async function updateModeloInMarcaAction(marcaId: string, modeloId: number, modeloUpdateData: Partial<Omit<ModeloVehiculo, 'idModelo'>>): Promise<ActionResult<null>> {
    const marcaManager = new MarcaManager();
    try {
        if (!modeloUpdateData.modelo?.trim()) {
             return { success: false, error: "El nombre del modelo no puede estar vacío."};
        }
        const success = await marcaManager.updateModeloInMarca(marcaId, modeloId, modeloUpdateData);
        if (success) {
            return { success: true, message: "Modelo actualizado exitosamente." };
        } else {
            return { success: false, error: "No se pudo actualizar el modelo." };
        }
    } catch (error) {
        console.error("Server action updateModeloInMarcaAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar modelo."};
    }
}

export async function removeModeloFromMarcaAction(marcaId: string, modeloId: number): Promise<ActionResult<null>> {
    const marcaManager = new MarcaManager();
    try {
        const success = await marcaManager.removeModeloFromMarca(marcaId, modeloId);
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

