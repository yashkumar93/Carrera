'use client';

import React from 'react';

export const BentoCard = ({
    children,
    className = "",
    title,
    description
}) => {
    return (
        <div className={`relative rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${className}`}>
            {title && <h3 className="text-lg font-bold mb-1">{title}</h3>}
            {description && <p className="text-sm opacity-80">{description}</p>}
            {children}
        </div>
    );
};
