
'use server';
/**
 * @fileOverview Manages insurance company (Aseguradora) operations with MongoDB.
 * Aseguradora IDs (_id) son MongoDB ObjectIds. Ajustador IDs (idAjustador) también son ObjectIds (como strings)
 * y son únicos dentro del array 'ajustadores' de su Aseguradora padre.
 */

import { ObjectId, type Collection, type InsertOneResult, type UpdateResult, type DeleteResult, type Filter } from './db';
import { connectDB } from './db';
import type { Aseguradora, Ajustador, NewAseguradoraData, UpdateAseguradoraData } from '@/lib/types';

/**
 * Clase responsable de gestionar operaciones CRUD para Aseguradoras (compañías de seguros)
 * y sus Ajustadores asociados en la base de datos MongoDB.
 * @remarks
 * Esta clase utiliza la directiva 'use server' para indicar que solo debe ejecutarse en el servidor.
 */
class AseguradoraManager {
  private collectionPromise: Promise<Collection<Aseguradora>>;

  /**
   * Constructor de AseguradoraManager.
   * Inicializa la promesa de conexión a la colección 'aseguradoras' en MongoDB.
   * Crea índices en 'nombre' (único) y 'ajustadores.idAjustador'.
   */
  constructor() {
    this.collectionPromise = connectDB().then(db => {
      const aseguradorasCollection = db.collection<Aseguradora>('aseguradoras');
      // Índice en el nombre de la Aseguradora para unicidad y búsquedas rápidas.
      aseguradorasCollection.createIndex({ nombre: 1 }, { unique: true }).catch(err => {
        // Registrar advertencia solo si no es un error de "clave duplicada" (índice ya existe)
        if (err.code !== 11000) console.warn('Failed to create index on aseguradoras.nombre:', err);
      });
      // Índice en el ID del ajustador para posibles búsquedas directas si alguna vez se necesitan, aunque menos común.
      aseguradorasCollection.createIndex({ "ajustadores.idAjustador": 1 }).catch(err => {
         if (err.code !== 11000) console.warn('Failed to create index on aseguradoras.ajustadores.idAjustador:', err);
      });
      return aseguradorasCollection;
    }).catch(err => {
      console.error('Error al obtener la colección de aseguradoras:', err);
      throw err; // Relanzar para ser capturado por quien llama o para fallar el servidor si no se maneja al inicio.
    });
  }

  /**
   * Obtiene la colección MongoDB para aseguradoras.
   * Este método asegura que la colección esté inicializada antes de su uso.
   * @returns {Promise<Collection<Aseguradora>>} La colección de aseguradoras.
   * @private
   */
  private async getCollection(): Promise<Collection<Aseguradora>> {
    return this.collectionPromise;
  }

  /**
   * Crea una nueva Aseguradora.
   * El `_id` para la Aseguradora es generado automáticamente por MongoDB como un ObjectId.
   * Los `idAjustador` para cualquier ajustador proporcionado se generarán como nuevas cadenas hexadecimales de ObjectId.
   * @param {NewAseguradoraData} data - Datos para la nueva aseguradora (nombre, telefono, opcionalmente ajustadores).
   * @returns {Promise<string | null>} El `_id` (string hexadecimal del ObjectId) de la aseguradora recién creada, o null en caso de fallo.
   * @throws {Error} Si el nombre de la aseguradora está duplicado u ocurren otros errores de base de datos.
   */
  async createAseguradora(data: NewAseguradoraData): Promise<string | null> {
    const collection = await this.getCollection();

    // Validación básica para campos requeridos.
    if (!data.nombre || !data.nombre.trim()) {
      throw new Error('El nombre de la aseguradora es requerido.');
    }
    
    const newAseguradoraDocument: Omit<Aseguradora, '_id'> = {
      nombre: data.nombre,
      telefono: data.telefono,
      ajustadores: (data.ajustadores || []).map(aj => ({
        ...aj, // Extender otros datos del ajustador si se proporcionan en `data`
        idAjustador: new ObjectId().toHexString(), // Generar nueva cadena ObjectId para cada ajustador
      })),
    };

    try {
      // Insertar el nuevo documento de aseguradora en la colección.
      const result: InsertOneResult<Aseguradora> = await collection.insertOne(newAseguradoraDocument as Aseguradora);
      console.log('Aseguradora creada con _id de MongoDB:', result.insertedId.toHexString());
      return result.insertedId.toHexString(); // Devolver el _id como string hexadecimal.
    } catch (error: any) {
      console.error('Error al crear aseguradora:', error);
      // Manejar errores específicos de MongoDB, como clave duplicada para 'nombre'.
      if (error.code === 11000 && error.message.includes('nombre_1')) {
        throw new Error(`La aseguradora con el nombre "${newAseguradoraDocument.nombre}" ya existe.`);
      }
      throw error; // Relanzar otros errores.
    }
  }

  /**
   * Obtiene todas las aseguradoras, ordenadas por nombre.
   * @param {Filter<Aseguradora>} [filter] - Filtro opcional de MongoDB para aplicar a la consulta.
   * @returns {Promise<Aseguradora[]>} Una lista de todas las aseguradoras que coinciden con el filtro, con `_id` como string.
   * @throws {Error} Si hay un error de base de datos.
   */
  async getAllAseguradoras(filter?: Filter<Aseguradora>): Promise<Aseguradora[]> {
    const collection = await this.getCollection();
    try {
      const aseguradorasDb = await collection.find(filter || {}).sort({ nombre: 1 }).toArray();
      // Convertir ObjectId de MongoDB a string para el consumo del lado del cliente.
      return aseguradorasDb.map(aseg => ({...aseg, _id: aseg._id.toHexString()}));
    } catch (error) {
      console.error('Error al obtener aseguradoras:', error);
      throw error;
    }
  }

  /**
   * Obtiene una única aseguradora por su `_id` de MongoDB (como string).
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB de la aseguradora.
   * @returns {Promise<Aseguradora | null>} El objeto aseguradora con `_id` como string, o null si no se encuentra o el ID es inválido.
   * @throws {Error} Si hay un error de base de datos.
   */
  async getAseguradoraById(id: string): Promise<Aseguradora | null> {
    const collection = await this.getCollection();
    try {
      // Validar si el ID proporcionado es una cadena hexadecimal válida de ObjectId.
      if (!ObjectId.isValid(id)) {
        console.warn('Formato de ObjectId inválido para getAseguradoraById:', id);
        return null;
      }
      // Encontrar la aseguradora por su _id.
      const aseguradoraDb = await collection.findOne({ _id: new ObjectId(id) });
      if (aseguradoraDb) {
        // Convertir _id a string antes de devolver.
        return {...aseguradoraDb, _id: aseguradoraDb._id.toHexString()};
      }
      return null; // Devolver null si no se encuentra ninguna aseguradora.
    } catch (error) {
      console.error('Error al obtener aseguradora por ID:', error);
      throw error;
    }
  }

  /**
   * Actualiza los datos de una aseguradora (excluyendo su array de ajustadores, que se gestiona con métodos específicos).
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB de la aseguradora a actualizar.
   * @param {UpdateAseguradoraData} updateData - Datos a actualizar para la aseguradora (ej. nombre, telefono).
   * @returns {Promise<boolean>} True si la actualización fue exitosa (modifiedCount > 0), false en caso contrario.
   * @throws {Error} Si el nombre actualizado está duplicado u ocurren otros errores de base de datos.
   */
  async updateAseguradora(id: string, updateData: UpdateAseguradoraData): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Formato de ObjectId inválido para updateAseguradora:', id);
        return false;
      }
      // Si no se proporcionan datos para actualizar, considerar como éxito (no se necesitan cambios).
      if (Object.keys(updateData).length === 0) {
        return true;
      }
      // El array 'ajustadores' se gestiona con métodos dedicados, así que se excluye de la actualización directa aquí.
      const { ajustadores, ...dataToUpdate } = updateData;
      if (Object.keys(dataToUpdate).length === 0) {
        // Si solo 'ajustadores' estaba en updateData, se ignora aquí, efectivamente sin cambios.
        return true; 
      }

      // Realizar la operación de actualización.
      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(id) }, // Filtrar por _id.
        { $set: dataToUpdate }      // Establecer los nuevos valores.
      );
      return result.modifiedCount > 0; // Devolver true si al menos un documento fue modificado.
    } catch (error: any) {
      console.error('Error al actualizar aseguradora:', error);
      // Manejar error de nombre duplicado si 'nombre' es parte de updateData.
      if (error.code === 11000 && updateData.nombre) {
        throw new Error(`El nombre de aseguradora "${updateData.nombre}" ya está en uso.`);
      }
      throw error;
    }
  }

  /**
   * Elimina una aseguradora de la base de datos.
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB de la aseguradora a eliminar.
   * @returns {Promise<boolean>} True si la aseguradora fue eliminada (deletedCount > 0), false en caso contrario.
   * @throws {Error} Si hay un error de base de datos.
   */
  async deleteAseguradora(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Formato de ObjectId inválido para deleteAseguradora:', id);
        return false;
      }
      // Realizar la operación de eliminación.
      const result: DeleteResult = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0; // Devolver true si al menos un documento fue eliminado.
    } catch (error) {
      console.error('Error al eliminar aseguradora:', error);
      throw error;
    }
  }

  // --- Gestión de Ajustadores ---

  /**
   * Añade un ajustador a una aseguradora específica.
   * Genera un nuevo ObjectId (como cadena hexadecimal) para el `idAjustador` del ajustador.
   * Verifica nombres de ajustador duplicados dentro de la misma aseguradora.
   * @param {string} aseguradoraId - La cadena hexadecimal del ObjectId de MongoDB de la aseguradora padre.
   * @param {Omit<Ajustador, 'idAjustador'>} ajustadorData - Datos para el nuevo ajustador (nombre, telefono, correo).
   * @returns {Promise<Ajustador | null>} El objeto ajustador recién añadido (con su `idAjustador` generado), o null en caso de fallo.
   * @throws {Error} Si un ajustador con el mismo nombre ya existe en la aseguradora, o si `aseguradoraId` es inválido.
   */
  async addAjustadorToAseguradora(aseguradoraId: string, ajustadorData: Omit<Ajustador, 'idAjustador'>): Promise<Ajustador | null> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(aseguradoraId)) {
        console.warn('Invalid ObjectId for addAjustadorToAseguradora (aseguradoraId):', aseguradoraId);
        throw new Error("ID de aseguradora inválido.");
      }
      if (!ajustadorData.nombre || !ajustadorData.nombre.trim()) {
        throw new Error("El nombre del ajustador es requerido.");
      }

      const mongoAseguradoraId = new ObjectId(aseguradoraId);
      
      // Verificar nombres de ajustador duplicados dentro de esta aseguradora antes de añadir.
      const aseguradora = await collection.findOne({ _id: mongoAseguradoraId });
      if (!aseguradora) {
        throw new Error("Aseguradora no encontrada.");
      }
      if (aseguradora.ajustadores?.some(a => a.nombre.toLowerCase() === ajustadorData.nombre.toLowerCase())) {
        throw new Error(`El ajustador con nombre "${ajustadorData.nombre}" ya existe en esta aseguradora.`);
      }

      // Crear el nuevo objeto ajustador con una cadena ObjectId generada para idAjustador.
      const newAjustador: Ajustador = {
        ...ajustadorData,
        idAjustador: new ObjectId().toHexString(),
      };

      // Añadir el nuevo ajustador al array 'ajustadores' de la aseguradora especificada.
      const result: UpdateResult = await collection.updateOne(
        { _id: mongoAseguradoraId },
        { $push: { ajustadores: newAjustador } }
      );
      // Devolver el objeto newAjustador si la actualización fue exitosa.
      return result.modifiedCount > 0 ? newAjustador : null;
    } catch (error) {
      console.error('Error al añadir ajustador:', error);
      throw error; // Relanzar para ser manejado por la acción del servidor.
    }
  }

  /**
   * Actualiza un ajustador dentro de una aseguradora específica.
   * @param {string} aseguradoraId - La cadena hexadecimal del ObjectId de MongoDB de la aseguradora padre.
   * @param {string} idAjustador - La cadena hexadecimal del ObjectId del ajustador a actualizar.
   * @param {Partial<Omit<Ajustador, 'idAjustador'>>} ajustadorUpdateData - Datos a actualizar para el ajustador.
   * @returns {Promise<boolean>} True si la actualización fue exitosa (modifiedCount > 0), false en caso contrario.
   * @throws {Error} Si se intenta actualizar a un nombre que ya existe para otro ajustador en la misma aseguradora,
   *         o si los IDs son inválidos.
   */
  async updateAjustadorInAseguradora(aseguradoraId: string, idAjustador: string, ajustadorUpdateData: Partial<Omit<Ajustador, 'idAjustador'>>): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      // Validar ObjectIds.
      if (!ObjectId.isValid(aseguradoraId) || !ObjectId.isValid(idAjustador)) {
        console.warn('Invalid ObjectId for updateAjustadorInAseguradora:', aseguradoraId, idAjustador);
        throw new Error("ID de aseguradora o ajustador inválido.");
      }
      if (Object.keys(ajustadorUpdateData).length === 0) {
        return true; // No hay cambios especificados.
      }
      // Validar nombre si se proporciona.
      if (ajustadorUpdateData.nombre !== undefined && !ajustadorUpdateData.nombre.trim()) {
        throw new Error("El nombre del ajustador no puede estar vacío.");
      }

      const mongoAseguradoraId = new ObjectId(aseguradoraId);

      // Si se está actualizando el nombre, verificar duplicados entre otros ajustadores.
      if (ajustadorUpdateData.nombre) {
        const aseguradora = await collection.findOne({ 
          _id: mongoAseguradoraId, 
          "ajustadores.nombre": ajustadorUpdateData.nombre,
          "ajustadores.idAjustador": { $ne: idAjustador } // Excluir el ajustador actual de la verificación.
        });
        if (aseguradora) {
          throw new Error(`Otro ajustador con el nombre "${ajustadorUpdateData.nombre}" ya existe en esta aseguradora.`);
        }
      }
      
      // Construir el objeto $set para la actualización de MongoDB.
      const setUpdate: Record<string, any> = {};
      for (const key in ajustadorUpdateData) {
        if (Object.prototype.hasOwnProperty.call(ajustadorUpdateData, key)) {
          // Apuntar al elemento específico en el array 'ajustadores'.
          setUpdate[`ajustadores.$[elem].${key}`] = (ajustadorUpdateData as any)[key];
        }
      }

      // Realizar la operación de actualización usando arrayFilters para apuntar al ajustador correcto.
      const result: UpdateResult = await collection.updateOne(
        { _id: mongoAseguradoraId },
        { $set: setUpdate },
        { arrayFilters: [{ "elem.idAjustador": idAjustador }] }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al actualizar ajustador:', error);
      throw error; // Relanzar para ser manejado por la acción del servidor.
    }
  }

  /**
   * Elimina un ajustador de una aseguradora específica.
   * @param {string} aseguradoraId - La cadena hexadecimal del ObjectId de MongoDB de la aseguradora padre.
   * @param {string} idAjustador - La cadena hexadecimal del ObjectId del ajustador a eliminar.
   * @returns {Promise<boolean>} True si el ajustador fue eliminado (modifiedCount > 0), false en caso contrario.
   * @throws {Error} Si hay un error de base de datos o si los IDs son inválidos.
   */
  async removeAjustadorFromAseguradora(aseguradoraId: string, idAjustador: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(aseguradoraId) || !ObjectId.isValid(idAjustador)) {
         console.warn('Invalid ObjectId for removeAjustadorFromAseguradora:', aseguradoraId, idAjustador);
        throw new Error("ID de aseguradora o ajustador inválido.");
      }
      // Usar $pull para eliminar el ajustador del array 'ajustadores'.
      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(aseguradoraId) },
        { $pull: { ajustadores: { idAjustador: idAjustador } } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al eliminar ajustador:', error);
      throw error;
    }
  }
}

export default AseguradoraManager;
