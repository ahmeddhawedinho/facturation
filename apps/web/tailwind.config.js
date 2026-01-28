/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                },
            },
            backgroundColor: {
                app: 'var(--app-bg)',
                card: 'var(--app-card-bg)',
                sidebar: 'var(--app-sidebar)',
                header: 'var(--app-header)',
            },
            textColor: {
                app: 'var(--app-text)',
                muted: 'var(--app-text-muted)',
            },
            borderColor: {
                app: 'var(--app-border)',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeInDown: {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeInUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'fade-in-down': 'fadeInDown 0.5s ease-out',
                'fade-in-up': 'fadeInUp 0.5s ease-out',
            },
        },
    },
    plugins: [
        function ({ addComponents }) {
            addComponents({
                '.btn': {
                    '@apply px-4 py-2 rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center gap-2': {},
                },
                '.btn-primary': {
                    '@apply bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-500/20': {},
                },
                '.btn-secondary': {
                    'background-color': 'var(--app-card-bg)',
                    'color': 'var(--app-text)',
                    'border-color': 'var(--app-border)',
                    '@apply hover:bg-[var(--app-card-hover)] active:scale-95 border': {},
                },
                '.btn-outline': {
                    '@apply border border-blue-600 text-blue-600 hover:bg-blue-600/5 active:scale-95': {},
                },
                '.card': {
                    'background-color': 'var(--app-card-bg)',
                    'color': 'var(--app-text)',
                    'border-color': 'var(--app-border)',
                    '@apply rounded-xl shadow-sm border p-6 transition-colors duration-300': {},
                },
                '.input-app': {
                    'background-color': 'var(--app-bg)',
                    'color': 'var(--app-text)',
                    'border-color': 'var(--app-border)',
                    '@apply w-full px-4 py-3 rounded-xl border focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-muted': {},
                },
                '.label-app': {
                    '@apply block text-[10px] font-black uppercase tracking-widest text-muted mb-2 ml-1': {},
                },
            })
        },
    ],
}
