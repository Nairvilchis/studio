import mongoose, { Document, Schema } from 'mongoose';
import type { AppointmentFormData } from '@/lib/types';

export interface IAppointment extends Document {
  name: string;
  email: string;
  phone: string;
  service: string;
  date: Date;
  time: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed'; // Para gestión administrativa
}

const AppointmentSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  service: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  message: { type: String, trim: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'rejected', 'completed'], 
    default: 'pending',
    required: true,
  },
}, { timestamps: true });

export const Appointment = mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
