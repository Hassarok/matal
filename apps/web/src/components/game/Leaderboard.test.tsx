import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { LeaderboardEntry } from '@matal/shared-types';
import { Leaderboard } from './Leaderboard';

const entries: LeaderboardEntry[] = [
  { rank: 1, playerId: 'a', nickname: 'Ada', score: 1500 },
  { rank: 2, playerId: 'b', nickname: 'Bo', score: 900 },
  { rank: 3, playerId: 'c', nickname: 'Cy', score: 400 },
];

describe('Leaderboard', () => {
  it('renders every entry with rank and score', () => {
    render(<Leaderboard entries={entries} />);
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('limits the number of visible entries', () => {
    render(<Leaderboard entries={entries} limit={2} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText('Cy')).not.toBeInTheDocument();
  });
});
