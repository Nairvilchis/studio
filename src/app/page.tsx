
"use client"; // Necesario para useState, useForm, etc.

import type { Metadata } from 'next';
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

// Metadata no puede estar en un "use client" component.
// Se puede mover a un layout si es necesario o eliminar si la página es puramente cliente.
// Por ahora, lo comentaré para evitar errores.
// export const metadata: Metadata = {
//   title: 'Login - LoginEase',
//   description: 'Sign in to access your LoginEase account securely and easily.',
// };

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
          <div className="grid gap-4 py-4">
            {/* Nombre */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="admin_nombre" className="text-right">Nombre Completo*</Label>
              <Input id="admin_nombre" name="nombre" value={newAdminData.nombre} onChange={handleAdminInputChange} className="col-span-3" />
            </div>
            {/* Puesto */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="admin_puesto" className="text-right">Puesto</Label>
              <Input id="admin_puesto" name="puesto" value={newAdminData.puesto} onChange={handleAdminInputChange} className="col-span-3" />
            </div>

            {/* System User Details - Forzado para admin temporal */}
            <div className="col-span-4 my-2 border-t pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox id="admin_createSystemUser" name="createSystemUser" checked={newAdminData.createSystemUser} disabled className="opacity-50"/>
                <Label htmlFor="admin_createSystemUser" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Crear acceso al sistema (Obligatorio para Admin)
                </Label>
              </div>
            </div>

            {/* Usuario */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="admin_systemUserUsuario" className="text-right">Nombre de Usuario*</Label>
              <Input id="admin_systemUserUsuario" name="systemUserUsuario" value={newAdminData.systemUserUsuario} onChange={handleAdminInputChange} className="col-span-3" />
            </div>
            {/* Contraseña */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="admin_systemUserContraseña" className="text-right">Contraseña*</Label>
              <Input id="admin_systemUserContraseña" name="systemUserContraseña" type="password" value={newAdminData.systemUserContraseña} onChange={handleAdminInputChange} className="col-span-3" />
            </div>
            {/* Confirmar Contraseña */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="admin_systemUserConfirmContraseña" className="text-right">Confirmar Contraseña*</Label>
              <Input id="admin_systemUserConfirmContraseña" name="systemUserConfirmContraseña" type="password" value={newAdminData.systemUserConfirmContraseña} onChange={handleAdminInputChange} className="col-span-3" />
            </div>
            {/* Rol */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="admin_systemUserRol" className="text-right">Rol en Sistema*</Label>
              <Select 
                name="systemUserRol" 
                value={newAdminData.systemUserRol} 
                onValueChange={(val) => handleAdminSelectChange("systemUserRol", val as UserRole)}
                disabled
              >
                <SelectTrigger className="col-span-3 opacity-50">
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

    