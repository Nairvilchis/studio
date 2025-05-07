
'use client';

import type { AppointmentFormData } from '@/lib/types';
import { readAppointments, updateAppointmentStatus, deleteAppointment } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';


export default function ManageAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentFormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await readAppointments();
      if (response.success && response.data) {
        setAppointments(response.data);
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to fetch appointments.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({ title: 'Error', description: 'Failed to fetch appointments.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter((appointment) =>
    Object.values(appointment).some((value) => {
      if (value instanceof Date) {
        return value.toLocaleDateString('es-ES').toLowerCase().includes(filter.toLowerCase()) ||
               value.toLocaleTimeString('es-ES').toLowerCase().includes(filter.toLowerCase());
      }
      return value?.toString().toLowerCase().includes(filter.toLowerCase());
    })
  );

  const handleStatusUpdate = (appointmentId: string, status: AppointmentFormData['status']) => {
    startTransition(async () => {
      if (!appointmentId) {
        toast({title: 'Error', description: 'ID de cita no válido.', variant: 'destructive'});
        return;
      }
      const result = await updateAppointmentStatus(appointmentId, status);
      if (result.success) {
        await fetchAppointments();
        toast({ title: 'Éxito', description: result.message });
      } else {
        toast({ title: 'Error', description: result.message || 'No se pudo actualizar la cita.', variant: 'destructive' });
      }
    });
  };

  const handleDelete = (appointmentId: string) => {
     startTransition(async () => {
      if (!appointmentId) {
        toast({title: 'Error', description: 'ID de cita no válido.', variant: 'destructive'});
        return;
      }
      const result = await deleteAppointment(appointmentId);
      if (result.success) {
        await fetchAppointments();
        toast({ title: 'Éxito', description: result.message });
      } else {
        toast({ title: 'Error', description: result.message || 'No se pudo eliminar la cita.', variant: 'destructive' });
      }
    });
  };

  const getStatusBadgeVariant = (status?: AppointmentFormData['status']) => {
    switch (status) {
      case 'confirmed':
        return 'default'; // bg-primary
      case 'pending':
        return 'secondary'; // bg-secondary
      case 'rejected':
        return 'destructive'; // bg-destructive
      case 'completed':
        return 'outline'; // text-foreground (consider a custom color or success variant)
      default:
        return 'outline';
    }
  };


  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Gestionar Citas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="filter">Filtrar Citas</Label>
            <Input
              id="filter"
              type="text"
              placeholder="Buscar..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mt-1"
            />
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAppointments.length === 0 ? (
             <p className="text-muted-foreground text-center py-10">
              {filter ? "No se encontraron citas con ese filtro." : "No hay citas para mostrar."}
            </p>
          ) : (
            <div className="rounded-md border mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">{appointment.name}</TableCell>
                      <TableCell>{appointment.email}</TableCell>
                      <TableCell>{appointment.phone}</TableCell>
                      <TableCell>{appointment.service}</TableCell>
                      <TableCell>{new Date(appointment.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                      <TableCell>{appointment.time}</TableCell>
                       <TableCell>
                        <Badge variant={getStatusBadgeVariant(appointment.status)} className="capitalize">
                          {appointment.status || 'desconocido'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {appointment.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(appointment.id!, 'confirmed')}
                              disabled={isPending}
                              className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                            >
                              <CheckCircle className="mr-1 h-4 w-4" /> Aprobar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(appointment.id!, 'rejected')}
                              disabled={isPending}
                               className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <XCircle className="mr-1 h-4 w-4" /> Rechazar
                            </Button>
                          </>
                        )}
                         {appointment.status === 'confirmed' && (
                           <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(appointment.id!, 'completed')}
                              disabled={isPending}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            >
                               Marcar como Completada
                            </Button>
                         )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la cita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(appointment.id!)} disabled={isPending}>
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
    </div>
  );
}
