
'use server';
/**
 * @fileOverview Manages service order (Order) operations with MongoDB.
 */

import type { Collection, ObjectId, InsertOneResult, Filter } from 'mongodb';
import { connectDB } from './db';
import type { Order, NewOrderData, UpdateOrderData, LogEntry } from '@/lib/types'; // Import from new types file


class OrderManager {
  private collectionPromise: Promise<Collection<Order>>;

  constructor() {
    this.collectionPromise = connectDB().then(db => {
      const ordersCollection = db.collection<Order>('orders');
      const countersCollection = db.collection<{ _id: string; sequence_value: number }>('counters');
      countersCollection.updateOne(
        { _id: 'orderIdSequence' },
        { $setOnInsert: { sequence_value: 1000 } }, // Start custom ID from 1000
        { upsert: true }
      ).catch(console.warn);
      ordersCollection.createIndex({ idOrder: 1 }, { unique: true }).catch(console.warn);
      return ordersCollection;
    }).catch(err => {
      console.error('Error al obtener la colección de órdenes:', err);
      throw err;
    });
  }

  private async getCollection(): Promise<Collection<Order>> {
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
      // Ensure the sequence starts at the desired value if it's somehow lost/reset
      const initialValue = sequenceName === 'orderIdSequence' ? 1000 : 0;
      await countersCollection.updateOne({ _id: sequenceName }, { $setOnInsert: { sequence_value: initialValue } }, { upsert: true });
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

  async createOrder(orderData: NewOrderData, userId?: number): Promise<ObjectId | null> {
    const collection = await this.getCollection();
    const nextIdOrder = await this.getNextSequenceValue('orderIdSequence');

    const newOrderDocument: Omit<Order, '_id'> = {
      ...orderData,
      idOrder: nextIdOrder,
      proceso: orderData.proceso || 'pendiente', // Default to 'pendiente' if not provided
      fechaRegistro: new Date(), // Current date as registration date
      log: [{
        timestamp: new Date(),
        userId: userId,
        action: 'Orden Creada',
        details: `ID Orden: OT-${String(nextIdOrder).padStart(4, '0')}`
      }],
    };

    try {
      const result: InsertOneResult<Order> = await collection.insertOne(newOrderDocument as Order);
      console.log('Orden creada con ID de MongoDB:', result.insertedId, 'y idOrder:', nextIdOrder);
      return result.insertedId;
    } catch (error) {
      console.error('Error al crear orden:', error);
      throw error;
    }
  }

  async getAllOrders(filter?: Filter<Order>): Promise<Order[]> {
    const collection = await this.getCollection();
    try {
      const orders = await collection.find(filter || {}).sort({ fechaRegistro: -1 }).toArray();
      return orders;
    } catch (error) {
      console.error('Error al obtener órdenes:', error);
      throw error;
    }
  }

  async getOrderById(id: string): Promise<Order | null> { // Gets by MongoDB _id
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Invalid ObjectId format for getOrderById:', id);
        return null;
      }
      const order = await collection.findOne({ _id: new ObjectId(id) });
      return order;
    } catch (error) {
      console.error('Error al obtener orden por ID de MongoDB:', error);
      throw error;
    }
  }

  async getOrderByCustomId(idOrder: number): Promise<Order | null> {
    const collection = await this.getCollection();
    try {
      const order = await collection.findOne({ idOrder: idOrder });
      return order;
    } catch (error) {
      console.error('Error al obtener orden por idOrder personalizado:', error);
      throw error;
    }
  }

  async updateOrderProceso(id: string, proceso: Order['proceso'], userId?: number): Promise<boolean> {
    const collection = await this.getCollection();
    try {
        if (!ObjectId.isValid(id)) {
          console.warn('Invalid ObjectId for updateOrderProceso:', id);
          return false;
        }
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: { proceso: proceso },
                $push: { log: { timestamp: new Date(), userId, action: `Proceso cambiado a: ${proceso}` } as LogEntry }
            }
        );
        return result.modifiedCount > 0;
    } catch (error) {
        console.error('Error al actualizar proceso de orden:', error);
        throw error;
    }
}


  async updateOrder(id: string, updateData: UpdateOrderData, userId?: number): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Invalid ObjectId format for updateOrder:', id);
        return false;
      }
      if (Object.keys(updateData).length === 0) {
        return true; // No changes needed
      }
      
      // Construct a more detailed log message
      let logDetails = "Campos actualizados: ";
      const changedFields: string[] = [];
      for (const key in updateData) {
        if (Object.prototype.hasOwnProperty.call(updateData, key)) {
          changedFields.push(`${key}`);
        }
      }
      logDetails += changedFields.join(', ');


      const logEntry: LogEntry = {
        timestamp: new Date(),
        userId,
        action: 'Orden Actualizada',
        details: logDetails
      };

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: updateData,
          $push: { log: logEntry }
        }
      );
      console.log('Orden actualizada:', result.modifiedCount);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al actualizar orden:', error);
      throw error;
    }
  }

  async deleteOrder(id: string): Promise<boolean> { // Deletes by MongoDB _id
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Invalid ObjectId format for deleteOrder:', id);
        return false;
      }
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      console.log('Orden eliminada:', result.deletedCount);
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar orden:', error);
      throw error;
    }
  }
}

export default OrderManager;
