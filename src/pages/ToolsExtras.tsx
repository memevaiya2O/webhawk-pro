import { useState, useMemo } from "react";

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); ta.remove();
  });
}

function ResultBox({ value, onCopy }: { value: string; onCopy: () => void }) {
  return (
    <div className="result-box">
      {value || <span style={{ color: "#3a5070" }}>Output will appear here...</span>}
      {value && <button className="copy-btn" onClick={onCopy}>⎘ copy</button>}
    </div>
  );
}

// ─── Password Generator ───────────────────────────────────────────────────────
export function PasswordGen({ showToast }: { showToast: (m: string) => void }) {
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ upper: true, lower: true, num: true, sym: true, ambig: false });
  const [password, setPassword] = useState("");
  const [count, setCount] = useState(1);
  const [batch, setBatch] = useState<string[]>([]);

  const generate = () => {
    let chars = "";
    if (opts.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (opts.lower) chars += "abcdefghijklmnopqrstuvwxyz";
    if (opts.num) chars += "0123456789";
    if (opts.sym) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
    if (!opts.ambig) chars = chars.replace(/[O0Il1]/g, "");
    if (!chars) return;
    const generateOne = () => {
      const arr = new Uint32Array(length);
      crypto.getRandomValues(arr);
      return Array.from(arr, x => chars[x % chars.length]).join("");
    };
    if (count === 1) { setPassword(generateOne()); setBatch([]); }
    else { const b = Array.from({ length: count }, generateOne); setBatch(b); setPassword(b[0]); }
  };

  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "—", color: "#3a5070" };
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (password.length >= 16) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[a-z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong", "Excellent", "Maximum"];
    const colors = ["#ff4757", "#ff4757", "#ff6d00", "#ffd600", "#69ff47", "#69ff47", "#00e5ff", "#00e5ff"];
    return { score: s, label: labels[s] || "Maximum", color: colors[s] || "#00e5ff" };
  }, [password]);

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#ff4081,#7c4dff)" }} />
      <div className="tool-header" style={{ color: "#ff4081" }}>🔐 Password Generator <span className="tool-badge" style={{ background: "#ff408111", borderColor: "#ff408133", color: "#ff4081" }}>CRYPTO-RANDOM</span></div>

      <div style={{ marginBottom: 10 }}>
        <div className="label">Length: {length}</div>
        <input type="range" min={6} max={64} value={length} onChange={e => setLength(+e.target.value)} style={{ width: "100%", accentColor: "#ff4081" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 6, marginBottom: 10 }}>
        {[
          { k: "upper", l: "A-Z" }, { k: "lower", l: "a-z" }, { k: "num", l: "0-9" },
          { k: "sym", l: "!@#$" }, { k: "ambig", l: "Allow O0Il1" },
        ].map(({ k, l }) => (
          <label key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.7rem", color: opts[k as keyof typeof opts] ? "#ff4081" : "#3a5070", cursor: "pointer", padding: "5px 8px", border: `1px solid ${opts[k as keyof typeof opts] ? "#ff408144" : "#1e2d48"}`, borderRadius: 6, background: opts[k as keyof typeof opts] ? "#ff408111" : "transparent", fontFamily: "'Space Mono',monospace", userSelect: "none" }}>
            <input type="checkbox" checked={opts[k as keyof typeof opts]} onChange={e => setOpts({ ...opts, [k]: e.target.checked })} style={{ accentColor: "#ff4081" }} />
            {l}
          </label>
        ))}
      </div>

      <div className="row" style={{ marginBottom: 10, alignItems: "center" }}>
        <select value={count} onChange={e => setCount(+e.target.value)} className="input-field" style={{ width: 120 }}>
          {[1, 5, 10, 25, 50].map(n => <option key={n} value={n}>{n} password{n > 1 ? "s" : ""}</option>)}
        </select>
        <button className="btn-primary" onClick={generate} style={{ flex: 1, background: "linear-gradient(90deg,#ff4081,#7c4dff)", color: "#fff" }}>
          ⚡ Generate
        </button>
      </div>

      {password && (
        <>
          <ResultBox value={password} onCopy={() => { copyText(password); showToast("Copied!"); }} />
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 6, background: "#131f35", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", background: strength.color, width: `${(strength.score / 7) * 100}%`, borderRadius: 3, transition: "all 0.2s" }} />
            </div>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.65rem", color: strength.color, minWidth: 90, textAlign: "right" }}>{strength.label}</span>
          </div>
        </>
      )}

      {batch.length > 1 && (
        <div style={{ marginTop: 10, maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          {batch.map((p, i) => (
            <div key={i} onClick={() => { copyText(p); showToast("Copied!"); }} style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.65rem", color: "#c8d8f0", background: "rgba(0,0,0,0.4)", padding: "5px 9px", borderRadius: 5, borderLeft: "2px solid #ff4081", cursor: "pointer", wordBreak: "break-all" }}>
              {p}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── UUID Generator ───────────────────────────────────────────────────────────
export function UUIDGen({ showToast }: { showToast: (m: string) => void }) {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);

  const generate = () => {
    setUuids(Array.from({ length: count }, () => crypto.randomUUID()));
  };

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#7c4dff,#00e5ff)" }} />
      <div className="tool-header" style={{ color: "#7c4dff" }}>🆔 UUID Generator <span className="tool-badge" style={{ background: "#7c4dff11", borderColor: "#7c4dff33", color: "#7c4dff" }}>v4 · RFC 4122</span></div>
      <div className="row" style={{ marginBottom: 10 }}>
        <select value={count} onChange={e => setCount(+e.target.value)} className="input-field" style={{ width: 130 }}>
          {[1, 5, 10, 25, 50, 100].map(n => <option key={n} value={n}>{n} UUID{n > 1 ? "s" : ""}</option>)}
        </select>
        <button className="btn-primary" onClick={generate} style={{ flex: 1, background: "linear-gradient(90deg,#7c4dff,#00e5ff)" }}>⚡ Generate</button>
      </div>
      {uuids.length > 0 && (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            <button className="btn-secondary" onClick={() => { copyText(uuids.join("\n")); showToast("Copied all!"); }}>⎘ Copy All</button>
            <span style={{ fontSize: "0.6rem", color: "#3a5070", padding: "5px 0", fontFamily: "'Space Mono',monospace" }}>{uuids.length} generated</span>
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {uuids.map((u, i) => (
              <div key={i} onClick={() => { copyText(u); showToast("Copied!"); }} style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.7rem", color: "#7c4dff", background: "rgba(0,0,0,0.4)", padding: "6px 10px", borderRadius: 5, borderLeft: "2px solid #7c4dff", cursor: "pointer", wordBreak: "break-all" }}>
                {u}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Timestamp Converter ──────────────────────────────────────────────────────
export function TimestampTool({ showToast }: { showToast: (m: string) => void }) {
  const [input, setInput] = useState(String(Math.floor(Date.now() / 1000)));
  const [now, setNow] = useState(Date.now());

  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    let n = parseInt(input.trim(), 10);
    if (isNaN(n)) {
      const d = new Date(input.trim());
      if (!isNaN(d.getTime())) return { date: d, ts: Math.floor(d.getTime() / 1000), tsMs: d.getTime() };
      return null;
    }
    if (n < 1e12) n = n * 1000;
    const d = new Date(n);
    if (isNaN(d.getTime())) return null;
    return { date: d, ts: Math.floor(d.getTime() / 1000), tsMs: d.getTime() };
  }, [input]);

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#ffd600,#ff6d00)" }} />
      <div className="tool-header" style={{ color: "#ffd600" }}>⏱ Timestamp / Epoch Converter <span className="tool-badge" style={{ background: "#ffd60011", borderColor: "#ffd60033", color: "#ffd600" }}>UNIX · ISO · DATE</span></div>

      <div className="row" style={{ marginBottom: 8 }}>
        <input className="input-field" placeholder="1718000000 or 2026-01-15T10:00:00Z" value={input} onChange={e => setInput(e.target.value)} style={{ flex: 1 }} />
        <button className="btn-secondary" onClick={() => { const t = String(Math.floor(Date.now() / 1000)); setInput(t); setNow(Date.now()); }}>🕒 Now</button>
      </div>

      {parsed ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            ["Unix (seconds)", String(parsed.ts), "#69ff47"],
            ["Unix (milliseconds)", String(parsed.tsMs), "#69ff47"],
            ["ISO 8601", parsed.date.toISOString(), "#00e5ff"],
            ["UTC", parsed.date.toUTCString(), "#7c4dff"],
            ["Local", parsed.date.toLocaleString(), "#ffd600"],
            ["Date Only", parsed.date.toISOString().split("T")[0], "#3a5070"],
            ["Time Only", parsed.date.toLocaleTimeString(), "#3a5070"],
            ["Day", parsed.date.toLocaleDateString(undefined, { weekday: "long" }), "#ff4081"],
          ].map(([k, v, c]) => (
            <div key={k as string} onClick={() => { copyText(v as string); showToast("Copied!"); }} style={{ display: "flex", gap: 10, alignItems: "center", background: "rgba(0,0,0,0.4)", padding: "7px 12px", borderRadius: 6, borderLeft: `2px solid ${c}`, cursor: "pointer", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.6rem", color: "#3a5070", minWidth: 130 }}>{k}</span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.7rem", color: c as string, wordBreak: "break-all", flex: 1 }}>{v}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: "#ff4757", fontSize: "0.72rem", fontFamily: "'Space Mono',monospace" }}>⚠ Invalid timestamp or date</div>
      )}
    </div>
  );
}

// ─── Color Converter ──────────────────────────────────────────────────────────
export function ColorTool({ showToast }: { showToast: (m: string) => void }) {
  const [color, setColor] = useState("#00e5ff");

  const conv = useMemo(() => {
    let h = color.trim();
    if (!h.startsWith("#")) h = "#" + h;
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(h)) return null;
    if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
    const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let hue = 0;
    if (d !== 0) {
      const rN = r / 255, gN = g / 255, bN = b / 255;
      if (max === rN) hue = ((gN - bN) / d) % 6;
      else if (max === gN) hue = (bN - rN) / d + 2;
      else hue = (rN - gN) / d + 4;
      hue *= 60; if (hue < 0) hue += 360;
    }
    return {
      hex: h.toUpperCase(),
      rgb: `rgb(${r}, ${g}, ${b})`,
      rgba: `rgba(${r}, ${g}, ${b}, 1)`,
      hsl: `hsl(${Math.round(hue)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
      cmyk: (() => { const k = 1 - Math.max(r, g, b) / 255; if (k === 1) return "cmyk(0%, 0%, 0%, 100%)"; const c = (1 - r / 255 - k) / (1 - k); const m = (1 - g / 255 - k) / (1 - k); const y = (1 - b / 255 - k) / (1 - k); return `cmyk(${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%)`; })(),
      preview: h,
    };
  }, [color]);

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#ff4081,#ffd600,#69ff47,#00e5ff)" }} />
      <div className="tool-header" style={{ color: "#ff4081" }}>🎨 Color Converter <span className="tool-badge" style={{ background: "#ff408111", borderColor: "#ff408133", color: "#ff4081" }}>HEX · RGB · HSL · CMYK</span></div>
      <div className="row" style={{ marginBottom: 10, alignItems: "center" }}>
        <input className="input-field" placeholder="#00e5ff or 00e5ff" value={color} onChange={e => setColor(e.target.value)} style={{ flex: 1, fontFamily: "'Space Mono',monospace" }} />
        <input type="color" value={conv?.preview || "#000000"} onChange={e => setColor(e.target.value)} style={{ width: 60, height: 40, border: "1px solid #1e2d48", borderRadius: 8, cursor: "pointer", background: "transparent" }} />
      </div>
      {conv && (
        <>
          <div style={{ height: 80, borderRadius: 10, background: conv.preview, border: "1px solid #1e2d48", marginBottom: 10, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.3))", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 10 }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.7rem", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>{conv.hex}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[["HEX", conv.hex], ["RGB", conv.rgb], ["HSL", conv.hsl], ["CMYK", conv.cmyk], ["RGBA", conv.rgba]].map(([k, v]) => (
              <div key={k} onClick={() => { copyText(v); showToast("Copied!"); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 11px", background: "rgba(0,0,0,0.4)", borderRadius: 6, cursor: "pointer", borderLeft: "2px solid #ff4081" }}>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.58rem", color: "#3a5070", minWidth: 50 }}>{k}</span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.68rem", color: "#c8d8f0", flex: 1, wordBreak: "break-all" }}>{v}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── QR Code Generator ────────────────────────────────────────────────────────
export function QRTool({ showToast }: { showToast: (m: string) => void }) {
  const [text, setText] = useState("");
  const [size, setSize] = useState(300);
  const [color, setColor] = useState("000000");
  const [bg, setBg] = useState("ffffff");
  const [generated, setGenerated] = useState(false);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=${size}x${size}&color=${color}&bgcolor=${bg}&margin=10`;

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#69ff47,#00e5ff)" }} />
      <div className="tool-header" style={{ color: "#69ff47" }}>📱 QR Code Generator <span className="tool-badge" style={{ background: "#69ff4711", borderColor: "#69ff4733", color: "#69ff47" }}>URL · TEXT · WIFI · ANY</span></div>

      <textarea className="input-field" placeholder="https://example.com or any text..." value={text} onChange={e => { setText(e.target.value); setGenerated(false); }} style={{ height: 70, marginBottom: 8 }} />

      <div className="row" style={{ marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 80 }}>
          <div className="label">Size</div>
          <select className="input-field" value={size} onChange={e => setSize(+e.target.value)}>
            {[150, 200, 300, 500, 800, 1000].map(s => <option key={s} value={s}>{s}×{s}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 70 }}>
          <div className="label">FG</div>
          <input type="color" value={"#" + color} onChange={e => setColor(e.target.value.slice(1))} className="input-field" style={{ height: 38, padding: 3, cursor: "pointer" }} />
        </div>
        <div style={{ flex: 1, minWidth: 70 }}>
          <div className="label">BG</div>
          <input type="color" value={"#" + bg} onChange={e => setBg(e.target.value.slice(1))} className="input-field" style={{ height: 38, padding: 3, cursor: "pointer" }} />
        </div>
      </div>

      <button className="btn-primary" onClick={() => setGenerated(true)} disabled={!text} style={{ marginBottom: 10, background: "linear-gradient(90deg,#69ff47,#00e5ff)", color: "#000" }}>
        ⚡ Generate QR Code
      </button>

      {generated && text && (
        <div style={{ textAlign: "center", padding: 12, background: "rgba(0,0,0,0.4)", borderRadius: 10, border: "1px solid #1e2d48" }}>
          <img src={qrUrl} alt="QR Code" style={{ maxWidth: "100%", height: "auto", borderRadius: 6 }} />
          <div style={{ marginTop: 10, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={qrUrl} download="webhawk-qr.png" target="_blank" rel="noreferrer" className="btn-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>↓ Download</a>
            <button className="btn-secondary" onClick={() => { copyText(qrUrl); showToast("URL Copied!"); }}>⎘ Copy URL</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── String Case Converter ────────────────────────────────────────────────────
export function CaseTool({ showToast }: { showToast: (m: string) => void }) {
  const [input, setInput] = useState("");

  const cases = useMemo(() => {
    if (!input) return null;
    const words = input.trim().split(/[\s_\-./]+|(?=[A-Z])/).filter(Boolean).map(w => w.toLowerCase());
    return {
      "UPPERCASE": input.toUpperCase(),
      "lowercase": input.toLowerCase(),
      "Title Case": input.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase()),
      "camelCase": words.map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1)).join(""),
      "PascalCase": words.map(w => w[0].toUpperCase() + w.slice(1)).join(""),
      "snake_case": words.join("_"),
      "CONSTANT_CASE": words.map(w => w.toUpperCase()).join("_"),
      "kebab-case": words.join("-"),
      "dot.case": words.join("."),
      "path/case": words.join("/"),
      "Sentence case": input.charAt(0).toUpperCase() + input.slice(1).toLowerCase(),
      "iNVERSE cASE": [...input].map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join(""),
      "Reverse": [...input].reverse().join(""),
    };
  }, [input]);

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#00b8d4,#7c4dff)" }} />
      <div className="tool-header" style={{ color: "#00b8d4" }}>Aa String Case Converter <span className="tool-badge" style={{ background: "#00b8d411", borderColor: "#00b8d433", color: "#00b8d4" }}>13 CASES</span></div>
      <textarea className="input-field" placeholder="Hello World Sample" value={input} onChange={e => setInput(e.target.value)} style={{ height: 60, marginBottom: 8 }} />
      {cases && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {Object.entries(cases).map(([k, v]) => (
            <div key={k} onClick={() => { copyText(v); showToast("Copied!"); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 11px", background: "rgba(0,0,0,0.4)", borderRadius: 6, cursor: "pointer", borderLeft: "2px solid #00b8d4" }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.55rem", color: "#3a5070", minWidth: 110 }}>{k}</span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.68rem", color: "#c8d8f0", flex: 1, wordBreak: "break-all" }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HMAC Generator ───────────────────────────────────────────────────────────
export function HMACTool({ showToast }: { showToast: (m: string) => void }) {
  const [text, setText] = useState("");
  const [key, setKey] = useState("");
  const [algo, setAlgo] = useState<"SHA-1" | "SHA-256" | "SHA-384" | "SHA-512">("SHA-256");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const generate = async () => {
    setError("");
    try {
      const enc = new TextEncoder();
      const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: algo }, false, ["sign"]);
      const sig = await crypto.subtle.sign("HMAC", k, enc.encode(text));
      setOutput(Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join(""));
    } catch (e) { setError(String(e)); }
  };

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#ff6d00,#ff4081)" }} />
      <div className="tool-header" style={{ color: "#ff6d00" }}>🔏 HMAC Generator <span className="tool-badge" style={{ background: "#ff6d0011", borderColor: "#ff6d0033", color: "#ff6d00" }}>SHA-1/256/384/512</span></div>

      <div className="label">Message</div>
      <textarea className="input-field" placeholder="Message to sign..." value={text} onChange={e => setText(e.target.value)} style={{ height: 60, marginBottom: 8 }} />
      <div className="label">Secret Key</div>
      <input className="input-field" placeholder="your-secret-key" value={key} onChange={e => setKey(e.target.value)} type="password" style={{ marginBottom: 8, fontFamily: "'Space Mono',monospace" }} />
      <div className="row" style={{ marginBottom: 8 }}>
        <select value={algo} onChange={e => setAlgo(e.target.value as any)} className="input-field" style={{ flex: 1 }}>
          {["SHA-1", "SHA-256", "SHA-384", "SHA-512"].map(a => <option key={a} value={a}>HMAC-{a}</option>)}
        </select>
      </div>
      <button className="btn-primary" onClick={generate} disabled={!text || !key} style={{ marginBottom: 10, background: "linear-gradient(90deg,#ff6d00,#ff4081)" }}>🔏 Sign</button>
      {error && <div style={{ color: "#ff4757", fontSize: "0.7rem", marginBottom: 6 }}>{error}</div>}
      <ResultBox value={output} onCopy={() => { copyText(output); showToast("Copied!"); }} />
    </div>
  );
}

// ─── User Agent Parser ────────────────────────────────────────────────────────
export function UserAgentTool({ showToast }: { showToast: (m: string) => void }) {
  const [ua, setUa] = useState(navigator.userAgent);

  const parsed = useMemo(() => {
    if (!ua) return null;
    const browsers: { name: string; re: RegExp }[] = [
      { name: "Edge", re: /Edg\/[\d.]+/ }, { name: "Opera", re: /OPR\/[\d.]+/ },
      { name: "Chrome", re: /Chrome\/[\d.]+/ }, { name: "Firefox", re: /Firefox\/[\d.]+/ },
      { name: "Safari", re: /Version\/[\d.]+ Safari/ }, { name: "IE", re: /MSIE [\d.]+|Trident/ },
    ];
    const oses = [
      { name: "Windows 11", re: /Windows NT 10\.0.+(Win64)/ }, { name: "Windows 10", re: /Windows NT 10\.0/ },
      { name: "Windows", re: /Windows NT/ }, { name: "macOS", re: /Mac OS X/ },
      { name: "iOS", re: /iPhone|iPad|iPod/ }, { name: "Android", re: /Android/ },
      { name: "Linux", re: /Linux/ },
    ];
    const devices = [
      { name: "iPhone", re: /iPhone/ }, { name: "iPad", re: /iPad/ },
      { name: "Android Phone", re: /Android.*Mobile/ }, { name: "Android Tablet", re: /Android(?!.*Mobile)/ },
      { name: "Desktop", re: /./ },
    ];
    const browser = browsers.find(b => b.re.test(ua));
    const os = oses.find(o => o.re.test(ua));
    const device = devices.find(d => d.re.test(ua));
    const browserMatch = browser ? ua.match(browser.re) : null;
    const browserVersion = browserMatch ? browserMatch[0].split("/")[1] || browserMatch[0] : null;
    return {
      browser: browser?.name || "Unknown", browserVersion: browserVersion || "Unknown",
      os: os?.name || "Unknown", device: device?.name || "Unknown",
      isBot: /bot|crawl|spider|slurp/i.test(ua),
      isMobile: /Mobile|Android|iPhone/i.test(ua),
    };
  }, [ua]);

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#7c4dff,#ff4081)" }} />
      <div className="tool-header" style={{ color: "#7c4dff" }}>🌐 User-Agent Parser <span className="tool-badge" style={{ background: "#7c4dff11", borderColor: "#7c4dff33", color: "#7c4dff" }}>BROWSER · OS · DEVICE</span></div>
      <textarea className="input-field" placeholder="User-Agent string..." value={ua} onChange={e => setUa(e.target.value)} style={{ height: 80, marginBottom: 10, fontSize: "0.7rem" }} />
      <button className="btn-secondary" onClick={() => setUa(navigator.userAgent)} style={{ marginBottom: 10 }}>📱 Use My UA</button>
      {parsed && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 6 }}>
          {[
            ["Browser", parsed.browser, "#00e5ff"], ["Version", parsed.browserVersion, "#ffd600"],
            ["OS", parsed.os, "#69ff47"], ["Device", parsed.device, "#7c4dff"],
            ["Is Mobile", parsed.isMobile ? "Yes" : "No", parsed.isMobile ? "#69ff47" : "#3a5070"],
            ["Is Bot", parsed.isBot ? "Yes" : "No", parsed.isBot ? "#ff4757" : "#3a5070"],
          ].map(([k, v, c]) => (
            <div key={k} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid #131f35", borderLeft: `2px solid ${c}`, borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontSize: "0.55rem", color: "#3a5070", fontFamily: "'Space Mono',monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: "0.78rem", color: c, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Lorem Ipsum ──────────────────────────────────────────────────────────────
export function LoremTool({ showToast }: { showToast: (m: string) => void }) {
  const [count, setCount] = useState(3);
  const [type, setType] = useState<"paragraphs" | "sentences" | "words">("paragraphs");
  const [output, setOutput] = useState("");

  const WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(" ");

  const generate = () => {
    const word = () => WORDS[Math.floor(Math.random() * WORDS.length)];
    const sentence = () => {
      const len = 5 + Math.floor(Math.random() * 12);
      const s = Array.from({ length: len }, word).join(" ");
      return s.charAt(0).toUpperCase() + s.slice(1) + ".";
    };
    const paragraph = () => Array.from({ length: 3 + Math.floor(Math.random() * 4) }, sentence).join(" ");
    if (type === "words") setOutput(Array.from({ length: count }, word).join(" "));
    else if (type === "sentences") setOutput(Array.from({ length: count }, sentence).join(" "));
    else setOutput(Array.from({ length: count }, paragraph).join("\n\n"));
  };

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#3a5070,#7c4dff)" }} />
      <div className="tool-header" style={{ color: "#7c4dff" }}>📝 Lorem Ipsum Generator <span className="tool-badge" style={{ background: "#7c4dff11", borderColor: "#7c4dff33", color: "#7c4dff" }}>WORDS · SENT · PARA</span></div>
      <div className="row" style={{ marginBottom: 8 }}>
        <input className="input-field" type="number" min={1} max={100} value={count} onChange={e => setCount(+e.target.value)} style={{ width: 90 }} />
        <select className="input-field" value={type} onChange={e => setType(e.target.value as any)} style={{ flex: 1 }}>
          <option value="paragraphs">Paragraphs</option><option value="sentences">Sentences</option><option value="words">Words</option>
        </select>
        <button className="btn-primary" onClick={generate} style={{ width: "auto", padding: "10px 18px", background: "linear-gradient(90deg,#3a5070,#7c4dff)" }}>Generate</button>
      </div>
      <ResultBox value={output} onCopy={() => { copyText(output); showToast("Copied!"); }} />
    </div>
  );
}

// ─── IP / CIDR Calculator ─────────────────────────────────────────────────────
export function IPTool({ showToast }: { showToast: (m: string) => void }) {
  const [input, setInput] = useState("192.168.1.0/24");

  const parsed = useMemo(() => {
    try {
      const [ip, prefixStr] = input.trim().split("/");
      const prefix = parseInt(prefixStr || "32", 10);
      if (prefix < 0 || prefix > 32) return null;
      const parts = ip.split(".").map(p => parseInt(p, 10));
      if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null;
      const ipNum = (parts[0] << 24) >>> 0 | (parts[1] << 16) | (parts[2] << 8) | parts[3];
      const maskNum = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
      const network = ipNum & maskNum;
      const broadcast = network | (~maskNum >>> 0);
      const numToIp = (n: number) => `${(n >>> 24) & 0xff}.${(n >>> 16) & 0xff}.${(n >>> 8) & 0xff}.${n & 0xff}`;
      const total = Math.pow(2, 32 - prefix);
      const usable = total > 2 ? total - 2 : total;
      const isPrivate = parts[0] === 10 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168);
      const cls = parts[0] < 128 ? "A" : parts[0] < 192 ? "B" : parts[0] < 224 ? "C" : parts[0] < 240 ? "D (Multicast)" : "E (Reserved)";
      return {
        ip: numToIp(ipNum), prefix, mask: numToIp(maskNum),
        network: numToIp(network), broadcast: numToIp(broadcast),
        first: numToIp(network + (total > 2 ? 1 : 0)),
        last: numToIp(broadcast - (total > 2 ? 1 : 0)),
        total, usable, isPrivate, class: cls,
        binary: parts.map(p => p.toString(2).padStart(8, "0")).join("."),
      };
    } catch { return null; }
  }, [input]);

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#69ff47,#ffd600)" }} />
      <div className="tool-header" style={{ color: "#69ff47" }}>📡 IP / CIDR Calculator <span className="tool-badge" style={{ background: "#69ff4711", borderColor: "#69ff4733", color: "#69ff47" }}>IPv4 · SUBNET</span></div>
      <input className="input-field" placeholder="192.168.1.0/24" value={input} onChange={e => setInput(e.target.value)} style={{ marginBottom: 10, fontFamily: "'Space Mono',monospace" }} />
      {parsed ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            ["Network", parsed.network], ["Broadcast", parsed.broadcast],
            ["Subnet Mask", parsed.mask], ["First Host", parsed.first],
            ["Last Host", parsed.last], ["Total Addresses", String(parsed.total)],
            ["Usable Hosts", String(parsed.usable)], ["Class", parsed.class],
            ["Type", parsed.isPrivate ? "Private (RFC 1918)" : "Public"],
            ["Binary", parsed.binary],
          ].map(([k, v]) => (
            <div key={k} onClick={() => { copyText(v); showToast("Copied!"); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 11px", background: "rgba(0,0,0,0.4)", borderRadius: 6, cursor: "pointer", borderLeft: "2px solid #69ff47" }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.58rem", color: "#3a5070", minWidth: 110 }}>{k}</span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.7rem", color: "#69ff47", flex: 1, wordBreak: "break-all" }}>{v}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: "#ff4757", fontSize: "0.72rem", fontFamily: "'Space Mono',monospace" }}>⚠ Invalid IP/CIDR notation</div>
      )}
    </div>
  );
}

// ─── Markdown Preview ─────────────────────────────────────────────────────────
export function MarkdownTool() {
  const [md, setMd] = useState("# Hello World\n\nWelcome to **WebHawk Pro**\n\n- Item 1\n- Item 2\n\n[Link](https://example.com)\n\n```\ncode block\n```\n\n> Blockquote");

  const html = useMemo(() => {
    let h = md
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/^### (.+)$/gm, '<h3 style="color:#00e5ff;font-family:Space Grotesk;margin:10px 0 6px">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="color:#69ff47;font-family:Space Grotesk;margin:14px 0 8px;font-size:1.2rem">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="color:#00e5ff;font-family:Space Grotesk;margin:18px 0 10px;font-size:1.5rem">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#ffd600">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em style="color:#7c4dff">$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:#131f35;color:#69ff47;padding:1px 6px;border-radius:3px;font-family:Space Mono">$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:#00e5ff;text-decoration:underline">$1</a>')
      .replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:3px solid #7c4dff;padding:6px 12px;color:#c8d8f0;background:rgba(124,77,255,0.05);margin:8px 0">$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li style="color:#c8d8f0">$1</li>')
      .replace(/(<li[\s\S]+?<\/li>)+/g, '<ul style="padding-left:20px;margin:8px 0">$&</ul>')
      .replace(/```([\s\S]+?)```/g, '<pre style="background:#000;color:#69ff47;padding:10px 14px;border-radius:6px;font-family:Space Mono;overflow-x:auto;font-size:0.72rem">$1</pre>')
      .replace(/\n\n/g, '<br/><br/>');
    return h;
  }, [md]);

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#ffd600,#7c4dff)" }} />
      <div className="tool-header" style={{ color: "#ffd600" }}>📄 Markdown Preview <span className="tool-badge" style={{ background: "#ffd60011", borderColor: "#ffd60033", color: "#ffd600" }}>LIVE RENDER</span></div>
      <div className="row" style={{ marginBottom: 10, alignItems: "stretch" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="label">Markdown Source</div>
          <textarea className="input-field" value={md} onChange={e => setMd(e.target.value)} style={{ height: 220, fontSize: "0.7rem" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="label">Live Preview</div>
          <div className="result-box" style={{ height: 220, overflowY: "auto", fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.78rem", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}
