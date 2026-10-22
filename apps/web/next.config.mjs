import { validateBasePath } from './lib/base-path.mjs';

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  basePath: validateBasePath(process.env.NEXT_PUBLIC_BASE_PATH),
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  experimental: { cpus: 2, useTypeScriptCli: false },
  transpilePackages: ['@a11y-workbench/core']
};
export default config;
