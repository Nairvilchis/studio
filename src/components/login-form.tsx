
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { User, KeyRound, Eye, EyeOff } from "lucide-react";
import React from "react";
import { useRouter } from 'next/navigation'; // Import useRouter

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

const formSchema = z.object({
  username: z.string().min(3, { message: "El usuario debe tener al menos 3 caracteres." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof formSchema>;

// Credenciales hardcodeadas para demostración
const VALID_USERNAME = "admin";
const VALID_PASSWORD = "password123";

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter(); // Initialize router
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  function onSubmit(values: LoginFormValues) {
    if (values.username === VALID_USERNAME && values.password === VALID_PASSWORD) {
      // Simular login exitoso
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', values.username);

      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido de nuevo, ${values.username}. Redirigiendo...`,
        variant: "default",
      });
      router.push('/dashboard'); // Redirigir al dashboard
    } else {
      // Simular login fallido
      toast({
        title: "Error de inicio de sesión",
        description: "Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
    // No resetear el formulario en caso de error para que el usuario pueda corregir
    // form.reset(); 
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
              name="username"
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
              name="password"
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
