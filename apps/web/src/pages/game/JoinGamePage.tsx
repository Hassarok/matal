import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Public entry point for players: enter a game PIN and a nickname, then jump
 * into the live session. No account required.
 */
export function JoinGamePage() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');

  const cleanedPin = pin.replace(/\D/g, '').slice(0, 6);
  const canJoin = cleanedPin.length === 6 && nickname.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canJoin) return;
    navigate(`/play/${cleanedPin}`, { state: { nickname: nickname.trim() } });
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6">
      <div className="bg-kilim pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -top-32 -end-24 h-96 w-96 rounded-full bg-brand-sun/20 blur-3xl" />

      <Card className="relative w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Logo className="mb-2 h-8" />
          <CardTitle>Join a game</CardTitle>
          <CardDescription>Enter the PIN shown on the host&apos;s screen.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-1.5">
              <Label htmlFor="pin">Game PIN</Label>
              <Input
                id="pin"
                inputMode="numeric"
                autoComplete="off"
                placeholder="123456"
                value={cleanedPin}
                onChange={(e) => setPin(e.target.value)}
                className="text-center font-display text-2xl tracking-[0.4em]"
                autoFocus
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                maxLength={20}
                placeholder="Your name"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
            <Button type="submit" variant="gradient" size="lg" disabled={!canJoin}>
              Enter game
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
