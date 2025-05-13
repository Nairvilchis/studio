import { AuthLayout } from "@/components/auth-layout";
import { LoginForm } from "@/components/login-form";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - LoginEase',
  description: 'Sign in to access your LoginEase account securely and easily.',
};

export default function LoginPage() {
  return (
    <AuthLayout 
      title="LoginEase"
      description="Seamlessly access your personalized experience."
    >
      <LoginForm />
    </AuthLayout>
  );
}
