import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/** Shared top navigation bar used across public pages. */
export function TopBar() {
  return (
    <header className="flex items-center justify-between py-6">
      <Link to="/" aria-label="MATAL home" className="rounded-md focus-visible:ring-2">
        <Logo />
      </Link>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
