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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const ManageGalleryPage = () => {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newImageAlt, setNewImageAlt] = useState('');
  const [newImageCategory, setNewImageCategory] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching data or use initial data
    setGalleryImages(initialGalleryImages);
  }, []);


  const handleDeleteImage = (id: string) => {
    setGalleryImages((prevImages) => prevImages.filter((image) => image.id !== id));
    toast({
      title: 'Image Deleted',
      description: `Image with ID: ${id} has been removed.`,
      variant: 'default',
    });
  };

  const handleAddImage = () => {
    if (!newImageAlt.trim() || !newImageCategory.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide both alt text and category.',
        variant: 'destructive',
      });
      return;
    }

    const newId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const randomImageNumber = Math.floor(Math.random() * 100) + 10; // for unique picsum photos
    const dataAiHint = newImageAlt.trim().toLowerCase().split(/\s+/).slice(0, 2).join(' ');

    const newImage: GalleryImage = {
      id: newId,
      src: `https://picsum.photos/600/800?random=${randomImageNumber}`,
      alt: newImageAlt.trim(),
      category: newImageCategory.trim(),
      dataAiHint: dataAiHint || 'new image',
    };

    setGalleryImages((prevImages) => [newImage, ...prevImages]);
    toast({
      title: 'Image Added',
      description: `New image "${newImage.alt}" added successfully.`,
      variant: 'default',
    });
    setIsAddDialogOpen(false);
    setNewImageAlt('');
    setNewImageCategory('');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Manage Gallery Images</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New Image</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Gallery Image</DialogTitle>
              <DialogDescription>
                Fill in the details for the new image. A random placeholder image will be used.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="altText" className="text-right">
                  Alt Text
                </Label>
                <Input
                  id="altText"
                  value={newImageAlt}
                  onChange={(e) => setNewImageAlt(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., Beautiful sunset over mountains"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Input
                  id="category"
                  value={newImageCategory}
                  onChange={(e) => setNewImageCategory(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., Nature, Hair, Nails"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" onClick={handleAddImage}>Save Image</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
              <div className="relative w-full h-64"> {/* Increased height for better preview */}
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  style={{ objectFit: 'cover' }}
                  data-ai-hint={image.dataAiHint}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <p className="text-base font-semibold text-card-foreground truncate" title={image.alt}>{image.alt}</p>
                <p className="text-xs text-muted-foreground mb-2">Category: {image.category}</p>
                <p className="text-xs text-muted-foreground mb-2">Hint: {image.dataAiHint}</p>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDeleteImage(image.id)}
                  className="mt-auto w-full" // Ensure button is at the bottom and full width
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageGalleryPage;
