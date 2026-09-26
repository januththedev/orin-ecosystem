/**
 * The canonical Orin product map.
 *
 * Every surface that links to a product reads this file, so a hostname is
 * defined exactly once. Product front ends come up on these subdomains of
 * orinai.org; anything that has not been deployed yet is marked so rather than
 * being pointed at a repository as a substitute.
 */

export type ProductStatus = 'live' | 'preview' | 'planned';

export interface ProductLink {
  /** Product name as shown in the UI. */
  name: string;
  /** Short name for dense navigation. */
  short: string;
  /** The canonical hostname, without a scheme. */
  host: string;
  /** Full URL. Null when the product has no deployed surface yet. */
  url: string | null;
  /** Where to send someone who clicks before that host exists. */
  fallback: { label: string; url: string };
  status: ProductStatus;
  /** Why the status is what it is, in one honest clause. */
  statusLabel: string;
  /** Does this product require an Orin account? */
  requiresAccount: boolean;
}

export const APEX = 'orinai.org';

/** Where a person signs in. One account works across every Orin product. */
export const SIGNIN_URL = 'https://orinai.org/signin';

/**
 * Build a sign-in link that returns the visitor to where they started.
 *
 * A return target is only ever built for an Orin origin; anything else is
 * dropped, so a crafted hub link cannot turn the sign-in page into an open
 * redirect. The sign-in page re-checks this independently.
 */
export function signinUrl(returnTo: string): string {
  try {
    const url = new URL(returnTo);
    const isOrin = url.hostname === APEX || url.hostname.endsWith(`.${APEX}`);
    if (url.protocol !== 'https:' || !isOrin) return SIGNIN_URL;
    return `${SIGNIN_URL}?return_to=${encodeURIComponent(url.toString())}`;
  } catch {
    return SIGNIN_URL;
  }
}

export const PRODUCTS: readonly ProductLink[] = [
  {
    name: 'Orin Chat',
    short: 'Chat',
    host: 'chat.orinai.org',
    url: 'https://chat.orinai.org',
    fallback: { label: 'Orin Chat', url: 'https://chat.orinai.org' },
    status: 'live',
    statusLabel: 'Live',
    requiresAccount: true,
  },
  {
    name: 'Orin Router',
    short: 'Router',
    host: 'router.orinai.org',
    url: 'https://router.orinai.org',
    fallback: { label: 'Router source', url: 'https://github.com/januththedev/orin-router-service' },
    status: 'live',
    statusLabel: 'Free models only',
    requiresAccount: true,
  },
  {
    name: 'Orin Code',
    short: 'Code',
    host: 'code.orinai.org',
    url: 'https://code.orinai.org',
    fallback: { label: 'Orin Code', url: 'https://github.com/januththedev/Orin-Code' },
    status: 'live',
    statusLabel: 'Live',
    requiresAccount: true,
  },
  {
    name: 'Orin Agent',
    short: 'Agent',
    host: 'agent.orinai.org',
    url: 'https://agent.orinai.org',
    fallback: { label: 'Orin Agent', url: 'https://github.com/januththedev/orin-agent' },
    status: 'live',
    statusLabel: 'Live',
    requiresAccount: true,
  },
  {
    name: 'Orin Console',
    short: 'Console',
    host: 'console.orinai.org',
    url: 'https://console.orinai.org',
    fallback: { label: 'Console source', url: 'https://github.com/januththedev/orin-console' },
    status: 'preview',
    statusLabel: 'No login · 8h sandbox',
    requiresAccount: false,
  },
  {
    name: 'Orin Tools',
    short: 'Tools',
    host: 'tools.orinai.org',
    url: 'https://tools.orinai.org',
    fallback: { label: 'Orin Tools', url: 'https://github.com/januththedev/orin-tools' },
    status: 'live',
    statusLabel: 'Search live · run gated',
    requiresAccount: false,
  },
  {
    name: 'Orin Automations',
    short: 'Automations',
    host: 'automate.orinai.org',
    url: 'https://automate.orinai.org',
    fallback: { label: 'Automations source', url: 'https://github.com/januththedev/orin-automations' },
    status: 'preview',
    statusLabel: 'Local preview',
    requiresAccount: false,
  },
  {
    name: 'Orin MCP',
    short: 'MCP',
    host: 'mcp.orinai.org',
    url: 'https://mcp.orinai.org',
    fallback: { label: 'Orin MCP', url: 'https://github.com/januththedev/orin-mcp' },
    status: 'live',
    statusLabel: 'Live',
    requiresAccount: true,
  },
] as const;

export function productByShort(short: string): ProductLink | undefined {
  return PRODUCTS.find((product) => product.short === short);
}

/** Where a product card should point: its own host, or an honest fallback. */
export function hrefFor(product: ProductLink): string {
  return product.url ?? product.fallback.url;
}
