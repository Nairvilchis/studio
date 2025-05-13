"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Github, KeyRound, Mail, Eye, EyeOff } from "lucide-react";
import React from "react";

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
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  function onSubmit(values: LoginFormValues) {
    // Simulate API call
    console.log(values);
    toast({
      title: "Login Attempt Successful",
      description: (
        <div className="mt-2 w-full max-w-xs rounded-md bg-card p-4 text-card-foreground shadow-lg">
          <p className="text-sm">Email: {values.email}</p>
          <p className="text-sm">Remember me: {values.rememberMe ? 'Yes' : 'No'}</p>
        </div>
      ),
      variant: "default",
    });
    // form.reset(); // Optionally reset form
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <Card className="w-full shadow-2xl backdrop-blur-sm bg-card/80 border-border/50">
      <CardHeader>
        <CardTitle className="text-3xl font-bold tracking-tight text-center">Welcome Back</CardTitle>
        <CardDescription className="text-center text-muted-foreground pt-1">
          Enter your credentials to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                      <Input 
                        placeholder="you@example.com" 
                        {...field} 
                        className="pl-11 h-12 text-base transition-shadow duration-300 focus:shadow-lg focus:shadow-primary/20" 
                        autoComplete="email"
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
                  <FormLabel className="text-muted-foreground">Password</FormLabel>
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
                        aria-label={showPassword ? "Hide password" : "Show password"}
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
                        aria-label="Remember me"
                        id="rememberMe"
                        className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:ring-primary/50"
                      />
                    </FormControl>
                    <FormLabel htmlFor="rememberMe" className="cursor-pointer font-normal text-sm text-muted-foreground hover:text-foreground">
                        Remember me
                    </FormLabel>
                  </FormItem>
                )}
              />
              {/* Removed Link to /forgot-password */}
            </div>
            <Button type="submit" className="w-full font-semibold text-lg py-7 shadow-md hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Sign In
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-6 pt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button variant="outline" className="w-full h-12 text-base shadow-sm hover:shadow-md transition-all hover:scale-[1.03] active:scale-[0.97] border-border/70 hover:border-primary/50">
            <Github className="mr-2.5 h-5 w-5" />
            GitHub
          </Button>
          <Button variant="outline" className="w-full h-12 text-base shadow-sm hover:shadow-md transition-all hover:scale-[1.03] active:scale-[0.97] border-border/70 hover:border-primary/50">
            <svg className="mr-2.5 h-5 w-5" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.386-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.85l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="currentColor"/></svg>
            Google
          </Button>
        </div>
         {/* Removed paragraph with links to /terms and /privacy */}
      </CardFooter>
    </Card>
  );
}
