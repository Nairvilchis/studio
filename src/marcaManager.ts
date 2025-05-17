
'use server';
/**
 * @fileOverview Manages vehicle brand (MarcaVehiculo) operations with MongoDB.
 */

import type { Collection, ObjectId, InsertOneResult, UpdateResult, DeleteResult, Filter } from 'mongodb';
import { connectDB } from './db';

// Interface for a vehicle model, typically a sub-document of MarcaVehiculo
export interface ModeloVehiculo {
  idModelo: number; // Custom numeric ID for the model (could be unique within the brand or globally)
  modelo: string;   // Name of the model, e.g., "Corolla", "Civic"
  // Add any other model-specific fields if needed, e.g., available years, type (sedan, SUV)
}

// Interface for a vehicle brand
export interface MarcaVehiculo {
  _id?: ObjectId;    // MongoDB's unique ID
  idMarca: number;   // Custom sequential numeric ID for the brand
  marca: string;     // Name of the brand, e.g., "Toyota", "Honda"
  modelos?: ModeloVehiculo[]; // Array of models associated with this brand
  // Add any other brand-specific fields if needed
}

// Type for creating a new brand, omitting MongoDB _id and sequenced idMarca.
// Modelos are optional at creation.
export type NewMarcaData = Omit<MarcaVehiculo, '_id' | 'idMarca'>;

// Type for updating an existing brand.
export type UpdateMarcaData = Partial<Omit<MarcaVehiculo, '_id' | 'idMarca'>>;

class MarcaManager {
  private collectionPromise: Promise<Collection<MarcaVehiculo>>;

  constructor() {
    this.collectionPromise = connectDB().then(db => {
      const marcasCollection = db.collection<MarcaVehiculo>('marcas');
      // Ensure a counter collection for idMarca sequence
      const countersCollection = db.collection<{ _id: string; sequence_value: number }>('counters');
      countersCollection.updateOne(
        { _id: 'marcaIdSequence' },
        { $setOnInsert: { sequence_value: 1 } }, // Start from 1
        { upsert: true }
      );
      // Consider adding an index for idMarca for faster lookups if it's frequently used
      // marcasCollection.createIndex({ idMarca: 1 }, { unique: true });
      marcasCollection.createIndex({ marca: 1 }, { unique: true }); // Ensure brand names are unique
      return marcasCollection;
    }).catch(err => {
      console.error('Error al obtener la colección de marcas:', err);
      throw err;
    });
  }

  private async getCollection(): Promise<Collection<MarcaVehiculo>> {
    return this.collectionPromise;
  }

  private async getNextSequenceValue(sequenceName: string): Promise<number> {
    const db = await connectDB();
    const countersCollection = db.collection<{ _id: string; sequence_value: number }>('counters');
    const sequenceDocument = await countersCollection.findOneAndUpdate(
      { _id: sequenceName },
      { $inc: { sequence_value: 1 } },
      { returnDocument: 'after', upsert: true }
    );
    if (!sequenceDocument || sequenceDocument.sequence_value === null || sequenceDocument.sequence_value === undefined) {
      // This case should be rare due to constructor setup
      await countersCollection.updateOne({ _id: sequenceName }, { $setOnInsert: { sequence_value: 0 } }, { upsert: true });
      const newSequenceDoc = await countersCollection.findOneAndUpdate(
        { _id: sequenceName }, { $inc: { sequence_value: 1 } }, { returnDocument: 'after' }
      );
      if (!newSequenceDoc || newSequenceDoc.sequence_value === null || newSequenceDoc.sequence_value === undefined) {
        throw new Error(`Could not find or create sequence for ${sequenceName}`);
      }
      return newSequenceDoc.sequence_value;
    }
    return sequenceDocument.sequence_value;
  }

  async createMarca(marcaData: NewMarcaData): Promise<ObjectId | null> {
    const collection = await this.getCollection();
    const nextIdMarca = await this.getNextSequenceValue('marcaIdSequence');

    const newMarcaDocument: Omit<MarcaVehiculo, '_id'> = {
      ...marcaData,
      idMarca: nextIdMarca,
      modelos: marcaData.modelos || [], // Ensure modelos is an array
    };

    try {
      const result: InsertOneResult<MarcaVehiculo> = await collection.insertOne(newMarcaDocument as MarcaVehiculo);
      console.log('Marca creada con ID de MongoDB:', result.insertedId, 'y idMarca:', nextIdMarca);
      return result.insertedId;
    } catch (error) {
      console.error('Error al crear marca:', error);
      // Handle specific errors, e.g., unique constraint violation for 'marca' name
      if ((error as any).code === 11000) {
         throw new Error(`La marca "${newMarcaDocument.marca}" ya existe.`);
      }
      throw error;
    }
  }

  async getAllMarcas(filter?: Filter<MarcaVehiculo>): Promise<MarcaVehiculo[]> {
    const collection = await this.getCollection();
    try {
      const marcas = await collection.find(filter || {}).sort({ marca: 1 }).toArray();
      return marcas;
    } catch (error) {
      console.error('Error al obtener marcas:', error);
      throw error;
    }
  }

  async getMarcaById(id: string): Promise<MarcaVehiculo | null> { // by MongoDB _id
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format for getMarcaById:', id);
        return null;
      }
      const marca = await collection.findOne({ _id: new ObjectId(id) });
      return marca;
    } catch (error) {
      console.error('Error al obtener marca por ID de MongoDB:', error);
      throw error;
    }
  }

  async getMarcaByCustomId(idMarca: number): Promise<MarcaVehiculo | null> {
    const collection = await this.getCollection();
    try {
      const marca = await collection.findOne({ idMarca: idMarca });
      return marca;
    } catch (error) {
      console.error('Error al obtener marca por idMarca personalizado:', error);
      throw error;
    }
  }

  async updateMarca(id: string, updateData: UpdateMarcaData): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format for updateMarca:', id);
        return false;
      }
      if (Object.keys(updateData).length === 0) {
        return true; // No changes needed
      }
      // Prevent changing idMarca
      const { idMarca, ...dataToUpdate } = updateData as any;

      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: dataToUpdate }
      );
      console.log('Marca actualizada:', result.modifiedCount);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al actualizar marca:', error);
      if ((error as any).code === 11000 && updateData.marca) {
         throw new Error(`El nombre de marca "${updateData.marca}" ya está en uso.`);
      }
      throw error;
    }
  }

  async deleteMarca(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format for deleteMarca:', id);
        return false;
      }
      const result: DeleteResult = await collection.deleteOne({ _id: new ObjectId(id) });
      console.log('Marca eliminada:', result.deletedCount);
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar marca:', error);
      throw error;
    }
  }

  // --- Model Management within a Brand ---

  async addModeloToMarca(marcaId: string, modeloData: ModeloVehiculo): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(marcaId)) return false;

      // Check if model with same idModelo or name already exists for this brand
      const marca = await collection.findOne({ _id: new ObjectId(marcaId) });
      if (marca && marca.modelos?.some(m => m.idModelo === modeloData.idModelo || m.modelo.toLowerCase() === modeloData.modelo.toLowerCase())) {
        throw new Error(`El modelo con ID ${modeloData.idModelo} o nombre "${modeloData.modelo}" ya existe en esta marca.`);
      }
      
      // If idModelo is not provided or is 0, generate one (simple increment for now, could be more robust)
      // For simplicity, we'll require idModelo to be provided by the client for now,
      // or assume it's globally unique if managed by a separate sequence.
      // If you want to auto-generate it within the brand:
      // const nextModeloId = (marca?.modelos?.length || 0) + 1;
      // modeloData.idModelo = modeloData.idModelo || nextModeloId;


      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(marcaId) },
        { $push: { modelos: modeloData } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al añadir modelo a marca:', error);
      throw error;
    }
  }

  async updateModeloInMarca(marcaId: string, modeloId: number, modeloUpdateData: Partial<Omit<ModeloVehiculo, 'idModelo'>>): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(marcaId)) return false;

      // Construct the $set object for specific fields of the model
      const setUpdate: Record<string, any> = {};
      for (const key in modeloUpdateData) {
        if (Object.prototype.hasOwnProperty.call(modeloUpdateData, key)) {
          setUpdate[`modelos.$.${key}`] = (modeloUpdateData as any)[key];
        }
      }
      
      if (Object.keys(setUpdate).length === 0) return true; // No changes

      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(marcaId), "modelos.idModelo": modeloId },
        { $set: setUpdate }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al actualizar modelo en marca:', error);
      throw error;
    }
  }

  async removeModeloFromMarca(marcaId: string, modeloId: number): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(marcaId)) return false;
      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(marcaId) },
        { $pull: { modelos: { idModelo: modeloId } } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al eliminar modelo de marca:', error);
      throw error;
    }
  }
}

export default MarcaManager;
