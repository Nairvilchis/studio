// import type { LucideIcon } from 'lucide-react'; // No se usa directamente en este archivo

export interface Service {
  id: string; // Será _id de MongoDB como string
  name: string;
  description: string;
  iconName: string; 
  imageUrl?: string; // Optional URL for the service image
}

export interface GalleryImage {
  id: string; // Será _id de MongoDB como string
  src: string;
  alt: string;
  category: string;
  dataAiHint: string;
}

export interface AppointmentFormData {
  id?: string; // Opcional, será _id de MongoDB como string
  name: string;
  email: string;
  phone: string;
  service: string;
  date: Date;
  time: string;
  message?: string;
  status?: 'pending' | 'confirmed' | 'rejected' | 'completed'; // Estado de la cita
}
