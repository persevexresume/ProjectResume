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
                accent: {
                    primary: 'var(--color-accent-primary)',
                    hover: 'var(--color-accent-hover)',
                }
            }
        },
    },
    plugins: [],
}
