export function Footer() {
  return (
    <footer aria-label="Footer">
      <div className="wrap">
        <div className="f-grid">
          <div className="f-brand">
            <a className="brand" href="#top" aria-label="Orin AI home">
              <span className="dot" aria-hidden="true" />
              ORIN&nbsp;AI
            </a>
            <p>An ecosystem of AI tools for people who build. Free forever, made by Januth.</p>
          </div>
          <nav className="f-cols" aria-label="Footer">
            <div>
              <h4>Products</h4>
              <a href="https://chat.orinai.org">Orin Chat</a>
              <a href="https://code.orinai.org">Orin Code</a>
              <a href="https://agent.orinai.org">Orin Agent</a>
              <a href="https://tools.orinai.org">Orin Tools</a>
            </div>
            <div>
              <h4>Developers</h4>
              <a href="https://github.com/januththedev/orin-code-vscode">VS Extension</a>
              <a href="https://github.com/januththedev/orin-code-cli">CLI</a>
              <a href="https://tools.orinai.org">API docs</a>
              <a href="https://github.com/januththedev/orin-tools">Self-host</a>
            </div>
            <div>
              <h4>Orin</h4>
              <a href="https://github.com/januththedev">GitHub</a>
              <a href="https://orinai.org">Ecosystem</a>
              <a href="https://januth.dev">Januth</a>
            </div>
          </nav>
        </div>
        <div className="f-base">
          <span>© 2026 Orin AI · Free forever · Made by <a href="https://januth.dev">Januth</a></span>
          <span className="mono">chat · code · agent · tools</span>
        </div>
      </div>
    </footer>
  );
}
