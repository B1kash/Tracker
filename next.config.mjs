/** @type {import('next').NextConfig} */
import nextPWA from 'next-pwa';

const withPWA = nextPWA({
  dest: 'public',
  disable: false, // Temporarily disabled so you can test in Dev Mode
  register: true,
  skipWaiting: true
});

const nextConfig = {
  reactCompiler: true,
  turbopack: {},
};

export default withPWA(nextConfig);
