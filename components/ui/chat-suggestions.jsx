'use client';

import React from 'react';

const cn = (...parts) => parts.filter(Boolean).join(' ');

export function ChatSuggestions({ className, children }) {
    return <div className={cn('flex flex-col gap-3', className)}>{children}</div>;
}

export function ChatSuggestionsHeader({ className, children }) {
    return <div className={cn('flex flex-col gap-1', className)}>{children}</div>;
}

export function ChatSuggestionsTitle({ className, children }) {
    return (
        <h4 className={cn('text-sm font-medium text-text-300', className)}>
            {children}
        </h4>
    );
}

export function ChatSuggestionsDescription({ className, children }) {
    return (
        <p className={cn('text-xs text-text-500', className)}>
            {children}
        </p>
    );
}

export function ChatSuggestionsContent({ className, children }) {
    return <div className={cn('flex flex-wrap gap-2', className)}>{children}</div>;
}

export function ChatSuggestion({ className, children, ...props }) {
    return (
        <button
            type="button"
            className={cn(
                'rounded-full border border-bg-300 bg-bg-100 px-3.5 py-1.5 text-sm text-text-200 transition-colors hover:bg-bg-200',
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}
