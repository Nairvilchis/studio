
'use server';

import AseguradoraManager from '@/aseguradoraManager';
import type { Aseguradora, NewAseguradoraData, UpdateAseguradoraData, Ajustador } from '@/lib/types';
// No longer need to import ObjectId from mongodb here if types are string-based for client

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper to serialize _id to string
// The Aseguradora type from lib/types already expects _id as string | undefined
function serializeAseguradora(aseguradoraFromDb: any): Aseguradora { // aseguradoraFromDb is raw doc from Mongo
  return {
    ...aseguradoraFromDb,
    _id: aseguradoraFromDb._id ? aseguradoraFromDb._id.toHexString() : undefined,
    ajustadores: aseguradoraFromDb.ajustadores?.map((ajustador: any) => ({ ...ajustador })) || [], // Ajustadores don't have _id
  } as Aseguradora;
}

function serializeAseguradoras(aseguradorasFromDb: any[]): Aseguradora[] {
  return aseguradorasFromDb.map(serializeAseguradora);
}

export async function getAllAseguradorasAction(): Promise<ActionResult<Aseguradora[]>> {
  const manager = new AseguradoraManager();
  try {
    const dataFromDBRaw = await manager.getAllAseguradoras(); // Returns docs with ObjectId
    const dataForClient = serializeAseguradoras(dataFromDBRaw);
    return { success: true, data: dataForClient };
  } catch (error) {
    console.error("Server action getAllAseguradorasAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener aseguradoras." };
  }
}

export async function createAseguradoraAction(data: NewAseguradoraData): Promise<ActionResult<{ aseguradoraId: string | null, customIdAseguradora?: number }>> {
  const manager = new AseguradoraManager();
  try {
    const newMongoIdObject = await manager.createAseguradora(data); // Returns ObjectId
    if (newMongoIdObject) {
      const createdRaw = await manager.getAseguradoraById(newMongoIdObject.toHexString());
      return {
        success: true,
        message: 'Aseguradora creada exitosamente.',
        data: {
          aseguradoraId: newMongoIdObject.toHexString(), // String for client
          customIdAseguradora: createdRaw?.idAseguradora
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

export async function getAseguradoraByIdAction(id: string): Promise<ActionResult<Aseguradora | null>> {
  const manager = new AseguradoraManager();
  try {
    const dataFromDBRaw = await manager.getAseguradoraById(id); // `id` is string
    if (dataFromDBRaw) {
      return { success: true, data: serializeAseguradora(dataFromDBRaw) };
    }
    return { success: true, data: null, message: "Aseguradora no encontrada." };
  } catch (error) {
    console.error("Server action getAseguradoraByIdAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener la aseguradora." };
  }
}

export async function updateAseguradoraAction(id: string, updateData: UpdateAseguradoraData): Promise<ActionResult<null>> {
  const manager = new AseguradoraManager();
  try {
    // `id` is string, manager.updateAseguradora expects string
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

export async function deleteAseguradoraAction(id: string): Promise<ActionResult<null>> {
  const manager = new AseguradoraManager();
  try {
    // `id` is string, manager.deleteAseguradora expects string
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
// Ajustadores are subdocuments, their actions operate on the parent Aseguradora identified by string `aseguradoraId`
export async function addAjustadorToAseguradoraAction(aseguradoraId: string, ajustadorData: Omit<Ajustador, 'idAjustador'>): Promise<ActionResult<Ajustador>> {
    const manager = new AseguradoraManager();
    try {
        if (!ajustadorData.nombre?.trim()) {
            return { success: false, error: "Nombre del ajustador es requerido."};
        }
        // `aseguradoraId` is string
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

export async function updateAjustadorInAseguradoraAction(aseguradoraId: string, idAjustador: number, ajustadorUpdateData: Partial<Omit<Ajustador, 'idAjustador'>>): Promise<ActionResult<null>> {
    const manager = new AseguradoraManager();
    try {
        if (ajustadorUpdateData.nombre !== undefined && !ajustadorUpdateData.nombre?.trim()) {
             return { success: false, error: "El nombre del ajustador no puede estar vacío."};
        }
        // `aseguradoraId` is string
        const success = await manager.updateAjustadorInAseguradora(aseguradoraId, idAjustador, ajustadorUpdateData);
        if (success) {
            return { success: true, message: "Ajustador actualizado exitosamente." };
        } else {
            return { success: false, error: "No se pudo actualizar el ajustador." };
        }
    } catch (error) {
        console.error("Server action updateAjustadorInAseguradoraAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar ajustador."};
    }
}

export async function removeAjustadorFromAseguradoraAction(aseguradoraId: string, idAjustador: number): Promise<ActionResult<null>> {
    const manager = new AseguradoraManager();
    try {
        // `aseguradoraId` is string
        const success = await manager.removeAjustadorFromAseguradora(aseguradoraId, idAjustador);
        if (success) {
            return { success: true, message: "Ajustador eliminado exitosamente." };
        } else {
            return { success: false, error: "No se pudo eliminar el ajustador." };
        }
    } catch (error) {
        console.error("Server action removeAjustadorFromAseguradoraAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido al eliminar ajustador."};
    }
}

export async function getAjustadoresByAseguradora(aseguradoraId: string): Promise<ActionResult<Partial<Ajustador>[]>> {
 const manager = new AseguradoraManager();
 try {
 if (!aseguradoraId) {
 return { success: false, error: "Se requiere el ID de la aseguradora." };
 }
 // `aseguradoraId` is string
 const aseguradora = await manager.getAseguradoraById(aseguradoraId);
 if (aseguradora && aseguradora.ajustadores) {
 return { success: true, data: aseguradora.ajustadores.map(adj => ({ idAjustador: adj.idAjustador, nombre: adj.nombre })) };
 }
 return { success: true, data: [], message: "Aseguradora no encontrada o sin ajustadores." };
 } catch (error) {
 console.error("Server action getAjustadoresByAseguradora error:", error);
 return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener ajustadores." };
 }
}
