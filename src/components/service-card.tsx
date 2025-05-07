import type { Service } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const IconComponent = service.icon;
  return (
    <Card className="flex flex-col h-full bg-card/80 backdrop-blur-sm shadow-md hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 ease-in-out">
      <CardHeader className="items-center text-center">
        <div className="p-4 bg-primary/10 rounded-full mb-4">
          <IconComponent className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl font-semibold text-foreground">{service.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow text-center">
        <CardDescription className="text-muted-foreground mb-6 text-base">
          {service.description}
        </CardDescription>
      </CardContent>
      <div className="p-6 pt-0 mt-auto">
        <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground">
          <Link href="#appointment">Saber Más</Link>
        </Button>
      </div>
    </Card>
  );
}
