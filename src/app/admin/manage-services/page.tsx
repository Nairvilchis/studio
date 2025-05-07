'use client';

import { servicesData } from '@/components/services-section';
import type { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ManageServicesPage() {

  const services: Service[] = servicesData; // Using the dummy data for now

  const handleEdit = (service: Service) => {
    console.log('Edit service:', service);
    // Implement edit logic here (e.g., open a modal or navigate to an edit page)
  };

  const handleDelete = (serviceId: string) => {
    console.log('Delete service with ID:', serviceId);
    // Implement delete logic here (e.g., show a confirmation dialog and then delete via API)
  };

  const handleAddService = () => {
    console.log('Add new service');
    // Implement add service logic here (e.g., open a modal or navigate to a new service creation page)
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Manage Services</h1>

      <div className="flex justify-end mb-4">
        <Button onClick={handleAddService}>Add New Service</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => {
              const IconComponent = service.icon;
              return (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.description}</TableCell>
                  <TableCell>
                    <IconComponent className="h-5 w-5" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(service)} className="mr-2">
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(service.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
