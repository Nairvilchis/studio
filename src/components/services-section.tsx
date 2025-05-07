import type { Service } from '@/lib/types';
import ServiceCard from './service-card';
// Icons are now referenced by name (string)
// import { Paintbrush, Scissors, PenTool, Sparkles, Waves } from 'lucide-react';

export const servicesData: Service[] = [
  {
    id: 'nails',
    name: 'Manicura y Pedicura',
    description: 'Diseños creativos y cuidado experto para tus uñas, manos y pies.',
    iconName: 'Paintbrush',
  },
  {
    id: 'hair',
    name: 'Peluquería Profesional',
    description: 'Cortes, coloración y peinados vanguardistas que realzan tu belleza natural.',
    iconName: 'Scissors',
  },
  {
    id: 'microblading',
    name: 'Microblading de Cejas',
    description: 'Cejas perfectas, definidas y naturales con técnicas de micropigmentación avanzadas.',
    iconName: 'PenTool',
  },
  {
    id: 'facial',
    name: 'Tratamientos Faciales',
    description: 'Rejuvenece e ilumina tu piel con nuestros tratamientos personalizados y efectivos.',
    iconName: 'Sparkles',
  },
  {
    id: 'body',
    name: 'Tratamientos Corporales',
    description: 'Relájate y revitaliza tu cuerpo con terapias exclusivas y masajes relajantes.',
    iconName: 'Waves', // Using Waves as a proxy for spa/body treatments
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-4">
          Nuestros <span className="text-primary">Servicios Exclusivos</span>
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          Descubre la gama de tratamientos que hemos diseñado para ti, utilizando productos de alta calidad y las últimas tendencias.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesData.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}
