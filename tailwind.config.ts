import type { Config } from "tailwindcss"

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
        sans: ['SF Pro', 'sans-serif'],
        serif: ['SF Pro', 'sans-serif'],
      },
      colors: {
        'po-primary': {
          DEFAULT: '#173288',  // Dark blue
          background: '#d0e5e9',  // Light blue background instead of green
          button: '#b8d4d8',  // Light blue button instead of green
          text: {
            background: '#967cbd'  // Background zones of text
          }
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#002856', // Marie Forleo dark blue
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#f5a67d', // Marie Forleo peach
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#f3f1eb', // Marie Forleo light beige
          foreground: '#000000',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        po: {
          blue: '#3b82f6',
          teal: '#14b8a6',
          green: '#22c55e',
          amber: '#f59e0b',
          red: '#ef4444',
          gray: '#6b7280',
        },
        landing: {
          DEFAULT: '#d0e5e9',  // Light blue instead of purple
          footer: '#c5c1a8',
          features: '#19348a',
          cta: '#b8d4d8'  // Light blue instead of green
        }
      },
      backgroundColor: {
        DEFAULT: '#ffffff',
        primary: '#002856',
        secondary: '#f5a67d',
        accent: '#f3f1eb',
        'text-zone': '#967cbd',
        'landing': {
          DEFAULT: '#d0e5e9',  // Light blue instead of purple
          footer: '#c5c1a8',
          features: '#19348a',
          cta: '#b8d4d8'  // Light blue instead of green
        }
      },
      boxShadow: {
        'marie': '0 10px 30px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: '0'
          },
          to: {
            height: '0'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
