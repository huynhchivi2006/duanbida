/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH !== undefined 
  ? process.env.NEXT_PUBLIC_BASE_PATH 
  : (isProd ? '/huynhchivi/doan' : '');

const nextConfig = {
  output: 'export',
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

module.exports = nextConfig;
