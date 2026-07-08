import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, Clock, Pencil, Play } from 'lucide-react';
import {
  QuestionType,
  type ChoiceOption,
  type PublicQuestion,
} from '@matal/shared-types';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';

const TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.MultipleChoice]: 'Multiple choice',
  [QuestionType.TrueFalse]: 'True / false',
  [QuestionType.MultipleSelect]: 'Multiple select',
  [QuestionType.ShortAnswer]: 'Short answer',
  [QuestionType.Poll]: 'Poll',
  [QuestionType.Ordering]: 'Ordering',
};

function Choice({ text, correct }: { text: string; correct?: boolean }) {
  return (
    <li
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
        correct ? 'border-success bg-success/10 font-medium' : 'border-border',
      )}
    >
      {correct && <Check className="size-4 shrink-0 text-success" />}
      {text}
    </li>
  );
}

function QuestionBody({ question }: { question: PublicQuestion }) {
  const content = question.content;
  switch (question.type) {
    case QuestionType.MultipleChoice:
    case QuestionType.MultipleSelect:
      return (
        <ul className="grid gap-2 sm:grid-cols-2">
          {(content as { options: ChoiceOption[] }).options.map((o, i) => (
            <Choice key={i} text={o.text} correct={o.correct} />
          ))}
        </ul>
      );
    case QuestionType.Poll:
      return (
        <ul className="grid gap-2 sm:grid-cols-2">
          {(content as { options: { text: string }[] }).options.map((o, i) => (
            <Choice key={i} text={o.text} />
          ))}
        </ul>
      );
    case QuestionType.TrueFalse:
      return (
        <ul className="grid grid-cols-2 gap-2">
          <Choice text="True" correct={(content as { correctAnswer: boolean }).correctAnswer} />
          <Choice
            text="False"
            correct={!(content as { correctAnswer: boolean }).correctAnswer}
          />
        </ul>
      );
    case QuestionType.ShortAnswer:
      return (
        <div className="flex flex-wrap gap-2">
          {(content as { acceptableAnswers: string[] }).acceptableAnswers.map((a, i) => (
            <Badge key={i} variant="success">
              {a}
            </Badge>
          ))}
        </div>
      );
    case QuestionType.Ordering:
      return (
        <ol className="grid gap-2">
          {(content as { items: string[] }).items.map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span className="font-semibold text-muted-foreground">{i + 1}.</span>
              {item}
            </li>
          ))}
        </ol>
      );
    default:
      return null;
  }
}

/** Read-only preview of a quiz — its metadata and every question's answer key. */
export function QuizDetailPage() {
  const { id = '' } = useParams();
  const quizQuery = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => api.quizzes.get(id),
  });

  const quiz = quizQuery.data;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-6">
        <TopBar />
        <main className="grid gap-6 py-6">
          <Button asChild variant="ghost" size="sm" className="w-fit -ms-2">
            <Link to="/quizzes">
              <ArrowLeft /> Back to my quizzes
            </Link>
          </Button>

          {quizQuery.isLoading ? (
            <div className="grid gap-4">
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !quiz ? (
            <Card>
              <CardContent className="py-14 text-center text-muted-foreground">
                This quiz could not be found.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl font-extrabold tracking-tight">
                    {quiz.title}
                  </h1>
                  {quiz.description && (
                    <p className="mt-1 text-muted-foreground">{quiz.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="lowercase">
                      {quiz.difficulty.toLowerCase()}
                    </Badge>
                    <Badge variant="outline" className="lowercase">
                      {quiz.visibility.toLowerCase()}
                    </Badge>
                    {quiz.category && <Badge variant="outline">{quiz.category.name}</Badge>}
                    <Badge variant="secondary">
                      {quiz.questionCount} question{quiz.questionCount === 1 ? '' : 's'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link to={`/quizzes/${quiz.id}/edit`}>
                      <Pencil /> Edit
                    </Link>
                  </Button>
                  {quiz.questionCount > 0 && (
                    <Button asChild variant="gradient">
                      <Link to={`/host/${quiz.id}`}>
                        <Play /> Host live
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                {quiz.questions.map((question, i) => (
                  <Card key={question.id}>
                    <CardHeader className="flex-row items-start justify-between gap-4">
                      <CardTitle className="text-base">
                        <span className="text-muted-foreground">{i + 1}.</span> {question.prompt}
                      </CardTitle>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="secondary">{TYPE_LABELS[question.type]}</Badge>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {question.timeLimitSeconds}s
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <QuestionBody question={question} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
