
'use client';

import Image from 'next/image';
import type { GalleryImage } from '@/lib/types';
import { createGalleryImage, readGalleryImages, updateGalleryImage, deleteGalleryImage } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, PlusCircle, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const ManageGalleryPage = () => {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<GalleryImage | null>(null); // null for add, object for edit

  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImageAlt, setFormImageAlt] = useState('');
  const [formImageCategory, setFormImageCategory] = useState('');
  const [formImageDataAiHint, setFormDataAiHint] = useState('');


  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchGalleryImages = async () => {
    setIsLoading(true);
    try {
      const response = await readGalleryImages();
      if (response.success && response.data) {
        setGalleryImages(response.data);
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to fetch gallery images.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      toast({ title: 'Error', description: 'Failed to fetch gallery images.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const resetFormFields = () => {
    setFormImageUrl('');
    setFormImageAlt('');
    setFormImageCategory('');
    setFormDataAiHint('');
    setCurrentImage(null);
  };

  const handleOpenAddDialog = () => {
    resetFormFields();
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (image: GalleryImage) => {
    setCurrentImage(image);
    setFormImageUrl(image.src);
    setFormImageAlt(image.alt);
    setFormImageCategory(image.category);
    setFormDataAiHint(image.dataAiHint || '');
    setIsFormDialogOpen(true);
  };

  const handleDeleteImage = (id: string) => {
    startTransition(async () => {
      const result = await deleteGalleryImage(id);
      if (result.success) {
        await fetchGalleryImages();
        toast({
          title: 'Imagen Eliminada',
          description: result.message,
          variant: 'default',
        });
      } else {
        toast({ title: 'Error', description: result.message || 'No se pudo eliminar la imagen.', variant: 'destructive'});
      }
    });
  };

  const handleSaveImage = () => {
    if (!formImageAlt.trim() || !formImageCategory.trim() || !formImageUrl.trim()) {
      toast({
        title: 'Error de Validación',
        description: 'URL de imagen, texto alternativo y categoría son requeridos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      new URL(formImageUrl);
    } catch (_) {
      toast({
        title: 'URL Inválida',
        description: 'Por favor, introduce una URL de imagen válida.',
        variant: 'destructive',
      });
      return;
    }

    const imageData = {
      src: formImageUrl.trim(),
      alt: formImageAlt.trim(),
      category: formImageCategory.trim(),
      dataAiHint: formImageDataAiHint.trim() || formImageAlt.trim().toLowerCase().split(/\s+/).slice(0, 2).join(' '),
    };

    startTransition(async () => {
      let result;
      if (currentImage && currentImage.id) {
        // Edit mode
        result = await updateGalleryImage(currentImage.id, imageData);
      } else {
        // Add mode
        result = await createGalleryImage(imageData);
      }

      if (result.success) {
        await fetchGalleryImages();
        toast({
          title: currentImage ? 'Imagen Actualizada' : 'Imagen Añadida',
          description: result.message,
          variant: 'default',
        });
        setIsFormDialogOpen(false);
        resetFormFields();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'No se pudo guardar la imagen.',
          variant: 'destructive',
        });
      }
    });
  };


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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Gestionar Imágenes de Galería</h1>
        <Button onClick={handleOpenAddDialog} disabled={isPending}>
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nueva Imagen
        </Button>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => { setIsFormDialogOpen(isOpen); if (!isOpen) resetFormFields();}}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentImage ? 'Editar Imagen de Galería' : 'Añadir Nueva Imagen de Galería'}</DialogTitle>
            <DialogDescription>
              {currentImage ? 'Actualiza los detalles de la imagen.' : 'Completa los detalles para la nueva imagen. Proporciona una URL para la fuente de la imagen.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageUrl" className="text-right">
                URL Imagen
              </Label>
              <Input
                id="imageUrl"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                className="col-span-3"
                placeholder="https://picsum.photos/600/800"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="altText" className="text-right">
                Texto Alt
              </Label>
              <Input
                id="altText"
                value={formImageAlt}
                onChange={(e) => setFormImageAlt(e.target.value)}
                className="col-span-3"
                placeholder="Ej: Diseño de uñas elegante"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Categoría
              </Label>
              <Input
                id="category"
                value={formImageCategory}
                onChange={(e) => setFormImageCategory(e.target.value)}
                className="col-span-3"
                placeholder="Ej: Nails, Hair, Microblading"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dataAiHint" className="text-right">
                AI Hint
              </Label>
              <Input
                id="dataAiHint"
                value={formImageDataAiHint}
                onChange={(e) => setFormDataAiHint(e.target.value)}
                className="col-span-3"
                placeholder="Ej: nail art (opcional)"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSaveImage} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentImage ? 'Guardar Cambios' : 'Guardar Imagen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
         <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      ) : galleryImages.length === 0 ? (
         <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              No hay imágenes en la galería. Haz clic en "Añadir Nueva Imagen" para empezar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {galleryImages.map((image) => (
            <div key={image.id} className="border rounded-lg overflow-hidden shadow-md bg-card flex flex-col">
              <div className="relative w-full h-64">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  style={{ objectFit: 'cover' }}
                  data-ai-hint={image.dataAiHint || image.alt.split(' ').slice(0,2).join(' ')}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${image.id}/600/800`;
                    (e.target as HTMLImageElement).alt = 'Error al cargar imagen - placeholder mostrado';
                  }}
                />
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <p className="text-base font-semibold text-card-foreground truncate" title={image.alt}>{image.alt}</p>
                <p className="text-xs text-muted-foreground mb-1">Categoría: {image.category}</p>
                {image.dataAiHint && <p className="text-xs text-muted-foreground mb-3">Hint: {image.dataAiHint}</p>}
                <div className="mt-auto flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOpenEditDialog(image)}
                    className="flex-1"
                    disabled={isPending}
                  >
                    <Pencil className="mr-2 h-3 w-3" /> Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="flex-1"
                        disabled={isPending}
                      >
                         <Trash2 className="mr-2 h-3 w-3" /> Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente la imagen de la galería.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteImage(image.id)} disabled={isPending}>
                          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageGalleryPage;
