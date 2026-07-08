import { QuestionType, type QuestionContent } from '@matal/shared-types';
import type { GamePlayerState, LoadedQuestion } from './game.types';
import { buildLeaderboard, computePoints, isCorrect } from './scoring';

function question(type: QuestionType, content: QuestionContent): LoadedQuestion {
  return {
    index: 0,
    type,
    prompt: 'Q',
    mediaUrl: null,
    explanation: null,
    timeLimitSeconds: 20,
    points: 1000,
    content,
  };
}

describe('isCorrect', () => {
  it('grades multiple choice', () => {
    const q = question(QuestionType.MultipleChoice, {
      options: [
        { text: 'A', correct: false },
        { text: 'B', correct: true },
      ],
    });
    expect(isCorrect(q, { questionIndex: 0, optionIndex: 1 })).toBe(true);
    expect(isCorrect(q, { questionIndex: 0, optionIndex: 0 })).toBe(false);
  });

  it('grades true/false', () => {
    const q = question(QuestionType.TrueFalse, { correctAnswer: true });
    expect(isCorrect(q, { questionIndex: 0, boolean: true })).toBe(true);
    expect(isCorrect(q, { questionIndex: 0, boolean: false })).toBe(false);
  });

  it('grades multiple select by exact set', () => {
    const q = question(QuestionType.MultipleSelect, {
      options: [
        { text: 'A', correct: true },
        { text: 'B', correct: false },
        { text: 'C', correct: true },
      ],
    });
    expect(isCorrect(q, { questionIndex: 0, optionIndices: [2, 0] })).toBe(true);
    expect(isCorrect(q, { questionIndex: 0, optionIndices: [0] })).toBe(false);
    expect(isCorrect(q, { questionIndex: 0, optionIndices: [0, 1, 2] })).toBe(false);
  });

  it('grades short answer case-insensitively', () => {
    const q = question(QuestionType.ShortAnswer, { acceptableAnswers: ['Zagros', 'zagros mts'] });
    expect(isCorrect(q, { questionIndex: 0, text: '  ZAGROS ' })).toBe(true);
    expect(isCorrect(q, { questionIndex: 0, text: 'Alps' })).toBe(false);
  });

  it('grades ordering by exact sequence', () => {
    const q = question(QuestionType.Ordering, { items: ['1', '2', '3'] });
    expect(isCorrect(q, { questionIndex: 0, order: ['1', '2', '3'] })).toBe(true);
    expect(isCorrect(q, { questionIndex: 0, order: ['2', '1', '3'] })).toBe(false);
  });

  it('never marks a poll correct', () => {
    const q = question(QuestionType.Poll, { options: [{ text: 'A' }, { text: 'B' }] });
    expect(isCorrect(q, { questionIndex: 0, optionIndex: 0 })).toBe(false);
  });
});

describe('computePoints', () => {
  it('awards full points for an instant correct answer', () => {
    expect(computePoints(true, 1000, 0, 20_000)).toBe(1000);
  });

  it('awards ~half points at the buzzer', () => {
    expect(computePoints(true, 1000, 20_000, 20_000)).toBe(500);
  });

  it('awards nothing for a wrong answer or zero-point question', () => {
    expect(computePoints(false, 1000, 0, 20_000)).toBe(0);
    expect(computePoints(true, 0, 0, 20_000)).toBe(0);
  });
});

describe('buildLeaderboard', () => {
  it('ranks players by descending score', () => {
    const players = [
      { id: 'a', nickname: 'Ann', score: 300 },
      { id: 'b', nickname: 'Bo', score: 900 },
      { id: 'c', nickname: 'Cy', score: 600 },
    ] as GamePlayerState[];
    const board = buildLeaderboard(players);
    expect(board.map((e) => e.playerId)).toEqual(['b', 'c', 'a']);
    expect(board[0].rank).toBe(1);
  });
});
