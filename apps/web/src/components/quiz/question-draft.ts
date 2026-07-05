import { QuestionType, type ChoiceOption, type PublicQuestion } from '@matal/shared-types';

export interface OptionDraft {
  text: string;
  correct: boolean;
}

/** Editable, UI-friendly superset of a question (all type fields present). */
export interface QuestionDraft {
  key: string;
  type: QuestionType;
  prompt: string;
  mediaUrl: string;
  explanation: string;
  timeLimitSeconds: number;
  points: number;
  options: OptionDraft[]; // MULTIPLE_CHOICE, MULTIPLE_SELECT, POLL
  correctAnswer: boolean; // TRUE_FALSE
  acceptableAnswers: string[]; // SHORT_ANSWER
  items: string[]; // ORDERING
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.MultipleChoice]: 'Multiple choice',
  [QuestionType.TrueFalse]: 'True / False',
  [QuestionType.MultipleSelect]: 'Multiple select',
  [QuestionType.ShortAnswer]: 'Short answer',
  [QuestionType.Poll]: 'Poll',
  [QuestionType.Ordering]: 'Ordering',
};

let keyCounter = 0;
export function nextKey(): string {
  keyCounter += 1;
  return `q-${Date.now()}-${keyCounter}`;
}

export function createDraft(type: QuestionType): QuestionDraft {
  const base: QuestionDraft = {
    key: nextKey(),
    type,
    prompt: '',
    mediaUrl: '',
    explanation: '',
    timeLimitSeconds: 20,
    points: 1000,
    options: [],
    correctAnswer: true,
    acceptableAnswers: [''],
    items: ['', ''],
  };
  switch (type) {
    case QuestionType.MultipleChoice:
      return {
        ...base,
        options: [
          { text: '', correct: true },
          { text: '', correct: false },
        ],
      };
    case QuestionType.MultipleSelect:
    case QuestionType.Poll:
      return {
        ...base,
        options: [
          { text: '', correct: false },
          { text: '', correct: false },
        ],
      };
    default:
      return base;
  }
}

/** Convert a saved question into an editable draft. */
export function questionToDraft(question: PublicQuestion): QuestionDraft {
  const draft = createDraft(question.type);
  draft.key = nextKey();
  draft.prompt = question.prompt;
  draft.mediaUrl = question.mediaUrl ?? '';
  draft.explanation = question.explanation ?? '';
  draft.timeLimitSeconds = question.timeLimitSeconds;
  draft.points = question.points;

  const content = question.content;
  switch (question.type) {
    case QuestionType.MultipleChoice:
    case QuestionType.MultipleSelect:
      draft.options = (content as { options: ChoiceOption[] }).options.map((o) => ({
        text: o.text,
        correct: o.correct,
      }));
      break;
    case QuestionType.Poll:
      draft.options = (content as { options: { text: string }[] }).options.map((o) => ({
        text: o.text,
        correct: false,
      }));
      break;
    case QuestionType.TrueFalse:
      draft.correctAnswer = (content as { correctAnswer: boolean }).correctAnswer;
      break;
    case QuestionType.ShortAnswer:
      draft.acceptableAnswers = (content as { acceptableAnswers: string[] }).acceptableAnswers;
      break;
    case QuestionType.Ordering:
      draft.items = (content as { items: string[] }).items;
      break;
  }
  return draft;
}

/** Convert a draft into the API payload shape (validated by saveQuizSchema). */
export function draftToInput(draft: QuestionDraft): Record<string, unknown> {
  const base = {
    type: draft.type,
    prompt: draft.prompt,
    mediaUrl: draft.mediaUrl,
    explanation: draft.explanation,
    timeLimitSeconds: draft.timeLimitSeconds,
    points: draft.points,
  };
  switch (draft.type) {
    case QuestionType.MultipleChoice:
    case QuestionType.MultipleSelect:
      return { ...base, options: draft.options };
    case QuestionType.Poll:
      return { ...base, options: draft.options.map((o) => ({ text: o.text })) };
    case QuestionType.TrueFalse:
      return { ...base, correctAnswer: draft.correctAnswer };
    case QuestionType.ShortAnswer:
      return { ...base, acceptableAnswers: draft.acceptableAnswers };
    case QuestionType.Ordering:
      return { ...base, items: draft.items };
    default:
      return base;
  }
}
