'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from 'react';
import { AtSign, ArrowUp } from 'lucide-react';

const ChatInputContext = createContext(null);

const cn = (...parts) => parts.filter(Boolean).join(' ');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseMentionsFromValue = (value, mentions) => {
    const parsed = { text: value.trim() };

    Object.values(mentions || {}).forEach((config) => {
        parsed[config.type] = [];

        (config.items || []).forEach((item) => {
            const label = String(item.name || '');
            if (!label) return;

            const pattern = new RegExp(
                `(?:^|\\s)${escapeRegExp(config.trigger)}${escapeRegExp(label)}(?=\\s|$)`,
                'i',
            );

            if (pattern.test(value)) {
                parsed[config.type].push(item);
            }
        });
    });

    return parsed;
};

export const createMentionConfig = ({ type, trigger, items = [] }) => ({
    type,
    trigger,
    items,
});

export const useChatInput = ({ mentions = {}, onSubmit }) => {
    const [value, setValue] = useState('');

    const parsed = useMemo(
        () => parseMentionsFromValue(value, mentions),
        [value, mentions],
    );

    const handleSubmit = useCallback(
        (e) => {
            e?.preventDefault?.();
            if (!value.trim()) return;
            onSubmit?.(parsed);
            setValue('');
        },
        [onSubmit, parsed, value],
    );

    return {
        value,
        onChange: setValue,
        parsed,
        handleSubmit,
        mentionConfigs: mentions,
    };
};

export const ChatInput = ({
    children,
    onSubmit,
    value,
    onChange,
    className,
}) => {
    const textareaRef = useRef(null);
    const [selection, setSelection] = useState({ start: 0, end: 0 });

    const insertTextAtCursor = useCallback(
        (textToInsert) => {
            const text = value || '';
            const start = selection.start ?? text.length;
            const end = selection.end ?? start;

            const next = `${text.slice(0, start)}${textToInsert}${text.slice(end)}`;
            const nextCursor = start + textToInsert.length;
            onChange(next);

            requestAnimationFrame(() => {
                if (!textareaRef.current) return;
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(nextCursor, nextCursor);
                setSelection({ start: nextCursor, end: nextCursor });
            });
        },
        [onChange, selection.end, selection.start, value],
    );

    const insertMention = useCallback(
        (trigger, label) => {
            const text = value || '';
            const start = selection.start ?? text.length;
            const end = selection.end ?? start;
            const before = text.slice(0, start);
            const after = text.slice(end);

            const tokenRegex = new RegExp(`(^|\\s)${escapeRegExp(trigger)}[^\\s]*$`);
            const match = before.match(tokenRegex);
            const mention = `${trigger}${label}`;

            let nextBefore = before;
            if (match) {
                const prefix = before.slice(0, before.length - match[0].length);
                const spacer = match[1] || '';
                nextBefore = `${prefix}${spacer}${mention} `;
            } else {
                nextBefore = `${before}${mention} `;
            }

            const next = `${nextBefore}${after}`;
            const nextCursor = nextBefore.length;
            onChange(next);

            requestAnimationFrame(() => {
                if (!textareaRef.current) return;
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(nextCursor, nextCursor);
                setSelection({ start: nextCursor, end: nextCursor });
            });
        },
        [onChange, selection.end, selection.start, value],
    );

    const contextValue = useMemo(
        () => ({
            value,
            onChange,
            onSubmit,
            textareaRef,
            selection,
            setSelection,
            insertTextAtCursor,
            insertMention,
        }),
        [
            value,
            onChange,
            onSubmit,
            selection,
            insertTextAtCursor,
            insertMention,
        ],
    );

    return (
        <ChatInputContext.Provider value={contextValue}>
            <form
                onSubmit={onSubmit}
                className={cn(
                    'relative rounded-2xl border border-bg-300/80 bg-bg-100 dark:bg-bg-200 shadow-[0_8px_20px_rgba(0,0,0,0.16)]',
                    className,
                )}
            >
                {children}
            </form>
        </ChatInputContext.Provider>
    );
};

export const ChatInputMention = ({ type, trigger, items, children }) => {
    const { value, selection, insertMention } = useContext(ChatInputContext);

    const token = useMemo(() => {
        const cursor = selection.start ?? value.length;
        const uptoCursor = (value || '').slice(0, cursor);
        const match = uptoCursor.match(/(?:^|\s)([@/])([^\s]*)$/);
        if (!match) return null;
        if (match[1] !== trigger) return null;
        return match[2].toLowerCase();
    }, [selection.start, trigger, value]);

    const filteredItems = useMemo(() => {
        if (token === null) return [];
        return (items || []).filter((item) => {
            const label = String(item.name || '').toLowerCase();
            return label.includes(token);
        });
    }, [items, token]);

    if (token === null || filteredItems.length === 0) {
        return null;
    }

    return (
        <div className="absolute left-4 right-4 bottom-[4.4rem] z-20 rounded-xl border border-bg-300 bg-bg-100 dark:bg-bg-200 shadow-lg overflow-hidden">
            <div className="px-3 py-2 text-xs uppercase tracking-wide text-text-500 border-b border-bg-300/80">
                {type}
            </div>
            <div className="max-h-56 overflow-y-auto">
                {filteredItems.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => insertMention(trigger, item.name)}
                        className="w-full px-3 py-2.5 flex items-center gap-2 text-left hover:bg-bg-200 dark:hover:bg-bg-300 transition-colors"
                    >
                        {children(item)}
                    </button>
                ))}
            </div>
        </div>
    );
};

export const ChatInputEditor = ({ placeholder, className }) => {
    const { value, onChange, textareaRef, setSelection } = useContext(ChatInputContext);

    const updateSelection = useCallback(() => {
        const node = textareaRef.current;
        if (!node) return;
        setSelection({
            start: node.selectionStart ?? 0,
            end: node.selectionEnd ?? 0,
        });
    }, [setSelection, textareaRef]);

    return (
        <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onClick={updateSelection}
                onKeyUp={updateSelection}
                onSelect={updateSelection}
                placeholder={placeholder}
                rows={1}
                className={cn(
                    'w-full min-h-[3rem] max-h-80 resize-none overflow-y-auto bg-transparent border-0 outline-none text-text-100 text-[clamp(1.45rem,2.4vw,2.2rem)] leading-tight placeholder:text-text-500',
                    className,
                )}
            />
        </div>
    );
};

export const ChatInputGroupAddon = ({ children, align = 'block-end' }) => {
    const alignClass = align === 'block-end' ? 'justify-between' : 'justify-start';

    return (
        <div
            className={cn(
                'flex items-center h-12 border-t border-bg-300/80 px-5 sm:px-6',
                alignClass,
            )}
        >
            {children}
        </div>
    );
};

export const ChatInputMentionButton = ({ className }) => {
    const { insertTextAtCursor } = useContext(ChatInputContext);

    return (
        <button
            type="button"
            onClick={() => insertTextAtCursor('@')}
            className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-400 hover:text-text-200 hover:bg-bg-200 transition-colors',
                className,
            )}
            aria-label="Insert mention"
        >
            <AtSign className="w-4 h-4" />
        </button>
    );
};

export const ChatInputSubmitButton = ({ className }) => {
    const { value } = useContext(ChatInputContext);
    const canSubmit = Boolean(value.trim());

    return (
        <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                canSubmit
                    ? 'bg-bg-300 text-text-100 hover:bg-bg-400'
                    : 'bg-bg-200 text-text-500 cursor-default',
                className,
            )}
            aria-label="Send message"
        >
            <ArrowUp className="w-4 h-4" />
        </button>
    );
};
