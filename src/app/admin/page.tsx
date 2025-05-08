
import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cog, Images, CalendarDays, Info, LayoutPanelTop, TypeIcon } from "lucide-react"; // Added TypeIcon

const AdminPage: React.FC = () => {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold text-center mb-10 text-foreground">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col">
          <CardHeader className="flex flex-row items-center space-x-3 pb-4">
            <LayoutPanelTop className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl font-semibold text-foreground">
              Sección Principal (Hero)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
            <p className="text-muted-foreground">
              Editar el contenido de la sección principal (hero).
            </p>
            <Button asChild variant="outline" className="w-full mt-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200">
              <Link href="/admin/manage-hero">Gestionar Hero</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col">
          <CardHeader className="flex flex-row items-center space-x-3 pb-4">
            <TypeIcon className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl font-semibold text-foreground">
              Contenido Sección Servicios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
            <p className="text-muted-foreground">
              Editar título y descripción de la sección de servicios.
            </p>
            <Button asChild variant="outline" className="w-full mt-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200">
              <Link href="/admin/manage-services-section">Gestionar Contenido</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col">
          <CardHeader className="flex flex-row items-center space-x-3 pb-4">
            <Cog className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl font-semibold text-foreground">
              Gestionar Servicios (CRUD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
            <p className="text-muted-foreground">
              Añadir, editar o eliminar los servicios ofrecidos.
            </p>
            <Button asChild variant="outline" className="w-full mt-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200">
              <Link href="/admin/manage-services">Gestionar Servicios</Link>
            </Button>
          </CardContent>
        </Card>

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
            <Button asChild variant="outline" className="w-full mt-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200">
              <Link href="/admin/manage-gallery">Gestionar Galería</Link>
            </Button>
          </CardContent>
        </Card>

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
            <Button asChild variant="outline" className="w-full mt-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200">
              <Link href="/admin/manage-appointments">Gestionar Citas</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col">
          <CardHeader className="flex flex-row items-center space-x-3 pb-4">
            <Info className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl font-semibold text-foreground">
              Info. de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
            <p className="text-muted-foreground">
              Actualizar datos de contacto y redes sociales.
            </p>
            <Button asChild variant="outline" className="w-full mt-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200">
              <Link href="/admin/manage-contact-info">Gestionar Contacto</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
