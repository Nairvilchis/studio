
'use server';

import { connectDB } from '@/db';
import type { Cliente } from '@/lib/types'; // Asegúrate de definir la interfaz Cliente en types.ts
import type { Collection } from 'mongodb';

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper to serialize _id to string
function serializeCliente(clienteFromDb: any): Cliente {
  return {
    ...clienteFromDb,
    _id: clienteFromDb._id ? clienteFromDb._id.toHexString() : undefined,
  } as Cliente;
}

function serializeClientes(clientesFromDb: any[]): Cliente[] {
  return clientesFromDb.map(serializeCliente);
}

export async function getClients(): Promise<ActionResult<Cliente[]>> {
  console.log('Server Action: getClients - Fetching clients from database.');
  try {
    const db = await connectDB();
    const collection: Collection<any> = db.collection('clientes'); // Use 'any' if schema is not strictly enforced yet for Cliente
    const clientsRaw = await collection.find().toArray();
    const clientsForClient = serializeClientes(clientsRaw);
    return { success: true, data: clientsForClient };
  } catch (error) {
    console.error('Error fetching clients:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch clients.';
    return { success: false, error: errorMessage, data: [] };
  }
}

// Puedes añadir otras acciones aquí en el futuro, como createClient, updateClient, deleteClient, etc.
