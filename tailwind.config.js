/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "0",
        md: "0",
        sm: "0",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "glitch-1": {
          "0%, 100%": {
            transform: "translate(0)",
            opacity: "0.7"
          },
          "20%": {
            transform: "translate(-2px, 2px)",
            opacity: "1"
          },
          "40%": {
            transform: "translate(-2px, -2px)",
            opacity: "0.5"
          },
          "60%": {
            transform: "translate(2px, 2px)",
            opacity: "0.8"
          },
          "80%": {
            transform: "translate(2px, -2px)",
            opacity: "0.6"
          },
        },
        "glitch-2": {
          "0%, 100%": {
            transform: "translate(0)",
            opacity: "0.7"
          },
          "20%": {
            transform: "translate(2px, -2px)",
            opacity: "0.8"
          },
          "40%": {
            transform: "translate(2px, 2px)",
            opacity: "0.6"
          },
          "60%": {
            transform: "translate(-2px, -2px)",
            opacity: "1"
          },
          "80%": {
            transform: "translate(-2px, 2px)",
            opacity: "0.5"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glitch-1": "glitch-1 2s ease-in-out infinite",
        "glitch-2": "glitch-2 2s ease-in-out infinite reverse",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}