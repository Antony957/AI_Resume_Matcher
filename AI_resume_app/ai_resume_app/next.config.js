/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value:
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' 'inline-speculation-rules' blob:; object-src 'none'; base-uri 'self'; worker-src 'self' blob:; child-src 'self' blob:;",
                    },
                ],
            },
        ];
    },
    webpack(config, { isServer }) {
        if (!isServer) {
            // 在客户端不使用 canvas 模块
            config.resolve.fallback = {
                ...config.resolve.fallback,
                canvas: false,
                fs: false,
                path: false,
            };
        }
        
        // 支持PDF.js worker
        config.module.rules.push({
            test: /pdf\.worker\.(min\.)?js/,
            type: 'asset/resource',
            generator: {
                filename: 'static/worker/[hash][ext][query]'
            }
        });
        
        return config;
    },
};

module.exports = nextConfig;
