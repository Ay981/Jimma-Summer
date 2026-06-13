import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
const env = loadEnv(mode, process.cwd(), '');
const devUrl = env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
const hmrHost = new URL(devUrl).hostname;

return {
    plugins: [
        laravel({
            input: ['resources/css/global.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
        },
    },
    server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
        host: hmrHost,
    },
    watch: {
        ignored: ['**/storage/framework/views/**'],
    },
},
};
});
