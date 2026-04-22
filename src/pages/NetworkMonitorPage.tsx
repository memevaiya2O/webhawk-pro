import { useState, useRef, useEffect } from "react";
import { startNetwork, openNetworkStream, getProxyUrl } from "@/lib/api";

type NetEvent = { id: string; url: string; method: string; status: number; type: string; size: number; duration: number; time: number; headers?: Record<string, string>; };
type ViewMode = "browser" | "network";

const TYPE_COLORS: Record<string, string> = {
  "text/html": "#00e5ff", "application/json": "#69ff47", "application/javascript": "#ffd600",
  "text/javascript": "#ffd600", "text/css": "#7c4dff", "image": "#ff4081",
  "font": "#ff6d00", "unknown": "#3a5070",
};

function typeColor(type: string) {
  for (const [k, v] of Object.entries(TYPE_COLORS)) { if (type.includes(k.split("/")[1] || k)) return v; }
  return "#3a5070";
}
function fmtBytes(n: number) { if (n < 1024) return n + " B"; if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB"; return (n / 1024 / 1024).toFixed(2) + " MB"; }
function fmtTime(ms: number) { return ms < 1000 ? ms + "ms" : (ms / 1000).toFixed(1) + "s"; }

function StatusBadge({ code }: { code: number }) {
  const color = code >= 200 && code < 300 ? "#69ff47" : code >= 300 && code < 400 ? "#00e5ff" : code >= 400 && code < 500 ? "#ff6d00" : code >= 500 ? "#ff4757" : "#3a5070";
  return <span style={{ background: color + "22", color, border: `1px solid ${color}44`, fontSize: "0.58rem", padding: "2px 6px", borderRadius: 3, fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>{code}</span>;
}

export default function NetworkMonitorPage() {
  const [targetUrl, setTargetUrl] = useState("");
  const [proxyUrl, setProxyUrl] = useState("");
  const [events, setEvents] = useState<NetEvent[]>([]);
  const [selected, setSelected] = useState<NetEvent | null>(null);
  const [active, setActive] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("browser");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [detailTab, setDetailTab] = useState<"headers" | "preview" | "timing">("headers");
  const esRef = useRef<EventSource | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const startSession = async () => {
    if (!targetUrl.trim()) return;
    if (esRef.current) esRef.current.close();
    setEvents([]); setSelected(null);
    const url = targetUrl.trim().startsWith("http") ? targetUrl.trim() : "https://" + targetUrl.trim();
    try {
      const data = await startNetwork(url);
      const sid = data.session_id;
      const pUrl = getProxyUrl(url, sid);
      setProxyUrl(pUrl);
      setActive(true);
      const es = openNetworkStream(sid);
      esRef.current = es;
      es.onmessage = (e) => { const ev = JSON.parse(e.data); setEvents(prev => [ev, ...prev.slice(0, 499)]); };
      es.onerror = () => {};
    } catch {}
  };

  const stop = () => { if (esRef.current) esRef.current.close(); setActive(false); };
  const clear = () => { setEvents([]); setSelected(null); };

  const filtered = events.filter(ev => {
    if (filter !== "all" && !ev.type.includes(filter)) return false;
    if (search && !ev.url.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const FILTERS = [
    { id: "all", label: "All" }, { id: "html", label: "Doc" }, { id: "json", label: "JSON" },
    { id: "javascript", label: "JS" }, { id: "css", label: "CSS" }, { id: "image", label: "Img" },
  ];

  const startMs = events.length > 0 ? Math.min(...events.map(e => e.time)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 57px)", overflow: "hidden" }}>
      {/* Control Bar */}
      <div style={{ background: "#060810", borderBottom: "1px solid #131f35", padding: "10px 14px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}>
        <input
          value={targetUrl} onChange={e => setTargetUrl(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !active && startSession()}
          type="url" placeholder="https://example.com"
          className="input-field" style={{ flex: 1, minWidth: 160, padding: "8px 12px", fontSize: "0.78rem" }}
        />
        {!active
          ? <button onClick={startSession} className="btn-primary" style={{ padding: "9px 18px", fontSize: "0.78rem", width: "auto" }}>▶ Start</button>
          : <button onClick={stop} style={{ padding: "9px 16px", fontSize: "0.78rem", background: "#ff475722", border: "1px solid #ff4757", color: "#ff4757", borderRadius: 8, cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700 }}>⬛ Stop</button>
        }
        <button onClick={clear} className="btn-secondary">🗑</button>
        {isMobile && (
          <div style={{ display: "flex", gap: 3, background: "#0b1120", border: "1px solid #131f35", borderRadius: 8, padding: 2 }}>
            {(["browser", "network"] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: "0.65rem", padding: "5px 9px", borderRadius: 6, border: "none", background: viewMode === v ? "#00e5ff22" : "transparent", color: viewMode === v ? "#00e5ff" : "#3a5070", cursor: "pointer" }}>
                {v === "browser" ? "🌐" : "📊"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Browser Panel */}
        {(!isMobile || viewMode === "browser") && (
          <div style={{ flex: isMobile ? 1 : "0 0 50%", display: "flex", flexDirection: "column", borderRight: isMobile ? "none" : "1px solid #131f35", overflow: "hidden" }}>
            {proxyUrl ? (
              <iframe src={proxyUrl} style={{ flex: 1, border: "none", background: "#fff" }} title="Browser Preview" sandbox="allow-scripts allow-same-origin allow-forms" />
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#1e2d48", padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>🌐</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: "#3a5070", fontSize: "0.85rem", marginBottom: 8 }}>Browser Preview</div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.62rem", color: "#1e2d48", lineHeight: 1.9 }}>Enter a URL above and click Start.<br />Network traffic will be captured live.</div>
              </div>
            )}
          </div>
        )}

        {/* Network Panel */}
        {(!isMobile || viewMode === "network") && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Toolbar */}
            <div style={{ background: "#060810", borderBottom: "1px solid #131f35", padding: "6px 10px", display: "flex", gap: 8, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: active ? "#69ff47" : "#3a5070", boxShadow: active ? "0 0 8px #69ff47" : "none", animation: active ? "blink 1.5s ease-in-out infinite" : "none" }} />
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.58rem", color: "#3a5070" }}>{events.length} reqs</span>
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter..." className="input-field" style={{ flex: 1, minWidth: 80, padding: "4px 9px", fontSize: "0.65rem" }} />
              <div style={{ display: "flex", gap: 3, overflowX: "auto", scrollbarWidth: "none" }}>
                {FILTERS.map(f => (
                  <button key={f.id} onClick={() => setFilter(f.id)} style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.55rem", padding: "3px 7px", borderRadius: 4, border: `1px solid ${filter === f.id ? "#00e5ff" : "#131f35"}`, background: filter === f.id ? "#00e5ff11" : "transparent", color: filter === f.id ? "#00e5ff" : "#3a5070", cursor: "pointer", whiteSpace: "nowrap" }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 70px 52px 70px", background: "#0a0f1e", borderBottom: "1px solid #131f35", padding: "5px 10px", flexShrink: 0 }}>
              {["URL", "Status", "Type", "Size", "Time"].map(h => (
                <div key={h} style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.5rem", color: "#3a5070", letterSpacing: "0.1em", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h}</div>
              ))}
            </div>

            {/* Requests */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "36px 16px", color: "#1e2d48", fontFamily: "'Space Mono',monospace", fontSize: "0.65rem" }}>
                  {active ? "Waiting for requests..." : "Start monitoring to capture traffic"}
                </div>
              )}
              {filtered.map((ev) => {
                const isSelected = selected?.id === ev.id;
                const dur = ev.duration || 0;
                const relStart = startMs > 0 ? ev.time - startMs : 0;
                const maxTotal = events.reduce((m, e) => Math.max(m, (e.time - startMs) + (e.duration || 0)), 1);
                const barLeft = maxTotal > 0 ? (relStart / maxTotal) * 100 : 0;
                const barWidth = maxTotal > 0 ? Math.max((dur / maxTotal) * 100, 2) : 2;
                const tc = typeColor(ev.type);
                return (
                  <div key={ev.id} onClick={() => { setSelected(isSelected ? null : ev); setDetailTab("headers"); }} style={{ display: "grid", gridTemplateColumns: "1fr 52px 70px 52px 70px", padding: "6px 10px", borderBottom: "1px solid #0d1625", cursor: "pointer", background: isSelected ? "#00e5ff08" : "transparent", alignItems: "center" }}>
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.58rem", color: "#c8d8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={ev.url}>{ev.url.replace(/^https?:\/\/[^/]+/, "") || "/"}</div>
                      <div style={{ fontSize: "0.5rem", color: "#3a5070", fontFamily: "'Space Mono',monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{new URL(ev.url).hostname}</div>
                    </div>
                    <div><StatusBadge code={ev.status} /></div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.54rem", color: tc, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.type.split("/")[1] || ev.type}</div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.56rem", color: "#3a5070" }}>{fmtBytes(ev.size)}</div>
                    <div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.56rem", color: dur > 1000 ? "#ff6d00" : "#3a5070", marginBottom: 2 }}>{fmtTime(dur)}</div>
                      <div style={{ height: 3, background: "#131f35", borderRadius: 2, position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: `${barLeft}%`, width: `${barWidth}%`, height: "100%", background: dur > 1000 ? "#ff6d00" : tc, borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail Panel */}
            {selected && (
              <div style={{ borderTop: "1px solid #131f35", maxHeight: "42%", overflowY: "auto", background: "#0a0f1e", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderBottom: "1px solid #131f35", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.6rem", color: "#c8d8f0", flex: 1, wordBreak: "break-all", minWidth: 0 }}>{selected.url}</span>
                  <StatusBadge code={selected.status} />
                  <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#3a5070", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                </div>
                <div style={{ display: "flex", borderBottom: "1px solid #131f35" }}>
                  {(["headers", "preview", "timing"] as const).map(t => (
                    <button key={t} onClick={() => setDetailTab(t)} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.62rem", fontWeight: 600, padding: "6px 12px", borderBottom: `2px solid ${detailTab === t ? "#00e5ff" : "transparent"}`, color: detailTab === t ? "#00e5ff" : "#3a5070", background: "none", border: "none", borderBottom: `2px solid ${detailTab === t ? "#00e5ff" : "transparent"}`, cursor: "pointer", textTransform: "capitalize" }}>
                      {t}
                    </button>
                  ))}
                </div>
                <div style={{ padding: "10px 12px" }}>
                  {detailTab === "headers" && (
                    <div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.56rem", color: "#3a5070", marginBottom: 8, letterSpacing: "0.1em" }}>RESPONSE HEADERS</div>
                      {selected.headers ? Object.entries(selected.headers).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", gap: 12, padding: "3px 0", borderBottom: "1px solid #0d1625", fontSize: "0.6rem", fontFamily: "'Space Mono',monospace", flexWrap: "wrap" }}>
                          <span style={{ color: "#00e5ff", minWidth: 160, flexShrink: 0 }}>{k}</span>
                          <span style={{ color: "#c8d8f0", wordBreak: "break-all", flex: 1 }}>{String(v)}</span>
                        </div>
                      )) : <span style={{ color: "#3a5070", fontFamily: "'Space Mono',monospace", fontSize: "0.62rem" }}>Headers captured on next request</span>}
                    </div>
                  )}
                  {detailTab === "preview" && (
                    <div>
                      {[["URL", selected.url], ["Method", selected.method], ["Type", selected.type], ["Size", fmtBytes(selected.size)], ["Duration", fmtTime(selected.duration)], ["Time", new Date(selected.time).toLocaleTimeString()]].map(([k, v]) => (
                        <div key={k} style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 10, padding: "4px 0", borderBottom: "1px solid #0d1625", fontSize: "0.6rem", fontFamily: "'Space Mono',monospace" }}>
                          <span style={{ color: "#3a5070" }}>{k}</span>
                          <span style={{ color: "#c8d8f0", wordBreak: "break-all" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {detailTab === "timing" && (
                    <div>
                      {[{ label: "Waiting (TTFB)", val: Math.round((selected.duration || 0) * 0.6), color: "#00e5ff" }, { label: "Content Download", val: Math.round((selected.duration || 0) * 0.4), color: "#69ff47" }, { label: "Total Duration", val: selected.duration || 0, color: "#ffd600" }].map(({ label, val, color }) => (
                        <div key={label} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.58rem", color: "#3a5070" }}>{label}</span>
                            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.58rem", color }}>{fmtTime(val)}</span>
                          </div>
                          <div style={{ height: 5, background: "#131f35", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", background: color, width: `${(val / (selected.duration || 1)) * 100}%`, borderRadius: 3 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
