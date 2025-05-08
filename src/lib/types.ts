
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

export interface ContactInfo {
  id?: string; // Opcional, será _id de MongoDB como string
  addressLine1: string;
  city: string;
  postalCode: string;
  email: string;
  phone: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
}

export interface HeroContentData {
  id?: string;
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  backgroundImageUrl?: string;
}

export interface ServicesSectionContentData {
  id?: string;
  titlePrefix: string;
  titleHighlight: string;
  description: string;
}
