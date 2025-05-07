import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cog, Images, CalendarDays } from "lucide-react";

const AdminPage: React.FC = () => {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold text-center mb-10 text-foreground">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Services Management Section */}
        <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col">
          <CardHeader className="flex flex-row items-center space-x-3 pb-4">
            <Cog className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl font-semibold text-foreground">
              Manage Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
            <p className="text-muted-foreground">
              Manage the services offered, including adding new ones, editing
              existing services, or removing outdated ones.
            </p>
            <Button asChild variant="outline" className="w-full mt-auto border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground">
              <Link href="/admin/manage-services">Go to Manage Services</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Gallery Management Section */}
        <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col">
          <CardHeader className="flex flex-row items-center space-x-3 pb-4">
            <Images className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl font-semibold text-foreground">
              Manage Gallery Images
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
            <p className="text-muted-foreground">
              Manage the images displayed in the gallery, add new ones, or
              remove unwanted images.
            </p>
            <Button asChild variant="outline" className="w-full mt-auto border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground">
              <Link href="/admin/manage-gallery">Go to Manage Gallery</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Appointments Management Section */}
        <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col">
          <CardHeader className="flex flex-row items-center space-x-3 pb-4">
            <CalendarDays className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl font-semibold text-foreground">
              Manage Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
            <p className="text-muted-foreground">
              View, approve, or reject pending appointments and manage the
              appointment calendar.
            </p>
            <Button asChild variant="outline" className="w-full mt-auto border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground">
              <Link href="/admin/manage-appointments">
                Go to Manage Appointments
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
