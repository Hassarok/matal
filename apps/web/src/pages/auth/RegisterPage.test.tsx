import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('RegisterPage', () => {
  it('shows inline validation errors when submitting an empty form', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/display name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/username must be at least 3/i)).toBeInTheDocument();
    expect(screen.getByText(/password must be at least 8/i)).toBeInTheDocument();
  });

  it('validates a too-short username as the user types', async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText(/username/i), 'ab');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/username must be at least 3/i)).toBeInTheDocument();
  });
});
