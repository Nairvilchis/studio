
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import type { ContactInfo } from '@/lib/types';
import { readContactInfo, updateContactInfo } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Unused, FormLabel is used from form component
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const ContactInfoSchema = z.object({
  addressLine1: z.string().min(1, "La dirección es requerida."),
  city: z.string().min(1, "La ciudad es requerida."),
  postalCode: z.string().min(1, "El código postal es requerido."),
  email: z.string().email("Debe ser un email válido."),
  phone: z.string().min(9, "El teléfono debe tener al menos 9 dígitos."),
  facebookUrl: z.string().url("URL de Facebook inválida. Debe ser una URL completa (ej: https://facebook.com/novaglow).").optional().or(z.literal('')),
  instagramUrl: z.string().url("URL de Instagram inválida. Debe ser una URL completa (ej: https://instagram.com/novaglow).").optional().or(z.literal('')),
  twitterUrl: z.string().url("URL de Twitter inválida. Debe ser una URL completa (ej: https://twitter.com/novaglow).").optional().or(z.literal('')),
  youtubeUrl: z.string().url("URL de YouTube inválida. Debe ser una URL completa (ej: https://youtube.com/novaglow).").optional().or(z.literal('')),
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
      facebookUrl: '',
      instagramUrl: '',
      twitterUrl: '',
      youtubeUrl: '',
    },
  });

  useEffect(() => {
    const fetchContactInfo = async () => {
      setIsLoading(true);
      try {
        const response = await readContactInfo();
        if (response.success && response.data) {
          // Ensure all fields, including optional ones, get a default value if not present in DB
          form.reset({
            addressLine1: response.data.addressLine1 || '',
            city: response.data.city || '',
            postalCode: response.data.postalCode || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
            facebookUrl: response.data.facebookUrl || '',
            instagramUrl: response.data.instagramUrl || '',
            twitterUrl: response.data.twitterUrl || '',
            youtubeUrl: response.data.youtubeUrl || '',
          });
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
    fetchContactInfo();
  }, [form, toast]); // form and toast are stable, fine for deps array

  const onSubmit = (values: ContactInfoFormValues) => {
    startTransition(async () => {
      // Ensure empty strings are passed if that's how schema expects to treat them as 'optional'
      const payload = {
        ...values,
        facebookUrl: values.facebookUrl || '',
        instagramUrl: values.instagramUrl || '',
        twitterUrl: values.twitterUrl || '',
        youtubeUrl: values.youtubeUrl || '',
      };
      const result = await updateContactInfo(payload);
      if (result.success) {
        toast({ title: 'Éxito', description: result.message || 'Información de contacto actualizada.' });
        if (result.data) {
          form.reset(result.data);
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
          <CardDescription>Actualiza los detalles de contacto y redes sociales que se mostrarán en la web.</CardDescription>
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
                      <Input placeholder="Ej: Calle Innovación 123, Local B" {...field} />
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
                        <Input placeholder="Ej: Tecnopolis" {...field} />
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
                        <Input placeholder="Ej: 08020" {...field} />
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
                      <Input type="email" placeholder="Ej: info@novaglow.example.com" {...field} />
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
                      <Input type="tel" placeholder="Ej: (+34) 930 987 654" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />
              <h3 className="text-lg font-medium text-foreground">Redes Sociales (Opcional)</h3>
              
              <FormField
                control={form.control}
                name="facebookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Facebook className="mr-2 h-4 w-4" /> URL de Facebook
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://facebook.com/tu_pagina" {...field} />
                    </FormControl>
                    <FormDescription>Dejar vacío si no se tiene.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instagramUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Instagram className="mr-2 h-4 w-4" /> URL de Instagram
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://instagram.com/tu_perfil" {...field} />
                    </FormControl>
                     <FormDescription>Dejar vacío si no se tiene.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="twitterUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Twitter className="mr-2 h-4 w-4" /> URL de Twitter/X
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://twitter.com/tu_usuario" {...field} />
                    </FormControl>
                     <FormDescription>Dejar vacío si no se tiene.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="youtubeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                     <Youtube className="mr-2 h-4 w-4" /> URL de YouTube
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://youtube.com/tu_canal" {...field} />
                    </FormControl>
                     <FormDescription>Dejar vacío si no se tiene.</FormDescription>
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

