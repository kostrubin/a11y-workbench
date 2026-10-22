import type { BrowserContext, Page, Route } from '@playwright/test';
import { requestAllowed } from './security.js';

export async function guardedRoute(route: Route, origin: string, blocked: () => void): Promise<void> {
  const request = route.request();
  if (!requestAllowed(request.url(), request.method(), origin)) {
    blocked();
    await route.abort('blockedbyclient');
    return;
  }
  try {
    // Fetch one hop only. Browser routing alone can miss a server redirect's
    // subsequent network hop. Never ask either client to follow a redirect.
    const response = await route.fetch({ maxRedirects: 0, maxRetries: 0, timeout: 15_000 });
    if (response.status() >= 300 && response.status() < 400) {
      blocked();
      await response.dispose();
      await route.abort('blockedbyclient');
      return;
    }
    await route.fulfill({ response });
    await response.dispose();
  } catch {
    blocked();
    await route.abort('failed').catch(() => undefined);
  }
}

export async function installGuards(context: BrowserContext, origin: string, blocked: () => void): Promise<Page> {
  await context.clearPermissions();
  await context.route('**/*', route => guardedRoute(route, origin, blocked));
  await context.routeWebSocket('**/*', socket => {
    blocked();
    socket.close();
  });
  const page = await context.newPage();
  page.on('download', download => {
    blocked();
    void download.cancel();
  });
  context.on('page', popup => {
    if (popup !== page) {
      blocked();
      void popup.close();
    }
  });
  await context.addInitScript(() => {
    Object.defineProperty(window, '__a11yCapturePopupBlocked', { value: false, writable: true, configurable: false });
    window.open = () => {
      (window as unknown as { __a11yCapturePopupBlocked: boolean }).__a11yCapturePopupBlocked = true;
      return null;
    };
  });
  page.setDefaultTimeout(15_000);
  page.setDefaultNavigationTimeout(15_000);
  return page;
}
