/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'bg-0': 'var(--bg-0)',
                'bg-000': 'var(--bg-000)',
                'bg-100': 'var(--bg-100)',
                'bg-200': 'var(--bg-200)',
                'bg-300': 'var(--bg-300)',
                'text-100': 'var(--text-100)',
                'text-200': 'var(--text-200)',
                'text-300': 'var(--text-300)',
                'text-400': 'var(--text-400)',
                'text-500': 'var(--text-500)',
                'accent': 'var(--accent)',
                'accent-hover': 'var(--accent-hover)',
                'primary': 'var(--primary)',
                'theme': 'var(--border)',
            },
            fontFamily: {
                serif: ['"Source Serif 4"', 'Georgia', 'serif'],
                sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'message-left': 'messageLeft 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                'message-right': 'messageRight 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                'spin': 'spin 1s linear infinite',
                'bounce': 'bounce 1s infinite',
            },
            keyframes: {
                fadeIn: {
                    from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
                    to: { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
                messageLeft: {
                    '0%': { opacity: '0', transform: 'translateX(-40px) translateY(10px) scale(0.95)', filter: 'blur(4px)' },
                    '70%': { opacity: '1', transform: 'translateX(5px) translateY(-2px) scale(1.02)', filter: 'blur(0)' },
                    '100%': { opacity: '1', transform: 'translateX(0) translateY(0) scale(1)' },
                },
                messageRight: {
                    '0%': { opacity: '0', transform: 'translateX(40px) translateY(10px) scale(0.95)', filter: 'blur(4px)' },
                    '70%': { opacity: '1', transform: 'translateX(-5px) translateY(-2px) scale(1.02)', filter: 'blur(0)' },
                    '100%': { opacity: '1', transform: 'translateX(0) translateY(0) scale(1)' },
                },
            },
            borderColor: {
                'theme': 'rgba(0, 0, 0, 0.06)',
            },
        },
    },
    plugins: [],
}
