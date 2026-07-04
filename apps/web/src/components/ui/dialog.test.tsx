import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from './dialog';

describe('Dialog', () => {
  it('is closed initially and opens on trigger click', async () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Delete quiz?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByText('Delete quiz?')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Open'));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete quiz?')).toBeInTheDocument();
  });
});
