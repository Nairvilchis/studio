import Link from "next/link";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - LoginEase',
  description: 'LoginEase Terms of Service.',
};

export default function TermsPage() {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <AuthLayout title="LoginEase">
      <Card className="w-full max-w-2xl shadow-2xl backdrop-blur-sm bg-card/80 border-border/50">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight text-center">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4 text-muted-foreground">
          <p className="text-xs text-center text-muted-foreground/70">Last updated: {currentDate}</p>
          
          <h2 className="text-xl font-semibold !mt-6 !mb-2 text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using LoginEase (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, then you may not access the Service. This document provides a template and should be reviewed by legal counsel.
          </p>

          <h2 className="text-xl font-semibold !mt-6 !mb-2 text-foreground">2. Description of Service</h2>
          <p>
            LoginEase provides an elegant login interface and related services. The specifics of the Service are subject to change and are provided "as is" without warranty.
          </p>

          <h2 className="text-xl font-semibold !mt-6 !mb-2 text-foreground">3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
          </p>
          
          <h2 className="text-xl font-semibold !mt-6 !mb-2 text-foreground">4. Intellectual Property</h2>
          <p>
            The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of LoginEase and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
          </p>

          <h2 className="text-xl font-semibold !mt-6 !mb-2 text-foreground">5. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </p>

          <div className="mt-8 text-center">
            <Button variant="link" asChild className="text-primary hover:text-primary/80">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
