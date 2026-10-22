/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  experimental: { cpus: 2, useTypeScriptCli: false },
  transpilePackages: ['@a11y-workbench/core']
};
export default config;
