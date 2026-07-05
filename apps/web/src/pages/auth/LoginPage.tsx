import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { loginSchema, type LoginInput } from '@matal/validation';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Field } from '@/components/form/Field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLogin } from '@/hooks/useAuth';
import { applyApiError } from '@/lib/form-errors';

export function LoginPage() {
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/profile';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login.mutateAsync(values);
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(applyApiError(error, setError));
    }
  });

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue to MATAL."
      footer={
        <>
          New to MATAL?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        {formError && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            invalid={!!errors.email}
            {...register('email')}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            invalid={!!errors.password}
            {...register('password')}
          />
        </Field>

        <Button type="submit" className="mt-2" loading={login.isPending}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
