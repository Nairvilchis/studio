import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <section id="hero" className="relative w-full min-h-[calc(100vh-4rem)] flex items-center justify-center text-center overflow-hidden bg-gradient-to-br from-background to-muted/20">
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/1920/1080?random=10"
          alt="Salón de belleza elegante y moderno con tonos dorados y oscuros"
          layout="fill"
          objectFit="cover"
          className="opacity-20 blur-sm"
          data-ai-hint="luxury salon background"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background z-10" />
      </div>
      
      <div className="relative z-20 container mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary/70 drop-shadow-lg leading-tight">
          Descubre tu <span className="block md:inline">Belleza Radiante</span>
        </h1>
        <p className="mt-8 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground/90 leading-relaxed">
          En <span className="font-semibold text-primary">Nova Glow</span>, combinamos arte y técnica para realzar tu esplendor natural. Experimenta servicios de lujo en un ambiente sofisticado y acogedor.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-6">
          <Button asChild size="lg" className="text-lg px-10 py-7 shadow-lg hover:shadow-primary/30 transition-all duration-300 transform hover:scale-105">
            <Link href="#appointment">Agendar una Cita</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-10 py-7 border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground shadow-md hover:shadow-primary/20 transition-all duration-300 transform hover:scale-105">
            <Link href="#services">Ver Servicios</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
