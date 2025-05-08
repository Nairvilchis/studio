import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { readHeroContent } from '@/lib/actions';
import type { HeroContentData } from '@/lib/types';

export default async function HeroSection() {
  const response = await readHeroContent();
  let heroData: HeroContentData;

  if (response.success && response.data) {
    heroData = response.data;
  } else {
    // Fallback data if fetching fails or no data is present
    console.warn("Failed to load hero content, using fallback data. Message:", response.message);
    heroData = {
      titlePrefix: "Descubre tu",
      titleHighlight: "Belleza Radiante",
      subtitle: "En Nova Glow, combinamos arte y técnica para realzar tu esplendor natural. Experimenta servicios de lujo en un ambiente sofisticado y acogedor.",
      primaryButtonText: "Agendar una Cita",
      primaryButtonLink: "#appointment",
      secondaryButtonText: "Ver Servicios",
      secondaryButtonLink: "#services",
      backgroundImageUrl: "https://picsum.photos/1920/1080?random=10",
    };
  }
  
  const bgImageUrl = heroData.backgroundImageUrl || "https://picsum.photos/1920/1080?random=10";


  return (
    <section id="hero" className="relative w-full min-h-[calc(100vh-4rem)] flex items-center justify-center text-center overflow-hidden bg-gradient-to-br from-background to-muted/20">
      <div className="absolute inset-0 z-0">
        <Image
          src={bgImageUrl}
          alt="Salón de belleza elegante y moderno con tonos dorados y oscuros"
          layout="fill"
          objectFit="cover"
          className="opacity-20 blur-sm"
          data-ai-hint="luxury salon background"
          priority
          key={bgImageUrl} // Add key to force re-render if URL changes
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background z-10" />
      </div>
      
      <div className="relative z-20 container mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary/70 drop-shadow-lg leading-tight">
          {heroData.titlePrefix} <span className="block md:inline">{heroData.titleHighlight}</span>
        </h1>
        <p className="mt-8 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground/90 leading-relaxed">
          {heroData.subtitle}
        </p>
        <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-6">
          <Button asChild size="lg" className="text-lg px-10 py-7 shadow-lg hover:shadow-primary/30 transition-all duration-300 transform hover:scale-105">
            <Link href={heroData.primaryButtonLink}>{heroData.primaryButtonText}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-10 py-7 border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground shadow-md hover:shadow-primary/20 transition-all duration-300 transform hover:scale-105">
            <Link href={heroData.secondaryButtonLink}>{heroData.secondaryButtonText}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
