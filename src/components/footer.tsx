import Link from 'next/link';
import { Gem, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-muted/30 border-t border-border/40">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Gem className="h-8 w-8 text-primary" />
              <span className="font-bold text-2xl text-foreground">Elegance Aesthetics</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Transformando belleza, realzando confianza. <br />
              Tu oasis de elegancia y bienestar.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li><Link href="#hero" className="text-sm text-muted-foreground hover:text-primary transition-colors">Inicio</Link></li>
              <li><Link href="#services" className="text-sm text-muted-foreground hover:text-primary transition-colors">Servicios</Link></li>
              <li><Link href="#gallery" className="text-sm text-muted-foreground hover:text-primary transition-colors">Galería</Link></li>
              <li><Link href="#appointment" className="text-sm text-muted-foreground hover:text-primary transition-colors">Agendar Cita</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Contacto</h3>
            <address className="not-italic text-sm text-muted-foreground space-y-2">
              <p>Calle Falsa 123, Ciudad Ejemplo, CP 08000</p>
              <p>Email: <a href="mailto:contacto@eleganceaesthetics.com" className="hover:text-primary transition-colors">contacto@eleganceaesthetics.com</a></p>
              <p>Teléfono: <a href="tel:+34900123456" className="hover:text-primary transition-colors">(+34) 900 123 456</a></p>
            </address>
            <div className="flex space-x-4 mt-6">
              <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors"><Facebook size={20} /></Link>
              <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors"><Instagram size={20} /></Link>
              <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors"><Twitter size={20} /></Link>
              <Link href="#" aria-label="Youtube" className="text-muted-foreground hover:text-primary transition-colors"><Youtube size={20} /></Link>
            </div>
          </div>
        </div>
        <div className="border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Elegance Aesthetics. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
