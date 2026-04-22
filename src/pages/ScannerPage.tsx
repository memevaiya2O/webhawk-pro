import { useState, useRef, useCallback } from "react";
import { startScan, openScanStream, getResult, downloadReport } from "@/lib/api";

type ScanItem = { url: string; method: string; cat: string; source: string; status: number | null; auth: boolean; locked: boolean; preview: string; content_type: string; };
type SecretItem = { type: string; value: string; source: string; };
type ScanResult = { headers: Record<string, string>; cookies: Record<string, any>; tech: string[]; env_vars: string[]; graphql_ops: string[]; sourcemaps: string[]; internal_ips: string[]; cors_misconfig: string[]; firebase_configs: string[]; forms: any[]; meta_tags: any[]; hidden_inputs: any[]; comments: any[]; links: any[]; pages: string[]; js_files: string[]; };

const STEPS = [
  { n: 1, label: "Headers" }, { n: 2, label: "Robots" }, { n: 3, label: "Crawl" },
  { n: 4, label: "JS" }, { n: 5, label: "Probe" }, { n: 6, label: "GraphQL" },
  { n: 7, label: "OpenAPI" }, { n: 8, label: "Auth" }, { n: 9, label: "Security" },
];

const CAT_COLORS: Record<string, string> = {
  API: "#00e5ff", GraphQL: "#69ff47", Auth: "#ff6d00", WebSocket: "#7c4dff",
  Realtime: "#7c4dff", "CDN/Asset": "#00b8d4", External: "#ffd600",
  Asset: "#3a5070", Admin: "#ff4757", Sensitive: "#ff4757", Import: "#ff4081", Path: "#3a5070",
};
const METHOD_COLORS: Record<string, string> = {
  GET: "#00e5ff", POST: "#69ff47", PUT: "#ffd600", DELETE: "#ff4757", PATCH: "#7c4dff", "–": "#3a5070",
};
const LOG_ICONS: Record<string, string> = { i: "›", f: "✦", t: "◈", w: "⚠", e: "✕", p: "·", k: "◆", g: "⟡" };
const LOG_COLORS: Record<string, string> = { i: "#00e5ff", f: "#69ff47", t: "#7c4dff", w: "#ff6d00", e: "#ff4757", p: "#3a5070", k: "#ffd600", g: "#69ff47" };

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{ background: color + "22", color, border: `1px solid ${color}44`, fontSize: "0.56rem", padding: "2px 7px", borderRadius: 4, fontFamily: "'Space Mono',monospace", fontWeight: 700, letterSpacing: "0.04em", display: "inline-flex", alignItems: "center" }}>
      {children}
    </span>
  );
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); });
}

export default function ScannerPage() {
  const [url, setUrl] = useState("");
  const [depth, setDepth] = useState(2);
  const [threads, setThreads] = useState(10);
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);
  const [logs, setLogs] = useState<{ t: string; msg: string }[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [secrets, setSecrets] = useState<SecretItem[]>([]);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("urls");
  const [activeCat, setActiveCat] = useState("ALL");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, secrets: 0, pages: 0, js: 0, elapsed: 0 });
  const [toast, setToast] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  const addLog = useCallback((msg: string, t: string) => {
    setLogs(prev => [...prev.slice(-200), { t, msg }]);
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 10);
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  const handleScan = async () => {
    if (!url.trim()) return;
    if (esRef.current) esRef.current.close();
    setScanning(true); setDone(false); setLogs([]); setItems([]); setSecrets([]); setResult(null);
    setCurrentStep(0); setActiveCat("ALL"); setSearch(""); setStats({ total: 0, secrets: 0, pages: 0, js: 0, elapsed: 0 });
    addLog("→ " + url, "i");
    try {
      const data = await startScan(url.trim().startsWith("http") ? url.trim() : "https://" + url.trim(), depth, threads);
      if (data.error) { addLog(data.error, "e"); setScanning(false); return; }
      setScanId(data.scan_id);
      const es = openScanStream(data.scan_id);
      esRef.current = es;
      es.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        const { event, data: d } = msg;
        if (event === "step") { setCurrentStep(d.n); addLog(`── ${d.label}`, "i"); }
        else if (event === "log") addLog(d.msg, d.t || "i");
        else if (event === "item") { setItems(prev => [...prev, d]); setStats(p => ({ ...p, total: p.total + 1 })); }
        else if (event === "secret") { setSecrets(prev => [...prev, d]); setStats(p => ({ ...p, secrets: p.secrets + 1 })); }
        else if (event === "done") {
          es.close(); setScanning(false); setDone(true); setCurrentStep(10);
          setStats(p => ({ ...p, total: d.total || p.total, secrets: d.secrets || p.secrets, pages: d.pages || 0, js: d.js || 0, elapsed: d.elapsed || 0 }));
          addLog(`✦ Done · ${d.total} URLs · ${d.secrets} secrets · ${d.elapsed}s`, "f");
          getResult(data.scan_id).then(r => setResult(r));
        }
      };
      es.onerror = () => { addLog("Stream error", "e"); es.close(); setScanning(false); };
    } catch (err) { addLog("Error: " + String(err), "e"); setScanning(false); }
  };

  const filteredItems = items.filter(it => {
    if (activeCat !== "ALL" && it.cat !== activeCat) return false;
    if (!search) return true;
    return (it.url + it.source + it.cat + it.method).toLowerCase().includes(search.toLowerCase());
  });
  const catCounts: Record<string, number> = {};
  items.forEach(it => { catCounts[it.cat] = (catCounts[it.cat] || 0) + 1; });

  const RESULT_TABS = [
    { id: "urls", label: "URLs", count: items.length },
    { id: "secrets", label: "Secrets", count: secrets.length },
    { id: "headers", label: "Headers", count: Object.keys(result?.headers || {}).length },
    { id: "cookies", label: "Cookies", count: Object.keys(result?.cookies || {}).length },
    { id: "forms", label: "Forms", count: result?.forms?.length || 0 },
    { id: "intel", label: "Intel" },
  ];

  return (
    <div className="page-wrap">
      {toast && <div className="toast">{toast}</div>}

      {/* Scan Card */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-accent" />
        <div className="label">Target URL</div>
        <input
          value={url} onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !scanning && handleScan()}
          type="url" placeholder="https://example.com" disabled={scanning}
          className="input-field" style={{ marginBottom: 10 }}
        />

        <button onClick={() => setShowAdvanced(p => !p)} style={{ background: "none", border: "none", color: "#3a5070", fontSize: "0.65rem", cursor: "pointer", fontFamily: "'Space Mono',monospace", padding: "0 0 8px", letterSpacing: "0.08em" }}>
          {showAdvanced ? "▲ Hide Options" : "▼ Advanced Options"}
        </button>

        {showAdvanced && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            {[{ label: "Crawl Depth", val: depth, set: setDepth, min: 1, max: 5 }, { label: "Threads", val: threads, set: setThreads, min: 1, max: 25 }].map(({ label, val, set, min, max }) => (
              <div key={label}>
                <div className="label">{label}</div>
                <input type="number" value={val} min={min} max={max} onChange={e => set(+e.target.value)} disabled={scanning} className="input-field" />
              </div>
            ))}
          </div>
        )}

        <button onClick={handleScan} disabled={scanning} className="btn-primary">
          {scanning ? `⟳ Scanning... ${currentStep}/9` : "⚡ DEEP SCAN"}
        </button>
      </div>

      {/* Progress */}
      {(scanning || done) && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: scanning ? "#69ff47" : "#00e5ff", boxShadow: scanning ? "0 0 10px #69ff47" : "0 0 8px #00e5ff", animation: scanning ? "blink 1.2s ease-in-out infinite" : "none", flexShrink: 0 }} />
            <span style={{ fontSize: "0.7rem", color: scanning ? "#69ff47" : "#00e5ff", fontFamily: "'Space Mono',monospace" }}>
              {scanning ? `Step ${currentStep}/9` : `Done · ${stats.total} URLs · ${stats.secrets} secrets · ${stats.elapsed}s`}
            </span>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
            {STEPS.map(step => (
              <div key={step.n} style={{ fontSize: "0.54rem", padding: "3px 8px", borderRadius: 20, border: `1px solid ${step.n === currentStep ? "#69ff47" : step.n < currentStep ? "#1e2d48" : "#131f35"}`, color: step.n === currentStep ? "#69ff47" : step.n < currentStep ? "#1e2d48" : "#3a5070", background: step.n === currentStep ? "rgba(105,255,71,0.07)" : "transparent", fontFamily: "'Space Mono',monospace" }}>
                {step.n < currentStep ? "✓ " : ""}{step.label}
              </div>
            ))}
          </div>
          <div ref={logRef} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #131f35", borderRadius: 8, padding: "10px 12px", height: 130, overflowY: "auto", fontSize: "0.62rem", lineHeight: 1.9, fontFamily: "'Space Mono',monospace" }}>
            {logs.map((log, i) => (
              <div key={i} style={{ display: "flex", gap: 7, wordBreak: "break-all" }}>
                <span style={{ flexShrink: 0, width: 12, textAlign: "center", color: LOG_COLORS[log.t] || "#3a5070" }}>{LOG_ICONS[log.t] || "›"}</span>
                <span style={{ color: log.t === "e" ? "#ff4757" : log.t === "w" ? "#ff6d00" : log.t === "f" ? "#69ff47" : "#c8d8f0" }}>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {(items.length > 0 || done) && (
        <div className="stat-grid" style={{ marginBottom: 14 }}>
          {[
            { n: stats.total, l: "URLs", color: "#00e5ff" },
            { n: stats.secrets, l: "Secrets", color: "#ff6d00" },
            { n: stats.js, l: "JS Files", color: "#69ff47" },
            { n: stats.pages, l: "Pages", color: "#7c4dff" },
            { n: stats.elapsed, l: "Seconds", color: "#ffd600" },
          ].map(({ n, l, color }) => (
            <div key={l} className="stat-card">
              <div className="stat-num" style={{ color }}>{n}</div>
              <div className="stat-label">{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tech Stack */}
      {result?.tech && result.tech.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div className="section-title">Tech Stack Detected</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {result.tech.map((t, i) => <span key={i} style={{ fontSize: "0.62rem", padding: "4px 11px", borderRadius: 20, background: "rgba(124,77,255,0.1)", border: "1px solid rgba(124,77,255,0.25)", color: "#7c4dff", fontFamily: "'Space Mono',monospace" }}>{t}</span>)}
          </div>
        </div>
      )}

      {/* Tabs */}
      {items.length > 0 && (
        <div>
          <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #131f35", marginBottom: 14, overflowX: "auto", scrollbarWidth: "none" }}>
            {RESULT_TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", padding: "9px 12px", borderBottom: `2px solid ${activeTab === tab.id ? "#00e5ff" : "transparent"}`, color: activeTab === tab.id ? "#00e5ff" : "#3a5070", cursor: "pointer", background: "none", border: "none", borderBottom: `2px solid ${activeTab === tab.id ? "#00e5ff" : "transparent"}`, whiteSpace: "nowrap", flexShrink: 0 }}>
                {tab.label}
                {"count" in tab && tab.count !== undefined && <span style={{ fontSize: "0.56rem", background: activeTab === tab.id ? "rgba(0,229,255,0.15)" : "#131f35", color: activeTab === tab.id ? "#00e5ff" : "#3a5070", padding: "1px 5px", borderRadius: 10, marginLeft: 5 }}>{tab.count}</span>}
              </button>
            ))}
          </div>

          {/* URLs Tab */}
          {activeTab === "urls" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter URL / method / category..." className="input-field" style={{ flex: 1, minWidth: 140, padding: "9px 12px", fontSize: "0.75rem" }} />
                <button onClick={() => scanId && downloadReport(scanId, "txt")} className="btn-secondary">↓ TXT</button>
                <button onClick={() => scanId && downloadReport(scanId, "json")} className="btn-secondary">↓ JSON</button>
              </div>
              <div style={{ overflowX: "auto", whiteSpace: "nowrap", paddingBottom: 8, marginBottom: 10, scrollbarWidth: "none" }}>
                {[["ALL", items.length], ...Object.entries(catCounts).sort((a, b) => +b[1] - +a[1])].map(([cat, count]) => (
                  <button key={cat} onClick={() => setActiveCat(String(cat))} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.58rem", padding: "5px 10px", borderRadius: 20, border: `1px solid ${activeCat === cat ? (CAT_COLORS[String(cat)] || "#00e5ff") : "#131f35"}`, color: activeCat === cat ? (CAT_COLORS[String(cat)] || "#00e5ff") : "#3a5070", background: activeCat === cat ? (CAT_COLORS[String(cat)] || "#00e5ff") + "11" : "transparent", cursor: "pointer", marginRight: 5, whiteSpace: "nowrap", fontFamily: "'Space Mono',monospace" }}>
                    {cat} <span style={{ fontSize: "0.52rem", padding: "1px 4px", borderRadius: 8, background: "#131f35" }}>{count}</span>
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredItems.length === 0 && <div style={{ textAlign: "center", padding: 32, color: "#3a5070", fontSize: "0.72rem", fontFamily: "'Space Mono',monospace" }}>No results</div>}
                {filteredItems.slice(0, 300).map((item, i) => {
                  const catColor = CAT_COLORS[item.cat] || "#3a5070";
                  const key = `${i}:${item.url}`;
                  const isExpanded = expanded.has(key);
                  return (
                    <div key={i} style={{ background: "#0a0f1e", border: "1px solid #131f35", borderLeft: `3px solid ${catColor}`, borderRadius: 10, padding: "11px 13px", animation: "fadeIn 0.12s ease" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7 }}>
                        <span style={{ flex: 1, fontSize: "0.68rem", lineHeight: 1.6, wordBreak: "break-all", color: "#c8d8f0", fontFamily: "'Space Mono',monospace" }}>{item.url}</span>
                        <button onClick={() => { copyText(item.url); showToast("Copied!"); }} style={{ flexShrink: 0, background: "transparent", border: "none", color: "#3a5070", fontSize: "1rem", padding: "0 2px", cursor: "pointer", lineHeight: 1 }}>⎘</button>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        <Badge color={METHOD_COLORS[item.method] || "#3a5070"}>{item.method}</Badge>
                        {item.status !== null && <Badge color={item.status >= 200 && item.status < 300 ? "#69ff47" : item.status >= 300 && item.status < 400 ? "#00e5ff" : item.status >= 400 && item.status < 500 ? "#ff6d00" : "#ff4757"}>{item.status}</Badge>}
                        <Badge color={catColor}>{item.cat}</Badge>
                        {item.auth && <Badge color="#ff6d00">AUTH</Badge>}
                        {item.locked && !item.auth && <Badge color="#ff4757">LOCKED</Badge>}
                        {item.content_type && <Badge color="#3a5070">{item.content_type.split(";")[0].trim()}</Badge>}
                      </div>
                      {item.preview && (
                        <div onClick={() => setExpanded(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; })} style={{ marginTop: 8, fontSize: "0.6rem", color: "#3a5070", background: "rgba(0,0,0,0.4)", borderRadius: 5, padding: "7px 10px", borderLeft: "2px solid #1e2d48", maxHeight: isExpanded ? 300 : 72, overflow: "hidden", cursor: "pointer", whiteSpace: "pre-wrap", wordBreak: "break-all", transition: "max-height 0.2s", fontFamily: "'Space Mono',monospace" }}>
                          {item.preview}
                        </div>
                      )}
                      {item.source && <div style={{ fontSize: "0.54rem", color: "#1e2d48", marginTop: 5, wordBreak: "break-all", fontFamily: "'Space Mono',monospace" }}>src: {item.source}</div>}
                    </div>
                  );
                })}
                {filteredItems.length > 300 && <div style={{ textAlign: "center", color: "#3a5070", fontSize: "0.65rem", padding: 12 }}>Showing 300 of {filteredItems.length} results. Use filters to narrow down.</div>}
              </div>
            </div>
          )}

          {/* Secrets Tab */}
          {activeTab === "secrets" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {secrets.length === 0 && <div style={{ textAlign: "center", padding: 32, color: "#3a5070", fontSize: "0.72rem", fontFamily: "'Space Mono',monospace" }}>No secrets found</div>}
              {secrets.map((s, i) => (
                <div key={i} style={{ background: "rgba(255,71,87,0.04)", border: "1px solid rgba(255,109,0,0.2)", borderLeft: "3px solid #ff6d00", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.65rem", fontWeight: 700, color: "#ff6d00", letterSpacing: "0.08em", marginBottom: 6 }}>⚠ {s.type}</div>
                  <div onClick={() => { copyText(s.value); showToast("Copied!"); }} style={{ fontSize: "0.67rem", color: "#ffd600", wordBreak: "break-all", lineHeight: 1.6, background: "rgba(0,0,0,0.4)", padding: "6px 9px", borderRadius: 5, marginBottom: 6, cursor: "pointer", fontFamily: "'Space Mono',monospace" }}>{s.value}</div>
                  <div style={{ fontSize: "0.55rem", color: "#3a5070", wordBreak: "break-all", fontFamily: "'Space Mono',monospace" }}>src: {s.source}</div>
                </div>
              ))}
            </div>
          )}

          {/* Headers Tab */}
          {activeTab === "headers" && result?.headers && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(result.headers).map(([k, v]) => (
                <div key={k} style={{ background: "#0a0f1e", border: "1px solid #131f35", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.65rem", color: "#00e5ff", minWidth: 180, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: "0.65rem", color: "#c8d8f0", wordBreak: "break-all", fontFamily: "'Space Mono',monospace", flex: 1 }}>{String(v)}</span>
                  <button onClick={() => { copyText(`${k}: ${v}`); showToast("Copied!"); }} style={{ background: "none", border: "none", color: "#3a5070", fontSize: "0.9rem", cursor: "pointer" }}>⎘</button>
                </div>
              ))}
            </div>
          )}

          {/* Cookies Tab */}
          {activeTab === "cookies" && result?.cookies && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.keys(result.cookies).length === 0 && <div style={{ textAlign: "center", padding: 32, color: "#3a5070", fontSize: "0.72rem" }}>No cookies found</div>}
              {Object.entries(result.cookies).map(([name, info]: [string, any]) => (
                <div key={name} style={{ background: "#0a0f1e", border: "1px solid #131f35", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.7rem", color: "#ffd600", marginBottom: 6 }}>{name}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {info.secure && <Badge color="#69ff47">Secure</Badge>}
                    {info.httponly && <Badge color="#00e5ff">HttpOnly</Badge>}
                    {info.samesite && <Badge color="#7c4dff">SameSite: {info.samesite}</Badge>}
                    {!info.secure && <Badge color="#ff4757">No Secure Flag</Badge>}
                    {!info.httponly && <Badge color="#ff6d00">No HttpOnly</Badge>}
                    {info.domain && <Badge color="#3a5070">{info.domain}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Forms Tab */}
          {activeTab === "forms" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(!result?.forms || result.forms.length === 0) && <div style={{ textAlign: "center", padding: 32, color: "#3a5070", fontSize: "0.72rem" }}>No forms found</div>}
              {(result?.forms || []).map((form, i) => (
                <div key={i} style={{ background: "#0a0f1e", border: "1px solid #131f35", borderLeft: "3px solid #69ff47", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <Badge color={METHOD_COLORS[form.method] || "#3a5070"}>{form.method}</Badge>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.68rem", color: "#c8d8f0", wordBreak: "break-all" }}>{form.url}</span>
                  </div>
                  {form.inputs?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {form.inputs.map((inp: any, j: number) => (
                        <span key={j} style={{ fontSize: "0.6rem", padding: "3px 9px", borderRadius: 5, background: inp.type === "hidden" ? "rgba(255,64,129,0.1)" : "rgba(0,229,255,0.06)", border: `1px solid ${inp.type === "hidden" ? "#ff408133" : "#00e5ff22"}`, color: inp.type === "hidden" ? "#ff4081" : "#00e5ff", fontFamily: "'Space Mono',monospace" }}>
                          {inp.name}:{inp.type}{inp.value ? `="${inp.value}"` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: "0.54rem", color: "#1e2d48", marginTop: 6, fontFamily: "'Space Mono',monospace" }}>src: {form.source}</div>
                </div>
              ))}
            </div>
          )}

          {/* Intel Tab */}
          {activeTab === "intel" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { title: "Environment Variables", data: result?.env_vars, color: "#ffd600", icon: "⚙" },
                { title: "GraphQL Operations", data: result?.graphql_ops, color: "#69ff47", icon: "⟡" },
                { title: "Internal IPs Leaked", data: result?.internal_ips, color: "#ff4757", icon: "🔴" },
                { title: "Source Maps", data: result?.sourcemaps, color: "#7c4dff", icon: "◈" },
                { title: "CORS Misconfigurations", data: result?.cors_misconfig, color: "#ff6d00", icon: "⚠" },
                { title: "Firebase Configs", data: result?.firebase_configs, color: "#ff6d00", icon: "🔥" },
                { title: "JS Files", data: result?.js_files, color: "#00e5ff", icon: "📜" },
                { title: "Crawled Pages", data: result?.pages, color: "#3a5070", icon: "📄" },
              ].map(({ title, data, color, icon }) => (
                (data && data.length > 0) ? (
                  <div key={title}>
                    <div className="section-title" style={{ color }}>{icon} {title} <span style={{ background: color + "22", color, padding: "2px 8px", borderRadius: 10, fontSize: "0.58rem", fontFamily: "'Space Mono',monospace" }}>{data.length}</span></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {data.slice(0, 50).map((item: string, i: number) => (
                        <div key={i} onClick={() => { copyText(item); showToast("Copied!"); }} style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.65rem", color: "#c8d8f0", background: "rgba(0,0,0,0.4)", border: "1px solid #131f35", borderRadius: 6, padding: "7px 10px", wordBreak: "break-all", cursor: "pointer", borderLeft: `2px solid ${color}` }}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              ))}
              {/* Hidden inputs */}
              {result?.hidden_inputs && result.hidden_inputs.length > 0 && (
                <div>
                  <div className="section-title" style={{ color: "#ff4081" }}>🔒 Hidden Form Inputs <span style={{ background: "#ff408122", color: "#ff4081", padding: "2px 8px", borderRadius: 10, fontSize: "0.58rem" }}>{result.hidden_inputs.length}</span></div>
                  {result.hidden_inputs.map((inp: any, i: number) => (
                    <div key={i} style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.65rem", background: "rgba(255,64,129,0.05)", border: "1px solid #ff408122", borderRadius: 6, padding: "7px 10px", marginBottom: 5, wordBreak: "break-all" }}>
                      <span style={{ color: "#ff4081" }}>{inp.name}</span>
                      {inp.value && <span style={{ color: "#ffd600" }}> = "{inp.value}"</span>}
                      <span style={{ color: "#3a5070", fontSize: "0.55rem" }}> @ {inp.source}</span>
                    </div>
                  ))}
                </div>
              )}
              {result?.meta_tags && result.meta_tags.length > 0 && (
                <div>
                  <div className="section-title" style={{ color: "#00e5ff" }}>🏷 Meta Tags <span style={{ background: "#00e5ff22", color: "#00e5ff", padding: "2px 8px", borderRadius: 10, fontSize: "0.58px" }}>{result.meta_tags.length}</span></div>
                  {result.meta_tags.slice(0, 30).map((tag: any, i: number) => (
                    <div key={i} style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.63rem", display: "flex", gap: 8, padding: "5px 8px", borderBottom: "1px solid #131f35", flexWrap: "wrap" }}>
                      <span style={{ color: "#00e5ff", flexShrink: 0 }}>{tag.name}</span>
                      <span style={{ color: "#c8d8f0", wordBreak: "break-all" }}>{tag.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!scanning && !done && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "#1e2d48" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>⚡</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#3a5070", marginBottom: 8 }}>Enter a URL above to start scanning</div>
          <div style={{ fontSize: "0.65rem", color: "#1e2d48", fontFamily: "'Space Mono',monospace", lineHeight: 1.8 }}>
            Discovers APIs · Extracts Secrets · Finds Forms<br />
            GraphQL · OpenAPI · CORS · Auth Endpoints · 100+ paths
          </div>
        </div>
      )}
    </div>
  );
}
