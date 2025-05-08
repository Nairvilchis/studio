
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { readContactInfo } from '@/lib/actions';
import type { ContactInfo } from '@/lib/types';
import Image from 'next/image'; // Import Image component

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  
  let contactInfo: ContactInfo = { 
    addressLine1: "Calle Falsa 123",
    city: "Ciudad Ejemplo",
    postalCode: "08000",
    email: "contacto@novaglow.com",
    phone: "(+34) 900 123 456",
    facebookUrl: "#",
    instagramUrl: "#",
    twitterUrl: "#",
    youtubeUrl: "#",
  };

  const response = await readContactInfo();
  if (response.success && response.data) {
    contactInfo = {
        ...contactInfo, // Spread defaults first
        ...response.data, // Then override with fetched data
        // Ensure URLs have a fallback if they are empty strings from DB
        facebookUrl: response.data.facebookUrl || "#",
        instagramUrl: response.data.instagramUrl || "#",
        twitterUrl: response.data.twitterUrl || "#",
        youtubeUrl: response.data.youtubeUrl || "#",
    };
  } else {
    console.warn("Could not load contact info for footer, using defaults. Message:", response.message);
  }


  return (
    <footer className="bg-card/50 border-t border-border/40">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 items-start">
          
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <Image 
                src="https://live.staticflickr.com/65535/54503507872_f9dc874b84_b.jpg" 
                alt="Nova Glow Logo" 
                width={40} 
                height={40} 
                className="rounded-full"
                data-ai-hint="company logo"
              />
              <span className="font-bold text-2xl text-foreground">Nova Glow</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Transformando belleza, realzando confianza. <br />
              Tu oasis de elegancia y bienestar.
            </p>
          </div>
  
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold text-foreground mb-4">Contacto</h3>
            <address className="not-italic text-sm text-muted-foreground space-y-2">
              <p>{contactInfo.addressLine1}, {contactInfo.city}, CP {contactInfo.postalCode}</p>
              <p>Email: <a href={`mailto:${contactInfo.email}`} className="hover:text-primary transition-colors">{contactInfo.email}</a></p>
              <p>Teléfono: <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="hover:text-primary transition-colors">{contactInfo.phone}</a> </p>
            </address>
          </div>

          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold text-foreground mb-4">Síguenos</h3>
            <div className="flex space-x-4">
              <Link href={contactInfo.facebookUrl || '#'} aria-label="Facebook" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Facebook size={20} /></Link>
              <Link href={contactInfo.instagramUrl || '#'} aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Instagram size={20} /></Link>
              <Link href={contactInfo.twitterUrl || '#'} aria-label="Twitter" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Twitter size={20} /></Link>
              <Link href={contactInfo.youtubeUrl || '#'} aria-label="Youtube" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Youtube size={20} /></Link>
            </div>
          </div>

        </div>
        <div className="border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Nova Glow. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

