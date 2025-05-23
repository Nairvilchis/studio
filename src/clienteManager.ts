
'use server';
/**
 * @fileOverview Manages client (Cliente) operations with MongoDB.
 * Client IDs (`_id`) son MongoDB ObjectIds.
 * @remarks
 * Esta clase utiliza la directiva 'use server' para indicar que solo debe ejecutarse en el servidor.
 */

import { ObjectId, type Collection, type InsertOneResult, type UpdateResult, type DeleteResult, type Filter } from './db';
import { connectDB } from './db';
import type { Cliente, NewClienteData, UpdateClienteData } from '@/lib/types';

/**
 * Clase responsable de gestionar operaciones CRUD para Clientes en la base de datos MongoDB.
 */
class ClienteManager {
  private collectionPromise: Promise<Collection<Cliente>>;

  /**
   * Constructor de ClienteManager.
   * Inicializa la promesa de conexión a la colección 'clientes' en MongoDB.
   * Crea índices en 'nombre', 'correo' (único disperso) y 'rfc' (único disperso).
   */
  constructor() {
    this.collectionPromise = connectDB().then(db => {
      const clientesCollection = db.collection<Cliente>('clientes');
      // Índice en el nombre del Cliente para búsquedas rápidas u ordenamiento.
      clientesCollection.createIndex({ nombre: 1 }).catch(err => {
        if (err.code !== 11000) console.warn('Failed to create index on clientes.nombre:', err);
      });
      // Índice único disperso en 'correo' (permite múltiples nulos/ausentes pero valores únicos si existen).
      clientesCollection.createIndex({ correo: 1 }, { unique: true, sparse: true }).catch(err => {
        if (err.code !== 11000) console.warn('Failed to create unique sparse index on clientes.correo:', err);
      });
      // Índice único disperso en 'rfc' (permite múltiples nulos/ausentes pero valores únicos si existen).
       clientesCollection.createIndex({ rfc: 1 }, { unique: true, sparse: true }).catch(err => {
        if (err.code !== 11000) console.warn('Failed to create unique sparse index on clientes.rfc:', err);
      });
      return clientesCollection;
    }).catch(err => {
      console.error('Error al obtener la colección de clientes:', err);
      throw err; 
    });
  }

  /**
   * Obtiene la colección MongoDB para clientes.
   * @returns {Promise<Collection<Cliente>>} La colección de clientes.
   * @private
   */
  private async getCollection(): Promise<Collection<Cliente>> {
    return this.collectionPromise;
  }

  /**
   * Crea un nuevo Cliente.
   * El `_id` para el Cliente es generado automáticamente por MongoDB.
   * El array `ordenes` se inicializa como vacío.
   * @param {NewClienteData} data - Datos para el nuevo cliente (nombre, telefono, correo, rfc).
   * @returns {Promise<string | null>} El `_id` (string hexadecimal del ObjectId) del cliente recién creado, o null en caso de fallo.
   * @throws {Error} Si falta el nombre del cliente u ocurren otros errores de base de datos.
   */
  async createCliente(data: NewClienteData): Promise<string | null> {
    const collection = await this.getCollection();

    if (!data.nombre || !data.nombre.trim()) {
      throw new Error('El nombre del cliente es requerido.');
    }
    
    const newClienteDocument: Omit<Cliente, '_id'> = {
      nombre: data.nombre,
      telefono: data.telefono,
      correo: data.correo,
      rfc: data.rfc, // RFC es opcional
      ordenes: [], // Inicializar 'ordenes' como un array vacío.
    };

    try {
      const result: InsertOneResult<Cliente> = await collection.insertOne(newClienteDocument as Cliente);
      console.log('Cliente creado con _id de MongoDB:', result.insertedId);
      return result.insertedId.toHexString(); // Devolver el _id como string
    } catch (error: any) {
      console.error('Error al crear cliente:', error);
      if (error.code === 11000) { // Error de clave duplicada
        if (data.correo && error.message.includes('correo_1')) {
          throw new Error(`El correo "${data.correo}" ya está registrado.`);
        }
        if (data.rfc && error.message.includes('rfc_1')) {
          throw new Error(`El RFC "${data.rfc}" ya está registrado.`);
        }
      }
      throw error;
    }
  }

  /**
   * Obtiene todos los clientes, ordenados por nombre.
   * @param {Filter<Cliente>} [filter] - Filtro opcional de MongoDB para aplicar a la consulta.
   * @returns {Promise<Cliente[]>} Una lista de todos los clientes que coinciden con el filtro, con `_id` como string.
   * @throws {Error} Si hay un error de base de datos.
   */
  async getAllClientes(filter?: Filter<Cliente>): Promise<Cliente[]> {
    const collection = await this.getCollection();
    try {
      const clientesFromDb = await collection.find(filter || {}).sort({ nombre: 1 }).toArray();
      // Convertir ObjectId de MongoDB a string para el consumo del lado del cliente.
      return clientesFromDb.map(cli => ({...cli, _id: cli._id.toHexString()}));
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }
  }

  /**
   * Obtiene un único cliente por su `_id` de MongoDB (como string).
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB del cliente.
   * @returns {Promise<Cliente | null>} El objeto cliente con `_id` como string, o null si no se encuentra o el ID es inválido.
   * @throws {Error} Si hay un error de base de datos.
   */
  async getClienteById(id: string): Promise<Cliente | null> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Formato de ObjectId inválido para getClienteById:', id);
        return null;
      }
      const clienteFromDb = await collection.findOne({ _id: new ObjectId(id) });
      if (clienteFromDb) {
        return {...clienteFromDb, _id: clienteFromDb._id.toHexString()};
      }
      return null;
    } catch (error) {
      console.error('Error al obtener cliente por ID de MongoDB:', error);
      throw error;
    }
  }

  /**
   * Actualiza los datos de un cliente.
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB del cliente a actualizar.
   * @param {UpdateClienteData} updateData - Datos a actualizar para el cliente (nombre, telefono, correo, rfc).
   * @returns {Promise<boolean>} True si la actualización fue exitosa (modifiedCount > 0), false en caso contrario.
   * @throws {Error} Si ocurren errores de base de datos (ej. campo único duplicado).
   */
  async updateCliente(id: string, updateData: UpdateClienteData): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Formato de ObjectId inválido para updateCliente:', id);
        return false;
      }
      if (Object.keys(updateData).length === 0) {
        return true; // No hay cambios necesarios
      }
      // Validar que el nombre no esté vacío si se intenta actualizar.
      if (updateData.nombre !== undefined && !updateData.nombre.trim()) {
        throw new Error("El nombre del cliente no puede estar vacío.");
      }
      // Crear un objeto $set con los campos a actualizar
      const updatePayload: Partial<Cliente> = {};
      if (updateData.nombre !== undefined) updatePayload.nombre = updateData.nombre;
      if (updateData.telefono !== undefined) updatePayload.telefono = updateData.telefono;
      if (updateData.correo !== undefined) updatePayload.correo = updateData.correo;
      if (updateData.rfc !== undefined) updatePayload.rfc = updateData.rfc;


      const result: UpdateResult = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatePayload }
      );
      return result.modifiedCount > 0;
    } catch (error: any) {
      console.error('Error al actualizar cliente:', error);
       if (error.code === 11000) { // Error de clave duplicada
        if (updateData.correo && error.message.includes('correo_1')) {
          throw new Error(`El correo "${updateData.correo}" ya está registrado.`);
        }
        if (updateData.rfc && error.message.includes('rfc_1')) {
          throw new Error(`El RFC "${updateData.rfc}" ya está registrado.`);
        }
      }
      throw error;
    }
  }

  /**
   * Elimina un cliente de la base de datos.
   * @param {string} id - La cadena hexadecimal del ObjectId de MongoDB del cliente a eliminar.
   * @returns {Promise<boolean>} True si el cliente fue eliminado (deletedCount > 0), false en caso contrario.
   * @throws {Error} Si hay un error de base de datos.
   */
  async deleteCliente(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.warn('Formato de ObjectId inválido para deleteCliente:', id);
        return false;
      }
      const result: DeleteResult = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      throw error;
    }
  }

  /**
   * Añade una referencia a una orden al array 'ordenes' del cliente.
   * @param {string} clienteId - El `_id` (string ObjectId) del cliente.
   * @param {string} orderId - El `_id` (string ObjectId) de la orden.
   * @returns {Promise<boolean>} True si la referencia de la orden fue añadida, false en caso contrario.
   * @remarks Usar con precaución si el array `ordenes` puede crecer mucho.
   */
  async addOrderToCliente(clienteId: string, orderId: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(clienteId) || !ObjectId.isValid(orderId)) {
        console.warn('Invalid ObjectId for addOrderToCliente:', clienteId, orderId);
        return false;
      }
      const result = await collection.updateOne(
        { _id: new ObjectId(clienteId) },
        { $addToSet: { ordenes: { orderId: orderId } } } // Usar $addToSet para evitar duplicados
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al añadir orden a cliente:', error);
      throw error;
    }
  }
}

export default ClienteManager;
