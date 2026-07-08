import { useState } from 'react';
import { ArrowDown, ArrowUp, Check } from 'lucide-react';
import { QuestionType, type AnswerSubmission, type PlayerQuestionView } from '@matal/shared-types';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Submission = Omit<AnswerSubmission, 'questionIndex'>;

const TILE_STYLES = [
  'bg-brand-sky text-white',
  'bg-brand-terracotta text-white',
  'bg-brand-mountain text-brand-sand',
  'bg-brand-pomegranate text-white',
  'bg-brand-sun text-brand-mountain',
  'bg-brand-sky/80 text-white',
];

export function AnswerInput({
  question,
  disabled,
  onSubmit,
}: {
  question: PlayerQuestionView;
  disabled: boolean;
  onSubmit: (submission: Submission) => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [text, setText] = useState('');
  const [order, setOrder] = useState<string[]>(question.items ?? []);

  const options = question.options ?? [];

  if (question.type === QuestionType.MultipleChoice || question.type === QuestionType.Poll) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onSubmit({ optionIndex: i })}
            className={cn(
              'min-h-16 rounded-xl px-4 py-3 text-start text-lg font-semibold shadow-soft transition-transform disabled:opacity-60',
              !disabled && 'hover:scale-[1.02] active:scale-[0.99]',
              TILE_STYLES[i % TILE_STYLES.length],
            )}
          >
            {option.text}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === QuestionType.TrueFalse) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[true, false].map((value, i) => (
          <button
            key={String(value)}
            type="button"
            disabled={disabled}
            onClick={() => onSubmit({ boolean: value })}
            className={cn(
              'min-h-20 rounded-xl text-xl font-bold shadow-soft transition-transform disabled:opacity-60',
              !disabled && 'hover:scale-[1.02] active:scale-[0.99]',
              TILE_STYLES[i],
            )}
          >
            {value ? 'True' : 'False'}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === QuestionType.MultipleSelect) {
    const toggle = (i: number) =>
      setSelected((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
    return (
      <div className="space-y-3">
        <div className="grid gap-2">
          {options.map((option, i) => (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => toggle(i)}
              className={cn(
                'flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-start font-medium transition-colors disabled:opacity-60',
                selected.includes(i)
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-surface-muted',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded border',
                  selected.includes(i) ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                )}
              >
                {selected.includes(i) && <Check className="size-3.5" />}
              </span>
              {option.text}
            </button>
          ))}
        </div>
        <Button
          className="w-full"
          disabled={disabled || selected.length === 0}
          onClick={() => onSubmit({ optionIndices: selected })}
        >
          Submit answer
        </Button>
      </div>
    );
  }

  if (question.type === QuestionType.ShortAnswer) {
    return (
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) onSubmit({ text: text.trim() });
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your answer"
          disabled={disabled}
          autoFocus
        />
        <Button type="submit" disabled={disabled || !text.trim()}>
          Submit
        </Button>
      </form>
    );
  }

  // ORDERING
  const move = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= order.length) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Put these in the correct order:</p>
      <div className="space-y-2">
        {order.map((item, i) => (
          <div
            key={item}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
          >
            <span className="w-5 text-center text-sm font-semibold text-muted-foreground">
              {i + 1}
            </span>
            <span className="flex-1 font-medium">{item}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move up"
              disabled={disabled || i === 0}
              onClick={() => move(i, -1)}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move down"
              disabled={disabled || i === order.length - 1}
              onClick={() => move(i, 1)}
            >
              <ArrowDown />
            </Button>
          </div>
        ))}
      </div>
      <Button className="w-full" disabled={disabled} onClick={() => onSubmit({ order })}>
        Submit order
      </Button>
    </div>
  );
}
