import mongoose, { Document, Schema } from 'mongoose';

// Interface para el documento de Información de Contacto
export interface IContactInfo extends Document {
  addressLine1: string;
  city: string;
  postalCode: string;
  email: string;
  phone: string;
  // facebookUrl?: string;
  // instagramUrl?: string;
  // twitterUrl?: string;
  // youtubeUrl?: string;
}

const ContactInfoSchema: Schema = new Schema({
  addressLine1: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  // facebookUrl: { type: String, trim: true },
  // instagramUrl: { type: String, trim: true },
  // twitterUrl: { type: String, trim: true },
  // youtubeUrl: { type: String, trim: true },
}, { timestamps: true, versionKey: false }); // Añade createdAt y updatedAt automáticamente, deshabilita __v

// Evita recompilar el modelo si ya existe
// El modelo se llamará 'ContactInfo' pero la colección será 'contactinfo' (singular, minúscula) por defecto
// o 'contactinfos' si Mongoose pluraliza.
// Para forzar un nombre de colección específico: mongoose.model<IContactInfo>('ContactInfo', ContactInfoSchema, 'contact_information_collection');
export const ContactInfo = mongoose.models.ContactInfo || mongoose.model<IContactInfo>('ContactInfo', ContactInfoSchema);
