'use client';

import Image from 'next/image';
import type { GalleryImage } from '@/lib/types';
import { galleryImages as galleryImagesData } from '@/lib/data';
import { Button } from '@/components/ui/button';

const ManageGalleryPage = () => {
  const galleryImages: GalleryImage[] = galleryImagesData; // Replace with fetching logic

  const handleDeleteImage = (id: string) => {
    // Implement delete logic
    console.log('Deleting image with id:', id);
  };

  const handleAddImage = () => {
    // Implement add logic
    console.log('Adding new image');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Manage Gallery Images</h1>

      <Button className="mb-6" onClick={handleAddImage}>Add New Image</Button>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {galleryImages.map((image) => (
          <div key={image.id} className="border rounded-lg overflow-hidden shadow-md bg-card">
            <div className="relative w-full h-48">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                style={{ objectFit: 'cover' }}
                data-ai-hint={image.dataAiHint}
              />
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold text-card-foreground">{image.alt}</p>
              <p className="text-xs text-muted-foreground mb-2">{image.category}</p>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteImage(image.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageGalleryPage;
