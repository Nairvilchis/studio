
'use server';

import { z } from 'zod';
import connectToDatabase from './mongodb';
import { Service as ServiceModel } from '@/models/Service';
import { GalleryImage as GalleryImageModel } from '@/models/GalleryImage';
import { Appointment as AppointmentModel } from '@/models/Appointment';
import { ContactInfo as ContactInfoModel } from '@/models/ContactInfo';
import type { AppointmentFormData, Service, GalleryImage as GalleryImageType, ContactInfo } from './types';
import { revalidatePath } from 'next/cache';

// Esquema de validación para citas (frontend)
const AppointmentSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  phone: z.string().min(9, { message: 'El teléfono debe tener al menos 9 dígitos.' }).regex(/^\+?[0-9\s-()]+$/, { message: 'Número de teléfono inválido.'}),
  service: z.string({ required_error: 'Por favor, selecciona un servicio.' }),
  date: z.coerce.date({ errorMap: () => ({ message: "Por favor, selecciona una fecha válida."}) }),
  time: z.string({ required_error: 'Por favor, selecciona una hora.' }),
  message: z.string().optional(),
});

// Esquema de validación para servicios (backend/admin)
const ServiceSchemaDB = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  description: z.string().min(1, "La descripción es requerida."),
  iconName: z.string().min(1, "El nombre del icono es requerido."),
  imageUrl: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
});

// Esquema de validación para imágenes de galería (backend/admin)
const GalleryImageSchemaDB = z.object({
  src: z.string().url("Debe ser una URL válida."),
  alt: z.string().min(1, "El texto alternativo es requerido."),
  category: z.string().min(1, "La categoría es requerida."),
  dataAiHint: z.string().optional(),
});

// Esquema de validación para información de contacto (backend/admin)
const ContactInfoSchemaDB = z.object({
  addressLine1: z.string().min(1, "La dirección es requerida."),
  city: z.string().min(1, "La ciudad es requerida."),
  postalCode: z.string().min(1, "El código postal es requerido."),
  email: z.string().email("Debe ser un email válido."),
  phone: z.string().min(9, "El teléfono debe tener al menos 9 dígitos."),
});


// --- Helper para transformar _id a id ---
function mongoDocToPlainObject<T extends { _id: any }>(doc: T): Omit<T, '_id'> & { id: string } {
  const obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
  obj.id = obj._id.toString();
  delete obj._id;
  // También eliminamos __v si existe
  if (obj.__v !== undefined) {
    delete obj.__v;
  }
  return obj;
}


// --- APPOINTMENTS ---
export async function scheduleAppointmentAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; errors?: Record<string, string[]>; success: boolean }> {
  
  const rawFormData = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    service: formData.get('service'),
    date: formData.get('date'),
    time: formData.get('time'),
    message: formData.get('message') || undefined,
  };

  const validatedFields = AppointmentSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: 'Error de validación. Por favor, revisa los campos.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  try {
    await connectToDatabase();
    const newAppointment = new AppointmentModel({
      ...validatedFields.data,
      status: 'pending', // Estado inicial
    });
    await newAppointment.save();
    
    revalidatePath('/admin/manage-appointments'); // Revalidar la página de admin
    
    return {
      message: `¡Gracias, ${validatedFields.data.name}! Tu cita para ${validatedFields.data.service} el ${new Date(validatedFields.data.date).toLocaleDateString('es-ES')} a las ${validatedFields.data.time} ha sido solicitada. Te contactaremos pronto para confirmar.`,
      success: true,
    };
  } catch (error) {
    console.error('Error al guardar la cita:', error);
    return {
      message: 'Error del servidor al intentar agendar la cita. Por favor, inténtalo más tarde.',
      success: false,
    };
  }
}

export async function readAppointments(): Promise<{ success: boolean; data?: AppointmentFormData[]; message?: string }> {
  try {
    await connectToDatabase();
    const appointments = await AppointmentModel.find({}).sort({ createdAt: -1 });
    return { success: true, data: appointments.map(mongoDocToPlainObject) as AppointmentFormData[] };
  } catch (error) {
    console.error('Error al leer citas:', error);
    return { success: false, message: 'Error al leer las citas.' };
  }
}

export async function updateAppointmentStatus(id: string, status: AppointmentFormData['status']): Promise<{ success: boolean; message: string }> {
  try {
    await connectToDatabase();
    const appointment = await AppointmentModel.findByIdAndUpdate(id, { status }, { new: true });
    if (!appointment) {
      return { success: false, message: 'Cita no encontrada.' };
    }
    revalidatePath('/admin/manage-appointments');
    return { success: true, message: `Cita ${status === 'confirmed' ? 'aprobada' : status === 'rejected' ? 'rechazada' : 'actualizada'} correctamente.` };
  } catch (error) {
    console.error('Error al actualizar estado de la cita:', error);
    return { success: false, message: 'Error al actualizar el estado de la cita.' };
  }
}

export async function deleteAppointment(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await connectToDatabase();
    const deleted = await AppointmentModel.findByIdAndDelete(id);
    if (!deleted) {
      return { success: false, message: 'Cita no encontrada para eliminar.' };
    }
    revalidatePath('/admin/manage-appointments');
    return { success: true, message: 'Cita eliminada exitosamente.' };
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    return { success: false, message: 'Error al eliminar la cita.' };
  }
}


// --- SERVICES ---
export async function createService(data: Omit<Service, 'id'>): Promise<{ success: boolean; data?: Service; message?: string; errors?: any }> {
  const validatedFields = ServiceSchemaDB.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors };
  }
  try {
    await connectToDatabase();
    const newService = new ServiceModel(validatedFields.data);
    const savedService = await newService.save();
    revalidatePath('/admin/manage-services');
    revalidatePath('/#services'); 
    return { success: true, data: mongoDocToPlainObject(savedService) as Service, message: 'Servicio creado exitosamente.' };
  } catch (error) {
    console.error('Error al crear servicio:', error);
    return { success: false, message: 'Error del servidor al crear el servicio.' };
  }
}

export async function readServices(): Promise<{ success: boolean; data?: Service[]; message?: string }> {
  try {
    await connectToDatabase();
    const servicesFromDB = await ServiceModel.find({}).sort({ createdAt: -1 });
    return { success: true, data: servicesFromDB.map(mongoDocToPlainObject) as Service[] };
  } catch (error) {
    console.error('Error al leer servicios:', error);
    return { success: false, message: 'Error del servidor al leer los servicios.' };
  }
}

export async function updateService(id: string, data: Partial<Omit<Service, 'id'>>): Promise<{ success: boolean; data?: Service; message?: string; errors?: any }> {
  const validatedFields = ServiceSchemaDB.partial().safeParse(data);
   if (!validatedFields.success) {
    return { success: false, message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors };
  }
  try {
    await connectToDatabase();
    const updatedService = await ServiceModel.findByIdAndUpdate(id, validatedFields.data, { new: true });
    if (!updatedService) {
      return { success: false, message: 'Servicio no encontrado.' };
    }
    revalidatePath('/admin/manage-services');
    revalidatePath('/#services');
    return { success: true, data: mongoDocToPlainObject(updatedService) as Service, message: 'Servicio actualizado exitosamente.' };
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    return { success: false, message: 'Error del servidor al actualizar el servicio.' };
  }
}

export async function deleteService(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await connectToDatabase();
    const deleted = await ServiceModel.findByIdAndDelete(id);
     if (!deleted) {
      return { success: false, message: 'Servicio no encontrado para eliminar.' };
    }
    revalidatePath('/admin/manage-services');
    revalidatePath('/#services');
    return { success: true, message: 'Servicio eliminado exitosamente.' };
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    return { success: false, message: 'Error del servidor al eliminar el servicio.' };
  }
}

// --- GALLERY IMAGES ---
export async function createGalleryImage(data: Omit<GalleryImageType, 'id'>): Promise<{ success: boolean; data?: GalleryImageType; message?: string; errors?: any }> {
  const validatedFields = GalleryImageSchemaDB.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors };
  }
  try {
    await connectToDatabase();
    const newImage = new GalleryImageModel(validatedFields.data);
    const savedImage = await newImage.save();
    revalidatePath('/admin/manage-gallery');
    revalidatePath('/#gallery');
    return { success: true, data: mongoDocToPlainObject(savedImage) as GalleryImageType, message: 'Imagen de galería creada exitosamente.' };
  } catch (error) {
    console.error('Error al crear imagen de galería:', error);
    return { success: false, message: 'Error del servidor al crear la imagen.' };
  }
}

export async function readGalleryImages(): Promise<{ success: boolean; data?: GalleryImageType[]; message?: string }> {
  try {
    await connectToDatabase();
    const imagesFromDB = await GalleryImageModel.find({}).sort({ createdAt: -1 });
    return { success: true, data: imagesFromDB.map(mongoDocToPlainObject) as GalleryImageType[] };
  } catch (error) {
    console.error('Error al leer imágenes de galería:', error);
    return { success: false, message: 'Error del servidor al leer las imágenes.' };
  }
}

export async function updateGalleryImage(id: string, data: Partial<Omit<GalleryImageType, 'id'>>): Promise<{ success: boolean; data?: GalleryImageType; message?: string; errors?: any }> {
  const validatedFields = GalleryImageSchemaDB.partial().safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors };
  }
  try {
    await connectToDatabase();
    const updatedImage = await GalleryImageModel.findByIdAndUpdate(id, validatedFields.data, { new: true });
    if (!updatedImage) {
      return { success: false, message: 'Imagen de galería no encontrada.' };
    }
    revalidatePath('/admin/manage-gallery');
    revalidatePath('/#gallery');
    return { success: true, data: mongoDocToPlainObject(updatedImage) as GalleryImageType, message: 'Imagen de galería actualizada exitosamente.' };
  } catch (error) {
    console.error('Error al actualizar imagen de galería:', error);
    return { success: false, message: 'Error del servidor al actualizar la imagen.' };
  }
}

export async function deleteGalleryImage(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await connectToDatabase();
    const deleted = await GalleryImageModel.findByIdAndDelete(id);
    if (!deleted) {
      return { success: false, message: 'Imagen no encontrada para eliminar.' };
    }
    revalidatePath('/admin/manage-gallery');
    revalidatePath('/#gallery');
    return { success: true, message: 'Imagen de galería eliminada exitosamente.' };
  } catch (error) {
    console.error('Error al eliminar imagen de galería:', error);
    return { success: false, message: 'Error del servidor al eliminar la imagen.' };
  }
}


// --- CONTACT INFO ---
export async function readContactInfo(): Promise<{ success: boolean; data?: ContactInfo; message?: string }> {
  try {
    await connectToDatabase();
    const contactInfoDoc = await ContactInfoModel.findOne({});
    if (contactInfoDoc) {
      return { success: true, data: mongoDocToPlainObject(contactInfoDoc) as ContactInfo };
    }
    // Return default/empty structure if no contact info is found
    return { 
      success: true, 
      data: {
        addressLine1: "Tu Dirección Aquí",
        city: "Tu Ciudad",
        postalCode: "00000",
        email: "tuemail@ejemplo.com",
        phone: "(000) 000-0000"
      } 
    };
  } catch (error) {
    console.error('Error al leer información de contacto:', error);
    return { success: false, message: 'Error del servidor al leer la información de contacto.' };
  }
}

export async function updateContactInfo(data: Partial<Omit<ContactInfo, 'id'>>): Promise<{ success: boolean; data?: ContactInfo; message?: string; errors?: any }> {
  const validatedFields = ContactInfoSchemaDB.partial().safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors };
  }
  try {
    await connectToDatabase();
    // Use findOneAndUpdate with upsert: true to create if not exists, or update if exists.
    // The filter {} will match the single document if it exists.
    const updatedContactInfo = await ContactInfoModel.findOneAndUpdate({}, validatedFields.data, { new: true, upsert: true, runValidators: true });
    
    if (!updatedContactInfo) {
      // This case should ideally not be reached due to upsert:true, but as a safeguard:
      return { success: false, message: 'No se pudo actualizar o crear la información de contacto.' };
    }
    
    revalidatePath('/'); // For footer
    revalidatePath('/admin/manage-contact-info');
    
    return { success: true, data: mongoDocToPlainObject(updatedContactInfo) as ContactInfo, message: 'Información de contacto actualizada exitosamente.' };
  } catch (error) {
    console.error('Error al actualizar información de contacto:', error);
    return { success: false, message: 'Error del servidor al actualizar la información de contacto.' };
  }
}
