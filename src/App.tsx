import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ScannerPage from "@/pages/ScannerPage";
import NetworkMonitorPage from "@/pages/NetworkMonitorPage";
import ToolsPage from "@/pages/ToolsPage";

const queryClient = new QueryClient();
type Page = "scanner" | "network" | "tools";

const TABS = [
  { id: "scanner" as Page, label: "Scanner", icon: "⚡" },
  { id: "network" as Page, label: "Network", icon: "📡" },
  { id: "tools" as Page, label: "Tools", icon: "🔧" },
];

export default function App() {
  const [page, setPage] = useState<Page>("scanner");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-shell">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="logo">
            <span className="logo-main">WEB</span>
            <span className="logo-accent">HAWK</span>
            <span className="logo-pro">PRO</span>
          </div>
          <div className="top-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setPage(t.id)}
                className={`top-tab ${page === t.id ? "active" : ""}`}
              >
                <span className="tab-icon">{t.icon}</span>
                <span className="tab-label">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="live-dot">
            <span className="dot" />
            <span className="live-text">LIVE</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content">
          {page === "scanner" && <ScannerPage />}
          {page === "network" && <NetworkMonitorPage />}
          {page === "tools" && <ToolsPage />}
        </main>

        {/* Bottom Nav (mobile) */}
        <nav className="bottom-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setPage(t.id)}
              className={`bottom-tab ${page === t.id ? "active" : ""}`}
            >
              <span className="bottom-icon">{t.icon}</span>
              <span className="bottom-label">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        html { background: #060810; overscroll-behavior: none; scroll-behavior: smooth; }
        body { min-height: 100dvh; font-family: 'Space Grotesk', sans-serif; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2d48; border-radius: 3px; }

        .app-shell {
          display: flex; flex-direction: column;
          min-height: 100dvh; background: #060810; color: #c8d8f0;
        }

        /* Top Bar */
        .top-bar {
          position: sticky; top: 0; z-index: 200;
          background: rgba(6,8,16,0.97);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #131f35;
          padding: 10px 16px;
          display: flex; align-items: center; gap: 12px;
        }
        .logo {
          display: flex; align-items: baseline; gap: 1px;
          font-family: 'Space Mono', monospace; font-weight: 700;
          letter-spacing: -0.02em; white-space: nowrap; flex-shrink: 0;
        }
        .logo-main {
          font-size: 1.1rem;
          background: linear-gradient(110deg, #00e5ff 0%, #00b8d4 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .logo-accent {
          font-size: 1.1rem;
          background: linear-gradient(110deg, #69ff47 0%, #00e5ff 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .logo-pro {
          font-size: 0.5rem; color: #3a5070; letter-spacing: 0.15em;
          margin-left: 5px; -webkit-text-fill-color: #3a5070;
          align-self: flex-start; margin-top: 2px;
        }

        .top-tabs {
          display: flex; gap: 2px;
          background: #0b1120; border: 1px solid #131f35; border-radius: 8px; padding: 2px;
          flex: 1; justify-content: center;
        }
        .top-tab {
          display: flex; align-items: center; gap: 5px;
          font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 0.72rem;
          letter-spacing: 0.04em; padding: 6px 12px; border-radius: 6px; border: none;
          background: transparent; color: #3a5070; cursor: pointer; transition: all 0.15s;
          white-space: nowrap;
        }
        .top-tab.active {
          background: linear-gradient(90deg, #00e5ff22, #69ff4711);
          color: #00e5ff; border: 1px solid #00e5ff33;
        }
        .tab-icon { font-size: 0.85rem; }
        .tab-label { }

        .live-dot { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: #69ff47; box-shadow: 0 0 8px #69ff47; animation: blink 2s ease-in-out infinite; }
        .live-text { font-size: 0.55rem; color: #3a5070; font-family: 'Space Mono', monospace; letter-spacing: 0.15em; }

        /* Main Content */
        .main-content { flex: 1; overflow-x: hidden; padding-bottom: 64px; }

        /* Bottom Nav */
        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
          display: none;
          background: rgba(6,8,16,0.98); backdrop-filter: blur(20px);
          border-top: 1px solid #131f35;
          padding: 6px 0 max(6px, env(safe-area-inset-bottom));
        }
        .bottom-tab {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
          background: none; border: none; cursor: pointer; padding: 6px 4px;
          color: #3a5070; font-family: 'Space Grotesk', sans-serif; transition: color 0.15s;
        }
        .bottom-tab.active { color: #00e5ff; }
        .bottom-icon { font-size: 1.2rem; }
        .bottom-label { font-size: 0.6rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }

        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes shimmer { 0%{background-position:-200%} 100%{background-position:200%} }
        @keyframes scanLine { 0%{top:0} 100%{top:100%} }

        @media (max-width: 640px) {
          .top-tabs { display: none; }
          .bottom-nav { display: flex; }
          .main-content { padding-bottom: 80px; }
          .live-dot { margin-left: auto; }
        }

        /* Shared UI */
        .page-wrap { max-width: 860px; margin: 0 auto; padding: 18px 14px; }
        .card {
          background: #0a0f1e; border: 1px solid #131f35; border-radius: 14px;
          padding: 18px; position: relative; overflow: hidden;
        }
        .card-accent { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg,#00e5ff,#69ff47 50%,#7c4dff); }
        .label { font-size: 0.58rem; color: #3a5070; letter-spacing: 0.18em; text-transform: uppercase; display: block; margin-bottom: 6px; font-family: 'Space Mono', monospace; }
        .input-field {
          width: 100%; background: rgba(0,0,0,0.5); border: 1px solid #1e2d48;
          color: #c8d8f0; font-family: 'Space Mono', monospace; font-size: 0.85rem;
          padding: 13px 14px; border-radius: 9px; outline: none;
          transition: border-color 0.2s; -webkit-appearance: none;
        }
        .input-field:focus { border-color: #00e5ff44; }
        .btn-primary {
          width: 100%; padding: 15px; border-radius: 9px; border: none;
          font-family: 'Space Grotesk', sans-serif; font-size: 1rem; font-weight: 700;
          letter-spacing: 0.08em; cursor: pointer; transition: all 0.2s;
          background: linear-gradient(90deg,#00e5ff,#69ff47);
          color: #000;
        }
        .btn-primary:disabled { background: #1e2d48; color: #3a5070; cursor: not-allowed; }
        .btn-secondary {
          padding: 8px 14px; border-radius: 8px; border: 1px solid #1e2d48;
          background: transparent; color: #00e5ff; font-family: 'Space Mono', monospace;
          font-size: 0.65rem; cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .btn-secondary:hover { border-color: #00e5ff44; background: #00e5ff11; }
        .badge {
          display: inline-flex; align-items: center;
          font-size: 0.58rem; padding: 2px 7px; border-radius: 4px;
          font-family: 'Space Mono', monospace; font-weight: 700; letter-spacing: 0.04em;
        }
        .section-title {
          font-size: 0.58rem; color: #3a5070; letter-spacing: 0.2em; text-transform: uppercase;
          display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
          font-family: 'Space Mono', monospace;
        }
        .section-title::after { content: ''; flex: 1; height: 1px; background: #131f35; }
        .stat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 14px; }
        .stat-card {
          background: #0a0f1e; border: 1px solid #131f35; border-radius: 10px;
          padding: 10px 6px; text-align: center;
        }
        .stat-num { font-family: 'Space Mono', monospace; font-size: 1.3rem; font-weight: 700; line-height: 1.1; }
        .stat-label { font-size: 0.48rem; color: #3a5070; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 2px; }
        @media (max-width: 480px) { .stat-grid { grid-template-columns: repeat(3, 1fr); } }

        textarea.input-field { resize: vertical; min-height: 80px; line-height: 1.6; }
        .result-box {
          background: rgba(0,0,0,0.5); border: 1px solid #1e2d48; border-radius: 9px;
          padding: 12px 14px; font-family: 'Space Mono', monospace; font-size: 0.75rem;
          line-height: 1.7; color: #c8d8f0; word-break: break-all; white-space: pre-wrap;
          min-height: 60px; position: relative;
        }
        .copy-btn {
          position: absolute; top: 8px; right: 8px;
          background: #131f35; border: 1px solid #1e2d48; color: #3a5070;
          font-size: 0.7rem; padding: 3px 8px; border-radius: 5px; cursor: pointer;
          font-family: 'Space Mono', monospace; transition: all 0.15s;
        }
        .copy-btn:hover { color: #00e5ff; border-color: #00e5ff44; }
        .tool-section { margin-bottom: 18px; }
        .tool-section .card { margin-bottom: 0; }
        .tool-header {
          font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 0.82rem;
          color: #00e5ff; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
          letter-spacing: 0.03em;
        }
        .tool-header .tool-badge {
          font-size: 0.55rem; padding: 2px 8px; border-radius: 10px;
          background: #00e5ff11; border: 1px solid #00e5ff33; color: #00e5ff;
          font-family: 'Space Mono', monospace;
        }
        .row { display: flex; gap: 8px; align-items: stretch; flex-wrap: wrap; }
        .row-btns { display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0; }

        .toast {
          position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
          background: #69ff47; color: #000; font-family: 'Space Grotesk', sans-serif;
          font-weight: 700; font-size: 0.82rem; padding: 8px 20px; border-radius: 20px;
          z-index: 9999; pointer-events: none; animation: fadeIn 0.2s ease;
        }
        @media (min-width: 641px) { .toast { bottom: 24px; } }
      `}</style>
    </QueryClientProvider>
  );
}
