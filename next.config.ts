import type { NextConfig } from 'next';
const config: NextConfig = {
    allowedDevOrigins: ['192.168.0.101'],
    async headers() {
        return [{ source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }] }];
    },
};
export default config;
