
'use server';

import AseguradoraManager, { type Aseguradora, type NewAseguradoraData, type UpdateAseguradoraData, type Ajustador } from '@/aseguradoraManager';

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper to serialize ObjectId to string
function serializeAseguradora(aseguradora: Aseguradora): Aseguradora {
  return {
    ...aseguradora,
    _id: aseguradora._id?.toHexString() as any,
    ajustadores: aseguradora.ajustadores?.map(ajustador => ({ ...ajustador })) || [],
  };
}

function serializeAseguradoras(aseguradoras: Aseguradora[]): Aseguradora[] {
  return aseguradoras.map(serializeAseguradora);
}

export async function getAllAseguradorasAction(): Promise<ActionResult<Aseguradora[]>> {
  const manager = new AseguradoraManager();
  try {
    const dataFromDB = await manager.getAllAseguradoras();
    const data = serializeAseguradoras(dataFromDB);
    return { success: true, data: data };
  } catch (error) {
    console.error("Server action getAllAseguradorasAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al obtener aseguradoras." };
  }
}

export async function createAseguradoraAction(data: NewAseguradoraData): Promise<ActionResult<{ aseguradoraId: string | null, customIdAseguradora?: number }>> {
  const manager = new AseguradoraManager();
  try {
    const newMongoId = await manager.createAseguradora(data);
    if (newMongoId) {
      const created = await manager.getAseguradoraById(newMongoId.toHexString());
      return {
        success: true,
        message: 'Aseguradora creada exitosamente.',
        data: {
          aseguradoraId: newMongoId.toHexString(),
          customIdAseguradora: created?.idAseguradora
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
    const dataFromDB = await manager.getAseguradoraById(id);
    if (dataFromDB) {
      return { success: true, data: serializeAseguradora(dataFromDB) };
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
    const success = await manager.updateAseguradora(id, updateData);
    if (success) {
      return { success: true, message: 'Aseguradora actualizada exitosamente.' };
    } else {
      const exists = await manager.getAseguradoraById(id);
      if (!exists) return { success: false, error: 'No se pudo actualizar: Aseguradora no encontrada.'};
      return { success: true, message: 'Ningún cambio detectado en la aseguradora.' }; // Or specific error if needed
    }
  } catch (error) {
    console.error("Server action updateAseguradoraAction error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido al actualizar la aseguradora." };
  }
}

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
export async function addAjustadorToAseguradoraAction(aseguradoraId: string, ajustadorData: Omit<Ajustador, 'idAjustador'>): Promise<ActionResult<Ajustador>> {
    const manager = new AseguradoraManager();
    try {
        if (!ajustadorData.nombre?.trim()) {
            return { success: false, error: "Nombre del ajustador es requerido."};
        }
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
        if (!ajustadorUpdateData.nombre?.trim() && Object.keys(ajustadorUpdateData).length === 1) { // Check if only name is being updated and it's empty
             return { success: false, error: "El nombre del ajustador no puede estar vacío."};
        }
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

    