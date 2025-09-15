/**
 * Register Page Component
 * Handles new user registration with password strength validation
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, AlertCircle, Loader2, Shield, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { passwordValidation } from '@/lib/cookies';

// Custom password validator for Zod schema
const passwordValidator = z.string()
  .min(8, 'Password must be at least 8 characters')
  .refine((password) => {
    const result = passwordValidation.validate(password);
    return result.valid;
  }, (password) => {
    const result = passwordValidation.validate(password);
    return { message: result.errors[0] || 'Invalid password' };
  });

// Form validation schema
const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: passwordValidator,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: authRegister, isAuthenticated, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setFocus,
    reset
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const password = watch('password');
  const passwordStrength = useMemo(() => passwordValidation.getStrength(password), [password]);
  const passwordStrengthLabel = useMemo(() => passwordValidation.getStrengthLabel(passwordStrength), [passwordStrength]);
  const passwordStrengthColor = useMemo(() => passwordValidation.getStrengthColor(passwordStrength), [passwordStrength]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Focus name field on mount
  useEffect(() => {
    setFocus('name');
  }, [setFocus]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const onSubmit = useCallback(async (data: RegisterFormData) => {
    try {
      await authRegister(data.email, data.password, data.name);
      // Clear form on successful registration
      reset();
    } catch (error) {
      // Error is handled by the auth context
      console.error('Registration error:', error);
    }
  }, [authRegister, reset]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Central Command</h1>
          <p className="text-muted-foreground mt-2">Create your account</p>
        </div>

        {/* Register Card */}
        <Card className="border-muted/50 shadow-xl">
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              Enter your details to create your account
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

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  disabled={isLoading || isSubmitting}
                  {...register('name')}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isLoading || isSubmitting}
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

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    disabled={isLoading || isSubmitting}
                    {...register('password')}
                    aria-invalid={!!errors.password}
                    aria-describedby="password-requirements"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Password strength:</span>
                      <span className={cn(
                        'font-medium',
                        passwordStrength >= 80 ? 'text-green-600' :
                        passwordStrength >= 60 ? 'text-blue-600' :
                        passwordStrength >= 40 ? 'text-yellow-600' :
                        'text-destructive'
                      )}>
                        {passwordStrengthLabel}
                      </span>
                    </div>
                    <Progress value={passwordStrength} className="h-2">
                      <div
                        className={cn('h-full transition-all', passwordStrengthColor)}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </Progress>
                  </div>
                )}

                {/* Password Requirements */}
                <div id="password-requirements" className="space-y-1">
                  {passwordValidation.requirements.map((req) => {
                    const isMet = password && req.regex.test(password);
                    return (
                      <div
                        key={req.id}
                        className={cn(
                          'flex items-center space-x-2 text-xs transition-colors',
                          isMet ? 'text-green-600' : 'text-muted-foreground'
                        )}
                      >
                        {isMet ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        <span>{req.message}</span>
                      </div>
                    );
                  })}
                  {/* Unique characters requirement */}
                  <div
                    className={cn(
                      'flex items-center space-x-2 text-xs transition-colors',
                      password && new Set(password).size >= passwordValidation.minUniqueChars
                        ? 'text-green-600'
                        : 'text-muted-foreground'
                    )}
                  >
                    {password && new Set(password).size >= passwordValidation.minUniqueChars ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    <span>At least {passwordValidation.minUniqueChars} unique characters</span>
                  </div>
                </div>

                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    disabled={isLoading || isSubmitting}
                    {...register('confirmPassword')}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirm-password-error" className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || isSubmitting || passwordStrength < 100}
              >
                {isLoading || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create account
                  </>
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account?</span>{' '}
                <Link
                  to="/auth/login"
                  className="text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>By creating an account, you agree to our</p>
          <div className="mt-1 space-x-2">
            <a href="/terms" className="hover:underline">Terms of Service</a>
            <span>•</span>
            <a href="/privacy" className="hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}