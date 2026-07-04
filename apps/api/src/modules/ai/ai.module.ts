import { Global, Module } from '@nestjs/common';
import {
  CONTENT_MODERATOR,
  DIFFICULTY_ANALYZER,
  QUESTION_SUGGESTER,
  QUIZ_GENERATOR,
  TRANSLATOR,
} from './ai.tokens';
import {
  DisabledContentModerator,
  DisabledDifficultyAnalyzer,
  DisabledQuestionSuggester,
  DisabledQuizGenerator,
  DisabledTranslator,
} from './disabled-ai.providers';

/**
 * AI capability module (future-readiness seam).
 *
 * Today it binds every AI contract to a "disabled" implementation. When you
 * introduce real providers (e.g. an LLM-backed generator), replace the
 * `useClass` bindings below — or make them conditional on config — and every
 * consumer keeps working unchanged. Marked @Global so any feature module can
 * inject a capability without re-importing.
 */
@Global()
@Module({
  providers: [
    { provide: QUIZ_GENERATOR, useClass: DisabledQuizGenerator },
    { provide: QUESTION_SUGGESTER, useClass: DisabledQuestionSuggester },
    { provide: CONTENT_MODERATOR, useClass: DisabledContentModerator },
    { provide: TRANSLATOR, useClass: DisabledTranslator },
    { provide: DIFFICULTY_ANALYZER, useClass: DisabledDifficultyAnalyzer },
  ],
  exports: [
    QUIZ_GENERATOR,
    QUESTION_SUGGESTER,
    CONTENT_MODERATOR,
    TRANSLATOR,
    DIFFICULTY_ANALYZER,
  ],
})
export class AiModule {}
