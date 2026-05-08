/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'ws'],
  turbopack: {},
}

module.exports = nextConfig
