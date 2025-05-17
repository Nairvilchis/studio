
'use server';
/**
 * @fileOverview Manages vehicle brand (MarcaVehiculo) operations with MongoDB.
 */

import type { Collection, ObjectId, InsertOneResult, UpdateResult, DeleteResult, Filter } from 'mongodb';
import { connectDB } from './db';
import type { MarcaVehiculo, ModeloVehiculo, NewMarcaData, UpdateMarcaData } from '@/lib/types'; // Import from new types file


class MarcaManager {
  private collectionPromise: Promise<Collection<MarcaVehiculo>>;

  constructor() {
    this.collectionPromise = connectDB().then(db => {
      const marcasCollection = db.collection<MarcaVehiculo>('marcas');
      const countersCollection = db.collection<{ _id: string; sequence_value: number }>('counters');
      countersCollection.updateOne(
        { _id: 'marcaIdSequence' },
        { $setOnInsert: { sequence_value: 1 } },
        { upsert: true }
      ).catch(console.warn);
      marcasCollection.createIndex({ marca: 1 }, { unique: true }).catch(console.warn);
      marcasCollection.createIndex({ idMarca: 1 }, { unique: true }).catch(console.warn);
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
      modelos: marcaData.modelos || [],
    };

    try {
      const result: InsertOneResult<MarcaVehiculo> = await collection.insertOne(newMarcaDocument as MarcaVehiculo);
      console.log('Marca creada con ID de MongoDB:', result.insertedId, 'y idMarca:', nextIdMarca);
      return result.insertedId;
    } catch (error: any) {
      console.error('Error al crear marca:', error);
      if (error.code === 11000) {
         if (error.message.includes('marca_1')) throw new Error(`La marca "${newMarcaDocument.marca}" ya existe.`);
         if (error.message.includes('idMarca_1')) throw new Error(`El idMarca "${nextIdMarca}" ya existe.`);
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
        console.warn('Invalid ObjectId format for getMarcaById:', id);
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
        console.warn('Invalid ObjectId format for updateMarca:', id);
        return false;
      }
      if (Object.keys(updateData).length === 0) {
        return true; 
      }
      const { idMarca, ...dataToUpdate } = updateData as any;

      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: dataToUpdate }
      );
      console.log('Marca actualizada:', result.modifiedCount);
      return result.modifiedCount > 0;
    } catch (error: any) {
      console.error('Error al actualizar marca:', error);
      if (error.code === 11000 && updateData.marca) {
         throw new Error(`El nombre de marca "${updateData.marca}" ya está en uso.`);
      }
      throw error;
    }
  }

  async deleteMarca(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Invalid ObjectId format for deleteMarca:', id);
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

  async addModeloToMarca(marcaId: string, modeloData: ModeloVehiculo): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(marcaId)) return false;

      const marca = await collection.findOne({ _id: new ObjectId(marcaId) });
      if (marca && marca.modelos?.some(m => m.idModelo === modeloData.idModelo || m.modelo.toLowerCase() === modeloData.modelo.toLowerCase())) {
        throw new Error(`El modelo con ID ${modeloData.idModelo} o nombre "${modeloData.modelo}" ya existe en esta marca.`);
      }
      
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

      const setUpdate: Record<string, any> = {};
      for (const key in modeloUpdateData) {
        if (Object.prototype.hasOwnProperty.call(modeloUpdateData, key)) {
          setUpdate[`modelos.$.${key}`] = (modeloUpdateData as any)[key];
        }
      }
      
      if (Object.keys(setUpdate).length === 0) return true;

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
