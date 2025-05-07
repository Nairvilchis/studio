import type { LucideIcon } from 'lucide-react';

export interface Service {
  id: string;
  name: string;
  description: string;
  iconName: string; // Changed from icon: LucideIcon to iconName: string
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: string;
  dataAiHint: string;
}

export interface AppointmentFormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  date: Date;
  time: string;
  message?: string; // Added optional message
}
