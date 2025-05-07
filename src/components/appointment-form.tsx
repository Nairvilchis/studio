'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useTransition } from 'react';
import { scheduleAppointmentAction } from '@/lib/actions';

const services = [
  'Manicura y Pedicura',
  'Peluquería Profesional',
  'Microblading de Cejas',
  'Tratamientos Faciales',
  'Tratamientos Corporales',
];

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '15:00', '16:00', '17:00', '18:00', '19:00',
];

const AppointmentFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  phone: z.string().min(9, { message: 'El teléfono debe tener al menos 9 dígitos.' }).regex(/^\+?[0-9\s-()]+$/, { message: 'Número de teléfono inválido.'}),
  service: z.string({ required_error: 'Por favor, selecciona un servicio.' }),
  date: z.date({ required_error: 'Por favor, selecciona una fecha.' }),
  time: z.string({ required_error: 'Por favor, selecciona una hora.' }),
});

type AppointmentFormValues = z.infer<typeof AppointmentFormSchema>;

export default function AppointmentForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);


  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(AppointmentFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  const onSubmit = (values: AppointmentFormValues) => {
    setFormError(null);
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else {
          formData.append(key, value as string);
        }
      });

      try {
        const result = await scheduleAppointmentAction(null, formData);
        if (result.success) {
          toast({
            title: 'Cita Solicitada',
            description: result.message,
            variant: 'default',
          });
          form.reset();
        } else {
          setFormError(result.message);
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, errors]) => {
              form.setError(field as keyof AppointmentFormValues, {
                type: 'manual',
                message: errors?.[0] || 'Error de validación',
              });
            });
          }
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        setFormError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
        toast({
          title: 'Error',
          description: 'No se pudo enviar el formulario. Inténtalo más tarde.',
          variant: 'destructive',
        });
      }
    });
  };


  return (
    <section id="appointment" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 max-w-2xl">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-4">
          Agenda tu <span className="text-primary">Momento de Belleza</span>
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12 md:mb-16">
          Rellena el formulario y nos pondremos en contacto contigo para confirmar tu cita.
        </p>

        <Card className="p-6 md:p-10 shadow-xl bg-card/80 backdrop-blur-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: María López" {...field} className="text-base"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Ej: maria@ejemplo.com" {...field} className="text-base"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Teléfono</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Ej: 600 123 456" {...field} className="text-base"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Servicio Deseado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder="Selecciona un servicio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service} value={service} className="text-base">
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-lg">Fecha Preferida</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal text-base',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: es })
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} // Disable past dates
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Hora Preferida</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-base">
                            <SelectValue placeholder="Selecciona una hora" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot} className="text-base">
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {formError && (
                <p className="text-sm font-medium text-destructive">{formError}</p>
              )}

              <Button type="submit" size="lg" className="w-full text-lg" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Solicitar Cita'
                )}
              </Button>
            </form>
          </Form>
        </Card>
      </div>
    </section>
  );
}

// Need to add Card component to this file for structure.
// This is a placeholder as actual Card is imported from ui.
const Card = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
    {children}
  </div>
);
