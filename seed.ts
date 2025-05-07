import mongoose from 'mongoose';
import { Service } from './src/models/Service';
import { GalleryImage } from './src/models/GalleryImage';
import { Appointment } from './src/models/Appointment';
import connectToDatabase from './src/lib/mongodb'; // Asegúrate que la ruta es correcta
import dotenv from 'dotenv';

dotenv.config(); // Carga variables de entorno desde .env

const sampleServices = [
  {
    name: 'Manicura y Pedicura Deluxe',
    description: 'Diseños creativos y cuidado experto para tus uñas, manos y pies. Incluye exfoliación e hidratación profunda.',
    iconName: 'Paintbrush', // Nombre del icono de Lucide
  },
  {
    name: 'Peluquería Profesional Premium',
    description: 'Cortes, coloración vanguardista y peinados que realzan tu belleza natural. Asesoramiento personalizado.',
    iconName: 'Scissors',
  },
  {
    name: 'Microblading y Diseño de Cejas',
    description: 'Cejas perfectas, definidas y naturales con técnicas de micropigmentación avanzadas y diseño personalizado.',
    iconName: 'PenTool',
  },
  {
    name: 'Tratamientos Faciales Rejuvenecedores',
    description: 'Rejuvenece e ilumina tu piel con nuestros tratamientos personalizados y efectivos. Diagnóstico facial incluido.',
    iconName: 'Sparkles',
  },
  {
    name: 'Tratamientos Corporales Relajantes',
    description: 'Relájate y revitaliza tu cuerpo con terapias exclusivas, envolturas y masajes relajantes.',
    iconName: 'Waves',
  },
];

const sampleGalleryImages = [
  {
    src: 'https://picsum.photos/seed/gallery_nails_1/600/800',
    alt: 'Esmaltado semipermanente con diseño floral',
    category: 'Nails',
    dataAiHint: 'floral nails',
  },
  {
    src: 'https://picsum.photos/seed/gallery_hair_1/600/800',
    alt: 'Corte bob asimétrico con mechas balayage',
    category: 'Hair',
    dataAiHint: 'bob haircut balayage',
  },
  {
    src: 'https://picsum.photos/seed/gallery_micro_1/600/800',
    alt: 'Cejas con microblading antes y después',
    category: 'Microblading',
    dataAiHint: 'eyebrows before after',
  },
  {
    src: 'https://picsum.photos/seed/gallery_facial_1/600/800',
    alt: 'Mujer recibiendo un tratamiento facial con mascarilla de oro',
    category: 'Aesthetics',
    dataAiHint: 'gold facial mask',
  },
  {
    src: 'https://picsum.photos/seed/gallery_body_1/600/800',
    alt: 'Persona disfrutando de un masaje de piedras calientes',
    category: 'Aesthetics',
    dataAiHint: 'hot stone massage',
  },
];

const sampleAppointments = [
  {
    name: 'Laura Martínez',
    email: 'laura.martinez@example.com',
    phone: '600123123',
    service: 'Manicura y Pedicura Deluxe',
    date: new Date('2024-08-15T10:00:00.000Z'),
    time: '10:00',
    message: 'Quisiera un diseño especial para una boda.',
    status: 'pending',
  },
  {
    name: 'Carlos Gómez',
    email: 'carlos.gomez@example.com',
    phone: '600456456',
    service: 'Peluquería Profesional Premium',
    date: new Date('2024-08-16T14:30:00.000Z'),
    time: '14:30',
    status: 'confirmed',
  },
  {
    name: 'Ana Pérez',
    email: 'ana.perez@example.com',
    phone: '600789789',
    service: 'Microblading y Diseño de Cejas',
    date: new Date('2024-08-17T11:00:00.000Z'),
    time: '11:00',
    message: 'Primera vez, un poco nerviosa pero emocionada.',
    status: 'pending',
  },
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Database connected successfully.');

    console.log('Clearing existing data...');
    await Service.deleteMany({});
    await GalleryImage.deleteMany({});
    await Appointment.deleteMany({});
    console.log('Existing data cleared.');

    console.log('Inserting sample services...');
    await Service.insertMany(sampleServices);
    console.log(`${sampleServices.length} services inserted.`);

    console.log('Inserting sample gallery images...');
    await GalleryImage.insertMany(sampleGalleryImages);
    console.log(`${sampleGalleryImages.length} gallery images inserted.`);
    
    console.log('Inserting sample appointments...');
    await Appointment.insertMany(sampleAppointments);
    console.log(`${sampleAppointments.length} appointments inserted.`);

    console.log('Sample data inserted successfully.');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    console.log('Disconnecting from database...');
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

seedDatabase();
