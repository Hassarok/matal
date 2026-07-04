import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo', () => {
  it('renders the MATAL wordmark and accessible mark', () => {
    render(<Logo />);
    expect(screen.getByText('MATAL')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'MATAL' })).toBeInTheDocument();
  });
});
