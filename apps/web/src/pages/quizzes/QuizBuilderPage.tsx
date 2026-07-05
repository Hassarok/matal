import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { CircleAlert, Plus, X } from 'lucide-react';
import {
  quizMetaSchema,
  saveQuizSchema,
  type SaveQuizInput,
} from '@matal/validation';
import { Difficulty, QuestionType, QuizVisibility } from '@matal/shared-types';
import { TopBar } from '@/components/layout/TopBar';
import { Field } from '@/components/form/Field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';
import { FullPageLoader } from '@/components/FullPageLoader';
import { QuestionEditor } from '@/components/quiz/QuestionEditor';
import {
  QUESTION_TYPE_LABELS,
  createDraft,
  draftToInput,
  questionToDraft,
  type QuestionDraft,
} from '@/components/quiz/question-draft';
import { useCategories } from '@/hooks/useCategories';
import { api } from '@/lib/api';
import { applyApiError } from '@/lib/form-errors';

const metaSchema = quizMetaSchema.omit({ tags: true, categoryId: true });
type MetaForm = {
  title: string;
  description?: string;
  coverImageUrl?: string;
  difficulty: Difficulty;
  visibility: QuizVisibility;
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  [Difficulty.Easy]: 'Easy',
  [Difficulty.Medium]: 'Medium',
  [Difficulty.Hard]: 'Hard',
};

const VISIBILITY_LABELS: Record<QuizVisibility, string> = {
  [QuizVisibility.Private]: 'Private',
  [QuizVisibility.Public]: 'Public',
  [QuizVisibility.Unlisted]: 'Unlisted',
};

export function QuizBuilderPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const categoriesQuery = useCategories();

  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [newType, setNewType] = useState<QuestionType>(QuestionType.MultipleChoice);
  const [questionErrors, setQuestionErrors] = useState<Record<number, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const initialized = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<MetaForm>({
    resolver: zodResolver(metaSchema),
    defaultValues: {
      title: '',
      description: '',
      coverImageUrl: '',
      difficulty: Difficulty.Medium,
      visibility: QuizVisibility.Private,
    },
  });

  const quizQuery = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => api.quizzes.get(id as string),
    enabled: isEdit,
  });

  // Initialise the form once the existing quiz has loaded (edit mode).
  useEffect(() => {
    if (!quizQuery.data || initialized.current) return;
    const quiz = quizQuery.data;
    initialized.current = true;
    reset({
      title: quiz.title,
      description: quiz.description ?? '',
      coverImageUrl: quiz.coverImageUrl ?? '',
      difficulty: quiz.difficulty,
      visibility: quiz.visibility,
    });
    setTags(quiz.tags);
    setCategoryId(quiz.categoryId ?? '');
    setDrafts(quiz.questions.map(questionToDraft));
  }, [quizQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (input: SaveQuizInput) =>
      isEdit ? api.quizzes.update(id as string, input) : api.quizzes.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success(isEdit ? 'Quiz updated' : 'Quiz created');
      navigate('/quizzes', { replace: true });
    },
  });

  const addTag = () => {
    const value = tagInput.trim();
    if (!value || tags.includes(value) || tags.length >= 10) return;
    setTags([...tags, value.slice(0, 30)]);
    setTagInput('');
  };

  const addQuestion = () => setDrafts((prev) => [...prev, createDraft(newType)]);

  const updateDraft = (index: number, draft: QuestionDraft) =>
    setDrafts((prev) => prev.map((d, i) => (i === index ? draft : d)));

  const moveDraft = (index: number, direction: -1 | 1) =>
    setDrafts((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const removeDraft = (index: number) =>
    setDrafts((prev) => prev.filter((_, i) => i !== index));

  const onSubmit = handleSubmit((meta) => {
    setFormError(null);
    setQuestionErrors({});

    if (drafts.length === 0) {
      setFormError('Add at least one question before saving.');
      return;
    }

    const payload = {
      ...meta,
      categoryId: categoryId || null,
      tags,
      questions: drafts.map(draftToInput),
    };

    const parsed = saveQuizSchema.safeParse(payload);
    if (!parsed.success) {
      const qErrors: Record<number, string> = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === 'questions' && typeof issue.path[1] === 'number') {
          qErrors[issue.path[1]] ??= issue.message;
        }
      }
      setQuestionErrors(qErrors);
      setFormError('Please fix the highlighted questions before saving.');
      return;
    }

    mutation.mutateAsync(parsed.data).catch((error) => {
      setFormError(applyApiError(error, setError));
    });
  });

  if (isEdit && quizQuery.isLoading) return <FullPageLoader />;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-6">
        <TopBar />
        <form onSubmit={onSubmit} noValidate className="grid gap-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight">
                {isEdit ? 'Edit quiz' : 'Create a quiz'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {drafts.length} question{drafts.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate('/quizzes')}>
                Cancel
              </Button>
              <Button type="submit" loading={mutation.isPending}>
                {isEdit ? 'Save changes' : 'Create quiz'}
              </Button>
            </div>
          </div>

          {formError && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
              <CardDescription>Give your quiz a title and organise it.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field label="Title" htmlFor="title" error={errors.title?.message}>
                <Input id="title" invalid={!!errors.title} {...register('title')} />
              </Field>
              <Field
                label="Description"
                htmlFor="description"
                error={errors.description?.message}
              >
                <Textarea id="description" {...register('description')} />
              </Field>
              <Field
                label="Cover image URL"
                htmlFor="coverImageUrl"
                error={errors.coverImageUrl?.message}
                hint="Optional"
              >
                <Input id="coverImageUrl" placeholder="https://…" {...register('coverImageUrl')} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">None</option>
                    {categoriesQuery.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select id="difficulty" {...register('difficulty')}>
                    {Object.values(Difficulty).map((d) => (
                      <option key={d} value={d}>
                        {DIFFICULTY_LABELS[d]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select id="visibility" {...register('visibility')}>
                    {Object.values(QuizVisibility).map((v) => (
                      <option key={v} value={v}>
                        {VISIBILITY_LABELS[v]}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Tags */}
              <div className="grid gap-1.5">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        aria-label={`Remove ${tag}`}
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-4">
            {drafts.map((draft, index) => (
              <QuestionEditor
                key={draft.key}
                draft={draft}
                index={index}
                total={drafts.length}
                error={questionErrors[index]}
                onChange={(d) => updateDraft(index, d)}
                onMove={(dir) => moveDraft(index, dir)}
                onRemove={() => removeDraft(index)}
              />
            ))}
          </div>

          {/* Add question */}
          <Card className="border-dashed">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
              <div className="grid flex-1 gap-1.5">
                <Label htmlFor="new-type">Add a question</Label>
                <Select
                  id="new-type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as QuestionType)}
                >
                  {Object.values(QuestionType).map((t) => (
                    <option key={t} value={t}>
                      {QUESTION_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="button" variant="secondary" onClick={addQuestion}>
                <Plus /> Add question
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
