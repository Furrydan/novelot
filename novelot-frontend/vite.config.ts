import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 5173,
    },
    resolve: {
        alias: {
            "@assets": path.resolve(__dirname, "./src/assets"),
            "@novelot-types": path.resolve(__dirname, "./src/types"),
            "@api": path.resolve(__dirname, "./src/api"),
            "@components": path.resolve(__dirname, "./src/components"),
            "@test": path.resolve(__dirname, "./src/test"),
            "@": path.resolve(__dirname, "./src"),
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: 'src/test/setup.ts',
        coverage: {
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/**/*.test.{ts,tsx}',
                'src/test/**',
                'src/components/layout/TopBar.tsx',
                'src/App.tsx',
                'src/main.tsx',
                'src/api/novelClients.ts',
            ],
        },
    }
});
