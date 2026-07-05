import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { KilimDivider } from '@/components/brand/KilimDivider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/** Centered card layout with the MATAL brand backdrop, used by auth pages. */
export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="bg-kilim pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -top-24 -end-16 h-80 w-80 rounded-full bg-brand-sun/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -start-16 h-80 w-80 rounded-full bg-brand-terracotta/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link to="/" aria-label="MATAL home" className="rounded-md focus-visible:ring-2">
            <Logo />
          </Link>
        </div>
        <Card className="animate-fade-in-up">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
            <KilimDivider className="mt-3" />
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        {footer && (
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        )}
      </div>
    </div>
  );
}
