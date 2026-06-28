import { defineConfig } from 'vite';
import { resolve } from 'path';

// Bundles firebase-messaging-sw.js from npm so the service worker is fully
// self-hosted and never needs to reach gstatic.com at runtime.
export default defineConfig({
    build: {
        outDir: 'public',
        emptyOutDir: false,
        rollupOptions: {
            input: resolve(__dirname, 'resources/js/firebase-messaging-sw.js'),
            output: {
                format: 'iife',
                name: 'sw',
                entryFileNames: 'firebase-messaging-sw.js',
                inlineDynamicImports: true,
            },
        },
        minify: true,
    },
});
