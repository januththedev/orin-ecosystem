import { register } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

register(new URL('./_resolve-hook.mjs', import.meta.url));

const { PRODUCTS, hrefFor, productByShort, APEX } = await import('../src/products.ts');
const { resolveRouterOrigin, probeRouter, summarizeWithKey } = await import('../api/router-status.ts');

const EXPECTED_HOSTS = [
  'chat.orinai.org',
  'router.orinai.org',
  'console.orinai.org',
  'tools.orinai.org',
  'code.orinai.org',
  'automate.orinai.org',
  'agent.orinai.org',
];

test('every requested product hostname is in the canonical map', () => {
  for (const host of EXPECTED_HOSTS) {
    const product = PRODUCTS.find((entry) => entry.host === host);
    assert.ok(product, `${host} must be a known product`);
    assert.ok(hrefFor(product).startsWith('https://'), `${host} must link over https`);
  }
});

test('the map covers exactly the requested subdomains and nothing invented', () => {
  const hosts = PRODUCTS.map((entry) => entry.host);
  assert.deepEqual([...hosts].sort(), [...EXPECTED_HOSTS, 'mcp.orinai.org'].sort());
  for (const host of hosts) assert.ok(host === APEX || host.endsWith(`.${APEX}`), `${host} must be an Orin host`);
});

test('account-gated products are exactly Chat, Code, Agent, Router and MCP', () => {
  const gated = PRODUCTS.filter((entry) => entry.requiresAccount).map((entry) => entry.short).sort();
  assert.deepEqual(gated, ['Agent', 'Chat', 'Code', 'MCP', 'Router']);
  // Console, Tools and Automations must stay reachable without an account.
  for (const short of ['Console', 'Tools', 'Automations']) {
    assert.equal(productByShort(short).requiresAccount, false, `${short} must not require an account`);
  }
});

test('the status endpoint only accepts a registered https router host', () => {
  assert.equal(resolveRouterOrigin(undefined), 'https://router.orinai.org');
  assert.equal(resolveRouterOrigin('https://router.orinai.org'), 'https://router.orinai.org');
  for (const bad of [
    'http://router.orinai.org',
    'https://evil.example',
    'https://router.orinai.org.evil.example',
    'https://user:pass@router.orinai.org',
    'https://router.orinai.org/elsewhere',
  ]) {
    assert.throws(() => resolveRouterOrigin(bad), `must refuse ${bad}`);
  }
});

test('an unreachable router is reported, not faked', async () => {
  const failing = async () => { throw new Error('connection refused'); };
  const status = await probeRouter('https://router.orinai.org', failing);
  assert.equal(status.reachable, false);
  assert.equal(status.freeModelCount, null);
  assert.match(status.error, /connection refused/);
});

test('health is reported when the router answers', async () => {
  const fake = async () => new Response(JSON.stringify({ status: 'ok', mode: 'live' }), { status: 200 });
  const status = await probeRouter('https://router.orinai.org', fake);
  assert.equal(status.reachable, true);
  assert.equal(status.mode, 'live');
  assert.equal(status.error, undefined);
});

test('only :free models are counted, even if the list contains others', async () => {
  const fake = async (url) => {
    if (String(url).endsWith('/health')) return new Response(JSON.stringify({ status: 'ok', mode: 'live' }), { status: 200 });
    return new Response(JSON.stringify({ data: [
      { id: 'vendor/one:free' }, { id: 'vendor/two:free' },
      { id: 'vendor/paid' }, { id: 'orin-cheap' },
    ] }), { status: 200 });
  };
  const status = await summarizeWithKey('https://router.orinai.org', 'orin_key', fake);
  assert.equal(status.reachable, true);
  assert.equal(status.freeModelCount, 2);
  assert.deepEqual(status.sampleModels, ['vendor/one:free', 'vendor/two:free']);
});

test('a failing model list does not erase a healthy router', async () => {
  const fake = async (url) => {
    if (String(url).endsWith('/health')) return new Response(JSON.stringify({ status: 'ok', mode: 'live' }), { status: 200 });
    return new Response('nope', { status: 401 });
  };
  const status = await summarizeWithKey('https://router.orinai.org', 'orin_key', fake);
  assert.equal(status.reachable, true);
  assert.equal(status.freeModelCount, null);
  assert.match(status.error, /401/);
});

test('the hub really calls the router, and the products page links to real hosts', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /<RouterStatus \/>/, 'App must render the router status panel');

  const products = await readFile(new URL('../src/components/Products.tsx', import.meta.url), 'utf8');
  assert.match(products, /productByShort/, 'products must resolve hosts from the canonical map');
  assert.match(products, /RESOLVED\.map/, 'products must render the resolved list');

  const nav = await readFile(new URL('../src/components/Nav.tsx', import.meta.url), 'utf8');
  assert.ok(!nav.includes('https://chat.orinai.org'), 'nav must read hosts from the canonical map');
});

test('sign-in links point at orinai.org and only accept Orin return targets', async () => {
  const { signinUrl, SIGNIN_URL } = await import('../src/products.ts');
  assert.equal(SIGNIN_URL, 'https://orinai.org/signin');
  assert.equal(signinUrl('https://code.orinai.org/'), 'https://orinai.org/signin?return_to=https%3A%2F%2Fcode.orinai.org%2F');
  // A non-Orin return target is dropped rather than forwarded, so the sign-in
  // page is never turned into an open redirect by a crafted link.
  for (const hostile of ['https://evil.example/', 'https://code.orinai.org.evil.example/', 'javascript:alert(1)', 'not a url', 'http://code.orinai.org/']) {
    assert.equal(signinUrl(hostile), SIGNIN_URL, hostile);
  }
});
