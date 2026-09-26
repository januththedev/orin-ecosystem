import { useEffect, useState } from 'react';

interface RouterStatusPayload {
  reachable: boolean;
  origin: string;
  mode: string | null;
  freeModelCount: number | null;
  sampleModels: string[];
  checkedAt: string;
  error?: string;
}

const FALLBACK: RouterStatusPayload = {
  reachable: false,
  origin: 'https://router.orinai.org',
  mode: null,
  freeModelCount: null,
  sampleModels: [],
  checkedAt: '',
};

/**
 * The apex is the front door to the routing service, so it shows the service's
 * real state rather than a claim about it. If the probe fails, this says so.
 */
export function RouterStatus() {
  const [status, setStatus] = useState<RouterStatusPayload>(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/router-status', { headers: { accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((payload: RouterStatusPayload) => { if (!cancelled) setStatus(payload); })
      .catch(() => { if (!cancelled) setStatus({ ...FALLBACK, error: 'Could not reach the router status endpoint.' }); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const state = !loaded ? 'checking' : status.reachable ? 'online' : 'offline';
  const label = state === 'checking' ? 'Checking router' : state === 'online' ? 'Router online' : 'Router unreachable';

  return (
    <section className="router-status" id="router" aria-live="polite">
      <div className="router-status-head">
        <span className={`router-dot router-dot--${state}`} aria-hidden="true" />
        <h2>Routing service</h2>
        <span className="router-state">{label}</span>
      </div>

      <dl className="router-facts">
        <div>
          <dt>Endpoint</dt>
          <dd><code>{status.origin}</code></dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{status.mode ?? '—'}</dd>
        </div>
        <div>
          <dt>Free models</dt>
          <dd>{status.freeModelCount === null ? '—' : status.freeModelCount}</dd>
        </div>
        <div>
          <dt>Checked</dt>
          <dd>{status.checkedAt ? new Date(status.checkedAt).toLocaleTimeString() : '—'}</dd>
        </div>
      </dl>

      {status.sampleModels.length > 0 && (
        <ul className="router-models">
          {status.sampleModels.map((model) => <li key={model}><code>{model}</code></li>)}
        </ul>
      )}

      {!loaded && <p className="router-note">Contacting the routing service…</p>}
      {loaded && !status.reachable && (
        <p className="router-note router-note--warn">
          {status.error ?? 'The routing service did not answer.'} Products that need a model will not work until it is back.
        </p>
      )}
      {loaded && status.reachable && status.freeModelCount === 0 && (
        <p className="router-note">Router is up but has not published a free model catalog yet.</p>
      )}
    </section>
  );
}
