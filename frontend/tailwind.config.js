/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#FF6B35',
                    light: '#FF8C61',
                    dark: '#E5512E',
                },
                secondary: {
                    DEFAULT: '#2D3142',
                    light: '#4F5D75',
                    dark: '#1A1D2E',
                },
                accent: {
                    DEFAULT: '#4ECDC4',
                    light: '#7BE0D9',
                    dark: '#3BA89F',
                },
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%)',
                'gradient-secondary': 'linear-gradient(135deg, #2D3142 0%, #4F5D75 100%)',
                'gradient-accent': 'linear-gradient(135deg, #4ECDC4 0%, #7BE0D9 100%)',
            },
            animation: {
                'float': 'float 3s ease-in-out infinite',
                'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
            boxShadow: {
                'premium': '0 10px 40px -15px rgba(0, 0, 0, 0.2)',
                'premium-lg': '0 20px 60px -15px rgba(0, 0, 0, 0.3)',
            },
        },
    },
    plugins: [],
}
