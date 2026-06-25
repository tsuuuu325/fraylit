'use client';

import { useLocale } from 'next-intl';
import { useState, useRef, useEffect } from 'react';
import { locales, localeMeta, LOCALE_COOKIE, type Locale } from '@/i18n/config';

function setLocaleCookie(locale: Locale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; samesite=lax`;
}

export default function LanguageSwitcher() {
  const current = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function choose(locale: Locale) {
    setOpen(false);
    if (locale === current) return;
    setLocaleCookie(locale);
    // Full reload avoids RSC refresh loops and stale CSS chunks in dev.
    window.location.reload();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={false}
        className="btn-ghost px-3"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{localeMeta[current].flag}</span>
        <span className="hidden sm:inline">{localeMeta[current].label}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-ink-700 bg-ink-900 py-1 shadow-xl animate-fade-in"
        >
          {locales.map((loc) => (
            <li key={loc}>
              <button
                type="button"
                role="option"
                aria-selected={loc === current}
                onClick={() => choose(loc)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-ink-800 ${
                  loc === current ? 'text-accent' : 'text-parchment'
                }`}
              >
                <span className="text-base leading-none">{localeMeta[loc].flag}</span>
                {localeMeta[loc].label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
