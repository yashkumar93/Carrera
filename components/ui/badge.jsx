'use client';

import React from 'react';

const cn = (...parts) => parts.filter(Boolean).join(' ');

export function Badge({ className, variant = 'default', children }) {
    const base = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium';
    const styles =
        variant === 'outline'
            ? 'border border-bg-300 text-text-400'
            : 'bg-bg-300 text-text-100';

    return <span className={cn(base, styles, className)}>{children}</span>;
}
