/**
 * Forgot Password Page Component
 * Handles password reset requests
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, AlertCircle, Loader2, Shield, CheckCircle } from 'lucide-react';
import { authService } from '@/lib/api/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);

    try {
      await authService.forgotPassword({ email: data.email });
      setIsSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email. Please try again.');
      console.error('Forgot password error:', error);
    }
  };

  const handleResendEmail = async () => {
    const email = getValues('email');
    if (!email) return;

    setError(null);

    try {
      await authService.forgotPassword({ email });
      setIsSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Failed to resend email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Central Command</h1>
          <p className="text-muted-foreground mt-2">Reset your password</p>
        </div>

        {/* Card */}
        <Card className="border-muted/50 shadow-xl">
          {!isSuccess ? (
            <>
              <CardHeader>
                <CardTitle>Forgot your password?</CardTitle>
                <CardDescription>
                  Enter your email address and we'll send you a link to reset your password.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  {/* Error Alert */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus
                      disabled={isSubmitting}
                      {...register('email')}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && (
                      <p id="email-error" className="text-sm text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      We'll send a password reset link to your email address if an account exists.
                    </AlertDescription>
                  </Alert>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending reset link...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send reset link
                      </>
                    )}
                  </Button>

                  {/* Back to Login */}
                  <Link
                    to="/auth/login"
                    className="flex items-center justify-center text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  >
                    <ArrowLeft className="mr-1 h-3 w-3" />
                    Back to sign in
                  </Link>
                </CardFooter>
              </form>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="mx-auto mb-4 h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-center">Check your email</CardTitle>
                <CardDescription className="text-center">
                  We've sent a password reset link to:
                  <span className="block mt-2 font-medium text-foreground">
                    {getValues('email')}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    The link will expire in 1 hour. If you don't see the email, check your spam folder.
                  </AlertDescription>
                </Alert>

                <div className="text-center text-sm text-muted-foreground">
                  <p>Didn't receive the email?</p>
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={isSubmitting}
                    className="mt-2 text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded font-medium"
                  >
                    {isSubmitting ? 'Resending...' : 'Resend email'}
                  </button>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                {/* Back to Login */}
                <Link
                  to="/auth/login"
                  className="w-full"
                >
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to sign in
                  </Button>
                </Link>
              </CardFooter>
            </>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Need help?</p>
          <div className="mt-1">
            <a href="/support" className="hover:underline">Contact Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}