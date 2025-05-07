import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <section id="hero" className="relative w-full min-h-[calc(100vh-4rem)] flex items-center justify-center text-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/1920/1080"
          alt="Salón de belleza elegante"
          layout="fill"
          objectFit="cover"
          className="opacity-30"
          data-ai-hint="luxury salon interior"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background z-10" />
      </div>
      
      <div className="relative z-20 container mx-auto px-4 py-16">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground drop-shadow-md">
          Descubre tu <span className="text-primary">Belleza Interior</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
          En Elegance Aesthetics, combinamos arte y técnica para realzar tu esplendor natural. Experimenta servicios de lujo en un ambiente sofisticado.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="#appointment">Agendar una Cita</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-primary text-primary hover:bg-primary/10">
            <Link href="#services">Ver Servicios</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
