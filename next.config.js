/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Убираем устаревший appDir (он включен по умолчанию в Next 14)
  },
  images: {
    domains: ['images.unsplash.com', 'cdn.jsdelivr.net', 'res.cloudinary.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
