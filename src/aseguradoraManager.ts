
'use server';
/**
 * @fileOverview Manages insurance company (Aseguradora) operations with MongoDB.
 */

import type { Collection, ObjectId, InsertOneResult, UpdateResult, DeleteResult, Filter } from 'mongodb';
import { connectDB } from './db';

// Interface for an adjuster, typically a sub-document of Aseguradora
export interface Ajustador {
  idAjustador: number; // Custom numeric ID for the adjuster (unique within the Aseguradora)
  nombre: string;
  telefono?: string;
  correo?: string;
}

// Interface for an insurance company
export interface Aseguradora {
  _id?: ObjectId;       // MongoDB's unique ID
  idAseguradora: number; // Custom sequential numeric ID for the insurance company
  nombre: string;
  telefono?: string;
  ajustadores?: Ajustador[]; // Array of adjusters associated with this company
}

export type NewAseguradoraData = Omit<Aseguradora, '_id' | 'idAseguradora'>;
export type UpdateAseguradoraData = Partial<Omit<Aseguradora, '_id' | 'idAseguradora'>>;

class AseguradoraManager {
  private collectionPromise: Promise<Collection<Aseguradora>>;

  constructor() {
    this.collectionPromise = connectDB().then(db => {
      const aseguradorasCollection = db.collection<Aseguradora>('aseguradoras');
      const countersCollection = db.collection<{ _id: string; sequence_value: number }>('counters');
      countersCollection.updateOne(
        { _id: 'aseguradoraIdSequence' },
        { $setOnInsert: { sequence_value: 1 } }, // Start from 1
        { upsert: true }
      );
      aseguradorasCollection.createIndex({ nombre: 1 }, { unique: true }); // Ensure company names are unique
      return aseguradorasCollection;
    }).catch(err => {
      console.error('Error al obtener la colección de aseguradoras:', err);
      throw err;
    });
  }

  private async getCollection(): Promise<Collection<Aseguradora>> {
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

  private async getNextAjustadorId(aseguradoraId: ObjectId): Promise<number> {
    const collection = await this.getCollection();
    const aseguradora = await collection.findOne({ _id: aseguradoraId }, { projection: { ajustadores: 1 } });
    if (!aseguradora || !aseguradora.ajustadores || aseguradora.ajustadores.length === 0) {
      return 1;
    }
    const maxId = aseguradora.ajustadores.reduce((max, p) => p.idAjustador > max ? p.idAjustador : max, 0);
    return maxId + 1;
  }

  async createAseguradora(data: NewAseguradoraData): Promise<ObjectId | null> {
    const collection = await this.getCollection();
    const nextIdAseguradora = await this.getNextSequenceValue('aseguradoraIdSequence');

    const newDocument: Omit<Aseguradora, '_id'> = {
      ...data,
      idAseguradora: nextIdAseguradora,
      ajustadores: data.ajustadores || [],
    };

    try {
      const result: InsertOneResult<Aseguradora> = await collection.insertOne(newDocument as Aseguradora);
      return result.insertedId;
    } catch (error) {
      console.error('Error al crear aseguradora:', error);
      if ((error as any).code === 11000) {
        throw new Error(`La aseguradora "${newDocument.nombre}" ya existe.`);
      }
      throw error;
    }
  }

  async getAllAseguradoras(filter?: Filter<Aseguradora>): Promise<Aseguradora[]> {
    const collection = await this.getCollection();
    try {
      const aseguradoras = await collection.find(filter || {}).sort({ nombre: 1 }).toArray();
      return aseguradoras;
    } catch (error) {
      console.error('Error al obtener aseguradoras:', error);
      throw error;
    }
  }

  async getAseguradoraById(id: string): Promise<Aseguradora | null> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) return null;
      return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error('Error al obtener aseguradora por ID:', error);
      throw error;
    }
  }

  async updateAseguradora(id: string, updateData: UpdateAseguradoraData): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) return false;
      if (Object.keys(updateData).length === 0) return true;
      const { idAseguradora, ...dataToUpdate } = updateData as any;

      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: dataToUpdate }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al actualizar aseguradora:', error);
      if ((error as any).code === 11000 && updateData.nombre) {
        throw new Error(`El nombre de aseguradora "${updateData.nombre}" ya está en uso.`);
      }
      throw error;
    }
  }

  async deleteAseguradora(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) return false;
      const result: DeleteResult = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar aseguradora:', error);
      throw error;
    }
  }

  // --- Ajustador Management ---
  async addAjustadorToAseguradora(aseguradoraId: string, ajustadorData: Omit<Ajustador, 'idAjustador'>): Promise<Ajustador | null> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(aseguradoraId)) return null;
      const mongoAseguradoraId = new ObjectId(aseguradoraId);
      const nextIdAjustador = await this.getNextAjustadorId(mongoAseguradoraId);
      
      const newAjustador: Ajustador = {
        ...ajustadorData,
        idAjustador: nextIdAjustador
      };

      const aseguradora = await collection.findOne({ _id: mongoAseguradoraId });
      if (aseguradora && aseguradora.ajustadores?.some(a => a.nombre.toLowerCase() === newAjustador.nombre.toLowerCase())) {
        throw new Error(`El ajustador con nombre "${newAjustador.nombre}" ya existe en esta aseguradora.`);
      }

      const result: UpdateResult = await collection.updateOne(
        { _id: mongoAseguradoraId },
        { $push: { ajustadores: newAjustador } }
      );
      return result.modifiedCount > 0 ? newAjustador : null;
    } catch (error) {
      console.error('Error al añadir ajustador:', error);
      throw error;
    }
  }

  async updateAjustadorInAseguradora(aseguradoraId: string, idAjustador: number, ajustadorUpdateData: Partial<Omit<Ajustador, 'idAjustador'>>): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(aseguradoraId)) return false;
      if (Object.keys(ajustadorUpdateData).length === 0) return true;

      const setUpdate: Record<string, any> = {};
      for (const key in ajustadorUpdateData) {
        if (Object.prototype.hasOwnProperty.call(ajustadorUpdateData, key)) {
          setUpdate[`ajustadores.$.${key}`] = (ajustadorUpdateData as any)[key];
        }
      }

      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(aseguradoraId), "ajustadores.idAjustador": idAjustador },
        { $set: setUpdate }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al actualizar ajustador:', error);
      throw error;
    }
  }

  async removeAjustadorFromAseguradora(aseguradoraId: string, idAjustador: number): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(aseguradoraId)) return false;
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

    