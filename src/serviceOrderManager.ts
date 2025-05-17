
'use server';
/**
 * @fileOverview Manages service order (Order) operations with MongoDB.
 */

import type { Collection, ObjectId, InsertOneResult, Filter } from 'mongodb';
import { connectDB } from './db';
// UserRole is now directly in userManager.ts, assuming it's exported from there if needed by Order.
// For now, assigned personnel are just numbers.

// LogEntry is specific to Order
interface LogEntry {
  timestamp: Date;
  userId?: number;
  action: string;
  details?: string;
}

// The following interfaces (Ajustador, Aseguradora, Cliente, ModeloVehiculo, MarcaVehiculo,
// ConceptoPresupuesto, Presupuesto) are placeholders here if not managed by their own dedicated managers.
// For this iteration, MarcaVehiculo and ModeloVehiculo will be moved to marcaManager.ts.
// Others remain as placeholders if Order directly references their structure or IDs.

export interface Order {
  _id?: ObjectId;
  idOrder: number;

  idCliente?: number;
  vin?: string;
  idMarca?: number; // Refers to MarcaVehiculo.idMarca
  idModelo?: number; // Refers to ModeloVehiculo.idModelo
  año?: number;
  placas?: string;
  color?: string;
  kilometraje?: string;

  idAseguradora?: number; // Refers to an Aseguradora entity's custom ID
  ajustador?: number; // Refers to an Ajustador's custom ID (within an Aseguradora)
  siniestro?: string;
  poliza?: string;
  folio?: string;
  deducible?: number;
  aseguradoTercero?: 'asegurado' | 'tercero';

  piso?: boolean;
  grua?: boolean;

  fechaRegistro: Date;
  fechaValuacion?: Date;
  fechaRengreso?: Date;
  fechaEntrega?: Date;
  fechaPromesa?: Date;

  idValuador?: number;
  idAsesor?: number;
  idHojalatero?: number;
  idPintor?: number;

  idPresupuesto?: number; // Refers to a Presupuesto entity's custom ID

  proceso: 'pendiente' | 'valuacion' | 'espera_refacciones' | 'refacciones_listas' | 'hojalateria' | 'preparacion_pintura' | 'pintura' | 'mecanica' | 'armado' | 'detallado_lavado' | 'control_calidad' | 'listo_entrega' | 'entregado' | 'facturado' | 'garantia' | 'cancelado';
  urlArchivos?: string;
  log?: LogEntry[];
}

export type NewOrderData = Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'log' | 'proceso'> & { proceso?: Order['proceso'] };
export type UpdateOrderData = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro'>>;


class OrderManager {
  private collectionPromise: Promise<Collection<Order>>;

  constructor() {
    this.collectionPromise = connectDB().then(db => {
      const ordersCollection = db.collection<Order>('orders');
      const countersCollection = db.collection<{ _id: string; sequence_value: number }>('counters');
      countersCollection.updateOne(
        { _id: 'orderIdSequence' },
        { $setOnInsert: { sequence_value: 1000 } },
        { upsert: true }
      );
      ordersCollection.createIndex({ idOrder: 1 }, { unique: true });
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
      await countersCollection.updateOne( { _id: sequenceName }, { $setOnInsert: { sequence_value: sequenceName === 'orderIdSequence' ? 1000 : 0 } }, { upsert: true });
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
      proceso: orderData.proceso || 'pendiente', // Use provided or default
      fechaRegistro: new Date(),
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

  async getOrderById(id: string): Promise<Order | null> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format for getOrderById:', id);
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
      if (!ObjectId.isValid(id)) return false;
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: { proceso: proceso },
          $push: { log: { timestamp: new Date(), userId, action: `Proceso cambiado a: ${proceso}` } as unknown as LogEntry }
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
      if (!ObjectId.isValid(id)) return false;
      if (Object.keys(updateData).length === 0) return true;

      const changes = Object.keys(updateData).map(key => `${key}: ${JSON.stringify(updateData[key as keyof UpdateOrderData])}`).join(', ');
      const logEntry: LogEntry = {
        timestamp: new Date(),
        userId,
        action: 'Orden Actualizada',
        details: `Campos actualizados: ${changes}`
      };

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: updateData,
          $push: { log: logEntry as unknown as LogEntry }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al actualizar orden:', error);
      throw error;
    }
  }

  async deleteOrder(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) return false;
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar orden:', error);
      throw error;
    }
  }
}

export default OrderManager;
