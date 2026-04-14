'use client';

/**
 * Shown at the top of the chat for returning users with a roadmap in progress.
 * Lets them resume exactly where they left off.
 */
export default function ProgressCheckIn({
    userName,
    completionPercent,
    completedModules,
    currentModule,
    nextModule,
    lastVisitDays,
    streakDays,
    onSuggestionClick,
}) {
    const pct = Math.max(0, Math.min(100, Number(completionPercent) || 0));
    const firstName = (userName || '').split(' ')[0] || 'there';
    const visitLabel =
        typeof lastVisitDays === 'number'
            ? lastVisitDays === 0
                ? 'Visited today'
                : lastVisitDays === 1
                    ? 'Last visit: yesterday'
                    : `Last visit: ${lastVisitDays} days ago`
            : null;

    return (
        <section className="mt-6 mb-4 ml-1 rounded-r-2xl border-l-2 border-[#b85c38] py-2 pl-6 pr-3">
            <div className="mb-5 flex items-start justify-between gap-6">
                <div className="min-w-0">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#b85c38]">
                        Welcome back
                    </p>
                    <h3 className="text-[18px] font-bold leading-tight text-white md:text-[19px]">
                        Hi {firstName}. You&apos;re {pct}% through your roadmap.
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#cbb8ab]">
                        {currentModule
                            ? `You were working on ${currentModule}.`
                            : 'Your roadmap is in motion.'}{' '}
                        {nextModule ? `Next up is ${nextModule}.` : 'I can help you choose the next best step.'}
                    </p>
                </div>
                <div className="shrink-0 pt-1 text-right">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f7768]">Progress</div>
                    <div className="mt-1 text-2xl font-bold leading-none text-[#f4ebe4]">{pct}%</div>
                </div>
            </div>

            <div className="mb-5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#2a211d]">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-[#b85c38] to-[#d9794e] transition-all duration-700"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 border-t border-white/8 pt-5">
                    <Cell label="Completed" value={completedModules ?? 0} highlight="green" />
                    <Cell label="In Progress" value={currentModule || '—'} highlight="blue" />
                    <Cell label="Up Next" value={nextModule || '—'} />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#a89283]">
                    {visitLabel && (
                        <span>
                            <span className="text-[#7e675a]">Last activity:</span> {visitLabel}
                        </span>
                    )}
                    {typeof streakDays === 'number' && streakDays > 0 && (
                        <span>
                            <span className="text-[#7e675a]">Consistency:</span> {streakDays}-day streak
                        </span>
                    )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
                    <button
                        onClick={() => onSuggestionClick?.(
                            currentModule
                                ? `Help me continue with ${currentModule}`
                                : `What should I focus on next?`
                        )}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#b85c38] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#d9794e]"
                    >
                        Continue roadmap
                    </button>
                    <button
                        onClick={() => onSuggestionClick?.('Show me my full roadmap progress')}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2 text-xs font-semibold text-[#e7d9cf] transition-colors hover:bg-white/5"
                    >
                        View full roadmap
                    </button>
            </div>
        </section>
    );
}

function Cell({ label, value, highlight }) {
    const tint = highlight === 'green'
        ? 'text-[#f4ebe4]'
        : highlight === 'blue'
            ? 'text-[#f4ebe4]'
            : 'text-[#f4ebe4]';

    return (
        <div className="min-w-0 py-0.5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7e675a]">{label}</p>
            <p
                className={`truncate text-sm font-bold leading-tight md:text-[15px] ${tint}`}
                title={String(value)}
            >
                {value}
            </p>
        </div>
    );
}
