
'use server';
/**
 * @fileOverview Manages service order (Order) operations with MongoDB.
 * Orders have a main MongoDB ObjectId `_id` and a custom sequential numeric `idOrder`.
 * References to other entities (Aseguradora, Ajustador, Cliente, Marca, Modelo, Empleado)
 * are stored as ObjectId strings.
 * @remarks
 * Esta clase utiliza la directiva 'use server' para indicar que solo debe ejecutarse en el servidor.
 */

import { ObjectId, type Collection, type InsertOneResult, type Filter, type UpdateResult, type DeleteResult, type FindOneAndUpdateOptions } from './db';
import { connectDB } from './db';
import type { Order, NewOrderData, UpdateOrderData, LogEntry } from '@/lib/types'; 

/**
 * Gestiona operaciones CRUD y lógica de negocio para órdenes de servicio.
 */
class OrderManager {
  private collectionPromise: Promise<Collection<Order>>;
  private countersCollectionPromise: Promise<Collection<{ _id: string; sequence_value: number }>>;

  /**
   * Constructor de OrderManager.
   * Inicializa las promesas de conexión a las colecciones 'orders' y 'counters'.
   * Crea índices en 'idOrder' (único) y 'fechaRegistro'.
   * Inicializa el contador 'orderIdSequence' si no existe.
   */
  constructor() {
    this.collectionPromise = connectDB().then(db => {
      const ordersCollection = db.collection<Order>('orders');
      ordersCollection.createIndex({ idOrder: 1 }, { unique: true }).catch(err => {
        if (err.code !== 11000) console.warn('Failed to create index on orders.idOrder:', err);
      });
      ordersCollection.createIndex({ fechaRegistro: -1 }).catch(err => {
         if (err.code !== 11000) console.warn('Failed to create index on orders.fechaRegistro:', err);
      });
      return ordersCollection;
    }).catch(err => {
      console.error('Error al obtener la colección de órdenes:', err);
      throw err;
    });

    this.countersCollectionPromise = connectDB().then(db => {
      const countersCollection = db.collection<{ _id: string; sequence_value: number }>('counters');
      // Asegura que el contador 'orderIdSequence' exista, inicializándolo en 1000 si es nuevo.
      countersCollection.updateOne(
        { _id: 'orderIdSequence' },
        { $setOnInsert: { sequence_value: 1000 } }, 
        { upsert: true }
      ).catch(err => {
         // No es crítico si el índice ya existe (código 11000)
         if (err.code !== 11000) console.warn('Failed to initialize orderIdSequence counter:', err);
      });
      return countersCollection;
    });
  }

  /**
   * Obtiene la colección MongoDB para órdenes.
   * @returns {Promise<Collection<Order>>} La colección de órdenes.
   * @private
   */
  private async getCollection(): Promise<Collection<Order>> {
    return this.collectionPromise;
  }

  /**
   * Obtiene la colección MongoDB para contadores (usada para secuencias).
   * @returns {Promise<Collection<{ _id: string; sequence_value: number }>>} La colección de contadores.
   * @private
   */
  private async getCountersCollection(): Promise<Collection<{ _id: string; sequence_value: number }>> {
    return this.countersCollectionPromise;
  }

  /**
   * Obtiene el siguiente valor para una secuencia nombrada (ej. 'orderIdSequence').
   * @param {string} sequenceName - El nombre de la secuencia.
   * @returns {Promise<number>} El siguiente valor de la secuencia.
   * @throws {Error} Si la secuencia no puede ser encontrada o incrementada.
   * @private
   */
  private async getNextSequenceValue(sequenceName: string): Promise<number> {
    const countersCollection = await this.getCountersCollection();
    const sequenceDocument = await countersCollection.findOneAndUpdate(
      { _id: sequenceName },
      { $inc: { sequence_value: 1 } },
      { returnDocument: 'after', upsert: true } as FindOneAndUpdateOptions // Asegurar que upsert esté en options
    );
    // Verificar que sequenceDocument y sequence_value no sean null o undefined
    if (!sequenceDocument || sequenceDocument.sequence_value === null || sequenceDocument.sequence_value === undefined) {
      // Si es la primera vez y upsert creó el documento, sequence_value podría ser el inicial (ej. 1000) + 1.
      // Si findOneAndUpdate devuelve el documento ANTES de la modificación (con returnOriginal: true por defecto),
      // entonces sequence_value será el valor antiguo. Con returnDocument: 'after', debe ser el nuevo.
      // Si aún así es null/undefined, hay un problema.
      const fallbackDoc = await countersCollection.findOne({ _id: sequenceName });
      if (fallbackDoc && fallbackDoc.sequence_value !== null && fallbackDoc.sequence_value !== undefined) {
        return fallbackDoc.sequence_value;
      }
      throw new Error(`Could not find or reliably increment sequence for ${sequenceName}. Last value: ${fallbackDoc?.sequence_value}`);
    }
    return sequenceDocument.sequence_value;
  }

  /**
   * Crea una nueva orden de servicio.
   * Genera un `idOrder` personalizado y una entrada inicial en el log.
   * `_id` es generado automáticamente por MongoDB.
   * @param {NewOrderData} orderData - Datos para la nueva orden, excluyendo `_id`, `idOrder`, `fechaRegistro`, `Log`.
   * @param {string} [empleadoLogId] - El `_id` (string ObjectId) del empleado que realiza la acción, para el log.
   * @returns {Promise<string | null>} El `_id` (string hexadecimal del ObjectId) de la orden recién creada, o null en caso de fallo.
   * @throws {Error} Si hay un error de base de datos o un problema de validación de datos.
   */
  async createOrder(orderData: NewOrderData, empleadoLogId?: string): Promise<string | null> {
    const collection = await this.getCollection();
    const nextIdOrder = await this.getNextSequenceValue('orderIdSequence');

    const newOrderDocument: Omit<Order, '_id'> = {
      ...orderData,
      idOrder: nextIdOrder,
      proceso: orderData.proceso || 'pendiente', // Valor por defecto si no se proporciona
      fechaRegistro: new Date(), 
      Log: [{
        timestamp: new Date(),
        userId: empleadoLogId, // _id (string) del empleado
        action: `Orden OT-${nextIdOrder} Creada`,
      }],
      presupuestos: orderData.presupuestos || [], // Inicializar presupuestos como array vacío si no se proporciona
    };

    try {
      // Validar ObjectIds referenciados si existen en orderData
      const fieldsToValidate: (keyof Order)[] = ['idAseguradora', 'idAjustador', 'idMarca', 'idModelo', 'idCliente', 'idValuador', 'idAsesor', 'idHojalatero', 'idPintor'];
      for (const field of fieldsToValidate) {
        const value = newOrderDocument[field] as string | undefined;
        if (value !== undefined && value !== null && !ObjectId.isValid(value)) { // Asegurar que no sea null antes de validar
          throw new Error(`Invalid ObjectId string for field ${field}: ${value}`);
        }
      }
      if (newOrderDocument.presupuestos) {
        for (const item of newOrderDocument.presupuestos) {
          if (item.idRefaccion !== undefined && item.idRefaccion !== null && !ObjectId.isValid(item.idRefaccion)) {
            throw new Error(`Invalid ObjectId string for presupuesto item idRefaccion: ${item.idRefaccion}`);
          }
        }
      }

      const result: InsertOneResult<Order> = await collection.insertOne(newOrderDocument as Order);
      console.log('Orden creada con _id de MongoDB:', result.insertedId.toHexString(), 'y idOrder:', nextIdOrder);
      return result.insertedId.toHexString(); // Devolver _id como string
    } catch (error) {
      console.error('Error al crear orden:', error);
      throw error; 
    }
  }

  /**
   * Obtiene todas las órdenes de servicio, opcionalmente filtradas, ordenadas por fecha de registro descendente.
   * Convierte `_id` a string.
   * @param {Filter<Order>} [filter] - Filtro opcional de MongoDB.
   * @returns {Promise<Order[]>} Una lista de órdenes con `_id` como string.
   * @throws {Error} Si hay un error de base de datos.
   */
  async getAllOrders(filter?: Filter<Order>): Promise<Order[]> {
    const collection = await this.getCollection();
    try {
      const ordersFromDb = await collection.find(filter || {}).sort({ fechaRegistro: -1 }).toArray();
      return ordersFromDb.map(order => ({
        ...order,
        _id: order._id.toHexString(),
      }));
    } catch (error) {
      console.error('Error al obtener órdenes:', error);
      throw error;
    }
  }

  /**
   * Obtiene una única orden por su `_id` de MongoDB (como string).
   * Convierte `_id` a string.
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB de la orden.
   * @returns {Promise<Order | null>} El objeto orden con `_id` como string, o null si no se encuentra o el ID es inválido.
   * @throws {Error} Si hay un error de base de datos.
   */
  async getOrderById(id: string): Promise<Order | null> { 
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Invalid ObjectId format for getOrderById:', id);
        return null;
      }
      const order = await collection.findOne({ _id: new ObjectId(id) });
      if (order) {
        return {
          ...order,
          _id: order._id.toHexString(),
        };
      }
      return null;
    } catch (error) {
      console.error('Error al obtener orden por ID de MongoDB:', error);
      throw error;
    }
  }

  /**
   * Obtiene una única orden por su `idOrder` numérico personalizado.
   * Convierte `_id` a string si se encuentra.
   * @param {number} idOrder - El ID numérico personalizado de la orden.
   * @returns {Promise<Order | null>} El objeto orden con `_id` como string, o null si no se encuentra.
   * @throws {Error} Si hay un error de base de datos.
   */
  async getOrderByCustomId(idOrder: number): Promise<Order | null> {
    const collection = await this.getCollection();
    try {
      const order = await collection.findOne({ idOrder: idOrder });
      if (order) {
        return {
          ...order,
          _id: order._id.toHexString(),
        };
      }
      return null;
    } catch (error) {
      console.error('Error al obtener orden por idOrder personalizado:', error);
      throw error;
    }
  }

  /**
   * Actualiza el proceso de una orden específica y añade una entrada al log.
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB de la orden.
   * @param {Order['proceso']} proceso - El nuevo estado del proceso.
   * @param {string} [empleadoLogId] - El `_id` (string ObjectId) del empleado que realiza la acción.
   * @returns {Promise<boolean>} True si la actualización fue exitosa (modifiedCount > 0), false en caso contrario.
   * @throws {Error} Si hay un error de base de datos o si el ID es inválido.
   */
  async updateOrderProceso(id: string, proceso: Order['proceso'], empleadoLogId?: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
        if (!ObjectId.isValid(id)) {
          console.warn('Invalid ObjectId for updateOrderProceso:', id);
          return false;
        }
        const logEntry: LogEntry = { 
            timestamp: new Date(), 
            userId: empleadoLogId, // _id (string) del empleado
            action: `Proceso cambiado a: ${proceso}` 
        };
        const result: UpdateResult = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: { proceso: proceso },
                $push: { Log: logEntry as any } // MongoDB manejará la estructura del log
            }
        );
        return result.modifiedCount > 0;
    } catch (error) {
        console.error('Error al actualizar proceso de orden:', error);
        throw error;
    }
}

  /**
   * Actualiza una orden de servicio existente.
   * Añade una entrada al log detallando los cambios.
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB de la orden a actualizar.
   * @param {UpdateOrderData} updateData - Los datos a actualizar. `_id`, `idOrder`, `fechaRegistro`, `Log` no son actualizables aquí.
   * @param {string} [empleadoLogId] - El `_id` (string ObjectId) del empleado que realiza la acción.
   * @returns {Promise<boolean>} True si la actualización fue exitosa (modifiedCount > 0), false en caso contrario.
   * @throws {Error} Si hay un error de base de datos o si el ID es inválido.
   */
  async updateOrder(id: string, updateData: UpdateOrderData, empleadoLogId?: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Invalid ObjectId format for updateOrder:', id);
        return false;
      }
      if (Object.keys(updateData).length === 0) {
        console.log('No fields to update for order ID:', id);
        return true; // Considerar como éxito si no hay nada que actualizar.
      }
      
      const currentOrder = await collection.findOne({ _id: new ObjectId(id) });
      if (!currentOrder) {
        console.warn('Order not found for update:', id);
        return false;
      }
      
      // Construir mensaje de log detallado
      let logDetails = "Campos actualizados: ";
      const changedFieldsMessages: string[] = [];
      for (const key in updateData) {
        if (Object.prototype.hasOwnProperty.call(updateData, key) && key !== 'Log' && key !== 'presupuestos') { // No loguear cambios en Log o presupuestos de esta manera
          const oldValue = (currentOrder as any)[key];
          const newValue = (updateData as any)[key];
          // Comparar valores de forma significativa
          if (String(oldValue) !== String(newValue)) { // Convertir a string para comparación genérica, puede necesitar ajustes para fechas/objetos
            let oldValueStr = oldValue instanceof Date ? oldValue.toLocaleDateString('es-MX') : String(oldValue);
            let newValueStr = newValue instanceof Date ? newValue.toLocaleDateString('es-MX') : String(newValue);
            if (typeof oldValue === 'boolean' || typeof newValue === 'boolean') {
                oldValueStr = oldValue ? 'Sí' : 'No';
                newValueStr = newValue ? 'Sí' : 'No';
            }
            changedFieldsMessages.push(`${key}: de '${oldValueStr === undefined || oldValueStr === 'undefined' ? 'N/A' : oldValueStr}' a '${newValueStr}'`);
          }
        }
      }
      logDetails += changedFieldsMessages.join('; ') || "Ningún valor cambiado.";

      const logEntry: LogEntry = {
        timestamp: new Date(),
        userId: empleadoLogId, // _id (string) del empleado
        action: changedFieldsMessages.length > 0 ? logDetails : 'Actualización de orden sin cambios de valor detectados.',
      };
      
      // Validar ObjectIds en updateData
      const fieldsToValidate: (keyof UpdateOrderData)[] = ['idAseguradora', 'idAjustador', 'idMarca', 'idModelo', 'idCliente', 'idValuador', 'idAsesor', 'idHojalatero', 'idPintor'];
      for (const field of fieldsToValidate) {
        const value = updateData[field] as string | undefined;
        if (value !== undefined && value !== null && !ObjectId.isValid(value)) {
          throw new Error(`Invalid ObjectId string for field ${field} in updateData: ${value}`);
        }
      }
      const updatePayload: any = { ...updateData };
      // Si se actualizan presupuestos, asegurar que idRefaccion sea ObjectId válido si existe
      if (updateData.presupuestos) {
        updatePayload.presupuestos = updateData.presupuestos.map(item => ({
          ...item,
          idRefaccion: item.idRefaccion && ObjectId.isValid(item.idRefaccion) ? item.idRefaccion : undefined
        }));
      }

      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: updatePayload, 
          $push: { Log: logEntry as any } // MongoDB manejará la estructura del log
        }
      );
      console.log('Orden actualizada, modificados:', result.modifiedCount);
      // Considerar éxito si se modificó o si no había campos para cambiar pero el log se añadió (si $push cuenta como modificación)
      return result.modifiedCount > 0 || (changedFieldsMessages.length === 0 && result.matchedCount > 0); 
    } catch (error) {
      console.error('Error al actualizar orden:', error);
      throw error;
    }
  }

  /**
   * Elimina una orden por su `_id` de MongoDB (como string).
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB de la orden a eliminar.
   * @returns {Promise<boolean>} True si la orden fue eliminada (deletedCount > 0), false en caso contrario.
   * @throws {Error} Si hay un error de base de datos o si el ID es inválido.
   */
  async deleteOrder(id: string): Promise<boolean> { 
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Invalid ObjectId format for deleteOrder:', id);
        return false;
      }
      const result: DeleteResult = await collection.deleteOne({ _id: new ObjectId(id) });
      console.log('Orden eliminada, conteo:', result.deletedCount);
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar orden:', error);
      throw error;
    }
  }
}

export default OrderManager;
