'use client';

import React, { useState, useEffect } from 'react';
import type { Service } from '@/lib/types';
import { servicesData as initialServicesData } from '@/components/services-section';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import * as Icons from 'lucide-react';
import { HelpCircle, PlusCircle, Edit3, Trash2 } from 'lucide-react'; // Specific icons for UI elements
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ManageServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceIconName, setServiceIconName] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    // Initialize services from imported data on mount
    setServices(initialServicesData);
  }, []);

  const resetFormFields = () => {
    setServiceName('');
    setServiceDescription('');
    setServiceIconName('');
    setCurrentService(null);
  };

  const handleAddService = () => {
    if (!serviceName.trim() || !serviceDescription.trim() || !serviceIconName.trim()) {
      toast({ title: 'Error', description: 'Todos los campos son requeridos.', variant: 'destructive' });
      return;
    }
    if (!(Icons as any)[serviceIconName.trim()]) {
      toast({ title: 'Error', description: `El icono "${serviceIconName.trim()}" no es válido.`, variant: 'destructive' });
      return;
    }

    const newService: Service = {
      id: `service-${Date.now()}`,
      name: serviceName.trim(),
      description: serviceDescription.trim(),
      iconName: serviceIconName.trim(),
    };
    setServices((prev) => [newService, ...prev]);
    toast({ title: 'Éxito', description: 'Servicio añadido correctamente.' });
    setIsAddDialogOpen(false);
    resetFormFields();
  };

  const handleEditService = (service: Service) => {
    setCurrentService(service);
    setServiceName(service.name);
    setServiceDescription(service.description);
    setServiceIconName(service.iconName);
    setIsEditDialogOpen(true);
  };

  const handleUpdateService = () => {
    if (!currentService || !serviceName.trim() || !serviceDescription.trim() || !serviceIconName.trim()) {
      toast({ title: 'Error', description: 'Todos los campos son requeridos.', variant: 'destructive' });
      return;
    }
     if (!(Icons as any)[serviceIconName.trim()]) {
      toast({ title: 'Error', description: `El icono "${serviceIconName.trim()}" no es válido.`, variant: 'destructive' });
      return;
    }

    setServices((prev) =>
      prev.map((s) =>
        s.id === currentService.id
          ? { ...s, name: serviceName.trim(), description: serviceDescription.trim(), iconName: serviceIconName.trim() }
          : s
      )
    );
    toast({ title: 'Éxito', description: 'Servicio actualizado correctamente.' });
    setIsEditDialogOpen(false);
    resetFormFields();
  };

  const handleDeleteService = (serviceId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    toast({ title: 'Éxito', description: 'Servicio eliminado correctamente.' });
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || HelpCircle;
    return <IconComponent className="h-5 w-5 text-foreground" />;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Gestionar Servicios</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => { setIsAddDialogOpen(isOpen); if (!isOpen) resetFormFields(); }}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Servicio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir Nuevo Servicio</DialogTitle>
                <DialogDescription>Completa los detalles del nuevo servicio.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Nombre</Label>
                  <Input id="name" value={serviceName} onChange={(e) => setServiceName(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Descripción</Label>
                  <Textarea id="description" value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="iconName" className="text-right">Nombre del Icono</Label>
                  <Input id="iconName" value={serviceIconName} onChange={(e) => setServiceIconName(e.target.value)} className="col-span-3" placeholder="Ej: Scissors" />
                </div>
                 <p className="text-xs text-muted-foreground col-span-4 px-1 text-center">
                    Usa un nombre de icono de <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="underline">Lucide Icons</a>.
                  </p>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={handleAddService}>Guardar Servicio</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No hay servicios para mostrar. ¡Añade uno!</p>
          ) : (
            <div className="rounded-md border mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Icono</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{service.description}</TableCell>
                      <TableCell>{renderIcon(service.iconName)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditService(service)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el servicio.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if(!isOpen) resetFormFields(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Servicio</DialogTitle>
            <DialogDescription>Actualiza los detalles del servicio.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Nombre</Label>
              <Input id="edit-name" value={serviceName} onChange={(e) => setServiceName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">Descripción</Label>
              <Textarea id="edit-description" value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-iconName" className="text-right">Nombre del Icono</Label>
              <Input id="edit-iconName" value={serviceIconName} onChange={(e) => setServiceIconName(e.target.value)} className="col-span-3" />
            </div>
            <p className="text-xs text-muted-foreground col-span-4 px-1 text-center">
                Usa un nombre de icono de <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="underline">Lucide Icons</a>.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateService}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageServicesPage;
