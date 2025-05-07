import Header from '@/components/header';
import HeroSection from '@/components/hero-section';
import ServicesSection from '@/components/services-section';
import GallerySection from '@/components/gallery-section';
import AppointmentForm from '@/components/appointment-form';
import Footer from '@/components/footer';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <HeroSection />
        <ServicesSection />
        <GallerySection />
        <AppointmentForm />
      </main>
      <Footer />
    </div>
  );
}
