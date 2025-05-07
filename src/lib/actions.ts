'use server';

import { z } from 'zod';
import type { AppointmentFormData } from './types';

const AppointmentSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  phone: z.string().min(9, { message: 'El teléfono debe tener al menos 9 dígitos.' }),
  service: z.string().min(1, { message: 'Por favor, selecciona un servicio.' }),
  date: z.coerce.date({ errorMap: () => ({ message: "Por favor, selecciona una fecha válida."}) }),
  time: z.string().min(1, { message: 'Por favor, selecciona una hora.' }),
});

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
  };

  const validatedFields = AppointmentSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: 'Error de validación. Por favor, revisa los campos.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const data = validatedFields.data as AppointmentFormData;

  // Simulate saving the appointment
  console.log('Cita agendada:', data);

  // In a real application, you would save this to a database.
  // For now, we'll just simulate success.
  
  // Introduce a small delay to simulate network latency
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    message: `¡Gracias, ${data.name}! Tu cita para ${data.service} el ${data.date.toLocaleDateString('es-ES')} a las ${data.time} ha sido solicitada. Te contactaremos pronto para confirmar.`,
    success: true,
  };
}
