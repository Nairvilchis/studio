
import { Collection, ObjectId, InsertOneResult } from 'mongodb';
import { connectDB } from './db'; // Importamos la función de conexión

// Definimos la interfaz para la estructura de un usuario
export interface User {
  _id?: ObjectId; // El ID generado por MongoDB
  username: string; // Changed from 'user' to 'username' for consistency
  password: string; // La contraseña se puede hacer opcional
  workstation?: string; // Workstation is now optional
  permissions?: string[]; // Permissions are now optional
}

class UserManager {
  private collectionPromise: Promise<Collection<User>>;

  constructor() {
    this.collectionPromise = connectDB().then(db => {
      return db.collection<User>('users');
    }).catch(err => {
      console.error('Error al obtener la colección de usuarios:', err);
      throw err; // Rethrow or handle as appropriate for your application
    });
  }

  private async getCollection(): Promise<Collection<User>> {
    // Ensures the promise is resolved and returns the collection
    return this.collectionPromise;
  }

  // CREATE: Método para crear un nuevo usuario
  async createUser(userData: Partial<User>): Promise<ObjectId | null> {
    const collection = await this.getCollection();

    // It's caller's responsibility to ensure username and password exist,
    // as per the existing pages/api/create-user.ts logic.
    if (!userData.username || !userData.password) {
      console.error('Username and password are required for createUser.');
      // Or throw new Error('Username and password are required.');
      return null; // Or handle error appropriately
    }

    const fullUserData: User = {
      username: userData.username,
      password: userData.password, // Consider hashing passwords in a real app
      workstation: userData.workstation || 'DefaultWorkstation',
      permissions: userData.permissions || ['basic_user'],
    };

    try {
      // Ensure the object passed to insertOne matches the collection's generic type,
      // excluding _id if it's auto-generated.
      // MongoDB Node.js driver expects OptionalId<TSchema> for insertOne.
      // Our User interface has _id optional, so fullUserData is fine.
      const result: InsertOneResult<User> = await collection.insertOne(fullUserData as Omit<User, '_id'>);
      console.log('Usuario creado con ID:', result.insertedId);
      return result.insertedId;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  }

  // READ: Método para obtener todos los usuarios
  async getAllUsers(): Promise<User[]> {
    const collection = await this.getCollection();
    try {
      const users = await collection.find().toArray();
      return users;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }

  // READ: Método para obtener un usuario por su ID
  async getUserById(id: string): Promise<User | null> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format for getUserById:', id);
        return null;
      }
      const user = await collection.findOne({ _id: new ObjectId(id) });
      return user;
    } catch (error) {
      console.error('Error al obtener usuario por ID:', error);
      throw error;
    }
  }

  // READ: Método para obtener un usuario por su nombre de usuario
  async getUserByUsername(username: string): Promise<User | null> {
    const collection = await this.getCollection();
    try {
      const user = await collection.findOne({ username: username });
      return user;
    } catch (error) {
      console.error('Error al obtener usuario por nombre de usuario:', error);
      throw error;
    }
  }

  // UPDATE: Método para actualizar un usuario por su ID
  async updateUser(id: string, updateData: Partial<User>): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format for updateUser:', id);
        return false;
      }
      // Ensure $set operator is used for updates unless replacing the whole document.
      // Remove _id and username from updateData if they are present, as they shouldn't be changed this way.
      const { _id, username, ...dataToUpdate } = updateData;

      if (Object.keys(dataToUpdate).length === 0) {
        console.log('No fields to update for user ID:', id);
        return false;
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: dataToUpdate }
      );
      console.log('Usuario actualizado:', result.modifiedCount);
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }

  // DELETE: Método para eliminar un usuario por su ID
  async deleteUser(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    try {
      if (!ObjectId.isValid(id)) {
        console.error('Invalid ObjectId format for deleteUser:', id);
        return false;
      }
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      console.log('Usuario eliminado:', result.deletedCount);
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  }
}

export default UserManager;
