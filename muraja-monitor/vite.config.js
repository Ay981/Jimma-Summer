import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { networkInterfaces } from 'os';

function getLanIp() {
    for (const iface of Object.values(networkInterfaces())) {
        for (const addr of iface) {
            if (addr.family === 'IPv4' && !addr.internal) return addr.address;
        }
    }
    return 'localhost';
}

export default defineConfig(({ mode }) => {
const env = loadEnv(mode, process.cwd(), '');
const hmrHost = env.VITE_DEV_SERVER_URL
    ? new URL(env.VITE_DEV_SERVER_URL).hostname
    : getLanIp();

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
