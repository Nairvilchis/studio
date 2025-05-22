
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { User, KeyRound, Eye, EyeOff } from "lucide-react";
import React from "react";
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { loginUser } from '@/app/auth/actions';

const formSchema = z.object({
  usuario: z.string().min(3, { message: "El usuario debe tener al menos 3 caracteres." }),
  contraseña: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usuario: "",
      contraseña: "",
      rememberMe: false,
    },
  });

  async function onSubmit(values: LoginFormValues) {
    console.log("LoginForm: Intentando iniciar sesión con:", values.usuario);
    const result = await loginUser({ usuario: values.usuario, contraseña: values.contraseña });
    console.log("LoginForm: Resultado de loginUser:", result);

    if (result.success && result.user) {
      console.log("LoginForm: Datos de usuario recibidos del servidor:", JSON.stringify(result.user));
      let sessionDataValid = true;

      // Username
      if (result.user.usuario && typeof result.user.usuario === 'string' && result.user.usuario.trim() !== '') {
        localStorage.setItem('username', result.user.usuario);
        console.log(`LoginForm: username guardado en localStorage: ${localStorage.getItem('username')}`);
      } else {
        console.error("LoginForm: result.user.usuario es inválido:", result.user.usuario);
        sessionDataValid = false;
      }

      // Empleado ID - DETAILED LOGGING HERE
      const empIdFromServer = result.user.empleadoId;
      console.log(`LoginForm: Chequeando empIdFromServer: '${empIdFromServer}' (tipo: ${typeof empIdFromServer})`);

      const checkEmpIdExists = !!empIdFromServer;
      const checkEmpIdIsString = typeof empIdFromServer === 'string';
      const checkEmpIdIsNotBlank = typeof empIdFromServer === 'string' && empIdFromServer.trim() !== '' && empIdFromServer !== 'null' && empIdFromServer !== 'undefined';

      console.log(`LoginForm: empIdFromServer - checkExists: ${checkEmpIdExists}, checkIsString: ${checkEmpIdIsString}, checkIsNotBlank: ${checkEmpIdIsNotBlank}`);

      if (checkEmpIdExists && checkEmpIdIsString && checkEmpIdIsNotBlank) {
        localStorage.setItem('empleadoId', empIdFromServer);
        const storedEmpId = localStorage.getItem('empleadoId');
        console.log(`LoginForm: empleadoId guardado en localStorage: ${storedEmpId}`);
        if (storedEmpId !== empIdFromServer) {
            console.error(`LoginForm: DISCREPANCIA! empIdFromServer era '${empIdFromServer}', pero localStorage.getItem('empleadoId') devolvió '${storedEmpId}'`);
        }
      } else {
        console.error("LoginForm: empleadoId NO VÁLIDO O NO ES UNA CADENA NO VACÍA. Valor:", empIdFromServer);
        sessionDataValid = false;
      }

      // User Role
      if (result.user.rol && typeof result.user.rol === 'string' && result.user.rol.trim() !== '') {
        localStorage.setItem('userRole', result.user.rol);
        console.log(`LoginForm: userRole guardado en localStorage: ${localStorage.getItem('userRole')}`);
      } else {
        console.error("LoginForm: result.user.rol es inválido:", result.user.rol);
        sessionDataValid = false;
      }

      if (sessionDataValid) {
        localStorage.setItem('isLoggedIn', 'true');
        console.log("LoginForm: Todos los datos de sesión validados. Redirigiendo al dashboard...");
        toast({
          title: "Inicio de sesión exitoso",
          description: `Bienvenido de nuevo, ${result.user.usuario}. Redirigiendo...`,
        });
        router.push('/dashboard');
      } else {
        console.error("LoginForm: Uno o más datos de sesión son inválidos. No se redirigirá. Por favor, revisa los logs anteriores.");
        toast({
          title: "Error de Configuración de Sesión",
          description: "No se pudieron guardar los datos de sesión necesarios. Por favor, inténtalo de nuevo o contacta a soporte.",
          variant: "destructive",
        });
      }
    } else {
      console.log("LoginForm: Inicio de sesión fallido o result.user no existe. Mensaje del servidor:", result.message);
      toast({
        title: "Error de inicio de sesión",
        description: result.message || "Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <Card className="w-full shadow-2xl backdrop-blur-sm bg-card/80 border-border/50">
      <CardHeader>
        <CardTitle className="text-3xl font-bold tracking-tight text-center">Bienvenido de Nuevo</CardTitle>
        <CardDescription className="text-center text-muted-foreground pt-1">
          Ingresa tus credenciales para acceder a tu cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="usuario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">Usuario</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                      <Input
                        placeholder="tu_usuario"
                        {...field}
                        className="pl-11 h-12 text-base transition-shadow duration-300 focus:shadow-lg focus:shadow-primary/20"
                        autoComplete="username"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contraseña"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                       <KeyRound className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        className="pl-11 pr-12 h-12 text-base transition-shadow duration-300 focus:shadow-lg focus:shadow-primary/20"
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground hover:bg-primary/10"
                        onClick={togglePasswordVisibility}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between pt-2">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2.5 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Recuérdame"
                        id="rememberMe"
                        className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:ring-primary/50"
                      />
                    </FormControl>
                    <FormLabel htmlFor="rememberMe" className="cursor-pointer font-normal text-sm text-muted-foreground hover:text-foreground">
                        Recuérdame
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full font-semibold text-lg py-7 shadow-md hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Iniciar Sesión
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
