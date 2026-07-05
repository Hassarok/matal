import { describe, expect, it } from 'vitest';
import { questionSchema, saveQuizSchema } from '@matal/validation';
import { Difficulty, QuestionType, QuizVisibility } from '@matal/shared-types';

const base = {
  prompt: 'Which is correct?',
  timeLimitSeconds: 20,
  points: 1000,
};

describe('questionSchema', () => {
  it('rejects a multiple-choice question with no correct answer', () => {
    const result = questionSchema.safeParse({
      ...base,
      type: QuestionType.MultipleChoice,
      options: [
        { text: 'A', correct: false },
        { text: 'B', correct: false },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a multiple-choice question with exactly one correct answer', () => {
    const result = questionSchema.safeParse({
      ...base,
      type: QuestionType.MultipleChoice,
      options: [
        { text: 'A', correct: true },
        { text: 'B', correct: false },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a multiple-select question with no correct answers', () => {
    const result = questionSchema.safeParse({
      ...base,
      type: QuestionType.MultipleSelect,
      options: [
        { text: 'A', correct: false },
        { text: 'B', correct: false },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid true/false question', () => {
    const result = questionSchema.safeParse({
      ...base,
      type: QuestionType.TrueFalse,
      correctAnswer: true,
    });
    expect(result.success).toBe(true);
  });
});

describe('saveQuizSchema', () => {
  it('requires a title', () => {
    const result = saveQuizSchema.safeParse({
      title: '',
      difficulty: Difficulty.Easy,
      visibility: QuizVisibility.Private,
      questions: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a minimal valid quiz', () => {
    const result = saveQuizSchema.safeParse({
      title: 'My Quiz',
      difficulty: Difficulty.Easy,
      visibility: QuizVisibility.Private,
      questions: [],
    });
    expect(result.success).toBe(true);
  });
});
