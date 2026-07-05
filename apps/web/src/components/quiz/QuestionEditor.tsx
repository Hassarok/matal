import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { QuestionType } from '@matal/shared-types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  QUESTION_TYPE_LABELS,
  type OptionDraft,
  type QuestionDraft,
} from './question-draft';

const TIME_OPTIONS = [5, 10, 20, 30, 45, 60, 90, 120];
const POINT_OPTIONS = [0, 500, 1000, 1500, 2000];

interface QuestionEditorProps {
  draft: QuestionDraft;
  index: number;
  total: number;
  error?: string;
  onChange: (draft: QuestionDraft) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

export function QuestionEditor({
  draft,
  index,
  total,
  error,
  onChange,
  onMove,
  onRemove,
}: QuestionEditorProps) {
  const update = (patch: Partial<QuestionDraft>) => onChange({ ...draft, ...patch });

  const setOption = (i: number, patch: Partial<OptionDraft>) =>
    update({ options: draft.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) });

  const setSingleCorrect = (i: number) =>
    update({ options: draft.options.map((o, idx) => ({ ...o, correct: idx === i })) });

  const addOption = () => {
    if (draft.options.length >= 6) return;
    update({ options: [...draft.options, { text: '', correct: false }] });
  };

  const removeOption = (i: number) => {
    if (draft.options.length <= 2) return;
    let options = draft.options.filter((_, idx) => idx !== i);
    // Keep one correct answer for single-select questions.
    if (draft.type === QuestionType.MultipleChoice && !options.some((o) => o.correct)) {
      options = options.map((o, idx) => ({ ...o, correct: idx === 0 }));
    }
    update({ options });
  };

  const setListItem = (
    field: 'acceptableAnswers' | 'items',
    i: number,
    value: string,
  ) => update({ [field]: draft[field].map((v, idx) => (idx === i ? value : v)) });

  const addListItem = (field: 'acceptableAnswers' | 'items') =>
    update({ [field]: [...draft[field], ''] });

  const removeListItem = (field: 'acceptableAnswers' | 'items', i: number, min: number) => {
    if (draft[field].length <= min) return;
    update({ [field]: draft[field].filter((_, idx) => idx !== i) });
  };

  const moveItem = (i: number, direction: -1 | 1) => {
    const target = i + direction;
    if (target < 0 || target >= draft.items.length) return;
    const items = [...draft.items];
    [items[i], items[target]] = [items[target], items[i]];
    update({ items });
  };

  return (
    <Card className={error ? 'border-destructive' : undefined}>
      <CardContent className="space-y-4 p-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {index + 1}
            </span>
            <Badge variant="secondary">{QUESTION_TYPE_LABELS[draft.type]}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move up"
              disabled={index === 0}
              onClick={() => onMove(-1)}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move down"
              disabled={index === total - 1}
              onClick={() => onMove(1)}
            >
              <ArrowDown />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Delete question"
              className="text-destructive"
              onClick={onRemove}
            >
              <Trash2 />
            </Button>
          </div>
        </div>

        {/* Prompt */}
        <div className="grid gap-1.5">
          <Label htmlFor={`${draft.key}-prompt`}>Question</Label>
          <Textarea
            id={`${draft.key}-prompt`}
            value={draft.prompt}
            onChange={(e) => update({ prompt: e.target.value })}
            placeholder="What do you want to ask?"
            className="min-h-16"
          />
        </div>

        {/* Answers */}
        <AnswersEditor
          draft={draft}
          setOption={setOption}
          setSingleCorrect={setSingleCorrect}
          addOption={addOption}
          removeOption={removeOption}
          setListItem={setListItem}
          addListItem={addListItem}
          removeListItem={removeListItem}
          moveItem={moveItem}
          setCorrectAnswer={(v) => update({ correctAnswer: v })}
        />

        {error && <p className="text-xs font-medium text-destructive">{error}</p>}

        {/* Settings */}
        <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor={`${draft.key}-time`}>Time limit</Label>
            <Select
              id={`${draft.key}-time`}
              value={draft.timeLimitSeconds}
              onChange={(e) => update({ timeLimitSeconds: Number(e.target.value) })}
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t} seconds
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${draft.key}-points`}>Points</Label>
            <Select
              id={`${draft.key}-points`}
              value={draft.points}
              onChange={(e) => update({ points: Number(e.target.value) })}
            >
              {POINT_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p === 0 ? 'No points' : `${p} points`}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor={`${draft.key}-media`}>Image URL (optional)</Label>
            <Input
              id={`${draft.key}-media`}
              value={draft.mediaUrl}
              onChange={(e) => update({ mediaUrl: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor={`${draft.key}-explanation`}>Explanation (optional)</Label>
            <Input
              id={`${draft.key}-explanation`}
              value={draft.explanation}
              onChange={(e) => update({ explanation: e.target.value })}
              placeholder="Shown after the question"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AnswersEditorProps {
  draft: QuestionDraft;
  setOption: (i: number, patch: Partial<OptionDraft>) => void;
  setSingleCorrect: (i: number) => void;
  addOption: () => void;
  removeOption: (i: number) => void;
  setListItem: (field: 'acceptableAnswers' | 'items', i: number, value: string) => void;
  addListItem: (field: 'acceptableAnswers' | 'items') => void;
  removeListItem: (field: 'acceptableAnswers' | 'items', i: number, min: number) => void;
  moveItem: (i: number, direction: -1 | 1) => void;
  setCorrectAnswer: (value: boolean) => void;
}

function AnswersEditor({
  draft,
  setOption,
  setSingleCorrect,
  addOption,
  removeOption,
  setListItem,
  addListItem,
  removeListItem,
  moveItem,
  setCorrectAnswer,
}: AnswersEditorProps) {
  const { type } = draft;

  if (type === QuestionType.TrueFalse) {
    return (
      <div className="flex gap-3">
        {[true, false].map((value) => (
          <button
            key={String(value)}
            type="button"
            onClick={() => setCorrectAnswer(value)}
            className={
              'flex-1 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-colors ' +
              (draft.correctAnswer === value
                ? 'border-success bg-success/10 text-success'
                : 'border-border text-muted-foreground hover:bg-surface-muted')
            }
          >
            {value ? 'True' : 'False'}
          </button>
        ))}
      </div>
    );
  }

  if (type === QuestionType.ShortAnswer) {
    return (
      <ListEditor
        label="Accepted answers"
        values={draft.acceptableAnswers}
        min={1}
        placeholder="An accepted answer"
        onChange={(i, v) => setListItem('acceptableAnswers', i, v)}
        onAdd={() => addListItem('acceptableAnswers')}
        onRemove={(i) => removeListItem('acceptableAnswers', i, 1)}
      />
    );
  }

  if (type === QuestionType.Ordering) {
    return (
      <div className="space-y-2">
        <Label>Items (in the correct order)</Label>
        {draft.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 text-center text-sm font-semibold text-muted-foreground">
              {i + 1}
            </span>
            <Input
              value={item}
              onChange={(e) => setListItem('items', i, e.target.value)}
              placeholder={`Item ${i + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move item up"
              disabled={i === 0}
              onClick={() => moveItem(i, -1)}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move item down"
              disabled={i === draft.items.length - 1}
              onClick={() => moveItem(i, 1)}
            >
              <ArrowDown />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove item"
              disabled={draft.items.length <= 2}
              onClick={() => removeListItem('items', i, 2)}
            >
              <X />
            </Button>
          </div>
        ))}
        {draft.items.length < 6 && (
          <Button type="button" variant="outline" size="sm" onClick={() => addListItem('items')}>
            <Plus /> Add item
          </Button>
        )}
      </div>
    );
  }

  // MULTIPLE_CHOICE, MULTIPLE_SELECT, POLL
  const single = type === QuestionType.MultipleChoice;
  const isPoll = type === QuestionType.Poll;

  return (
    <div className="space-y-2">
      <Label>{isPoll ? 'Options' : 'Options (mark the correct one)'}</Label>
      {draft.options.map((option, i) => (
        <div key={i} className="flex items-center gap-2">
          {!isPoll &&
            (single ? (
              <input
                type="radio"
                name={`${draft.key}-correct`}
                checked={option.correct}
                onChange={() => setSingleCorrect(i)}
                aria-label={`Mark option ${i + 1} correct`}
                className="h-4 w-4 accent-[rgb(var(--color-success))]"
              />
            ) : (
              <input
                type="checkbox"
                checked={option.correct}
                onChange={(e) => setOption(i, { correct: e.target.checked })}
                aria-label={`Mark option ${i + 1} correct`}
                className="h-4 w-4 accent-[rgb(var(--color-success))]"
              />
            ))}
          <Input
            value={option.text}
            onChange={(e) => setOption(i, { text: e.target.value })}
            placeholder={`Option ${i + 1}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove option"
            disabled={draft.options.length <= 2}
            onClick={() => removeOption(i)}
          >
            <X />
          </Button>
        </div>
      ))}
      {draft.options.length < 6 && (
        <Button type="button" variant="outline" size="sm" onClick={addOption}>
          <Plus /> Add option
        </Button>
      )}
    </div>
  );
}

interface ListEditorProps {
  label: string;
  values: string[];
  min: number;
  placeholder: string;
  onChange: (i: number, value: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}

function ListEditor({
  label,
  values,
  min,
  placeholder,
  onChange,
  onAdd,
  onRemove,
}: ListEditorProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {values.map((value, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(i, e.target.value)}
            placeholder={placeholder}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove"
            disabled={values.length <= min}
            onClick={() => onRemove(i)}
          >
            <X />
          </Button>
        </div>
      ))}
      {values.length < 10 && (
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus /> Add
        </Button>
      )}
    </div>
  );
}
