'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { LIMITS, countSentences, checkLine } from '@/lib/validation';
import type { Database, PostMode, TablesInsert } from '@/lib/database.types';

type PostInsert = TablesInsert<'posts'>;

function LineField({
  label,
  placeholder,
  value,
  onChange
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTranslations('create');
  const sentences = useMemo(() => countSentences(value), [value]);
  const overChars = value.length > LIMITS.lineMaxChars;
  const overSentences = sentences > LIMITS.lineMaxSentences;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-parchment">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`input resize-none font-serif text-lg leading-relaxed ${
          overChars || overSentences ? 'border-red-500 focus:ring-red-500' : ''
        }`}
      />
      <div className="mt-1 flex items-center justify-between text-xs tabular-nums">
        <span className={overSentences ? 'text-red-400' : 'text-parchment-dim'}>
          {t('sentenceCount', { count: sentences, max: LIMITS.lineMaxSentences })}
        </span>
        <span className={overChars ? 'text-red-400' : 'text-parchment-dim'}>
          {t('charCount', { count: value.length, max: LIMITS.lineMaxChars })}
        </span>
      </div>
    </div>
  );
}

export default function CreatePostForm({
  userId,
  isPaid,
  recentPostCount,
  freeLimit
}: {
  userId: string;
  isPaid: boolean;
  recentPostCount: number;
  freeLimit: number;
}) {
  const t = useTranslations('create');
  const tp = useTranslations('post');
  const ts = useTranslations('subscription');
  const router = useRouter();
  const [upgrading, setUpgrading] = useState(false);
  const limitReached = !isPaid && recentPostCount >= freeLimit;

  const [mode, setMode] = useState<PostMode>('opening_closing');
  const [opening, setOpening] = useState('');
  const [closing, setClosing] = useState('');
  const [twist, setTwist] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    if (mode === 'plot_twist') {
      const c = checkLine(twist, { required: true });
      if (!c.ok) return mapError(c.reason);
      return null;
    }
    // opening_closing: at least one of the two, each valid if present.
    if (!opening.trim() && !closing.trim()) return t('errorEmpty');
    for (const v of [opening, closing]) {
      const c = checkLine(v, { required: false });
      if (!c.ok) return mapError(c.reason);
    }
    return null;
  }

  function mapError(reason?: string): string {
    if (reason === 'too_many_sentences')
      return t('errorTooManySentences', { max: LIMITS.lineMaxSentences });
    if (reason === 'too_long')
      return t('errorTooLong', { max: LIMITS.lineMaxChars });
    return t('errorEmpty');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const payload: PostInsert =
      mode === 'plot_twist'
        ? {
            user_id: userId,
            mode,
            twist_lines: twist.trim(),
            opening_lines: null,
            closing_lines: null
          }
        : {
            user_id: userId,
            mode,
            opening_lines: opening.trim() || null,
            closing_lines: closing.trim() || null,
            twist_lines: null
          };

    const { error } = await supabase.from('posts').insert(payload);

    if (error) {
      setError(t('errorEmpty'));
      setSubmitting(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  async function upgrade() {
    setUpgrading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setUpgrading(false);
    }
  }

  if (limitReached) {
    return (
      <div className="card space-y-4 p-7 text-center">
        <h2 className="font-serif text-2xl font-bold text-amber-400">
          {ts('limitReachedTitle')}
        </h2>
        <p className="text-parchment-muted">
          {ts('limitReachedBody', { count: freeLimit })}
        </p>
        <button
          type="button"
          onClick={upgrade}
          disabled={upgrading}
          className="btn-primary px-8"
        >
          {ts('upgradeButton')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-parchment-muted">
          {t('chooseMode')}
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ModeOption
            active={mode === 'opening_closing'}
            title={tp('modeOpeningClosing')}
            desc={t('openingClosingDesc')}
            onClick={() => setMode('opening_closing')}
          />
          <ModeOption
            active={mode === 'plot_twist'}
            title={tp('modePlotTwist')}
            desc={t('plotTwistDesc')}
            onClick={() => setMode('plot_twist')}
          />
        </div>
      </fieldset>

      <div className="card space-y-6 p-5 sm:p-7">
        {mode === 'opening_closing' ? (
          <>
            <LineField
              label={tp('openingLabel')}
              placeholder={tp('openingPlaceholder')}
              value={opening}
              onChange={setOpening}
            />
            <LineField
              label={tp('closingLabel')}
              placeholder={tp('closingPlaceholder')}
              value={closing}
              onChange={setClosing}
            />
          </>
        ) : (
          <LineField
            label={tp('twistLabel')}
            placeholder={tp('twistPlaceholder')}
            value={twist}
            onChange={setTwist}
          />
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="btn-primary px-8">
          {submitting ? t('submitting') : t('submit')}
        </button>
      </div>
    </form>
  );
}

function ModeOption({
  active,
  title,
  desc,
  onClick
}: {
  active: boolean;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border p-4 text-left transition-colors ${
        active
          ? 'border-accent bg-accent/10'
          : 'border-ink-700 bg-ink-900/40 hover:border-ink-600'
      }`}
    >
      <span
        className={`block font-serif text-lg font-semibold ${
          active ? 'text-accent-soft' : 'text-parchment'
        }`}
      >
        {title}
      </span>
      <span className="mt-1 block text-sm text-parchment-muted">{desc}</span>
    </button>
  );
}
