import { MongoClient, Db, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

// Obtener la URI de conexión de las variables de entorno
const uri = process.env.MONGODB_URI;
// Declarar variables para el cliente y la base de datos
let client: MongoClient;
let db: Db;

// Función asíncrona para conectar a la base de datos
async function connectDB(): Promise<Db> {
  // Si la conexión a la base de datos ya existe, la retornamos
  if (db) {
    return db;
  }

  // Verificar si la URI de conexión está definida
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in your .env file');
  }

  try {
    // Crear una nueva instancia del cliente MongoClient con la URI
    client = new MongoClient(uri);
    // Conectar al servidor de MongoDB
    await client.connect();
    // Obtener la instancia de la base de datos (el nombre de la base de datos está en la URI)
    db = client.db();
    // Imprimir un mensaje de éxito en la consola
    console.log('Connected to MongoDB');
    // Retornar la instancia de la base de datos
    return db;
  } catch (error) {
    // En caso de error, imprimir un mensaje de error en la consola
    console.error('Error connecting to MongoDB:', error);
    // Relanzar el error para que sea manejado por quien llama a esta función
    throw error;
  }
}

// Función asíncrona para cerrar la conexión a la base de datos
async function closeDB(): Promise<void> {
  // Verificar si el cliente existe (si hay una conexión activa)
  if (client) {
    // Cerrar la conexión del cliente
    await client.close();
    // Imprimir un mensaje en la consola indicando que la conexión se cerró
    console.log('MongoDB connection closed');
  }
}

// Exportar las funciones connectDB y closeDB para ser usadas en otros módulos
export { connectDB, closeDB, ObjectId };