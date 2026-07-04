import { Logger, ServiceUnavailableException } from '@nestjs/common';
import type {
  ContentModerator,
  DifficultyAnalyzer,
  QuestionSuggester,
  QuizGenerator,
  Translator,
} from './interfaces/ai-provider.interfaces';

/**
 * Default "disabled" implementations bound when no AI provider is configured.
 * They make the capability contracts injectable everywhere today while clearly
 * signalling that the feature is off — calls fail fast with a 503 rather than a
 * confusing null reference. Swap these for real implementations in AiModule.
 */
const logger = new Logger('AiModule');

function notConfigured(capability: string): never {
  logger.warn(`AI capability "${capability}" was invoked but is not configured.`);
  throw new ServiceUnavailableException(
    `The "${capability}" AI feature is not enabled on this deployment.`,
  );
}

export class DisabledQuizGenerator implements QuizGenerator {
  generateQuiz(): never {
    return notConfigured('quiz-generation');
  }
}

export class DisabledQuestionSuggester implements QuestionSuggester {
  suggestQuestions(): never {
    return notConfigured('question-suggestions');
  }
}

export class DisabledContentModerator implements ContentModerator {
  moderate(): never {
    return notConfigured('content-moderation');
  }
}

export class DisabledTranslator implements Translator {
  translate(): never {
    return notConfigured('translation');
  }
}

export class DisabledDifficultyAnalyzer implements DifficultyAnalyzer {
  estimateDifficulty(): never {
    return notConfigured('difficulty-analysis');
  }
}
