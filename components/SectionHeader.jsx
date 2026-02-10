'use client';

import React from 'react';

export const SectionHeader = ({
    badge,
    title,
    description,
    align = 'center'
}) => {
    return (
        <div className={`max-w-3xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
            <span className="text-primary font-bold uppercase tracking-widest text-xs mb-4 block">
                {badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                {title}
            </h2>
            <p className="text-xl text-slate-600 leading-relaxed">
                {description}
            </p>
        </div>
    );
};
