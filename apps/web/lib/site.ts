import type { Metadata } from 'next';
import { releaseConfiguration } from './release';

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const config = releaseConfiguration({ SITE_RELEASE_APPROVED: process.env.SITE_RELEASE_APPROVED, SITE_PUBLIC_ORIGIN: process.env.SITE_PUBLIC_ORIGIN, NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH });
  const index = config.approved && path !== '/workbench/';
  return {
    title: `${title} · A11y Workbench`, description,
    robots: { index, follow: true },
    ...(index && config.origin ? { alternates: { canonical: `${config.origin}${config.basePath}${path}` } } : {})
  };
}
