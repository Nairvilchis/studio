"use client"

import Link from "next/link";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from 'next';
import { Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React from "react"; // Required for useState

export const metadata: Metadata = {
  title: 'Forgot Password - LoginEase',
  description: 'Recover your LoginEase account password.',
};

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    // Simulate API call
    console.log("Password reset requested for:", email);
    toast({
      title: "Password Reset Email Sent",
      description: `If an account exists for ${email}, you will receive an email with reset instructions.`,
      variant: "default",
    });
    setEmail("");
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      description="No worries, we'll help you get back on track."
    >
      <Card className="w-full shadow-2xl backdrop-blur-sm bg-card/80 border-border/50">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center text-muted-foreground pt-1">
            Enter your email and we'll send a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email-forgot" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                <Input 
                  id="email-forgot" 
                  name="email" 
                  type="email" 
                  autoComplete="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-11 h-12 text-base transition-shadow duration-300 focus:shadow-lg focus:shadow-primary/20"
                />
              </div>
            </div>
            <Button type="submit" className="w-full font-semibold text-lg py-7 shadow-md hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Send Reset Link
            </Button>
          </form>
        </CardContent>
        <CardFooter className="mt-2 pt-0 text-center">
            <Button variant="link" asChild className="text-primary hover:text-primary/80">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
