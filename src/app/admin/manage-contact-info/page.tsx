
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import type { ContactInfo } from '@/lib/types';
import { readContactInfo, updateContactInfo } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';

const ContactInfoSchema = z.object({
  addressLine1: z.string().min(1, "La dirección es requerida."),
  city: z.string().min(1, "La ciudad es requerida."),
  postalCode: z.string().min(1, "El código postal es requerido."),
  email: z.string().email("Debe ser un email válido."),
  phone: z.string().min(9, "El teléfono debe tener al menos 9 dígitos."),
});

type ContactInfoFormValues = z.infer<typeof ContactInfoSchema>;

export default function ManageContactInfoPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<ContactInfoFormValues>({
    resolver: zodResolver(ContactInfoSchema),
    defaultValues: {
      addressLine1: '',
      city: '',
      postalCode: '',
      email: '',
      phone: '',
    },
  });

  const fetchContactInfo = async () => {
    setIsLoading(true);
    try {
      const response = await readContactInfo();
      if (response.success && response.data) {
        form.reset(response.data);
      } else {
        toast({ title: 'Error', description: response.message || 'No se pudo cargar la información de contacto.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
      toast({ title: 'Error', description: 'No se pudo cargar la información de contacto.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContactInfo();
  }, [form]);

  const onSubmit = (values: ContactInfoFormValues) => {
    startTransition(async () => {
      const result = await updateContactInfo(values);
      if (result.success) {
        toast({ title: 'Éxito', description: result.message || 'Información de contacto actualizada.' });
        if (result.data) {
          form.reset(result.data); // Reset form with new data to ensure consistency
        }
      } else {
        toast({ title: 'Error', description: result.message || 'No se pudo actualizar la información de contacto.', variant: 'destructive' });
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, errors]) => {
            form.setError(field as keyof ContactInfoFormValues, {
              type: 'manual',
              message: (errors as string[])?.[0] || 'Error de validación',
            });
          });
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
        </Button>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Gestionar Información de Contacto</CardTitle>
          <CardDescription>Actualiza los detalles de contacto que se mostrarán en el pie de página.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Calle Falsa 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Ciudad Ejemplo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Postal</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 08000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Ej: contacto@novaglow.com" {...field} />
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
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Ej: (+34) 900 123 456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending || !form.formState.isDirty}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
               {!form.formState.isDirty && form.formState.isSubmitted && (
                <p className="text-sm text-muted-foreground text-center">No hay cambios para guardar.</p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
