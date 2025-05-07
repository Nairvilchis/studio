import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { GalleryImage } from '@/lib/types';
import { readGalleryImages } from '@/lib/actions'; // Importar la server action

// Los datos estáticos se eliminarán o se usarán como fallback/semilla.
// export const galleryImagesData: GalleryImage[] = [ ... ];

export default async function GallerySection() {
  // Cargar imágenes de la galería desde la base de datos
  const galleryResponse = await readGalleryImages();
  let galleryImagesData: GalleryImage[] = [];

  if (galleryResponse.success && galleryResponse.data) {
    galleryImagesData = galleryResponse.data;
  } else {
    // Manejar el caso de error
    console.error("Failed to load gallery images:", galleryResponse.message);
    // galleryImagesData = [ ... fallback data ... ];
  }
  
  return (
    <section id="gallery" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-4">
          Galería de <span className="text-primary">Transformaciones</span>
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          Inspírate con algunos de nuestros trabajos y visualiza tu próximo cambio de look.
        </p>
        {galleryImagesData.length > 0 ? (
          <Carousel
            opts={{
              align: 'start',
              loop: galleryImagesData.length > 3, // Solo hacer loop si hay suficientes imágenes
            }}
            className="w-full max-w-xs sm:max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto"
          >
            <CarouselContent>
              {galleryImagesData.map((image) => (
                <CarouselItem key={image.id} className="sm:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <Card className="overflow-hidden shadow-lg hover:shadow-primary/20 transition-all duration-300 ease-in-out transform hover:scale-105">
                      <CardContent className="flex aspect-[3/4] items-center justify-center p-0">
                        <Image
                          src={image.src}
                          alt={image.alt}
                          width={600}
                          height={800}
                          className="object-cover w-full h-full"
                          data-ai-hint={image.dataAiHint || image.alt.split(' ').slice(0,2).join(' ')}
                           onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${image.id}/600/800`;
                            (e.target as HTMLImageElement).alt = 'Error loading image - placeholder shown';
                          }}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex bg-card/70 hover:bg-accent hover:text-accent-foreground border-primary text-primary" />
            <CarouselNext className="hidden sm:flex bg-card/70 hover:bg-accent hover:text-accent-foreground border-primary text-primary" />
          </Carousel>
        ) : (
          <p className="text-center text-muted-foreground">
            Nuestra galería está vacía por el momento. ¡Vuelve pronto para ver nuestras transformaciones!
          </p>
        )}
      </div>
    </section>
  );
}
