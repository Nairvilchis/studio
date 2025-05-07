
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import type { Service } from '@/lib/types';
import { createService, readServices, updateService, deleteService } from '@/lib/actions';
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
import { HelpCircle, PlusCircle, Edit3, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

const ManageServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceIconName, setServiceIconName] = useState('');
  const [serviceImageUrl, setServiceImageUrl] = useState('');


  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const response = await readServices();
      if (response.success && response.data) {
        setServices(response.data);
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to fetch services.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({ title: 'Error', description: 'Failed to fetch services.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const resetFormFields = () => {
    setServiceName('');
    setServiceDescription('');
    setServiceIconName('');
    setServiceImageUrl('');
    setCurrentService(null);
  };

  const isValidIconName = (iconNameInput: string): boolean => {
    const trimmedIconName = iconNameInput.trim();
    if (!trimmedIconName) return false;
    return Icons.hasOwnProperty(trimmedIconName) && typeof (Icons as any)[trimmedIconName] === 'function';
  };

  const isValidUrl = (urlString: string): boolean => {
    if (!urlString) return true; // Optional field
    try {
      new URL(urlString);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleAddService = () => {
    if (!serviceName.trim() || !serviceDescription.trim()) {
      toast({ title: 'Error de Validación', description: 'Nombre y descripción son requeridos.', variant: 'destructive' });
      return;
    }
    if (!serviceIconName.trim()){
        toast({ title: 'Error de Validación', description: 'Nombre del icono es requerido.', variant: 'destructive' });
        return;
    }
    if (!isValidIconName(serviceIconName)) {
      toast({ title: 'Error de Icono', description: `El icono "${serviceIconName.trim()}" no es válido. Por favor, elige un icono de Lucide Icons.`, variant: 'destructive' });
      return;
    }
    if (serviceImageUrl.trim() && !isValidUrl(serviceImageUrl.trim())) {
      toast({ title: 'URL Inválida', description: 'La URL de la imagen no es válida.', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      const result = await createService({
        name: serviceName.trim(),
        description: serviceDescription.trim(),
        iconName: serviceIconName.trim(),
        imageUrl: serviceImageUrl.trim() || undefined,
      });
      if (result.success && result.data) {
        await fetchServices(); 
        toast({ title: 'Éxito', description: result.message });
        setIsAddDialogOpen(false);
        resetFormFields();
      } else {
        toast({ title: 'Error', description: result.message || 'No se pudo añadir el servicio.', variant: 'destructive' });
      }
    });
  };

  const handleEditService = (service: Service) => {
    setCurrentService(service);
    setServiceName(service.name);
    setServiceDescription(service.description);
    setServiceIconName(service.iconName);
    setServiceImageUrl(service.imageUrl || '');
    setIsEditDialogOpen(true);
  };

  const handleUpdateService = () => {
    if (!currentService || !serviceName.trim() || !serviceDescription.trim()) {
      toast({ title: 'Error de Validación', description: 'Nombre y descripción son requeridos.', variant: 'destructive' });
      return;
    }
    if (!serviceIconName.trim()){
        toast({ title: 'Error de Validación', description: 'Nombre del icono es requerido.', variant: 'destructive' });
        return;
    }
    if (!isValidIconName(serviceIconName)) {
      toast({ title: 'Error de Icono', description: `El icono "${serviceIconName.trim()}" no es válido.`, variant: 'destructive' });
      return;
    }
    if (serviceImageUrl.trim() && !isValidUrl(serviceImageUrl.trim())) {
      toast({ title: 'URL Inválida', description: 'La URL de la imagen no es válida.', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      const result = await updateService(currentService.id, {
        name: serviceName.trim(),
        description: serviceDescription.trim(),
        iconName: serviceIconName.trim(),
        imageUrl: serviceImageUrl.trim() || undefined,
      });
      if (result.success) {
        await fetchServices();
        toast({ title: 'Éxito', description: result.message });
        setIsEditDialogOpen(false);
        resetFormFields();
      } else {
        toast({ title: 'Error', description: result.message || 'No se pudo actualizar el servicio.', variant: 'destructive' });
      }
    });
  };

  const handleDeleteService = (serviceId: string) => {
    startTransition(async () => {
      const result = await deleteService(serviceId);
      if (result.success) {
        await fetchServices();
        toast({ title: 'Éxito', description: result.message });
      } else {
        toast({ title: 'Error', description: result.message || 'No se pudo eliminar el servicio.', variant: 'destructive' });
      }
    });
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
              <Button disabled={isPending}>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Servicio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
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
                    Usa un nombre de icono de <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="underline">Lucide Icons</a> (ej: Smile, Home).
                  </p>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="imageUrl" className="text-right">URL de Imagen</Label>
                  <Input id="imageUrl" value={serviceImageUrl} onChange={(e) => setServiceImageUrl(e.target.value)} className="col-span-3" placeholder="https://ejemplo.com/imagen.jpg (Opcional)" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" disabled={isPending}>Cancelar</Button></DialogClose>
                <Button onClick={handleAddService} disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Servicio
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : services.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No hay servicios para mostrar. ¡Añade uno!</p>
          ) : (
            <div className="rounded-md border mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagen/Icono</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        {service.imageUrl ? (
                          <Image src={service.imageUrl} alt={service.name} width={40} height={40} className="rounded aspect-square object-cover" data-ai-hint="service beauty" />
                        ) : (
                          renderIcon(service.iconName)
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{service.description}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditService(service)} disabled={isPending}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isPending}>
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
                              <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteService(service.id)} disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if(!isOpen) resetFormFields(); }}>
        <DialogContent className="sm:max-w-md">
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
                Usa un nombre de icono de <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="underline">Lucide Icons</a> (ej: Smile, Home).
            </p>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-imageUrl" className="text-right">URL de Imagen</Label>
                <Input id="edit-imageUrl" value={serviceImageUrl} onChange={(e) => setServiceImageUrl(e.target.value)} className="col-span-3" placeholder="https://ejemplo.com/imagen.jpg (Opcional)" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={isPending}>Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateService} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageServicesPage;
