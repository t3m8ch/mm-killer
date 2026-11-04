import { defineServerEntry } from "nitro";

export default defineServerEntry({
  gracefulShutdown: true,
  fetch: () => undefined,
});
