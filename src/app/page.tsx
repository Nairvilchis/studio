
"use client"; // Necesario para useState, useForm, etc.

import React, { useState } from 'react';
import { AuthLayout } from "@/components/auth-layout";
import { LoginForm } from "@/components/login-form";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { createEmpleadoAction } from '@/app/dashboard/admin/empleados/actions';
import { UserRole, type Empleado, type SystemUserCredentials } from '@/lib/types';

type NewAdminFormDataType = Omit<Empleado, '_id' | 'fechaRegistro' | 'user'> & {
  createSystemUser: boolean;
  systemUserUsuario?: string;
  systemUserContraseña?: string;
  systemUserConfirmContraseña?: string;
  systemUserRol?: UserRole;
};

const initialNewAdminData: NewAdminFormDataType = {
  nombre: '',
  puesto: 'Administrador', // Default puesto
  createSystemUser: true, // Forzar creación de usuario de sistema
  systemUserUsuario: '',
  systemUserContraseña: '',
  systemUserConfirmContraseña: '',
  systemUserRol: UserRole.ADMIN, // Forzar rol Admin
};

export default function LoginPage() {
  const [isCreateAdminDialogOpen, setIsCreateAdminDialogOpen] = useState(false);
  const [newAdminData, setNewAdminData] = useState<NewAdminFormDataType>(initialNewAdminData);
  const { toast } = useToast();

  const handleAdminInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setNewAdminData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAdminSelectChange = (name: string, value: UserRole) => {
    setNewAdminData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateAdminUser = async () => {
    if (!newAdminData.nombre.trim()) {
      toast({ title: "Error de Validación", description: "Nombre es obligatorio.", variant: "destructive" });
      return;
    }
    if (newAdminData.createSystemUser) {
      if (!newAdminData.systemUserUsuario?.trim() || !newAdminData.systemUserContraseña?.trim() || !newAdminData.systemUserRol) {
        toast({ title: "Error de Validación de Usuario", description: "Usuario, Contraseña y Rol son obligatorios.", variant: "destructive" });
        return;
      }
      if (newAdminData.systemUserContraseña !== newAdminData.systemUserConfirmContraseña) {
        toast({ title: "Error de Contraseña", description: "Las contraseñas no coinciden.", variant: "destructive" });
        return;
      }
    }

    const empleadoToCreate: Omit<Empleado, '_id' | 'fechaRegistro' | 'user'> = {
      nombre: newAdminData.nombre,
      puesto: newAdminData.puesto,
      telefono: newAdminData.telefono,
      correo: newAdminData.correo,
      sueldo: newAdminData.sueldo ? Number(newAdminData.sueldo) : undefined,
      comision: newAdminData.comision ? Number(newAdminData.comision) : undefined,
    };

    let systemUserDetails: Omit<SystemUserCredentials, 'permisos' | '_id'> | undefined = undefined;
    if (newAdminData.createSystemUser && newAdminData.systemUserUsuario && newAdminData.systemUserContraseña && newAdminData.systemUserRol) {
      systemUserDetails = {
        usuario: newAdminData.systemUserUsuario,
        contraseña: newAdminData.systemUserContraseña,
        rol: newAdminData.systemUserRol,
      };
    }

    const result = await createEmpleadoAction(empleadoToCreate, systemUserDetails);
    if (result.success) {
      toast({ title: "Éxito", description: `Empleado administrador '${newAdminData.nombre}' creado.` });
      setIsCreateAdminDialogOpen(false);
      setNewAdminData(initialNewAdminData);
    } else {
      toast({ title: "Error al Crear Administrador", description: result.error || "No se pudo crear el empleado administrador.", variant: "destructive" });
    }
  };

  const userRoleOptions = Object.values(UserRole).map(role => ({ value: role, label: role.charAt(0).toUpperCase() + role.slice(1) }));


  return (
    <AuthLayout>
      <LoginForm />
      <div className="mt-6 text-center">
        <Button variant="link" onClick={() => setIsCreateAdminDialogOpen(true)}>
          Crear Administrador Temporal
        </Button>
      </div>

      <Dialog open={isCreateAdminDialogOpen} onOpenChange={setIsCreateAdminDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear Administrador Inicial</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {/* Nombre */}
            <div>
              <Label htmlFor="admin_nombre">Nombre Completo*</Label>
              <Input id="admin_nombre" name="nombre" value={newAdminData.nombre} onChange={handleAdminInputChange} className="mt-1 w-full" />
            </div>
            {/* Puesto */}
            <div>
              <Label htmlFor="admin_puesto">Puesto</Label>
              <Input id="admin_puesto" name="puesto" value={newAdminData.puesto} onChange={handleAdminInputChange} className="mt-1 w-full" />
            </div>

            {/* System User Details - Forzado para admin temporal */}
            <div className="my-2 border-t pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox id="admin_createSystemUser" name="createSystemUser" checked={newAdminData.createSystemUser} disabled className="opacity-50"/>
                <Label htmlFor="admin_createSystemUser" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Crear acceso al sistema (Obligatorio para Admin)
                </Label>
              </div>
            </div>

            {/* Usuario */}
            <div>
              <Label htmlFor="admin_systemUserUsuario">Nombre de Usuario*</Label>
              <Input id="admin_systemUserUsuario" name="systemUserUsuario" value={newAdminData.systemUserUsuario ?? ''} onChange={handleAdminInputChange} className="mt-1 w-full" />
            </div>
            {/* Contraseña */}
            <div>
              <Label htmlFor="admin_systemUserContraseña">Contraseña*</Label>
              <Input id="admin_systemUserContraseña" name="systemUserContraseña" type="password" value={newAdminData.systemUserContraseña ?? ''} onChange={handleAdminInputChange} className="mt-1 w-full" />
            </div>
            {/* Confirmar Contraseña */}
            <div>
              <Label htmlFor="admin_systemUserConfirmContraseña">Confirmar Contraseña*</Label>
              <Input id="admin_systemUserConfirmContraseña" name="systemUserConfirmContraseña" type="password" value={newAdminData.systemUserConfirmContraseña ?? ''} onChange={handleAdminInputChange} className="mt-1 w-full" />
            </div>
            {/* Rol */}
            <div>
              <Label htmlFor="admin_systemUserRol">Rol en Sistema*</Label>
              <Select
                name="systemUserRol"
                value={newAdminData.systemUserRol}
                onValueChange={(val) => handleAdminSelectChange("systemUserRol", val as UserRole)}
                disabled
              >
                <SelectTrigger className="mt-1 w-full opacity-50">
                  <SelectValue placeholder="Seleccionar rol..." />
                </SelectTrigger>
                <SelectContent>
                  {userRoleOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" onClick={() => setNewAdminData(initialNewAdminData)}>Cancelar</Button></DialogClose>
            <Button onClick={handleCreateAdminUser}>Crear Administrador</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
}
