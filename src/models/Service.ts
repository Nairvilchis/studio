import mongoose, { Document, Schema } from 'mongoose';
import type { Service as ServiceType } from '@/lib/types'; // Import for potential type checking

// Interface para el documento de Servicio, extendiendo la interfaz base y Document de Mongoose
export interface IService extends Document {
  name: string;
  description: string;
  iconName: string; // Corresponde a iconName en ServiceType
}

const ServiceSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  iconName: { type: String, required: true, trim: true }, // Campo para el nombre del icono de Lucide
}, { timestamps: true }); // Añade createdAt y updatedAt automáticamente

// Evita recompilar el modelo si ya existe
export const Service = mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);
