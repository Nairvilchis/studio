import Link from "next/link";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - LoginEase',
  description: 'LoginEase Privacy Policy.',
};

export default function PrivacyPage() {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <AuthLayout /* title="LoginEase" removed */>
       <Card className="w-full max-w-2xl shadow-2xl backdrop-blur-sm bg-card/80 border-border/50">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight text-center">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4 text-muted-foreground">
          <p className="text-xs text-center text-muted-foreground/70">Last updated: {currentDate}</p>

          <h2 className="text-xl font-semibold !mt-6 !mb-2 text-foreground">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us. For example, we collect information when you create an account, use the Service, fill out a form, or communicate with us. The types of information we may collect include your name, email address, password, and any other information you choose to provide. This is a template document and should be customized.
          </p>

          <h2 className="text-xl font-semibold !mt-6 !mb-2 text-foreground">2. How We Use Information</h2>
          <p>
            We may use the information we collect for various purposes, including to:
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Provide, maintain, and improve our Service;</li>
            <li>Process transactions and send you related information;</li>
            <li>Send you technical notices, updates, security alerts, and support messages;</li>
            <li>Respond to your comments, questions, and customer service requests;</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our Service.</li>
          </ul>

          <h2 className="text-xl font-semibold !mt-6 !mb-2 text-foreground">3. Sharing of Information</h2>
          <p>
            We may share information about you as follows or as otherwise described in this Privacy Policy:
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>With vendors, consultants, and other service providers who need access to such information to carry out work on our behalf;</li>
            <li>In response to a request for information if we believe disclosure is in accordance with, or required by, any applicable law or legal process;</li>
            <li>If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of LoginEase or others.</li>
          </ul>
          
          <h2 className="text-xl font-semibold !mt-6 !mb-2 text-foreground">4. Your Choices</h2>
          <p>
            You may update, correct, or delete your account information at any time by logging into your account or contacting us. If you wish to delete or deactivate your account, please contact us, but note that we may retain certain information as required by law or for legitimate business purposes.
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
