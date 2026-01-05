import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
    tailwindcss({
      theme: {
        extend: {
          colors: {
            freeflyDarkGray: "#242424",
            freeflyGray: "#F8FAFC",
          },
        },
      },
    }),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
})
