import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Info,
  CheckCircle2,
  TriangleAlert,
  CircleX,
  Plus,
  Trash2,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toaster';
import { Logo } from '@/components/brand/Logo';
import { StarSpinner } from '@/components/brand/StarSpinner';
import { KilimDivider } from '@/components/brand/KilimDivider';
import { ThemeToggle } from '@/components/ThemeToggle';

/* ── Local layout helpers ─────────────────────────────────────────── */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-3', className)}>{children}</div>;
}

function Swatch({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={cn('h-14 w-full rounded-lg border border-border', className)} />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

type SegOption<T extends string> = { value: T; label: string };

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegOption<T>[];
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-primary text-primary-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */

export function StyleGuidePage() {
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [previewDir, setPreviewDir] = useState<'ltr' | 'rtl'>('ltr');

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header / chrome (uses the global theme) */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo />
            <Separator orientation="vertical" className="h-8" />
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight">
                Design System
              </h1>
              <p className="text-sm text-muted-foreground">
                Living component gallery & visual QA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">← Back home</Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Preview toolbar */}
        <div className="sticky top-4 z-10 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface/80 p-3 shadow-soft backdrop-blur">
          <span className="ps-2 text-sm font-semibold text-muted-foreground">
            Preview canvas
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Theme</span>
              <Segmented
                value={previewTheme}
                onChange={setPreviewTheme}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Direction</span>
              <Segmented
                value={previewDir}
                onChange={setPreviewDir}
                options={[
                  { value: 'ltr', label: 'LTR' },
                  { value: 'rtl', label: 'RTL' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Preview canvas — scopes theme (via .dark) + direction locally */}
        <div className={cn(previewTheme === 'dark' && 'dark')} dir={previewDir}>
          <div className="space-y-12 rounded-2xl border border-border bg-background p-6 text-foreground sm:p-8">
            {/* Colours */}
            <Section title="Colour tokens" description="Fixed brand palette + theme-aware semantic tokens.">
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                <Swatch label="sun" className="bg-brand-sun" />
                <Swatch label="terracotta" className="bg-brand-terracotta" />
                <Swatch label="mountain" className="bg-brand-mountain" />
                <Swatch label="sky" className="bg-brand-sky" />
                <Swatch label="pomegranate" className="bg-brand-pomegranate" />
                <Swatch label="sand" className="bg-brand-sand" />
              </div>
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                <Swatch label="background" className="bg-background" />
                <Swatch label="surface" className="bg-surface" />
                <Swatch label="surface-muted" className="bg-surface-muted" />
                <Swatch label="primary" className="bg-primary" />
                <Swatch label="secondary" className="bg-secondary" />
                <Swatch label="destructive" className="bg-destructive" />
              </div>
            </Section>

            {/* Typography */}
            <Section title="Typography" description="Sora for display, Plus Jakarta Sans for UI.">
              <div className="space-y-2">
                <p className="font-display text-4xl font-extrabold tracking-tight">
                  Display / Heading
                </p>
                <p className="text-gradient-sun font-display text-3xl font-extrabold">
                  Golden gradient heading
                </p>
                <p className="text-lg">Body large — the quick brown fox jumps over.</p>
                <p className="text-sm text-muted-foreground">
                  Muted small — supporting helper text.
                </p>
              </div>
            </Section>

            {/* Buttons */}
            <Section title="Buttons" description="Variants, sizes, and states.">
              <Row>
                <Button>Default</Button>
                <Button variant="gradient">
                  <Sparkles /> Gradient CTA
                </Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </Row>
              <Row>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" aria-label="Add">
                  <Plus />
                </Button>
              </Row>
              <Row>
                <Button disabled>Disabled</Button>
                <Button loading>Loading</Button>
                <Button variant="gradient" loading>
                  Saving…
                </Button>
              </Row>
            </Section>

            {/* Badges */}
            <Section title="Badges" description="Status & category labels.">
              <Row>
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="accent">Accent</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </Row>
            </Section>

            {/* Form controls */}
            <Section title="Form controls" description="Inputs with normal, disabled, and error states.">
              <div className="grid max-w-xl gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="sg-email">Email</Label>
                  <Input id="sg-email" type="email" placeholder="you@example.com" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="sg-disabled">Disabled</Label>
                  <Input id="sg-disabled" placeholder="Unavailable" disabled />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="sg-error">Username</Label>
                  <Input id="sg-error" defaultValue="ab" invalid aria-describedby="sg-error-msg" />
                  <p id="sg-error-msg" className="text-xs font-medium text-destructive">
                    Username must be at least 3 characters.
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="sg-bio">Bio</Label>
                  <Textarea id="sg-bio" placeholder="Tell us about yourself…" />
                </div>
              </div>
            </Section>

            {/* Alerts */}
            <Section title="Alerts" description="Inline feedback for the four intents.">
              <div className="grid gap-3">
                <Alert variant="info">
                  <Info />
                  <AlertTitle>Heads up</AlertTitle>
                  <AlertDescription>A new game mode is coming soon.</AlertDescription>
                </Alert>
                <Alert variant="success">
                  <CheckCircle2 />
                  <AlertTitle>Saved</AlertTitle>
                  <AlertDescription>Your quiz was published successfully.</AlertDescription>
                </Alert>
                <Alert variant="warning">
                  <TriangleAlert />
                  <AlertTitle>Almost there</AlertTitle>
                  <AlertDescription>Add at least one question to continue.</AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <CircleX />
                  <AlertTitle>Something went wrong</AlertTitle>
                  <AlertDescription>We couldn’t reach the server.</AlertDescription>
                </Alert>
              </div>
            </Section>

            {/* Card + Avatar */}
            <Section title="Card & Avatar">
              <div className="grid gap-6 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Kurdish Geography</CardTitle>
                    <CardDescription>12 questions · Medium difficulty</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center gap-3">
                    <Badge variant="accent">Geography</Badge>
                    <Badge variant="secondary">Popular</Badge>
                  </CardContent>
                  <CardFooter>
                    <Button size="sm">Play</Button>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </CardFooter>
                </Card>
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src="https://i.pravatar.cc/80?img=13" alt="" />
                    <AvatarFallback>MA</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>KD</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-14 w-14">
                    <AvatarFallback>
                      <User className="size-6" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </Section>

            {/* Overlays */}
            <Section title="Overlays" description="Dialog and dropdown menu.">
              <Row>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Open dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete quiz?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. The quiz and its results will be
                        permanently removed.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button variant="destructive">
                          <Trash2 /> Delete
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Account <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>My account</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <User /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive>
                      <LogOut /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Row>
            </Section>

            {/* Toasts */}
            <Section title="Toasts" description="Transient feedback (top-centered).">
              <Row>
                <Button variant="secondary" onClick={() => toast('Quiz saved as draft')}>
                  Default
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => toast.success('Game started!')}
                >
                  Success
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => toast.error('Failed to join game')}
                >
                  Error
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => toast.info('3 players joined the lobby')}
                >
                  Info
                </Button>
              </Row>
            </Section>

            {/* Loading & dividers */}
            <Section title="Loading & dividers">
              <div className="flex items-center gap-8">
                <StarSpinner />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
              <KilimDivider className="my-2" />
              <Separator />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
