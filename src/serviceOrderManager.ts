
'use server';
/**
 * @fileOverview Manages service order operations with MongoDB.
 */

import type { Collection, ObjectId, InsertOneResult, Filter } from 'mongodb';
import { connectDB } from './db';

export interface ServiceOrder {
  _id?: ObjectId;
  orderIdSequence?: number; // For human-readable IDs like SO-001
  clientName: string;
  vehicleModel: string; 
  vehicleLicensePlate: string;
  issueDescription: string;
  status: 'Pendiente' | 'En Progreso' | 'Completado' | 'Cancelado';
  creationDate: Date;
  estimatedCompletionDate?: Date;
  assignedMechanic?: string;
  notes?: string;
  // Add any other relevant fields
}

class ServiceOrderManager {
  private collectionPromise: Promise<Collection<ServiceOrder>>;

  constructor() {
    this.collectionPromise = connectDB().then(db => {
      // Ensure a unique, auto-incrementing sequence for orderIdSequence
      const serviceOrdersCollection = db.collection<ServiceOrder>('serviceOrders');
      // Create a counter collection if it doesn't exist
      const countersCollection = db.collection<{ _id: string; sequence_value: number }>('counters');
      countersCollection.updateOne(
        { _id: 'serviceOrderId' },
        { $setOnInsert: { sequence_value: 0 } },
        { upsert: true }
      );
      return serviceOrdersCollection;
    }).catch(err => {
      console.error('Error al obtener la colección de órdenes de servicio:', err);
      throw err; 
    });
  }

  private async getCollection(): Promise<Collection<ServiceOrder>> {
    return this.collectionPromise;
  }
  
  private async getNextSequenceValue(sequenceName: string): Promise<number> {
    const db = await connectDB();
    const countersCollection = db.collection<{ _id: string; sequence_value: number }>('counters');
    const sequenceDocument = await countersCollection.findOneAndUpdate(
      { _id: sequenceName },
      { $inc: { sequence_value: 1 } },
      { returnDocument: 'after', upsert: true } // Add upsert: true here
    );
    if (!sequenceDocument || sequenceDocument.sequence_value === null || sequenceDocument.sequence_value === undefined) {
      // This case should ideally be handled by the initial setup in constructor or if the counter was manually deleted.
      // For robustness, ensure counter exists or re-initialize.
      await countersCollection.updateOne( { _id: sequenceName }, { $setOnInsert: { sequence_value: 0 } }, { upsert: true });
      const newSequenceDoc = await countersCollection.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { sequence_value: 1 } },
        { returnDocument: 'after' }
      );
      if (!newSequenceDoc || newSequenceDoc.sequence_value === null || newSequenceDoc.sequence_value === undefined) {
        throw new Error(`Could not find or create sequence for ${sequenceName}`);
      }
      return newSequenceDoc.sequence_value;
    }
    return sequenceDocument.sequence_value;
  }


  // CREATE: Método para crear una nueva orden de servicio
  async createServiceOrder(orderData: Omit<ServiceOrder, '_id' | 'creationDate' | 'orderIdSequence' | 'status'>): Promise<ObjectId | null> {
    const collection = await this.getCollection();
    const nextOrderIdSequence = await this.getNextSequenceValue('serviceOrderId');
    
    const newOrder: Omit<ServiceOrder, '_id'> = {
      ...orderData,
      orderIdSequence: nextOrderIdSequence,
      status: 'Pendiente', // Default status
      creationDate: new Date(),
    };

    try {
      const result: InsertOneResult<ServiceOrder> = await collection.insertOne(newOrder as ServiceOrder);
      console.log('Orden de servicio creada con ID:', result.insertedId);
      return result.insertedId;
    } catch (error) {
      console.error('Error al crear orden de servicio:', error);
      // Consider more specific error handling or re-throwing
      return null;
    }
  }

  // READ: Método para obtener todas las órdenes de servicio
  async getAllServiceOrders(filter?: Filter<ServiceOrder>): Promise<ServiceOrder[]> {
    const collection = await this.getCollection();
    try {
      const orders = await collection.find(filter || {}).sort({ creationDate: -1 }).toArray();
      return orders;
    } catch (error) {
      console.error('Error al obtener órdenes de servicio:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  // READ: Método para obtener una orden de servicio por su ID de MongoDB
  async getServiceOrderById(id: string): Promise<ServiceOrder | null> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format for getServiceOrderById:', id);
        return null;
      }
      const order = await collection.findOne({ _id: new ObjectId(id) });
      return order;
    } catch (error) {
      console.error('Error al obtener orden de servicio por ID:', error);
      throw error;
    }
  }
  
  // READ: Método para obtener una orden de servicio por su orderIdSequence
  async getServiceOrderBySequenceId(sequenceId: number): Promise<ServiceOrder | null> {
    const collection = await this.getCollection();
    try {
      const order = await collection.findOne({ orderIdSequence: sequenceId });
      return order;
    } catch (error) {
      console.error('Error al obtener orden de servicio por ID de secuencia:', error);
      throw error;
    }
  }


  // UPDATE: Método para actualizar el estado de una orden de servicio
  async updateServiceOrderStatus(id: string, status: ServiceOrder['status']): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format for updateServiceOrderStatus:', id);
        return false;
      }
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: status } }
      );
      console.log('Estado de orden de servicio actualizado:', result.modifiedCount);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al actualizar estado de orden de servicio:', error);
      throw error;
    }
  }

  // UPDATE: Método para añadir una nota a una orden de servicio
  async addNoteToServiceOrder(id: string, note: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format for addNoteToServiceOrder:', id);
        return false;
      }
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { notes: note } } // This will overwrite existing notes. Consider $push if notes should be an array.
      );
      console.log('Nota añadida a orden de servicio:', result.modifiedCount);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al añadir nota a orden de servicio:', error);
      throw error;
    }
  }
  
  // UPDATE: Método para actualizar una orden de servicio completa
  async updateServiceOrder(id: string, updateData: Partial<Omit<ServiceOrder, '_id' | 'orderIdSequence' | 'creationDate'>>): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format for updateServiceOrder:', id);
        return false;
      }
      // Destructure to prevent updating immutable fields if they are accidentally passed
      const { _id, orderIdSequence, creationDate, ...dataToUpdate } = updateData as ServiceOrder;

      if (Object.keys(dataToUpdate).length === 0) {
        console.log('No fields to update for service order ID:', id);
        return false; // Or true, if no change means success
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: dataToUpdate }
      );
      console.log('Orden de servicio actualizada:', result.modifiedCount);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al actualizar orden de servicio:', error);
      throw error;
    }
  }


  // DELETE: Método para eliminar una orden de servicio por su ID
  async deleteServiceOrder(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format for deleteServiceOrder:', id);
        return false;
      }
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      console.log('Orden de servicio eliminada:', result.deletedCount);
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar orden de servicio:', error);
      throw error;
    }
  }
}

export default ServiceOrderManager;

    