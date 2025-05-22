
'use server';
/**
 * @fileOverview Manages insurance company (Aseguradora) operations with MongoDB.
 * Aseguradora IDs are MongoDB ObjectIds. Ajustador IDs are also ObjectIds unique within their parent Aseguradora.
 */

import { ObjectId, type Collection, type InsertOneResult, type UpdateResult, type DeleteResult, type Filter } from 'mongodb';
import { connectDB } from './db';
import type { Aseguradora, Ajustador, NewAseguradoraData, UpdateAseguradoraData } from '@/lib/types';

class AseguradoraManager {
  private collectionPromise: Promise<Collection<Aseguradora>>;

  constructor() {
    this.collectionPromise = connectDB().then(db => {
      const aseguradorasCollection = db.collection<Aseguradora>('aseguradoras');
      // Index on Aseguradora name for uniqueness and fast lookups.
      aseguradorasCollection.createIndex({ nombre: 1 }, { unique: true }).catch(err => {
        if (err.code !== 11000) console.warn('Failed to create index on aseguradoras.nombre:', err);
      });
      // Index on ajustador ID for potential direct lookups if ever needed, though less common.
      aseguradorasCollection.createIndex({ "ajustadores.idAjustador": 1 }).catch(err => {
         if (err.code !== 11000) console.warn('Failed to create index on aseguradoras.ajustadores.idAjustador:', err);
      });
      return aseguradorasCollection;
    }).catch(err => {
      console.error('Error al obtener la colección de aseguradoras:', err);
      throw err;
    });
  }

  /**
   * Retrieves the MongoDB collection for aseguradoras.
   * @returns {Promise<Collection<Aseguradora>>} The aseguradora collection.
   */
  private async getCollection(): Promise<Collection<Aseguradora>> {
    return this.collectionPromise;
  }

  /**
   * Creates a new Aseguradora.
   * @param {NewAseguradoraData} data Data for the new aseguradora. Ajustadores provided will have their idAjustador generated.
   * @returns {Promise<ObjectId | null>} The MongoDB ObjectId of the newly created aseguradora, or null on failure.
   * @throws Will throw an error if the aseguradora name is duplicate.
   */
  async createAseguradora(data: NewAseguradoraData): Promise<ObjectId | null> {
    const collection = await this.getCollection();

    if (!data.nombre || !data.nombre.trim()) {
      throw new Error('El nombre de la aseguradora es requerido.');
    }
    
    const newAseguradoraDocument: Omit<Aseguradora, '_id'> & { _id?: ObjectId } = {
      nombre: data.nombre,
      telefono: data.telefono,
      ajustadores: (data.ajustadores || []).map(aj => ({
        ...aj,
        idAjustador: new ObjectId().toHexString(), // Generate ObjectId string for each adjuster
      })),
    };

    try {
      const result: InsertOneResult<Aseguradora> = await collection.insertOne(newAseguradoraDocument as Aseguradora);
      console.log('Aseguradora creada con ID de MongoDB:', result.insertedId);
      return result.insertedId;
    } catch (error: any) {
      console.error('Error al crear aseguradora:', error);
      if (error.code === 11000 && error.message.includes('nombre_1')) {
        throw new Error(`La aseguradora con el nombre "${newAseguradoraDocument.nombre}" ya existe.`);
      }
      throw error; // Re-throw other errors.
    }
  }

  /**
   * Retrieves all aseguradoras, sorted by name.
   * @param {Filter<Aseguradora>} [filter] Optional MongoDB filter.
   * @returns {Promise<Aseguradora[]>} A list of all aseguradoras.
   */
  async getAllAseguradoras(filter?: Filter<Aseguradora>): Promise<Aseguradora[]> {
    const collection = await this.getCollection();
    try {
      const aseguradoras = await collection.find(filter || {}).sort({ nombre: 1 }).toArray();
      return aseguradoras.map(aseg => ({...aseg, _id: aseg._id.toHexString()}));
    } catch (error) {
      console.error('Error al obtener aseguradoras:', error);
      throw error;
    }
  }

  /**
   * Retrieves a single aseguradora by its MongoDB ObjectId.
   * @param {string} id The MongoDB ObjectId string of the aseguradora.
   * @returns {Promise<Aseguradora | null>} The aseguradora object or null if not found or ID is invalid.
   */
  async getAseguradoraById(id: string): Promise<Aseguradora | null> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Formato de ObjectId inválido para getAseguradoraById:', id);
        return null;
      }
      const aseguradora = await collection.findOne({ _id: new ObjectId(id) });
      if (aseguradora) {
        return {...aseguradora, _id: aseguradora._id.toHexString()};
      }
      return null;
    } catch (error) {
      console.error('Error al obtener aseguradora por ID:', error);
      throw error;
    }
  }

  /**
   * Updates an aseguradora's data.
   * @param {string} id The MongoDB ObjectId string of the aseguradora to update.
   * @param {UpdateAseguradoraData} updateData Data to update for the aseguradora.
   * @returns {Promise<boolean>} True if the update was successful (modified count > 0), false otherwise.
   * @throws Will throw an error if the updated name is duplicate.
   */
  async updateAseguradora(id: string, updateData: UpdateAseguradoraData): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Formato de ObjectId inválido para updateAseguradora:', id);
        return false;
      }
      if (Object.keys(updateData).length === 0) {
        return true; // No changes specified.
      }
      // Cannot update 'ajustadores' array directly with this method. Use specific ajustador methods.
      const { ajustadores, ...dataToUpdate } = updateData;
      if (Object.keys(dataToUpdate).length === 0) {
        return true; // Only ajustadores were in updateData, which is ignored here.
      }

      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: dataToUpdate }
      );
      return result.modifiedCount > 0;
    } catch (error: any) {
      console.error('Error al actualizar aseguradora:', error);
      if (error.code === 11000 && updateData.nombre) {
        throw new Error(`El nombre de aseguradora "${updateData.nombre}" ya está en uso.`);
      }
      throw error;
    }
  }

  /**
   * Deletes an aseguradora from the database.
   * @param {string} id The MongoDB ObjectId string of the aseguradora to delete.
   * @returns {Promise<boolean>} True if the aseguradora was deleted, false otherwise.
   */
  async deleteAseguradora(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Formato de ObjectId inválido para deleteAseguradora:', id);
        return false;
      }
      const result: DeleteResult = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar aseguradora:', error);
      throw error;
    }
  }

  // --- Ajustador Management ---

  /**
   * Adds an ajustador to a specific aseguradora.
   * Generates a new ObjectId for the ajustador's idAjustador.
   * @param {string} aseguradoraId The MongoDB ObjectId string of the parent aseguradora.
   * @param {Omit<Ajustador, 'idAjustador'>} ajustadorData Data for the new ajustador.
   * @returns {Promise<Ajustador | null>} The newly added ajustador object with its generated idAjustador, or null on failure.
   * @throws Error if an adjuster with the same name already exists in the aseguradora.
   */
  async addAjustadorToAseguradora(aseguradoraId: string, ajustadorData: Omit<Ajustador, 'idAjustador'>): Promise<Ajustador | null> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(aseguradoraId)) {
        console.warn('Invalid ObjectId for addAjustadorToAseguradora (aseguradoraId):', aseguradoraId);
        return null;
      }
      if (!ajustadorData.nombre || !ajustadorData.nombre.trim()) {
        throw new Error("El nombre del ajustador es requerido.");
      }

      const mongoAseguradoraId = new ObjectId(aseguradoraId);
      
      // Check for duplicate ajustador name within this aseguradora
      const aseguradora = await collection.findOne({ _id: mongoAseguradoraId });
      if (aseguradora && aseguradora.ajustadores?.some(a => a.nombre.toLowerCase() === ajustadorData.nombre.toLowerCase())) {
        throw new Error(`El ajustador con nombre "${ajustadorData.nombre}" ya existe en esta aseguradora.`);
      }

      const newAjustador: Ajustador = {
        ...ajustadorData,
        idAjustador: new ObjectId().toHexString(), // Generate new ObjectId string for idAjustador
      };

      const result: UpdateResult = await collection.updateOne(
        { _id: mongoAseguradoraId },
        { $push: { ajustadores: newAjustador } }
      );
      return result.modifiedCount > 0 ? newAjustador : null;
    } catch (error) {
      console.error('Error al añadir ajustador:', error);
      throw error; // Re-throw to be handled by the action
    }
  }

  /**
   * Updates an ajustador within a specific aseguradora.
   * @param {string} aseguradoraId The MongoDB ObjectId string of the parent aseguradora.
   * @param {string} idAjustador The ObjectId string of the ajustador to update.
   * @param {Partial<Omit<Ajustador, 'idAjustador'>>} ajustadorUpdateData Data to update for the ajustador.
   * @returns {Promise<boolean>} True if the update was successful, false otherwise.
   * @throws Error if trying to update to a name that already exists for another adjuster in the same aseguradora.
   */
  async updateAjustadorInAseguradora(aseguradoraId: string, idAjustador: string, ajustadorUpdateData: Partial<Omit<Ajustador, 'idAjustador'>>): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(aseguradoraId) || !ObjectId.isValid(idAjustador)) {
        console.warn('Invalid ObjectId for updateAjustadorInAseguradora:', aseguradoraId, idAjustador);
        return false;
      }
      if (Object.keys(ajustadorUpdateData).length === 0) {
        return true; // No changes specified.
      }
      if (ajustadorUpdateData.nombre !== undefined && !ajustadorUpdateData.nombre.trim()) {
        throw new Error("El nombre del ajustador no puede estar vacío.");
      }

      const mongoAseguradoraId = new ObjectId(aseguradoraId);

      // If name is being updated, check for duplicates
      if (ajustadorUpdateData.nombre) {
        const aseguradora = await collection.findOne({ 
          _id: mongoAseguradoraId, 
          "ajustadores.nombre": ajustadorUpdateData.nombre,
          "ajustadores.idAjustador": { $ne: idAjustador } // Check other ajustadores
        });
        if (aseguradora) {
          throw new Error(`Otro ajustador con el nombre "${ajustadorUpdateData.nombre}" ya existe en esta aseguradora.`);
        }
      }
      
      const setUpdate: Record<string, any> = {};
      for (const key in ajustadorUpdateData) {
        if (Object.prototype.hasOwnProperty.call(ajustadorUpdateData, key)) {
          setUpdate[`ajustadores.$[elem].${key}`] = (ajustadorUpdateData as any)[key];
        }
      }

      const result: UpdateResult = await collection.updateOne(
        { _id: mongoAseguradoraId },
        { $set: setUpdate },
        { arrayFilters: [{ "elem.idAjustador": idAjustador }] }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al actualizar ajustador:', error);
      throw error; // Re-throw to be handled by the action
    }
  }

  /**
   * Removes an ajustador from a specific aseguradora.
   * @param {string} aseguradoraId The MongoDB ObjectId string of the parent aseguradora.
   * @param {string} idAjustador The ObjectId string of the ajustador to remove.
   * @returns {Promise<boolean>} True if the ajustador was removed, false otherwise.
   */
  async removeAjustadorFromAseguradora(aseguradoraId: string, idAjustador: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(aseguradoraId) || !ObjectId.isValid(idAjustador)) {
         console.warn('Invalid ObjectId for removeAjustadorFromAseguradora:', aseguradoraId, idAjustador);
        return false;
      }
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
