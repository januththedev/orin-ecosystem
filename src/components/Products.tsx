import { Reveal } from './Reveal';
import { hrefFor, productByShort } from '../products';

interface Product {
  index: string;
  name: string;
  short: string;
  accent: string;
  statement: string;
  desc: string;
  feats: string[];
  cta: string;
  href: string;
  domain: string;
  status: 'live' | 'preview' | 'planned';
  statusLabel: string;
  visual: React.ReactNode;
  flip?: boolean;
}

function ChatVisual() {
  return (
    <>
      <div className="v-orb" style={{ ['--pc' as string]: '#22d3ee' }} />
      <div className="v-code" aria-hidden="true">
        <div><span className="k">you</span> <span className="s">explain black holes like I'm ten</span></div>
        <div><span className="k">orin</span> <span className="s">imagine space is a trampoline…</span></div>
        <div><span className="k">you</span> <span className="s">now in Sinhala</span></div>
        <div><span className="c">memory updated · model: balanced · free</span></div>
      </div>
    </>
  );
}

function CodeVisual() {
  return (
    <>
      <div className="v-grid" aria-hidden="true" />
      <div className="v-code" aria-hidden="true">
        <div><span className="c">{'// agent understood the repo'}</span></div>
        <div><span className="k">function</span> <span className="s">shipIt</span>() {'{'}</div>
        <div>&nbsp;&nbsp;<span className="k">await</span> <span className="s">orin.refactor</span>(<span className="s">'auth'</span>)</div>
        <div>&nbsp;&nbsp;<span className="k">return</span> <span className="s">tests.green()</span></div>
        <div>{'}'}</div>
        <div><span className="c">✓ 14 files · 0 errors · committed</span></div>
      </div>
    </>
  );
}

function ExtVisual() {
  return (
    <div className="v-code" aria-hidden="true">
      <div><span className="c">{"// VS Code sidebar — explain selection"}</span></div>
      <div><span className="k">▸</span> <span className="s">Orin: Explain selection</span></div>
      <div><span className="k">▸</span> <span className="s">Orin: Fix this function</span></div>
      <div><span className="k">▸</span> <span className="s">Orin: Write tests</span></div>
      <div><span className="c">deep reasoning · your keys stay yours</span></div>
    </div>
  );
}

function AgentVisual() {
  return (
    <svg className="v-nodes" viewBox="0 0 400 300" role="img" aria-label="Agent execution graph: plan splitting into parallel tool calls that converge on a result">
      <g stroke="rgba(255,255,255,0.14)" strokeWidth="1.5">
        <line x1="200" y1="60" x2="110" y2="150" />
        <line x1="200" y1="60" x2="200" y2="150" />
        <line x1="200" y1="60" x2="290" y2="150" />
        <line x1="110" y1="150" x2="200" y2="240" />
        <line x1="200" y1="150" x2="200" y2="240" />
        <line x1="290" y1="150" x2="200" y2="240" />
      </g>
      <g fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#a1a1aa" textAnchor="middle">
        <circle cx="200" cy="60" r="10" fill="#bef264" />
        <text x="200" y="36" fill="#e7e5e4">plan</text>
        <circle cx="110" cy="150" r="8" fill="none" stroke="#bef264" strokeWidth="1.5" />
        <circle cx="200" cy="150" r="8" fill="none" stroke="#bef264" strokeWidth="1.5" />
        <circle cx="290" cy="150" r="8" fill="none" stroke="#bef264" strokeWidth="1.5" />
        <text x="110" y="178">search</text>
        <text x="200" y="178">code</text>
        <text x="290" y="178">browse</text>
        <circle cx="200" cy="240" r="10" fill="none" stroke="#fff" strokeWidth="2" />
        <text x="200" y="268" fill="#e7e5e4">done</text>
      </g>
    </svg>
  );
}

function ToolsVisual() {
  return (
    <div className="v-term" aria-hidden="true">
      <div><span className="k">$</span> curl orin.tools/api/search?q=news</div>
      <div><span className="ok">✓ 200 · 5 results · 41ms · $0.00</span></div>
      <div><span className="k">$</span> orin run -l python main.py</div>
      <div><span className="warn">⏸ execution gated · sandbox review pending</span></div>
      <div><span className="k">$</span> docker run searxng/searxng</div>
      <div><span className="ok">✓ your engine · layer one</span></div>
    </div>
  );
}

const PRODUCTS: Product[] = [
  {
    index: '01', name: 'Orin Chat', short: 'Chat', accent: '#22d3ee',
    statement: 'Your AI workspace for thinking, researching, creating and getting things done.',
    desc: 'Conversational AI with web research, files, projects, memory and multimodal input — in English, Sinhala and Tamil. Free, fast, and yours.',
    feats: ['Conversational AI', 'Web research', 'Files & projects', 'Memory', 'Voice mode', 'Free forever'],
    cta: 'Open Orin Chat', href: 'https://chat.orinai.org', domain: 'chat.orinai.org', status: 'live', statusLabel: 'Live',
    visual: <ChatVisual />
  },
  {
    index: '02', name: 'Orin Code', short: 'Code', accent: '#f59e0b',
    statement: 'AI-native development for building real software.',
    desc: 'A code editor that understands your repo — AI coding, debugging, generation and agentic workflows, backed by free-tier models with live auto-routing.',
    feats: ['AI code editor', 'Repo understanding', 'Debugging', 'Generation', 'Agentic workflows', 'Terminal'],
    cta: 'Explore Orin Code', href: 'https://code.orinai.org', domain: 'code.orinai.org', status: 'live', statusLabel: 'Live',
    visual: <CodeVisual />, flip: true
  },
  {
    index: '03', name: 'Orin Code VS Extension', short: 'VS Extension', accent: '#a78bfa',
    statement: 'The developer integration layer — Orin inside your editor.',
    desc: 'Sidebar chat, inline assistance, coding agents and terminal workflows in VS Code. No Telegram, no noise — chat and code only.',
    feats: ['VS Code sidebar', 'Explain selection', 'Inline assistance', 'Deep reasoning', 'Secret storage auth'],
    cta: 'Get the VS Code Extension', href: 'https://github.com/januththedev/orin-code-vscode', domain: 'github · orin-code-vscode', status: 'live', statusLabel: 'Live',
    visual: <ExtVisual />
  },
  {
    index: '04', name: 'Orin Agent', short: 'Agent', accent: '#bef264',
    statement: 'AI that doesn’t just answer. It acts.',
    desc: 'Planning, tool use, multi-step execution, browser interaction and automation. Wake word, glass overlay, pets — a complete assistant, not a chatbot.',
    feats: ['Planning', 'Tool use', 'Multi-step execution', 'Wake word', 'Glass mode', 'Cron automations'],
    cta: 'Explore Orin Agent', href: 'https://agent.orinai.org', domain: 'agent.orinai.org', status: 'live', statusLabel: 'Live',
    visual: <AgentVisual />, flip: true
  },
  {
    index: '05', name: 'Orin Tools', short: 'Tools', accent: '#e7e5e4',
    statement: 'Open infrastructure for running AI tooling yourself.',
    desc: 'Free keyless web search API with a private no-store route for Orin products. Public code execution stays disabled until an Orin-controlled sandbox passes security review.',
    feats: ['Search API', 'Private no-store search', 'Self-hosting', 'Open source', 'No keys'],
    cta: 'Explore Orin Tools', href: 'https://tools.orinai.org', domain: 'tools.orinai.org', status: 'live', statusLabel: 'Search live · run gated',
    visual: <ToolsVisual />
  },
  {
    index: '06', name: 'Orin MCP', short: 'MCP', accent: '#a78bfa',
    statement: 'Orin models inside the tools you already use.',
    desc: 'Scoped tokens connect Orin to Claude, Cursor and VS Code as tools. Least privilege, revocable, same quotas as the web app.',
    feats: ['Claude + Cursor + VS Code', 'Scoped tokens', '4 tools + prompts', 'Revocable', 'Same quotas'],
    cta: 'Connect Orin MCP', href: 'https://mcp.orinai.org', domain: 'mcp.orinai.org', status: 'live', statusLabel: 'Live',
    visual: <ToolsVisual />
  },
  {
    index: '07', name: 'Orin Router', short: 'Router', accent: '#38bdf8',
    statement: 'One OpenAI-compatible API over many providers.',
    desc: 'Priority routing with failover, one revocable orin_... key, encrypted provider keys, streaming and logs. Self-host from the public repo; point any OpenAI SDK at it.',
    feats: ['OpenAI-compatible', 'Priority + failover', 'One orin_... key', 'Encrypted provider keys', 'Streaming', 'Usage logs', 'Open source'],
    cta: 'Explore Orin Router', href: 'https://github.com/januththedev/orin-router-service', domain: 'router.orinai.org', status: 'live', statusLabel: 'Inference live · dashboard API',
    visual: <AgentVisual />
  },
  {
    index: '08', name: 'Orin Console', short: 'Console', accent: '#fb923c',
    statement: 'A real Linux terminal with a safe browser surface.',
    desc: 'Isolated sessions, ANSI-preserving streams, replayable history, resizing, exit state, and expiring public ports.',
    feats: ['PTY stream', 'Replay', 'Resize', '8-hour expiry', 'No login'],
    cta: 'Explore Orin Console', href: 'https://github.com/januththedev/orin-console', domain: 'github · orin-console', status: 'preview', statusLabel: 'Preview',
    visual: <CodeVisual />, flip: true
  },
  {
    index: '09', name: 'Orin Automations', short: 'Automations', accent: '#f472b6',
    statement: 'Describe the output. Review the system.',
    desc: 'Compile input/output requests into immutable manifests, exact-hash approvals, safe local runs, and Logseq-compatible Markdown.',
    feats: ['Pipeline compiler', 'Exact-hash approval', 'Safe local runner', 'Logseq notes'],
    cta: 'Explore Orin Automations', href: 'https://github.com/januththedev/orin-automations', domain: 'github · orin-automations', status: 'preview', statusLabel: 'Local preview',
    visual: <ToolsVisual />
  },
  {
    index: '10', name: 'Orin Ecosystem', short: 'Ecosystem', accent: '#e2e8f0',
    statement: 'The shared surface for the Orin family.',
    desc: 'One account, one design language, one release map — with every capability labeled by its actual gate status.',
    feats: ['Shared contracts', 'Release map', 'Creator profile', 'Open source'],
    cta: 'View the ecosystem', href: 'https://orinai.org', domain: 'orinai.org', status: 'live', statusLabel: 'Live',
    visual: <AgentVisual />, flip: true
  }
];

/**
 * Hostnames live in one place (src/products.ts). Anything the map knows about
 * gets its href, domain and status overwritten here, so a card can never drift
 * away from where that product is actually deployed.
 */
const RESOLVED: Product[] = PRODUCTS.map((product) => {
  const canonical = productByShort(product.short);
  if (!canonical) return product;
  return {
    ...product,
    href: hrefFor(canonical),
    domain: canonical.host,
    status: canonical.status,
    statusLabel: canonical.statusLabel,
  };
});

export function Products() {
  return (
    <section className="block" id="products" aria-label="Orin products">
      <div className="wrap">
        <Reveal>
          <div className="sec-head">
            <p className="kicker">The ecosystem</p>
            <h2>Ten tools.<br />One Orin.</h2>
          </div>
        </Reveal>
        <Reveal>
          <p className="lead">
            Separate products, one brand language. Each does one job completely —
            together they cover thinking, building, acting and infrastructure.
          </p>
        </Reveal>
        {RESOLVED.map((p) => (
          <article
            key={p.name}
            className={`product${p.flip ? ' flip' : ''}`}
            style={{ ['--pc' as string]: p.accent }}
            aria-label={p.name}
          >
            <Reveal>
              <div className="p-copy">
                <span className="p-index">PRODUCT {p.index}</span>
                <span className={`status-badge ${p.status}`}>{p.statusLabel}</span>
                <h3 className="p-name">{p.short}<span className="dot-accent">.</span></h3>
                <p className="p-state">{p.statement}</p>
                <p className="p-desc">{p.desc}</p>
                <ul className="p-feats">
                  {p.feats.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <a className="p-cta" href={p.href}>{p.cta} <span aria-hidden="true">→</span></a>
                <p className="p-domain">{p.domain}</p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="p-visual" aria-hidden="true">{p.visual}</div>
            </Reveal>
          </article>
        ))}
      </div>
    </section>
  );
}
