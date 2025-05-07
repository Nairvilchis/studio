
'use client';

import Image from 'next/image';
import type { GalleryImage } from '@/lib/types';
import { galleryImages as initialGalleryImages } from '@/lib/data';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, PlusCircle } from 'lucide-react';

const ManageGalleryPage = () => {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null); // null for add, id for edit

  // Form fields state
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImageAlt, setFormImageAlt] = useState('');
  const [formImageCategory, setFormImageCategory] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    setGalleryImages(initialGalleryImages);
  }, []);

  const resetFormFields = () => {
    setFormImageUrl('');
    setFormImageAlt('');
    setFormImageCategory('');
    setCurrentImageId(null);
  };

  const handleOpenAddDialog = () => {
    resetFormFields();
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (image: GalleryImage) => {
    setCurrentImageId(image.id);
    setFormImageUrl(image.src);
    setFormImageAlt(image.alt);
    setFormImageCategory(image.category);
    setIsFormDialogOpen(true);
  };

  const handleDeleteImage = (id: string) => {
    setGalleryImages((prevImages) => prevImages.filter((image) => image.id !== id));
    toast({
      title: 'Image Deleted',
      description: `Image with ID: ${id} has been removed.`,
      variant: 'default',
    });
  };

  const handleSaveImage = () => {
    if (!formImageAlt.trim() || !formImageCategory.trim() || !formImageUrl.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide alt text, category, and a valid image URL.',
        variant: 'destructive',
      });
      return;
    }

    try {
      new URL(formImageUrl);
    } catch (_) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid image URL.',
        variant: 'destructive',
      });
      return;
    }

    const dataAiHint = formImageAlt.trim().toLowerCase().split(/\s+/).slice(0, 2).join(' ');

    if (currentImageId) {
      // Edit mode
      setGalleryImages((prevImages) =>
        prevImages.map((img) =>
          img.id === currentImageId
            ? {
                ...img,
                src: formImageUrl.trim(),
                alt: formImageAlt.trim(),
                category: formImageCategory.trim(),
                dataAiHint: dataAiHint || 'updated image',
              }
            : img
        )
      );
      toast({
        title: 'Image Updated',
        description: `Image "${formImageAlt.trim()}" updated successfully.`,
        variant: 'default',
      });
    } else {
      // Add mode
      const newId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newImage: GalleryImage = {
        id: newId,
        src: formImageUrl.trim(),
        alt: formImageAlt.trim(),
        category: formImageCategory.trim(),
        dataAiHint: dataAiHint || 'new image',
      };
      setGalleryImages((prevImages) => [newImage, ...prevImages]);
      toast({
        title: 'Image Added',
        description: `New image "${newImage.alt}" added successfully.`,
        variant: 'default',
      });
    }

    setIsFormDialogOpen(false);
    resetFormFields();
  };


  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Manage Gallery Images</h1>
        <Button onClick={handleOpenAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Image
        </Button>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => { setIsFormDialogOpen(isOpen); if (!isOpen) resetFormFields();}}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentImageId ? 'Edit Gallery Image' : 'Add New Gallery Image'}</DialogTitle>
            <DialogDescription>
              {currentImageId ? 'Update the details for the image.' : 'Fill in the details for the new image. Provide a URL for the image source.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageUrl" className="text-right">
                Image URL
              </Label>
              <Input
                id="imageUrl"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                className="col-span-3"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="altText" className="text-right">
                Alt Text
              </Label>
              <Input
                id="altText"
                value={formImageAlt}
                onChange={(e) => setFormImageAlt(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Beautiful sunset"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                id="category"
                value={formImageCategory}
                onChange={(e) => setFormImageCategory(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Nature, Hair, Nails"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSaveImage}>{currentImageId ? 'Save Changes' : 'Save Image'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {galleryImages.length === 0 ? (
         <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              No images in the gallery yet. Click "Add New Image" to get started.
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
                  data-ai-hint={image.dataAiHint}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${image.id}/600/800`;
                    (e.target as HTMLImageElement).alt = 'Error loading image - placeholder shown';
                  }}
                />
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <p className="text-base font-semibold text-card-foreground truncate" title={image.alt}>{image.alt}</p>
                <p className="text-xs text-muted-foreground mb-1">Category: {image.category}</p>
                <p className="text-xs text-muted-foreground mb-3">Hint: {image.dataAiHint}</p>
                <div className="mt-auto flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOpenEditDialog(image)}
                    className="flex-1"
                  >
                    <Pencil className="mr-2 h-3 w-3" /> Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteImage(image.id)}
                    className="flex-1"
                  >
                    Delete
                  </Button>
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
