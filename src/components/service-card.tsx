import type { Service } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import * as Icons from 'lucide-react';
import { HelpCircle, Image as ImageIconPlaceholder } from 'lucide-react'; // Fallback icon

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const IconComponent = (Icons as any)[service.iconName] || HelpCircle;
  
  const hasValidImageUrl = service.imageUrl && service.imageUrl.startsWith('https://');

  return (
    <Card className="flex flex-col h-full bg-card/80 backdrop-blur-sm shadow-md hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 ease-in-out">
      <CardHeader className="items-center text-center">
        {hasValidImageUrl ? (
          <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden border-2 border-primary/30 shadow-lg">
            <Image
              src={service.imageUrl!}
              alt={service.name}
              fill
              style={{ objectFit: 'cover' }}
              data-ai-hint={`${service.name.split(' ')[0].toLowerCase()} service`}
              onError={(e) => {
                // Fallback to icon if image fails to load
                (e.target as HTMLImageElement).style.display = 'none'; 
                // Optionally, you could show a placeholder icon here if the Image component is hidden
              }}
            />
             {/* Fallback Icon visible if image fails & display is set to none */}
            <div className={`absolute inset-0 flex items-center justify-center ${hasValidImageUrl ? 'hidden' : ''}`}>
                <IconComponent className="h-10 w-10 text-primary" />
            </div>
          </div>
        ) : (
          <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block">
            <IconComponent className="h-10 w-10 text-primary" />
          </div>
        )}
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
