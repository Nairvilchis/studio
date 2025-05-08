
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import type { GallerySectionContentData } from '@/lib/types';
import { readGallerySectionContent, updateGallerySectionContent } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';

const GallerySectionContentSchema = z.object({
  titlePrefix: z.string().min(1, "El prefijo del título es requerido."),
  titleHighlight: z.string().min(1, "El texto destacado del título es requerido."),
  description: z.string().min(1, "La descripción es requerida.").max(500, "La descripción no debe exceder los 500 caracteres."),
});

type GallerySectionContentFormValues = z.infer<typeof GallerySectionContentSchema>;

export default function ManageGallerySectionPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<GallerySectionContentFormValues>({
    resolver: zodResolver(GallerySectionContentSchema),
    defaultValues: {
      titlePrefix: '',
      titleHighlight: '',
      description: '',
    },
  });

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await readGallerySectionContent();
        if (response.success && response.data) {
          form.reset(response.data);
        } else {
          toast({ title: 'Error', description: response.message || 'No se pudo cargar el contenido de la sección de galería.', variant: 'destructive' });
        }
      } catch (error) {
        console.error('Error fetching gallery section content:', error);
        toast({ title: 'Error', description: 'No se pudo cargar el contenido.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [form, toast]);

  const onSubmit = (values: GallerySectionContentFormValues) => {
    startTransition(async () => {
      const result = await updateGallerySectionContent(values);
      if (result.success) {
        toast({ title: 'Éxito', description: result.message || 'Contenido actualizado.' });
        if (result.data) {
           form.reset(result.data);
        }
      } else {
        toast({ title: 'Error', description: result.message || 'No se pudo actualizar el contenido.', variant: 'destructive' });
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, errors]) => {
            form.setError(field as keyof GallerySectionContentFormValues, {
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
          <CardTitle className="text-2xl font-bold flex items-center">
            <ImageIcon className="mr-3 h-6 w-6 text-primary" />
            Gestionar Contenido de Sección "Galería"
          </CardTitle>
          <CardDescription>Actualiza el título y la descripción que se muestran en la sección de galería de la página de inicio.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Título de la Sección</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="titlePrefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prefijo del Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Galería de" {...field} />
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
                          <Input placeholder="Ej: Transformaciones" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción de la Sección</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ej: Inspírate con nuestros trabajos..." {...field} rows={5} />
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
