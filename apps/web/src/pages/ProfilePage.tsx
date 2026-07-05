import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, MailCheck, MailWarning } from 'lucide-react';
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from '@matal/validation';
import type { PublicUser } from '@matal/shared-types';
import { TopBar } from '@/components/layout/TopBar';
import { Field } from '@/components/form/Field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';
import { api } from '@/lib/api';
import { applyApiError } from '@/lib/form-errors';
import { useAuth, AUTH_ME_KEY } from '@/hooks/useAuth';
import { FullPageLoader } from '@/components/FullPageLoader';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function AccountSummary({ user }: { user: PublicUser }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-4 space-y-0">
        <Avatar className="h-16 w-16">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
          <AvatarFallback className="text-lg">{initials(user.displayName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <CardTitle className="truncate">{user.displayName}</CardTitle>
          <CardDescription className="truncate">@{user.username}</CardDescription>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={user.role === 'ADMIN' ? 'accent' : 'secondary'}>
              {user.role === 'ADMIN' ? 'Admin' : 'User'}
            </Badge>
            {user.emailVerified ? (
              <Badge variant="success">
                <MailCheck className="size-3" /> Verified
              </Badge>
            ) : (
              <Badge variant="warning">
                <MailWarning className="size-3" /> Unverified
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium">{user.email}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Member since</span>
          <span className="font-medium">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function EditProfileCard({ user }: { user: PublicUser }) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { displayName: user.displayName, bio: user.bio ?? '' },
  });

  const mutation = useMutation({
    mutationFn: api.users.updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(AUTH_ME_KEY, updated);
      toast.success('Profile updated');
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      setFormError(applyApiError(error, setError));
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Profile</CardTitle>
        <CardDescription>Update how you appear on MATAL.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          {formError && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <Field label="Display name" htmlFor="displayName" error={errors.displayName?.message}>
            <Input id="displayName" invalid={!!errors.displayName} {...register('displayName')} />
          </Field>
          <Field label="Bio" htmlFor="bio" error={errors.bio?.message} hint="Optional — up to 300 characters.">
            <Textarea id="bio" invalid={!!errors.bio} {...register('bio')} />
          </Field>
          <div>
            <Button type="submit" loading={mutation.isPending} disabled={!isDirty}>
              Save changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ChangePasswordCard() {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: api.users.changePassword,
    onSuccess: () => {
      toast.success('Password changed');
      reset();
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      setFormError(applyApiError(error, setError));
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Change password</CardTitle>
        <CardDescription>Choose a strong, unique password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          {formError && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <Field
            label="Current password"
            htmlFor="currentPassword"
            error={errors.currentPassword?.message}
          >
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              invalid={!!errors.currentPassword}
              {...register('currentPassword')}
            />
          </Field>
          <Field
            label="New password"
            htmlFor="newPassword"
            error={errors.newPassword?.message}
            hint="At least 8 characters, with upper, lower and a number."
          >
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              invalid={!!errors.newPassword}
              {...register('newPassword')}
            />
          </Field>
          <div>
            <Button type="submit" variant="secondary" loading={mutation.isPending}>
              Update password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ProfilePage() {
  const { user } = useAuth();

  if (!user) return <FullPageLoader />;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-6">
        <TopBar />
        <main className="grid gap-6 py-6">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">
              Account
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your profile and security.
            </p>
          </div>
          <AccountSummary user={user} />
          <EditProfileCard user={user} />
          <ChangePasswordCard />
        </main>
      </div>
    </div>
  );
}
