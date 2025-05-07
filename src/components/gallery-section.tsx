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

export const galleryImagesData: GalleryImage[] = [
  { id: 'nail1', src: 'https://picsum.photos/600/800?random=1', alt: 'Diseño de uñas elegante', category: 'Nails', dataAiHint: "nail art design" },
  { id: 'hair1', src: 'https://picsum.photos/600/800?random=2', alt: 'Peinado moderno', category: 'Hair', dataAiHint: "modern hairstyle" },
  { id: 'micro1', src: 'https://picsum.photos/600/800?random=3', alt: 'Resultado de microblading', category: 'Microblading', dataAiHint: "eyebrow microblading" },
  { id: 'facial1', src: 'https://picsum.photos/600/800?random=4', alt: 'Tratamiento facial rejuvenecedor', category: 'Aesthetics', dataAiHint: "facial treatment spa" },
  { id: 'nail2', src: 'https://picsum.photos/600/800?random=5', alt: 'Manicura francesa', category: 'Nails', dataAiHint: "french manicure" },
  { id: 'hair2', src: 'https://picsum.photos/600/800?random=6', alt: 'Corte de cabello estilizado', category: 'Hair', dataAiHint: "stylish haircut" },
  { id: 'micro2', src: 'https://picsum.photos/600/800?random=7', alt: 'Cejas con microblading', category: 'Microblading', dataAiHint: "perfect eyebrows" },
  { id: 'body1', src: 'https://picsum.photos/600/800?random=8', alt: 'Masaje relajante', category: 'Aesthetics', dataAiHint: "relaxing massage" },
];

export default function GallerySection() {
  return (
    <section id="gallery" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-4">
          Galería de <span className="text-primary">Transformaciones</span>
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          Inspírate con algunos de nuestros trabajos y visualiza tu próximo cambio de look.
        </p>
        <Carousel
          opts={{
            align: 'start',
            loop: true,
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
                        data-ai-hint={image.dataAiHint}
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
      </div>
    </section>
  );
}
