/**
 * PostHog, loaded after the page is ready instead of in the first download.
 *
 * posthog-js (with its session-recording code) was the largest file on first
 * load: 344 KB, 113 KB gzip, a quarter of the JavaScript the home page
 * fetched before it could render (owner: make the web app faster). Nothing
 * on screen needs it, so every module imports this stand-in instead of
 * "posthog-js":
 *
 * - before the real library arrives, any call (`posthog.capture(...)`,
 *   `posthog.people.set(...)`, `posthog.logger.info(...)`) is queued and
 *   replayed in order once it loads;
 * - getters (`get_distinct_id`, `isFeatureEnabled`, …) return undefined
 *   until then, which every caller already handles (they use `?.`);
 * - `__loaded` is false until the real init has run;
 * - after loading, the stand-in forwards to the real object, including
 *   references taken early (`const log = posthog.logger`).
 *
 * The library loads on the first idle moment after the page has loaded (or
 * after 3 s at the latest), or immediately when `loadPostHog()` is awaited.
 */
import type { PostHog } from "posthog-js";

type Path = (string | symbol)[];

let real: PostHog | null = null;
let loading: Promise<PostHog> | null = null;
const queue: { path: Path; args: unknown[] }[] = [];

function resolve(path: Path): { owner: any; value: any } {
  let owner: any = null;
  let value: any = real;
  for (const key of path) {
    owner = value;
    value = value?.[key as any];
  }
  return { owner, value };
}

function flush() {
  while (queue.length) {
    const { path, args } = queue.shift()!;
    try {
      const { owner, value } = resolve(path);
      if (typeof value === "function") value.apply(owner, args);
    } catch (err) {
      console.debug("[posthog replay]", err);
    }
  }
}

export function loadPostHog(): Promise<PostHog> {
  if (real) return Promise.resolve(real);
  if (!loading) {
    loading = import("posthog-js").then((mod) => {
      real = mod.default;
      flush();
      return real;
    });
  }
  return loading;
}

/** A callable proxy for `posthog.<path>`: forwards once loaded, queues before. */
function stand(path: Path): any {
  const fn = function () {} as unknown as object;
  return new Proxy(fn, {
    get(_t, key) {
      if (key === "then") return undefined; // never look like a promise
      if (real) {
        const { value } = resolve([...path, key]);
        if (typeof value === "function") {
          const { owner } = resolve([...path, key]);
          return value.bind(owner);
        }
        // Nested objects keep forwarding (people, logger, metrics, …).
        return value !== null && typeof value === "object" ? stand([...path, key]) : value;
      }
      if (path.length === 0 && key === "__loaded") return false;
      return stand([...path, key]);
    },
    apply(_t, _this, args) {
      if (real) {
        const { owner, value } = resolve(path);
        return typeof value === "function" ? value.apply(owner, args) : undefined;
      }
      queue.push({ path, args });
      return undefined;
    },
  });
}

const posthog = stand([]) as PostHog;
export default posthog;

// Start loading once the page is ready and the browser is idle.
if (typeof window !== "undefined") {
  const start = () => {
    const idle = (window as any).requestIdleCallback as ((cb: () => void, o?: { timeout: number }) => void) | undefined;
    if (idle) idle(() => void loadPostHog(), { timeout: 3000 });
    else window.setTimeout(() => void loadPostHog(), 1500);
  };
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
