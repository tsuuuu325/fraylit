'use client';

import { useState } from 'react';

export default function UpgradeButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);

  async function upgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={upgrade}
      disabled={loading}
      className="btn-primary w-full"
    >
      {label}
    </button>
  );
}
