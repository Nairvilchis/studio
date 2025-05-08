
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import type { HeroContentData } from '@/lib/types';
import { readHeroContent, updateHeroContent } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const HeroContentSchema = z.object({
  titlePrefix: z.string().min(1, "El prefijo del título es requerido."),
  titleHighlight: z.string().min(1, "El texto destacado del título es requerido."),
  subtitle: z.string().min(1, "El subtítulo es requerido.").max(300, "El subtítulo no debe exceder los 300 caracteres."),
  primaryButtonText: z.string().min(1, "El texto del botón principal es requerido."),
  primaryButtonLink: z.string().min(1, "El enlace del botón principal es requerido.")
    .refine(value => value.startsWith('#') || value.startsWith('/') || /^https?:\/\//.test(value), {
      message: "El enlace debe ser una ruta relativa (ej: /servicios, #contacto) o una URL completa (ej: https://ejemplo.com)."
    }),
  secondaryButtonText: z.string().min(1, "El texto del botón secundario es requerido."),
  secondaryButtonLink: z.string().min(1, "El enlace del botón secundario es requerido.")
    .refine(value => value.startsWith('#') || value.startsWith('/') || /^https?:\/\//.test(value), {
      message: "El enlace debe ser una ruta relativa (ej: /servicios, #contacto) o una URL completa (ej: https://ejemplo.com)."
    }),
  backgroundImageUrl: z.string().url("Debe ser una URL válida para la imagen de fondo.").optional().or(z.literal('')),
});

type HeroContentFormValues = z.infer<typeof HeroContentSchema>;

export default function ManageHeroContentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<HeroContentFormValues>({
    resolver: zodResolver(HeroContentSchema),
    defaultValues: {
      titlePrefix: '',
      titleHighlight: '',
      subtitle: '',
      primaryButtonText: '',
      primaryButtonLink: '',
      secondaryButtonText: '',
      secondaryButtonLink: '',
      backgroundImageUrl: '',
    },
  });

  useEffect(() => {
    const fetchHeroContent = async () => {
      setIsLoading(true);
      try {
        const response = await readHeroContent();
        if (response.success && response.data) {
          form.reset({
            titlePrefix: response.data.titlePrefix || '',
            titleHighlight: response.data.titleHighlight || '',
            subtitle: response.data.subtitle || '',
            primaryButtonText: response.data.primaryButtonText || '',
            primaryButtonLink: response.data.primaryButtonLink || '',
            secondaryButtonText: response.data.secondaryButtonText || '',
            secondaryButtonLink: response.data.secondaryButtonLink || '',
            backgroundImageUrl: response.data.backgroundImageUrl || '',
          });
        } else {
          toast({ title: 'Error', description: response.message || 'No se pudo cargar el contenido del hero.', variant: 'destructive' });
        }
      } catch (error) {
        console.error('Error fetching hero content:', error);
        toast({ title: 'Error', description: 'No se pudo cargar el contenido del hero.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchHeroContent();
  }, [form, toast]);

  const onSubmit = (values: HeroContentFormValues) => {
    startTransition(async () => {
      const payload = {
        ...values,
        backgroundImageUrl: values.backgroundImageUrl || '', 
      };
      const result = await updateHeroContent(payload);
      if (result.success) {
        toast({ title: 'Éxito', description: result.message || 'Contenido del hero actualizado.' });
        if (result.data) {
           form.reset({ // Reset form with potentially updated/defaulted values from backend
            titlePrefix: result.data.titlePrefix || '',
            titleHighlight: result.data.titleHighlight || '',
            subtitle: result.data.subtitle || '',
            primaryButtonText: result.data.primaryButtonText || '',
            primaryButtonLink: result.data.primaryButtonLink || '',
            secondaryButtonText: result.data.secondaryButtonText || '',
            secondaryButtonLink: result.data.secondaryButtonLink || '',
            backgroundImageUrl: result.data.backgroundImageUrl || '',
          });
        }
      } else {
        toast({ title: 'Error', description: result.message || 'No se pudo actualizar el contenido del hero.', variant: 'destructive' });
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, errors]) => {
            form.setError(field as keyof HeroContentFormValues, {
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
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <Edit className="mr-3 h-6 w-6 text-primary" />
            Gestionar Contenido de la Sección Principal (Hero)
          </CardTitle>
          <CardDescription>Actualiza los textos y enlaces que se muestran en la sección principal de la página de inicio.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Título Principal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="titlePrefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prefijo del Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Descubre tu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="titleHighlight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto Destacado</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Belleza Radiante" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtítulo</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ej: En Nova Glow, combinamos arte y técnica..." {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />
              <h3 className="text-lg font-medium text-foreground">Botones de Acción</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="primaryButtonText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto Botón Principal</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Agendar una Cita" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primaryButtonLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enlace Botón Principal</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: #appointment o /contacto" {...field} />
                      </FormControl>
                      <FormDescription>Usar #ancla, /ruta-interna o URL completa.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="secondaryButtonText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto Botón Secundario</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Ver Servicios" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondaryButtonLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enlace Botón Secundario</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: #services o /galeria" {...field} />
                      </FormControl>
                      <FormDescription>Usar #ancla, /ruta-interna o URL completa.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              <h3 className="text-lg font-medium text-foreground">Imagen de Fondo</h3>
               <FormField
                control={form.control}
                name="backgroundImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de Imagen de Fondo</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://ejemplo.com/imagen-hero.jpg" {...field} />
                    </FormControl>
                    <FormDescription>Opcional. Si se deja vacío, se usará una imagen por defecto.</FormDescription>
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

