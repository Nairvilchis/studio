
'use server';
/**
 * @fileOverview Manages vehicle brand (MarcaVehiculo) operations with MongoDB.
 * Brand IDs (`_id`) son MongoDB ObjectIds (strings). Model IDs (`idModelo`) también son MongoDB ObjectIds (strings),
 * únicos dentro del array 'modelos' de su MarcaVehiculo padre.
 */

import { ObjectId, type Collection, type InsertOneResult, type UpdateResult, type DeleteResult, type Filter } from './db';
import { connectDB } from './db';
import type { MarcaVehiculo, ModeloVehiculo, NewMarcaData, UpdateMarcaData } from '@/lib/types';

/**
 * Clase responsable de gestionar operaciones CRUD para Marcas (marcas de vehículos)
 * y sus Modelos asociados (modelos de vehículos) en la base de datos MongoDB.
 * @remarks
 * Esta clase utiliza la directiva 'use server' para indicar que solo debe ejecutarse en el servidor.
 */
class MarcaManager {
  private collectionPromise: Promise<Collection<MarcaVehiculo>>;

  /**
   * Constructor de MarcaManager.
   * Inicializa la promesa de conexión a la colección 'marcas' en MongoDB.
   * Crea índices en 'marca' (único) y 'modelos.idModelo'.
   */
  constructor() {
    this.collectionPromise = connectDB().then(db => {
      const marcasCollection = db.collection<MarcaVehiculo>('marcas');
      // Índice en el nombre de la Marca para unicidad y búsquedas rápidas.
      // La colección almacena el campo 'marca', no 'nombre'.
      marcasCollection.createIndex({ marca: 1 }, { unique: true }).catch(err => {
        if (err.code !== 11000) console.warn('Failed to create index on marcas.marca:', err);
      });
      // Índice en el ID del modelo para posibles búsquedas directas si alguna vez se necesitan.
      marcasCollection.createIndex({ "modelos.idModelo": 1 }).catch(err => {
         if (err.code !== 11000) console.warn('Failed to create index on marcas.modelos.idModelo:', err);
      });
      return marcasCollection;
    }).catch(err => {
      console.error('Error al obtener la colección de marcas:', err);
      throw err; // Relanzar para ser capturado por quien llama o para fallar el servidor si no se maneja al inicio.
    });
  }

  /**
   * Obtiene la colección MongoDB para marcas.
   * Este método asegura que la colección esté inicializada antes de su uso.
   * @returns {Promise<Collection<MarcaVehiculo>>} La colección de marcas.
   * @private
   */
  private async getCollection(): Promise<Collection<MarcaVehiculo>> {
    return this.collectionPromise;
  }

  /**
   * Crea una nueva MarcaVehiculo.
   * El `_id` para la MarcaVehiculo es generado automáticamente por MongoDB.
   * Cualquier modelo inicial proporcionado también tendrá su `idModelo` (cadena ObjectId) generado.
   * @param {NewMarcaData} marcaData - Datos para la nueva marca (nombre de la marca, opcionalmente modelos iniciales).
   * @returns {Promise<string | null>} El `_id` (string hexadecimal del ObjectId) de la marca recién creada, o null en caso de fallo.
   * @throws {Error} Si el nombre de la marca está duplicado u ocurren otros errores de base de datos.
   */
  async createMarca(marcaData: NewMarcaData): Promise<string | null> {
    const collection = await this.getCollection();
    
    if (!marcaData.marca || !marcaData.marca.trim()) {
      throw new Error('El nombre de la marca es requerido.');
    }

    const newMarcaDocument: Omit<MarcaVehiculo, '_id'> = {
      marca: marcaData.marca,
      // Inicializar modelos como un array vacío si no se proporcionan, o mapear modelos proporcionados generando cadenas ObjectId.
      modelos: (marcaData.modelos || []).map(mod => ({
        ...mod, // Extender otros datos del modelo si se proporcionan (ej. nombre 'modelo')
        idModelo: new ObjectId().toHexString(), // Generar nueva cadena ObjectId para cada modelo inicial
      })),
    };

    try {
      // Insertar el nuevo documento de marca. MongoDB genera el `_id`.
      const result: InsertOneResult<MarcaVehiculo> = await collection.insertOne(newMarcaDocument as MarcaVehiculo);
      console.log('Marca creada con _id de MongoDB:', result.insertedId.toHexString());
      return result.insertedId.toHexString(); // Devolver el _id como string hexadecimal.
    } catch (error: any) {
      console.error('Error al crear marca:', error);
      if (error.code === 11000 && error.message.includes('marca_1')) {
        throw new Error(`La marca con el nombre "${newMarcaDocument.marca}" ya existe.`);
      }
      throw error; // Relanzar otros errores.
    }
  }

  /**
   * Obtiene todas las marcas, ordenadas por nombre.
   * @param {Filter<MarcaVehiculo>} [filter] - Filtro opcional de MongoDB.
   * @returns {Promise<MarcaVehiculo[]>} Una lista de marcas, con `_id` como string.
   * @throws {Error} Si hay un error de base de datos.
   */
  async getAllMarcas(filter?: Filter<MarcaVehiculo>): Promise<MarcaVehiculo[]> {
    const collection = await this.getCollection();
    try {
      const marcasFromDb = await collection.find(filter || {}).sort({ marca: 1 }).toArray();
      // Convertir ObjectId de MongoDB (_id) a string para el consumo del lado del cliente.
      return marcasFromDb.map(m => ({ ...m, _id: m._id.toHexString() }));
    } catch (error) {
      console.error('Error al obtener marcas:', error);
      throw error;
    }
  }

  /**
   * Obtiene una única marca por su `_id` de MongoDB (como string).
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB de la marca.
   * @returns {Promise<MarcaVehiculo | null>} El objeto marca con `_id` como string, o null si no se encuentra o el ID es inválido.
   * @throws {Error} Si hay un error de base de datos.
   */
  async getMarcaById(id: string): Promise<MarcaVehiculo | null> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Formato de ObjectId inválido para getMarcaById:', id);
        return null;
      }
      const marcaFromDb = await collection.findOne({ _id: new ObjectId(id) });
      if (marcaFromDb) {
        // Convertir _id a string antes de devolver.
        return { ...marcaFromDb, _id: marcaFromDb._id.toHexString() };
      }
      return null; // Devolver null si no se encuentra ninguna marca.
    } catch (error) {
      console.error('Error al obtener marca por ID de MongoDB:', error);
      throw error;
    }
  }

  /**
   * Actualiza los datos de una marca (solo el nombre 'marca').
   * El array `modelos` se gestiona con métodos dedicados específicos.
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB de la marca a actualizar.
   * @param {UpdateMarcaData} updateData - Datos a actualizar (solo nombre `marca`).
   * @returns {Promise<boolean>} True si la actualización fue exitosa (modifiedCount > 0), false en caso contrario.
   * @throws {Error} Si el nombre actualizado está duplicado u ocurren otros errores de base de datos.
   */
  async updateMarca(id: string, updateData: UpdateMarcaData): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Formato de ObjectId inválido para updateMarca:', id);
        return false;
      }
      // El tipo `UpdateMarcaData` solo permite el campo 'marca'. Si está vacío o no hay cambios, devolver true.
      if (!updateData.marca || !updateData.marca.trim()) {
        throw new Error("El nombre de la marca no puede estar vacío para actualizar.");
      }
      
      // Realizar la operación de actualización.
      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(id) }, // Filtrar por _id.
        { $set: { marca: updateData.marca } } // Establecer el nuevo nombre de marca.
      );
      return result.modifiedCount > 0; // Devolver true si al menos un documento fue modificado.
    } catch (error: any) {
      console.error('Error al actualizar marca:', error);
      // Manejar error de nombre duplicado si 'marca' es parte de updateData y se viola el índice único.
      if (error.code === 11000 && updateData.marca) {
         throw new Error(`El nombre de marca "${updateData.marca}" ya está en uso.`);
      }
      throw error;
    }
  }

  /**
   * Elimina una marca de la base de datos.
   * Esto también eliminará todos los modelos asociados, ya que están embebidos.
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB de la marca a eliminar.
   * @returns {Promise<boolean>} True si la marca fue eliminada (deletedCount > 0), false en caso contrario.
   * @throws {Error} Si hay un error de base de datos.
   */
  async deleteMarca(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Formato de ObjectId inválido para deleteMarca:', id);
        return false;
      }
      // Realizar la operación de eliminación.
      const result: DeleteResult = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0; // Devolver true si al menos un documento fue eliminado.
    } catch (error) {
      console.error('Error al eliminar marca:', error);
      throw error;
    }
  }

  // --- Gestión de Modelos ---

  /**
   * Añade un modelo a una marca específica.
   * Genera un nuevo ObjectId (como cadena hexadecimal) para el `idModelo` del modelo.
   * Verifica nombres de modelo duplicados dentro de la misma marca.
   * @param {string} marcaId - La cadena hexadecimal del ObjectId de MongoDB de la marca padre.
   * @param {Omit<ModeloVehiculo, 'idModelo'>} modeloData - Datos para el nuevo modelo (nombre del modelo).
   * @returns {Promise<ModeloVehiculo | null>} El objeto modelo recién añadido (con su `idModelo` generado), o null en caso de fallo.
   * @throws {Error} Si un modelo con el mismo nombre ya existe en la marca, o si `marcaId` es inválido.
   */
  async addModeloToMarca(marcaId: string, modeloData: Omit<ModeloVehiculo, 'idModelo'>): Promise<ModeloVehiculo | null> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(marcaId)) {
        console.warn('Invalid ObjectId for addModeloToMarca (marcaId):', marcaId);
        throw new Error("ID de marca inválido.");
      }
      if (!modeloData.modelo || !modeloData.modelo.trim()) {
        throw new Error("El nombre del modelo es requerido.");
      }

      const mongoMarcaId = new ObjectId(marcaId);
      
      // Obtener la marca para verificar nombres de modelo duplicados.
      const marca = await collection.findOne({ _id: mongoMarcaId });
      if (!marca) {
        throw new Error("Marca no encontrada.");
      }
      if (marca.modelos?.some(m => m.modelo.toLowerCase() === modeloData.modelo.toLowerCase())) {
        throw new Error(`El modelo con nombre "${modeloData.modelo}" ya existe en esta marca.`);
      }

      // Crear el nuevo objeto modelo con una cadena ObjectId generada para idModelo.
      const newModelo: ModeloVehiculo = {
        ...modeloData, // Contiene el nombre 'modelo'
        idModelo: new ObjectId().toHexString(), // Generar nueva cadena ObjectId para idModelo
      };

      // Añadir el nuevo modelo al array 'modelos' de la marca especificada.
      const result: UpdateResult = await collection.updateOne(
        { _id: mongoMarcaId },
        { $push: { modelos: newModelo } }
      );
      // Devolver el objeto newModelo si la actualización fue exitosa.
      return result.modifiedCount > 0 ? newModelo : null;
    } catch (error) {
      console.error('Error al añadir modelo a marca:', error);
      throw error; // Relanzar para ser manejado por la acción del servidor.
    }
  }

  /**
   * Actualiza un modelo dentro de una marca específica.
   * @param {string} marcaId - La cadena hexadecimal del ObjectId de MongoDB de la marca padre.
   * @param {string} idModelo - La cadena hexadecimal del ObjectId del modelo a actualizar.
   * @param {Partial<Omit<ModeloVehiculo, 'idModelo'>>} modeloUpdateData - Datos a actualizar (ej. nombre del modelo).
   * @returns {Promise<boolean>} True si la actualización fue exitosa (modifiedCount > 0), false en caso contrario.
   * @throws {Error} Si se intenta actualizar a un nombre que ya existe para otro modelo en la misma marca,
   *         o si los IDs son inválidos.
   */
  async updateModeloInMarca(marcaId: string, idModelo: string, modeloUpdateData: Partial<Omit<ModeloVehiculo, 'idModelo'>>): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(marcaId) || !ObjectId.isValid(idModelo)) {
        console.warn('Invalid ObjectId for updateModeloInMarca:', marcaId, idModelo);
        throw new Error("ID de marca o modelo inválido.");
      }
      // Asegurar que haya algo para actualizar.
      if (Object.keys(modeloUpdateData).length === 0) {
        return true; // No hay cambios especificados.
      }
      // Validar nombre del modelo si se proporciona.
      if (modeloUpdateData.modelo !== undefined && !modeloUpdateData.modelo.trim()) {
        throw new Error("El nombre del modelo no puede estar vacío.");
      }

      const mongoMarcaId = new ObjectId(marcaId);

      // Si se está actualizando el nombre del modelo, verificar duplicados entre otros modelos en la misma marca.
      if (modeloUpdateData.modelo) {
        const marca = await collection.findOne({ 
          _id: mongoMarcaId, 
          "modelos.modelo": modeloUpdateData.modelo, // Verificar si el nuevo nombre existe
          "modelos.idModelo": { $ne: idModelo } // Excluir el modelo actual que se está actualizando de la verificación
        });
        if (marca) {
          throw new Error(`Otro modelo con el nombre "${modeloUpdateData.modelo}" ya existe en esta marca.`);
        }
      }
      
      // Construir el objeto $set para la actualización de MongoDB para apuntar al modelo específico en el array.
      const setUpdate: Record<string, any> = {};
      for (const key in modeloUpdateData) {
        if (Object.prototype.hasOwnProperty.call(modeloUpdateData, key)) {
          // Apuntar al elemento específico en el array 'modelos' usando $[elem].
          setUpdate[`modelos.$[elem].${key}`] = (modeloUpdateData as any)[key];
        }
      }

      // Realizar la operación de actualización usando arrayFilters para apuntar al modelo correcto por su idModelo.
      const result: UpdateResult = await collection.updateOne(
        { _id: mongoMarcaId }, // Filtrar por _id de marca.
        { $set: setUpdate },    // Establecer los nuevos valores para el modelo coincidente.
        { arrayFilters: [{ "elem.idModelo": idModelo }] } // Identificar el modelo en el array.
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al actualizar modelo en marca:', error);
      throw error; // Relanzar para ser manejado por la acción del servidor.
    }
  }

  /**
   * Elimina un modelo de una marca específica.
   * @param {string} marcaId - La cadena hexadecimal del ObjectId de MongoDB de la marca padre.
   * @param {string} idModelo - La cadena hexadecimal del ObjectId del modelo a eliminar.
   * @returns {Promise<boolean>} True si el modelo fue eliminado (modifiedCount > 0), false en caso contrario.
   * @throws {Error} Si hay un error de base de datos o si los IDs son inválidos.
   */
  async removeModeloFromMarca(marcaId: string, idModelo: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(marcaId) || !ObjectId.isValid(idModelo)) {
         console.warn('Invalid ObjectId for removeModeloFromMarca:', marcaId, idModelo);
        throw new Error("ID de marca o modelo inválido.");
      }
      // Usar $pull para eliminar el modelo del array 'modelos' basado en su idModelo.
      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(marcaId) }, // Filtrar por _id de marca.
        { $pull: { modelos: { idModelo: idModelo } } } // Especificar el modelo a eliminar.
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al eliminar modelo de marca:', error);
      throw error;
    }
  }
}

export default MarcaManager;
