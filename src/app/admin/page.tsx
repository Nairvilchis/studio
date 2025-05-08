
import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cog, Images, CalendarDays, Info } from "lucide-react"; // Added Info icon

const AdminPage: React.FC = () => {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold text-center mb-10 text-foreground">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Services Management Section */}
        <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col">
          <CardHeader className="flex flex-row items-center space-x-3 pb-4">
            <Cog className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl font-semibold text-foreground">
              Gestionar Servicios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
            <p className="text-muted-foreground">
              Añadir, editar o eliminar los servicios ofrecidos.
            </p>
            <Button asChild variant="outline" className="w-full mt-auto border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground">
              <Link href="/admin/manage-services">Ir a Servicios</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Gallery Management Section */}
        <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col">
          <CardHeader className="flex flex-row items-center space-x-3 pb-4">
            <Images className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl font-semibold text-foreground">
              Gestionar Galería
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
            <p className="text-muted-foreground">
              Administrar las imágenes de la galería.
            </p>
            <Button asChild variant="outline" className="w-full mt-auto border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground">
              <Link href="/admin/manage-gallery">Ir a Galería</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Appointments Management Section */}
        <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col">
          <CardHeader className="flex flex-row items-center space-x-3 pb-4">
            <CalendarDays className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl font-semibold text-foreground">
              Gestionar Citas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
            <p className="text-muted-foreground">
              Ver y administrar las citas de los clientes.
            </p>
            <Button asChild variant="outline" className="w-full mt-auto border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground">
              <Link href="/admin/manage-appointments">Ir a Citas</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Contact Info Management Section */}
        <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col">
          <CardHeader className="flex flex-row items-center space-x-3 pb-4">
            <Info className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl font-semibold text-foreground">
              Info. de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
            <p className="text-muted-foreground">
              Actualizar dirección, email y teléfono del negocio.
            </p>
            <Button asChild variant="outline" className="w-full mt-auto border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground">
              <Link href="/admin/manage-contact-info">Ir a Contacto</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
