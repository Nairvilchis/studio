
'use server';

import MarcaManager from '@/marcaManager';
import type { MarcaVehiculo, NewMarcaData, UpdateMarcaData, ModeloVehiculo } from '@/lib/types';

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

function serializeMarca(marcaFromDb: any): MarcaVehiculo { 
  return {
    ...marcaFromDb,
    _id: marcaFromDb._id ? marcaFromDb._id.toHexString() : undefined,
    modelos: marcaFromDb.modelos?.map((modelo: any) => ({ ...modelo })) || [],
  } as MarcaVehiculo;
}

function serializeMarcas(marcasFromDb: any[]): MarcaVehiculo[] {
  return marcasFromDb.map(serializeMarca);
}

export async function getAllMarcasAction(): Promise<ActionResult<MarcaVehiculo[]>> {
  const marcaManager = new MarcaManager();
  try {
    const marcasFromDBRaw = await marcaManager.getAllMarcas();
    const marcasForClient = serializeMarcas(marcasFromDBRaw);
    return { success: true, data: marcasForClient };
  } catch (error) {
    console.error("Server action getAllMarcasAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener marcas." };
  }
}

export async function createMarcaAction(marcaData: NewMarcaData): Promise<ActionResult<{ marcaId: string | null, customIdMarca?: number }>> {
  const marcaManager = new MarcaManager();
  try {
    const newMongoIdObject = await marcaManager.createMarca(marcaData); 
    if (newMongoIdObject) {
      const createdMarcaRaw = await marcaManager.getMarcaById(newMongoIdObject.toHexString());
      return {
        success: true,
        message: 'Marca creada exitosamente.',
        data: {
          marcaId: newMongoIdObject.toHexString(), 
          customIdMarca: createdMarcaRaw?.idMarca
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
    const marcaFromDBRaw = await marcaManager.getMarcaById(id); 
    if (marcaFromDBRaw) {
      return { success: true, data: serializeMarca(marcaFromDBRaw) };
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

export async function addModeloToMarcaAction(marcaId: string, modeloData: ModeloVehiculo): Promise<ActionResult<null>> {
    const marcaManager = new MarcaManager();
    try {
        if (modeloData.idModelo == null || String(modeloData.idModelo).trim() === '' || !modeloData.modelo?.trim()) { // Check for null or empty string for idModelo
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
        if (modeloUpdateData.modelo !== undefined && !modeloUpdateData.modelo?.trim()) {
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
