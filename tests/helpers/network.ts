import { test as base, expect, type Route } from "@playwright/test";

type HoldRequest = (
  url: string,
  respond?: { status: number },
) => Promise<{ requested: Promise<void>; release: () => void }>;

export const test = base.extend<{ holdRequest: HoldRequest }>({
  holdRequest: async ({ page }, use) => {
    const releases: (() => void)[] = [];
    const interceptors: { url: string; handler: (route: Route) => Promise<void> }[] = [];
    const active = new Set<Promise<void>>();

    try {
      await use(async (url, respond) => {
        let release!: () => void;
        let markRequested!: () => void;
        const released = new Promise<void>((resolve) => {
          release = resolve;
        });
        const requested = new Promise<void>((resolve) => {
          markRequested = resolve;
        });
        const respondTo = async (route: Route) => {
          markRequested();
          await released;

          if (respond) {
            await route.fulfill(respond);
          } else {
            await route.continue();
          }
        };

        const handler = (route: Route) => {
          const response = respondTo(route);

          active.add(response);
          void response.then(
            () => active.delete(response),
            () => active.delete(response),
          );

          return response;
        };

        await page.route(url, handler);
        releases.push(release);
        interceptors.push({ url, handler });

        return { requested, release };
      });
    } finally {
      // Сначала отпустить все запросы, затем убрать только наши перехваты.
      releases.forEach((release) => release());
      await Promise.all(interceptors.map(({ url, handler }) => page.unroute(url, handler)));
      await Promise.all(active);
    }
  },
});

export { expect };
