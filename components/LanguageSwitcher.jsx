'use client';

import { useState, useEffect } from 'react';

const LOCALES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
];

export default function LanguageSwitcher({ style }) {
  const [current, setCurrent] = useState('en');

  useEffect(() => {
    const saved = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1];
    if (saved && LOCALES.some(l => l.code === saved)) {
      setCurrent(saved);
    }
  }, []);

  function switchLocale(code) {
    document.cookie = `locale=${code}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setCurrent(code);
    window.location.reload();
  }

  const active = LOCALES.find(l => l.code === current) || LOCALES[0];

  return (
    <div style={{ position: 'relative', display: 'inline-block', ...style }}>
      <select
        value={current}
        onChange={e => switchLocale(e.target.value)}
        style={{
          background: 'transparent',
          border: '1px solid #333',
          borderRadius: '6px',
          color: '#aaa',
          padding: '0.25rem 0.5rem',
          fontSize: '0.8rem',
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
        }}
      >
        {LOCALES.map(l => (
          <option key={l.code} value={l.code} style={{ background: '#1a1a1a', color: '#fff' }}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
