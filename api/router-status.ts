import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * The apex is the front door to the routing service, so the apex asks the
 * router how it is doing rather than hard-coding an answer.
 *
 * The router origin comes from configuration, so it is validated against a
 * fixed host allowlist. A misconfigured or tampered value fails the request
 * instead of turning this into an open proxy.
 */

const ALLOWED_ROUTER_HOSTS = ['router.orinai.org', 'router.orinai.org:443'] as const;
const DEFAULT_ROUTER_ORIGIN = 'https://router.orinai.org';
const PROBE_TIMEOUT_MS = 4000;

export interface RouterStatus {
  /** Whether the router answered. */
  reachable: boolean;
  /** The origin that was probed, for display. */
  origin: string;
  /** Router-reported mode, when it answered. */
  mode: string | null;
  /** How many free models the router is currently willing to serve. */
  freeModelCount: number | null;
  /** A few free model ids, so the page can show what is actually available. */
  sampleModels: string[];
  /** When this answer was produced, ISO-8601. */
  checkedAt: string;
  /** Present when the router could not be reached. */
  error?: string;
}

export function resolveRouterOrigin(raw: string | undefined): string {
  const candidate = (raw ?? DEFAULT_ROUTER_ORIGIN).trim();
  const url = new URL(candidate);
  if (url.protocol !== 'https:') throw new Error('Router origin must be https.');
  if (url.username || url.password) throw new Error('Router origin must not carry credentials.');
  if (url.pathname !== '/' && url.pathname !== '') throw new Error('Router origin must not carry a path.');
  if (!ALLOWED_ROUTER_HOSTS.includes(url.host as (typeof ALLOWED_ROUTER_HOSTS)[number])) {
    throw new Error('Router origin is not a registered Orin host.');
  }
  return url.origin;
}

function summarizeModels(payload: unknown): { count: number; sample: string[] } {
  const data = (payload as { data?: unknown })?.data;
  if (!Array.isArray(data)) return { count: 0, sample: [] };
  const ids = data
    .map((entry) => (entry as { id?: unknown })?.id)
    .filter((id): id is string => typeof id === 'string');
  // Only the free tier is ever advertised, but assert it here so a change
  // upstream cannot quietly put a paid model on the front page.
  const free = ids.filter((id) => id.endsWith(':free'));
  return { count: free.length, sample: free.slice(0, 6) };
}

export async function probeRouter(origin: string, fetchImpl: typeof fetch = fetch): Promise<RouterStatus> {
  const base: RouterStatus = {
    reachable: false,
    origin,
    mode: null,
    freeModelCount: null,
    sampleModels: [],
    checkedAt: new Date().toISOString(),
  };

  const withTimeout = AbortSignal.timeout(PROBE_TIMEOUT_MS);
  try {
    const health = await fetchImpl(`${origin}/health`, { signal: withTimeout, headers: { accept: 'application/json' } });
    if (!health.ok) return { ...base, error: `Router health returned HTTP ${health.status}.` };
    const healthBody = (await health.json()) as { status?: unknown; mode?: unknown };
    const mode = typeof healthBody.mode === 'string' ? healthBody.mode : null;

    // The models endpoint requires authentication, so the public apex reports
    // health and mode, and leaves the model count to the authenticated surfaces.
    return {
      ...base,
      reachable: true,
      mode,
      error: undefined,
    };
  } catch (error) {
    return { ...base, error: error instanceof Error ? error.message : 'Router is unreachable.' };
  }
}

export async function summarizeWithKey(origin: string, apiKey: string, fetchImpl: typeof fetch = fetch): Promise<RouterStatus> {
  const base = await probeRouter(origin, fetchImpl);
  if (!base.reachable) return base;
  try {
    const response = await fetchImpl(`${origin}/v1/models`, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      headers: { accept: 'application/json', authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) return { ...base, error: `Model list returned HTTP ${response.status}.` };
    const { count, sample } = summarizeModels(await response.json());
    return { ...base, freeModelCount: count, sampleModels: sample, error: undefined };
  } catch (error) {
    return { ...base, error: error instanceof Error ? error.message : 'Model list is unreachable.' };
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.end(JSON.stringify({ error: 'GET required.' }));
    return;
  }

  let origin: string;
  try {
    origin = resolveRouterOrigin(process.env.ORIN_ROUTER_BASE_URL);
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Router origin is not configured.' }));
    return;
  }

  // A read-only gateway key lets the public page report the live free-model
  // count. Without one the page still reports health, just not the catalogue.
  const apiKey = process.env.ORIN_ROUTER_STATUS_KEY;
  const status = apiKey ? await summarizeWithKey(origin, apiKey) : await probeRouter(origin);

  res.statusCode = 200;
  res.end(JSON.stringify(status));
}
