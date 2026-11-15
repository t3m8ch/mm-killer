import { test as base, expect, type Page, type Route } from "@playwright/test";

/** Удерживает запрос до release(); teardown освобождает его и удаляет перехват. */
async function holdRequest(page: Page, url: string, respond?: { status: number }) {
  let release!: () => void;
  let entered!: () => void;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const active = new Set<Promise<void>>();
  const respondTo = async (route: Route) => {
    entered();
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

  return {
    requested,
    release,
    dispose: async () => {
      release();
      await page.unroute(url, handler);
      await Promise.all(active);
    },
  };
}

export const test = base.extend<{
  holdRequest: (url: string, respond?: { status: number }) => ReturnType<typeof holdRequest>;
}>({
  holdRequest: async ({ page }, use) => {
    const gates: Awaited<ReturnType<typeof holdRequest>>[] = [];

    try {
      await use(async (url, respond) => {
        const gate = await holdRequest(page, url, respond);

        gates.push(gate);

        return gate;
      });
    } finally {
      // Освободить все запросы до ожидания завершения обработчиков.
      gates.forEach((gate) => gate.release());
      await Promise.all(gates.map((gate) => gate.dispose()));
    }
  },
});

export { expect };
