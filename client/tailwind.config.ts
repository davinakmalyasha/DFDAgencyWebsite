import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#ffffff",
                foreground: "#000000",
                muted: "#f3f4f6",
                border: "#e5e7eb",
                primary: "#000000",
                'primary-foreground': "#ffffff",
            },
            transitionTimingFunction: {
                'quintic-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
            }
        },
    },
    plugins: [],
};
export default config;
