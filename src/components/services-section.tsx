import type { Service } from '@/lib/types';
import ServiceCard from './service-card';
import { readServices } from '@/lib/actions'; // Importar la server action

// Los datos estáticos se eliminarán o se usarán como fallback/semilla.
// export const servicesData: Service[] = [ ... ];

export default async function ServicesSection() {
  // Cargar servicios desde la base de datos
  const servicesResponse = await readServices();
  let servicesData: Service[] = [];

  if (servicesResponse.success && servicesResponse.data) {
    servicesData = servicesResponse.data;
  } else {
    // Manejar el caso de error, quizás mostrar un mensaje o usar datos de fallback
    console.error("Failed to load services:", servicesResponse.message);
    // Podrías tener aquí datos de fallback si es necesario:
    // servicesData = [ ... fallback data ... ];
  }

  return (
    <section id="services" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-4">
          Nuestros <span className="text-primary">Servicios Exclusivos</span>
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          Descubre la gama de tratamientos que hemos diseñado para ti, utilizando productos de alta calidad y las últimas tendencias.
        </p>
        {servicesData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicesData.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            No hay servicios disponibles en este momento. Por favor, vuelve más tarde.
          </p>
        )}
      </div>
    </section>
  );
}
