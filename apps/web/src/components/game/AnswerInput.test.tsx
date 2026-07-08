import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionType, type PlayerQuestionView } from '@matal/shared-types';
import { AnswerInput } from './AnswerInput';

function question(overrides: Partial<PlayerQuestionView>): PlayerQuestionView {
  return {
    index: 0,
    total: 1,
    type: QuestionType.MultipleChoice,
    prompt: 'Q?',
    mediaUrl: null,
    timeLimitSeconds: 20,
    points: 1000,
    endsAt: Date.now() + 20_000,
    ...overrides,
  };
}

describe('AnswerInput', () => {
  it('submits the chosen option index for multiple choice', async () => {
    const onSubmit = vi.fn();
    render(
      <AnswerInput
        question={question({ options: [{ text: 'Zagros' }, { text: 'Alps' }] })}
        disabled={false}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Alps' }));
    expect(onSubmit).toHaveBeenCalledWith({ optionIndex: 1 });
  });

  it('submits a boolean for true/false', async () => {
    const onSubmit = vi.fn();
    render(
      <AnswerInput
        question={question({ type: QuestionType.TrueFalse })}
        disabled={false}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'True' }));
    expect(onSubmit).toHaveBeenCalledWith({ boolean: true });
  });

  it('does not submit when disabled', async () => {
    const onSubmit = vi.fn();
    render(
      <AnswerInput
        question={question({ options: [{ text: 'A' }, { text: 'B' }] })}
        disabled
        onSubmit={onSubmit}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'A' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('collects multiple selections before submitting', async () => {
    const onSubmit = vi.fn();
    render(
      <AnswerInput
        question={question({
          type: QuestionType.MultipleSelect,
          options: [{ text: 'A' }, { text: 'B' }, { text: 'C' }],
        })}
        disabled={false}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'A' }));
    await userEvent.click(screen.getByRole('button', { name: 'C' }));
    await userEvent.click(screen.getByRole('button', { name: /submit answer/i }));
    expect(onSubmit).toHaveBeenCalledWith({ optionIndices: [0, 2] });
  });
});
