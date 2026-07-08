import {
  QuestionType,
  type AnswerDistribution,
  type AnswerSubmission,
  type ChoiceOption,
  type GamePodium,
  type HostQuestionView,
  type LeaderboardEntry,
  type PlayerQuestionView,
} from '@matal/shared-types';
import type { GamePlayerState, LoadedQuestion } from './game.types';

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function correctOptionIndices(options: ChoiceOption[]): number[] {
  return options.reduce<number[]>((acc, option, i) => {
    if (option.correct) acc.push(i);
    return acc;
  }, []);
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function setsEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((v, i) => v === sortedB[i]);
}

/** Server-authoritative correctness check for a submitted answer. */
export function isCorrect(question: LoadedQuestion, submission: AnswerSubmission): boolean {
  const content = question.content;
  switch (question.type) {
    case QuestionType.MultipleChoice: {
      const options = (content as { options: ChoiceOption[] }).options;
      return submission.optionIndex !== undefined && !!options[submission.optionIndex]?.correct;
    }
    case QuestionType.TrueFalse:
      return submission.boolean === (content as { correctAnswer: boolean }).correctAnswer;
    case QuestionType.MultipleSelect: {
      const options = (content as { options: ChoiceOption[] }).options;
      return setsEqual(submission.optionIndices ?? [], correctOptionIndices(options));
    }
    case QuestionType.ShortAnswer: {
      const accepted = (content as { acceptableAnswers: string[] }).acceptableAnswers.map(
        normalize,
      );
      return submission.text !== undefined && accepted.includes(normalize(submission.text));
    }
    case QuestionType.Ordering: {
      const items = (content as { items: string[] }).items;
      return !!submission.order && arraysEqual(submission.order, items);
    }
    case QuestionType.Poll:
      return false; // polls have no correct answer
    default:
      return false;
  }
}

/**
 * Speed-weighted score. A correct answer earns between half and full points:
 * instant answers get ~100%, buzzer-beaters ~50%. Polls and wrong answers = 0.
 */
export function computePoints(
  correct: boolean,
  basePoints: number,
  responseMs: number,
  limitMs: number,
): number {
  if (!correct || basePoints <= 0) return 0;
  const fraction = limitMs > 0 ? Math.min(1, Math.max(0, responseMs / limitMs)) : 0;
  const factor = 1 - fraction / 2; // 1.0 → 0.5
  return Math.round(basePoints * factor);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Build the player-facing question view (never reveals the correct answer). */
export function toPlayerQuestion(
  question: LoadedQuestion,
  total: number,
  endsAt: number,
): PlayerQuestionView {
  const base: PlayerQuestionView = {
    index: question.index,
    total,
    type: question.type,
    prompt: question.prompt,
    mediaUrl: question.mediaUrl,
    timeLimitSeconds: question.timeLimitSeconds,
    points: question.points,
    endsAt,
  };

  switch (question.type) {
    case QuestionType.MultipleChoice:
    case QuestionType.MultipleSelect:
      return {
        ...base,
        options: (question.content as { options: ChoiceOption[] }).options.map((o) => ({
          text: o.text,
        })),
      };
    case QuestionType.Poll:
      return {
        ...base,
        options: (question.content as { options: { text: string }[] }).options.map((o) => ({
          text: o.text,
        })),
      };
    case QuestionType.Ordering:
      return { ...base, items: shuffle((question.content as { items: string[] }).items) };
    default:
      return base;
  }
}

/** Build the host-facing question view (includes correct answers + counts). */
export function toHostQuestion(
  question: LoadedQuestion,
  total: number,
  endsAt: number,
  answeredCount: number,
  playerCount: number,
): HostQuestionView {
  const view = toPlayerQuestion(question, total, endsAt) as HostQuestionView;
  view.answeredCount = answeredCount;
  view.playerCount = playerCount;

  switch (question.type) {
    case QuestionType.MultipleChoice:
    case QuestionType.MultipleSelect:
      view.correctOptionIndices = correctOptionIndices(
        (question.content as { options: ChoiceOption[] }).options,
      );
      break;
    case QuestionType.TrueFalse:
      view.correctAnswer = (question.content as { correctAnswer: boolean }).correctAnswer;
      break;
    case QuestionType.ShortAnswer:
      view.acceptableAnswers = (
        question.content as { acceptableAnswers: string[] }
      ).acceptableAnswers;
      break;
    case QuestionType.Ordering:
      view.correctOrder = (question.content as { items: string[] }).items;
      break;
  }
  return view;
}

/** Build the answer distribution for a question's reveal. */
export function buildDistribution(
  question: LoadedQuestion,
  answers: { correct: boolean; submission: AnswerSubmission }[],
): AnswerDistribution {
  const answeredCount = answers.length;

  if (
    question.type === QuestionType.MultipleChoice ||
    question.type === QuestionType.MultipleSelect ||
    question.type === QuestionType.Poll
  ) {
    const options = (question.content as { options: { text: string; correct?: boolean }[] })
      .options;
    const buckets = options.map((option, index) => ({
      label: option.text,
      count: answers.filter((a) =>
        question.type === QuestionType.MultipleSelect
          ? a.submission.optionIndices?.includes(index)
          : a.submission.optionIndex === index,
      ).length,
      correct: Boolean(option.correct),
    }));
    return { buckets, answeredCount };
  }

  // TRUE_FALSE / SHORT_ANSWER / ORDERING → correct vs incorrect split.
  const correctCount = answers.filter((a) => a.correct).length;
  return {
    answeredCount,
    buckets: [
      { label: 'Correct', count: correctCount, correct: true },
      { label: 'Incorrect', count: answeredCount - correctCount, correct: false },
    ],
  };
}

/** Ranked leaderboard (highest score first). */
export function buildLeaderboard(players: GamePlayerState[]): LeaderboardEntry[] {
  return [...players]
    .sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname))
    .map((player, i) => ({
      rank: i + 1,
      playerId: player.id,
      nickname: player.nickname,
      score: player.score,
    }));
}

export function buildPodium(
  players: GamePlayerState[],
  questionCount: number,
): GamePodium {
  const leaderboard = buildLeaderboard(players);
  return {
    winner: leaderboard[0] ?? null,
    top: leaderboard.slice(0, 3),
    finalLeaderboard: leaderboard,
    questionCount,
    playerCount: players.length,
  };
}
