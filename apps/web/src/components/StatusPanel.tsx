import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useHealth } from '../hooks/useHealth';
import { useRealtimeStatus } from '../hooks/useRealtimeStatus';

type Tone = 'up' | 'checking' | 'down';

const DOT: Record<Tone, string> = {
  up: 'bg-success',
  checking: 'bg-warning',
  down: 'bg-danger',
};

function StatusRow({
  label,
  tone,
  value,
}: {
  label: string;
  tone: Tone;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-2 text-sm font-semibold">
        <span className="relative flex h-2.5 w-2.5">
          {tone !== 'down' && (
            <span
              className={clsx(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
                DOT[tone],
              )}
            />
          )}
          <span className={clsx('relative inline-flex h-2.5 w-2.5 rounded-full', DOT[tone])} />
        </span>
        {value}
      </span>
    </div>
  );
}

/** Live connectivity panel — proves REST + DB + WebSocket wiring end-to-end. */
export function StatusPanel() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useHealth();
  const realtime = useRealtimeStatus();

  const apiTone: Tone = isLoading ? 'checking' : isError ? 'down' : 'up';
  const apiValue = isLoading
    ? t('status.checking')
    : isError
      ? t('status.offline')
      : t('status.connected');

  const dbTone: Tone = isLoading
    ? 'checking'
    : data?.services.database === 'up'
      ? 'up'
      : 'down';
  const dbValue = isLoading
    ? t('status.checking')
    : data?.services.database === 'up'
      ? t('status.connected')
      : t('status.degraded');

  const rtTone: Tone =
    realtime === 'connected' ? 'up' : realtime === 'connecting' ? 'checking' : 'down';
  const rtValue =
    realtime === 'connected'
      ? t('status.connected')
      : realtime === 'connecting'
        ? t('status.checking')
        : t('status.offline');

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-surface/80 p-5 shadow-card backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {t('status.heading')}
        </h2>
        {data?.version && (
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            v{data.version}
          </span>
        )}
      </div>
      <div className="divide-y divide-border">
        <StatusRow label={t('status.api')} tone={apiTone} value={apiValue} />
        <StatusRow label={t('status.database')} tone={dbTone} value={dbValue} />
        <StatusRow label={t('status.realtime')} tone={rtTone} value={rtValue} />
      </div>
    </div>
  );
}
