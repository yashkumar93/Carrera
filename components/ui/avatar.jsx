'use client';

import React, { useState } from 'react';

const cn = (...parts) => parts.filter(Boolean).join(' ');

export function Avatar({ className, children }) {
    return (
        <span className={cn('relative inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-bg-300', className)}>
            {children}
        </span>
    );
}

export function AvatarImage({ src, alt, className }) {
    const [hasError, setHasError] = useState(false);

    if (hasError || !src) return null;

    return (
        <img
            src={src}
            alt={alt}
            className={cn('h-full w-full object-cover', className)}
            onError={() => setHasError(true)}
        />
    );
}

export function AvatarFallback({ className, children }) {
    return (
        <span className={cn('absolute inset-0 inline-flex items-center justify-center text-xs font-medium text-text-200', className)}>
            {children}
        </span>
    );
}
