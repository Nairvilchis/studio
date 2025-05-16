
'use server';
/**
 * @fileOverview Manages service order (Order) operations with MongoDB.
 */

import type { Collection, ObjectId, InsertOneResult, Filter } from 'mongodb';
import { connectDB } from './db';
import type { UserRole } from './userManager'; // Assuming UserRole might be relevant for assigned personnel

// Helper Interfaces (Placeholders for now, to be expanded or moved later)

interface LogEntry {
  timestamp: Date;
  userId?: number; // FK to User.idEmpleado - made optional as initial creation might not have user context
  action: string; 
  details?: string;
}

interface Ajustador {
  idAjustador: number; // Assuming numeric ID based on user example (e.g., ajustador:1 in Order)
  nombre: string;
  telefono?: string;
  correo?: string;
}

interface Aseguradora {
  _id?: ObjectId;
  idAseguradora: number; // Custom numeric ID
  nombre: string;
  telefono?: string;
  ajustadores?: Ajustador[];
}

interface Cliente {
  _id?: ObjectId;
  idCliente: number; // Custom numeric ID
  nombre: string;
  telefono?: string;
  correo?: string;
  // ordenes?: { idOrder: number }[]; // Array of order IDs associated with the client
}

interface ModeloVehiculo {
  idModelo: number; // Custom numeric ID
  modelo: string;
}

interface MarcaVehiculo {
  _id?: ObjectId;
  idMarca: number; // Custom numeric ID
  marca: string;
  modelos?: ModeloVehiculo[];
}

interface ConceptoPresupuesto {
  concepto: string; // Corrected typo from consepto
  cantidad: number;
  precio: number;
  pintura?: boolean;
  procedimiento?: string; // Corrected typo from precedimiento (e.g., "reparacion", "cambio")
  idRefaccion?: string; // Assuming custom string ID or ObjectId string for Refaccion
}

interface Presupuesto {
  _id?: ObjectId;
  idPresupuesto: number; // Custom numeric ID
  conceptos?: ConceptoPresupuesto[];
  // idOrder?: number; // Link back to Order.idOrder might be useful
}

// Interface for Order (previously ServiceOrder)
export interface Order {
  _id?: ObjectId; // MongoDB's unique ID
  idOrder: number; // Custom sequential ID (managed by getNextSequenceValue('orderIdSequence'))
  
  // Vehicle and Client Information
  idCliente?: number; // FK to Cliente.idCliente
  vin?: string;
  idMarca?: number; // FK to MarcaVehiculo.idMarca
  idModelo?: number; // FK to ModeloVehiculo.idModelo (within the brand)
  año?: number;
  placas?: string;
  color?: string;
  kilometraje?: string;

  // Insurance and Claim Information
  idAseguradora?: number; // FK to Aseguradora.idAseguradora
  ajustador?: number; // FK to Aseguradora.ajustadores.idAjustador
  siniestro?: string;
  poliza?: string;
  folio?: string; // Folio from insurer or internal
  deducible?: number;
  aseguradoTercero?: 'asegurado' | 'tercero';

  // Workshop Specifics
  piso?: boolean; // si la unidad es de piso o no
  grua?: boolean; // si la llego en grua o no
  
  // Dates
  fechaRegistro: Date;
  fechaValuacion?: Date;
  fechaRengreso?: Date; // Reingreso
  fechaEntrega?: Date; // Actual delivery date
  fechaPromesa?: Date; // Promised delivery date

  // Assigned Personnel (FKs to User.idEmpleado)
  idValuador?: number; 
  idAsesor?: number; 
  idHojalatero?: number;
  idPintor?: number;
  // Potentially: idMecanico, idArmador, idLavador, idControlCalidad

  // Related Entities
  idPresupuesto?: number; // FK to Presupuesto.idPresupuesto

  // Operational Data
  proceso: 'pendiente' | 'valuacion' | 'espera_refacciones' | 'refacciones_listas' | 'hojalateria' | 'preparacion_pintura' | 'pintura' | 'mecanica' | 'armado' | 'detallado_lavado' | 'control_calidad' | 'listo_entrega' | 'entregado' | 'facturado' | 'garantia' | 'cancelado';
  urlArchivos?: string; // URL to stored files (consider array if multiple)
  log?: LogEntry[];
}

// Type for creating a new Order, omitting MongoDB _id and sequenced idOrder, and log.
// fechaRegistro will be set automatically. Proceso will have a default.
export type NewOrderData = Omit<Order, '_id' | 'idOrder' | 'fechaRegistro' | 'log' | 'proceso'>;
// Type for updating an existing Order. Most fields are partial.
// _id, idOrder, and fechaRegistro should not be updated directly via this type.
export type UpdateOrderData = Partial<Omit<Order, '_id' | 'idOrder' | 'fechaRegistro'>>;


class OrderManager {
  private collectionPromise: Promise<Collection<Order>>;

  constructor() {
    this.collectionPromise = connectDB().then(db => {
      const ordersCollection = db.collection<Order>('orders'); // Collection name changed to 'orders'
      // Ensure a counter collection for idOrder sequence
      const countersCollection = db.collection<{ _id: string; sequence_value: number }>('counters');
      countersCollection.updateOne(
        { _id: 'orderIdSequence' }, // Counter name for the human-readable order ID
        { $setOnInsert: { sequence_value: 1000 } }, // Start from 1000 as per user example
        { upsert: true }
      );
      // Consider adding indexes for frequently queried fields like idOrder, placas, idCliente, proceso
      // ordersCollection.createIndex({ idOrder: 1 }, { unique: true });
      // ordersCollection.createIndex({ placas: 1 });
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
      await countersCollection.updateOne( { _id: sequenceName }, { $setOnInsert: { sequence_value: 1000 } }, { upsert: true }); // Re-initialize if lost
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
      proceso: 'pendiente', // Default process status
      fechaRegistro: new Date(),
      log: [{
        timestamp: new Date(),
        userId: userId,
        action: 'Orden Creada',
        details: `ID Orden: ${nextIdOrder}`
      }],
    };

    try {
      const result: InsertOneResult<Order> = await collection.insertOne(newOrderDocument as Order);
      console.log('Orden creada con ID de MongoDB:', result.insertedId, 'y idOrder:', nextIdOrder);
      return result.insertedId;
    } catch (error) {
      console.error('Error al crear orden:', error);
      return null;
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

  async getOrderById(id: string): Promise<Order | null> { // by MongoDB _id
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
  
  async getOrderByCustomId(idOrder: number): Promise<Order | null> { // by custom idOrder
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
        console.error('Invalid ObjectId format for updateOrderProceso:', id);
        return false;
      }
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { proceso: proceso },
          $push: { log: { timestamp: new Date(), userId, action: `Proceso cambiado a: ${proceso}` } as LogEntry }
        }
      );
      console.log('Proceso de orden actualizado:', result.modifiedCount);
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
        console.error('Invalid ObjectId format for updateOrder:', id);
        return false;
      }
      
      if (Object.keys(updateData).length === 0) {
        console.log('No fields to update for order ID:', id);
        return false;
      }

      // Construct log entry for changes
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

  async deleteOrder(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format for deleteOrder:', id);
        return false;
      }
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      // Consider soft delete (e.g., setting a flag) instead of hard delete
      // or archiving the order document.
      console.log('Orden eliminada:', result.deletedCount);
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar orden:', error);
      throw error;
    }
  }
}

export default OrderManager;
