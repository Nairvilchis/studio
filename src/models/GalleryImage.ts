import mongoose, { Document, Schema } from 'mongoose';
import type { GalleryImage as GalleryImageType } from '@/lib/types'; // Import for potential type checking

// Interface para el documento de Imagen de Galería
export interface IGalleryImage extends Document {
  src: string; // Corresponde a src en GalleryImageType (URL de la imagen)
  alt: string; // Corresponde a alt en GalleryImageType
  category: string; // Corresponde a category en GalleryImageType
  dataAiHint: string; // Corresponde a dataAiHint en GalleryImageType
}

const GalleryImageSchema: Schema = new Schema({
  src: { type: String, required: true, trim: true },
  alt: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  dataAiHint: { type: String, required: false, trim: true, default: '' },
}, { timestamps: true }); // Añade createdAt y updatedAt automáticamente

// Evita recompilar el modelo si ya existe
export const GalleryImage = mongoose.models.GalleryImage || mongoose.model<IGalleryImage>('GalleryImage', GalleryImageSchema);
