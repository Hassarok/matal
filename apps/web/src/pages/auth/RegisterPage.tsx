import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@matal/validation';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Field } from '@/components/form/Field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRegister } from '@/hooks/useAuth';
import { applyApiError } from '@/lib/form-errors';

export function RegisterPage() {
  const registerMutation = useRegister();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', username: '', displayName: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await registerMutation.mutateAsync(values);
      navigate('/profile', { replace: true });
    } catch (error) {
      setFormError(applyApiError(error, setError));
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      description="Join MATAL to build quizzes and host live games."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
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

        <Field label="Display name" htmlFor="displayName" error={errors.displayName?.message}>
          <Input
            id="displayName"
            autoComplete="name"
            invalid={!!errors.displayName}
            {...register('displayName')}
          />
        </Field>

        <Field label="Username" htmlFor="username" error={errors.username?.message}>
          <Input
            id="username"
            autoComplete="username"
            invalid={!!errors.username}
            {...register('username')}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            invalid={!!errors.email}
            {...register('email')}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          hint="At least 8 characters, with upper, lower and a number."
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register('password')}
          />
        </Field>

        <Button type="submit" className="mt-2" loading={registerMutation.isPending}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
