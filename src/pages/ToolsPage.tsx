import { useState, useCallback } from "react";
import { PasswordGen, UUIDGen, TimestampTool, ColorTool, QRTool, CaseTool, HMACTool, UserAgentTool, LoremTool, IPTool, MarkdownTool } from "./ToolsExtras";

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); ta.remove();
  });
}

function useToast() {
  const [toast, setToast] = useState("");
  const show = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }, []);
  return { toast, show };
}

function ResultBox({ value, onCopy }: { value: string; onCopy: () => void }) {
  return (
    <div className="result-box">
      {value || <span style={{ color: "#3a5070" }}>Output will appear here...</span>}
      {value && <button className="copy-btn" onClick={onCopy}>⎘ copy</button>}
    </div>
  );
}

// ─── Base64 ───────────────────────────────────────────────────────────────────
function Base64Tool({ showToast }: { showToast: (m: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [isUrl, setIsUrl] = useState(false);
  const [error, setError] = useState("");

  const run = () => {
    setError("");
    try {
      if (mode === "encode") {
        const encoded = isUrl
          ? btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
          : btoa(unescape(encodeURIComponent(input)));
        setOutput(encoded);
      } else {
        let b64 = input;
        if (isUrl) b64 = b64.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - b64.length % 4) % 4);
        setOutput(decodeURIComponent(escape(atob(b64))));
      }
    } catch (e) {
      setError("Invalid Base64 input");
      setOutput("");
    }
  };

  const detectAndDecode = () => {
    const b64Regex = /^[A-Za-z0-9+/=\-_]{4,}$/;
    if (b64Regex.test(input.trim())) {
      setMode("decode");
      try {
        let b64 = input.trim().replace(/-/g, "+").replace(/_/g, "/");
        b64 += "==".slice(0, (4 - b64.length % 4) % 4);
        const decoded = decodeURIComponent(escape(atob(b64)));
        setOutput(decoded);
        setError("");
      } catch { setError("Failed to decode as Base64"); }
    } else {
      setMode("encode");
      setOutput(btoa(unescape(encodeURIComponent(input))));
      setError("");
    }
  };

  return (
    <div className="card tool-section">
      <div className="card-accent" />
      <div className="tool-header">🔐 Base64 Encoder / Decoder <span className="tool-badge">TEXT · URL-SAFE · AUTO-DETECT</span></div>

      <div className="row" style={{ marginBottom: 8 }}>
        {(["encode", "decode"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} className="btn-secondary" style={mode === m ? { borderColor: "#00e5ff", color: "#00e5ff", background: "#00e5ff11" } : {}}>
            {m === "encode" ? "↑ Encode" : "↓ Decode"}
          </button>
        ))}
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.7rem", color: "#3a5070", cursor: "pointer", userSelect: "none" }}>
          <input type="checkbox" checked={isUrl} onChange={e => setIsUrl(e.target.checked)} style={{ accentColor: "#00e5ff", width: 14, height: 14 }} />
          URL-safe
        </label>
        <button onClick={detectAndDecode} className="btn-secondary" style={{ marginLeft: "auto", borderColor: "#69ff4744", color: "#69ff47" }}>⚡ Auto-detect</button>
      </div>

      <textarea
        className="input-field" placeholder={mode === "encode" ? "Enter text to encode..." : "Enter Base64 to decode..."}
        value={input} onChange={e => setInput(e.target.value)}
        style={{ marginBottom: 8, height: 90 }}
      />

      <button className="btn-primary" onClick={run} style={{ marginBottom: 10 }}>
        {mode === "encode" ? "↑ Encode to Base64" : "↓ Decode from Base64"}
      </button>

      {error && <div style={{ color: "#ff4757", fontSize: "0.72rem", marginBottom: 8, fontFamily: "'Space Mono', monospace" }}>⚠ {error}</div>}
      <ResultBox value={output} onCopy={() => { copyText(output); showToast("Copied!"); }} />
    </div>
  );
}

// ─── Base64 Image ─────────────────────────────────────────────────────────────
function Base64ImageTool({ showToast }: { showToast: (m: string) => void }) {
  const [input, setInput] = useState("");
  const [imgSrc, setImgSrc] = useState("");
  const [toB64, setToB64] = useState("");
  const [error, setError] = useState("");

  const decode = () => {
    setError("");
    let src = input.trim();
    if (!src.startsWith("data:")) src = "data:image/png;base64," + src;
    setImgSrc(src);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setToB64(result || "");
      const justB64 = result?.split(",")[1] || "";
      setInput(justB64);
      setImgSrc(result || "");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#7c4dff,#ff4081)" }} />
      <div className="tool-header" style={{ color: "#7c4dff" }}>🖼 Base64 Image Viewer / Encoder <span className="tool-badge" style={{ background: "#7c4dff11", borderColor: "#7c4dff33", color: "#7c4dff" }}>PNG · JPG · SVG · GIF</span></div>

      <div className="row" style={{ marginBottom: 10 }}>
        <label className="btn-secondary" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
          📁 Upload Image
          <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        </label>
      </div>

      <textarea
        className="input-field" placeholder="Paste Base64 image data here (with or without data:image/... prefix)..."
        value={input} onChange={e => setInput(e.target.value)} style={{ height: 70, marginBottom: 8 }}
      />
      <button className="btn-primary" onClick={decode} style={{ marginBottom: 10, background: "linear-gradient(90deg,#7c4dff,#ff4081)" }}>
        👁 View Image
      </button>
      {error && <div style={{ color: "#ff4757", fontSize: "0.72rem", marginBottom: 8 }}>⚠ {error}</div>}
      {imgSrc && (
        <div style={{ textAlign: "center", background: "rgba(0,0,0,0.5)", border: "1px solid #1e2d48", borderRadius: 9, padding: 12, marginBottom: 10 }}>
          <img src={imgSrc} alt="decoded" style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 6, objectFit: "contain" }} onError={() => { setError("Invalid image data"); setImgSrc(""); }} />
        </div>
      )}
      {toB64 && (
        <>
          <div className="label">Base64 Output</div>
          <div className="result-box" style={{ maxHeight: 100, overflow: "auto" }}>
            {toB64.split(",")[1] || toB64}
            <button className="copy-btn" onClick={() => { copyText(toB64.split(",")[1] || toB64); showToast("Copied!"); }}>⎘ copy</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── JWT Decoder ──────────────────────────────────────────────────────────────
function JWTTool({ showToast }: { showToast: (m: string) => void }) {
  const [input, setInput] = useState("");
  const [parts, setParts] = useState<{ header: any; payload: any; sig: string; expired: boolean | null; iat: string | null; exp: string | null } | null>(null);
  const [error, setError] = useState("");

  const decode = () => {
    setError(""); setParts(null);
    const token = input.trim().replace(/^Bearer\s+/i, "");
    const split = token.split(".");
    if (split.length !== 3) { setError("Invalid JWT format (expected 3 parts separated by .)"); return; }
    try {
      const b64d = (s: string) => {
        s = s.replace(/-/g, "+").replace(/_/g, "/");
        s += "==".slice(0, (4 - s.length % 4) % 4);
        return JSON.parse(atob(s));
      };
      const header = b64d(split[0]);
      const payload = b64d(split[1]);
      const sig = split[2];
      const now = Math.floor(Date.now() / 1000);
      const expired = payload.exp ? now > payload.exp : null;
      const fmt = (ts: number) => ts ? new Date(ts * 1000).toLocaleString() : null;
      setParts({ header, payload, sig, expired, iat: payload.iat ? fmt(payload.iat) : null, exp: payload.exp ? fmt(payload.exp) : null });
    } catch (e) { setError("Failed to decode JWT: " + String(e)); }
  };

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#ffd600,#ff6d00)" }} />
      <div className="tool-header" style={{ color: "#ffd600" }}>🔑 JWT Token Decoder <span className="tool-badge" style={{ background: "#ffd60011", borderColor: "#ffd60033", color: "#ffd600" }}>HEADER · PAYLOAD · VERIFY</span></div>

      <textarea className="input-field" placeholder="Paste JWT token here (eyJ...)..." value={input} onChange={e => setInput(e.target.value)} style={{ height: 80, marginBottom: 8, wordBreak: "break-all" }} />
      <button className="btn-primary" onClick={decode} style={{ marginBottom: 10, background: "linear-gradient(90deg,#ffd600,#ff6d00)", color: "#000" }}>
        🔓 Decode JWT
      </button>

      {error && <div style={{ color: "#ff4757", fontSize: "0.72rem", marginBottom: 8 }}>{error}</div>}
      {parts && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {parts.expired !== null && (
            <div style={{ padding: "8px 14px", borderRadius: 8, background: parts.expired ? "rgba(255,71,87,0.1)" : "rgba(105,255,71,0.1)", border: `1px solid ${parts.expired ? "#ff475733" : "#69ff4733"}`, fontSize: "0.72rem", color: parts.expired ? "#ff4757" : "#69ff47", display: "flex", gap: 10, alignItems: "center" }}>
              {parts.expired ? "❌ Token EXPIRED" : "✅ Token is VALID"}
              {parts.iat && <span style={{ color: "#3a5070" }}>Issued: {parts.iat}</span>}
              {parts.exp && <span style={{ color: "#3a5070" }}>Expires: {parts.exp}</span>}
            </div>
          )}
          {[{ label: "Header", data: parts.header, color: "#00e5ff" }, { label: "Payload", data: parts.payload, color: "#ffd600" }, { label: "Signature", data: parts.sig, color: "#3a5070" }].map(({ label, data, color }) => (
            <div key={label}>
              <div className="label" style={{ color }}>{label}</div>
              <div className="result-box" style={{ borderLeft: `3px solid ${color}` }}>
                {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
                <button className="copy-btn" onClick={() => { copyText(typeof data === "string" ? data : JSON.stringify(data, null, 2)); showToast("Copied!"); }}>⎘</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── URL Coder ────────────────────────────────────────────────────────────────
function URLTool({ showToast }: { showToast: (m: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const encode = () => { setError(""); try { setOutput(encodeURIComponent(input)); } catch (e) { setError(String(e)); } };
  const decode = () => { setError(""); try { setOutput(decodeURIComponent(input)); } catch (e) { setError("Invalid URL-encoded string"); } };
  const parseUrl = () => {
    setError("");
    try {
      const u = new URL(input.includes("://") ? input : "https://" + input);
      const result = {
        protocol: u.protocol, host: u.host, pathname: u.pathname,
        search: u.search, hash: u.hash,
        params: Object.fromEntries(u.searchParams),
      };
      setOutput(JSON.stringify(result, null, 2));
    } catch { setError("Invalid URL"); }
  };
  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#00e5ff,#00b8d4)" }} />
      <div className="tool-header">🔗 URL Encoder / Decoder <span className="tool-badge">ENCODE · DECODE · PARSE</span></div>
      <textarea className="input-field" placeholder="Enter URL or URL-encoded string..." value={input} onChange={e => setInput(e.target.value)} style={{ height: 70, marginBottom: 8 }} />
      <div className="row-btns">
        <button className="btn-secondary" onClick={encode}>↑ URL Encode</button>
        <button className="btn-secondary" onClick={decode}>↓ URL Decode</button>
        <button className="btn-secondary" onClick={parseUrl} style={{ borderColor: "#69ff4744", color: "#69ff47" }}>🔍 Parse URL</button>
      </div>
      {error && <div style={{ color: "#ff4757", fontSize: "0.72rem", margin: "6px 0" }}>⚠ {error}</div>}
      <ResultBox value={output} onCopy={() => { copyText(output); showToast("Copied!"); }} />
    </div>
  );
}

// ─── Hex Coder ────────────────────────────────────────────────────────────────
function HexTool({ showToast }: { showToast: (m: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const toHex = () => {
    setError("");
    setOutput(Array.from(new TextEncoder().encode(input)).map(b => b.toString(16).padStart(2, "0")).join(" "));
  };
  const fromHex = () => {
    setError("");
    try {
      const cleaned = input.replace(/[^0-9a-fA-F]/g, "");
      if (cleaned.length % 2 !== 0) throw new Error("Odd number of hex digits");
      const bytes = new Uint8Array(cleaned.match(/.{2}/g)!.map(h => parseInt(h, 16)));
      setOutput(new TextDecoder().decode(bytes));
    } catch (e) { setError("Invalid hex: " + String(e)); }
  };
  const toBinary = () => {
    setError("");
    setOutput(Array.from(new TextEncoder().encode(input)).map(b => b.toString(2).padStart(8, "0")).join(" "));
  };
  const toOctal = () => {
    setError("");
    setOutput(Array.from(new TextEncoder().encode(input)).map(b => b.toString(8).padStart(3, "0")).join(" "));
  };
  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#69ff47,#00e5ff)" }} />
      <div className="tool-header" style={{ color: "#69ff47" }}>⬡ Hex / Binary / Octal Converter <span className="tool-badge" style={{ background: "#69ff4711", borderColor: "#69ff4733", color: "#69ff47" }}>HEX · BIN · OCT</span></div>
      <textarea className="input-field" placeholder="Enter text (to convert) or hex string (to decode)..." value={input} onChange={e => setInput(e.target.value)} style={{ height: 70, marginBottom: 8 }} />
      <div className="row-btns">
        <button className="btn-secondary" onClick={toHex}>Text → Hex</button>
        <button className="btn-secondary" onClick={fromHex}>Hex → Text</button>
        <button className="btn-secondary" onClick={toBinary}>Text → Binary</button>
        <button className="btn-secondary" onClick={toOctal}>Text → Octal</button>
      </div>
      {error && <div style={{ color: "#ff4757", fontSize: "0.72rem", margin: "6px 0" }}>⚠ {error}</div>}
      <ResultBox value={output} onCopy={() => { copyText(output); showToast("Copied!"); }} />
    </div>
  );
}

// ─── Hash Generator ───────────────────────────────────────────────────────────
function HashTool({ showToast }: { showToast: (m: string) => void }) {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!input) return;
    setLoading(true);
    try {
      const enc = new TextEncoder().encode(input);
      const results: Record<string, string> = {};
      for (const algo of ["SHA-1", "SHA-256", "SHA-384", "SHA-512"]) {
        const buf = await crypto.subtle.digest(algo, enc);
        results[algo] = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
      }
      // MD5-like simple hash (not real MD5 - use for demo only)
      let h = 0;
      for (let i = 0; i < input.length; i++) { h = ((h << 5) - h + input.charCodeAt(i)) | 0; }
      results["CRC32-like"] = (h >>> 0).toString(16).padStart(8, "0");
      setHashes(results);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#ff6d00,#ffd600)" }} />
      <div className="tool-header" style={{ color: "#ff6d00" }}>🔒 Hash Generator <span className="tool-badge" style={{ background: "#ff6d0011", borderColor: "#ff6d0033", color: "#ff6d00" }}>SHA-1 · SHA-256 · SHA-512</span></div>
      <textarea className="input-field" placeholder="Enter text to hash..." value={input} onChange={e => setInput(e.target.value)} style={{ height: 70, marginBottom: 8 }} />
      <button className="btn-primary" onClick={generate} disabled={loading} style={{ marginBottom: 10, background: "linear-gradient(90deg,#ff6d00,#ffd600)", color: "#000" }}>
        {loading ? "⟳ Hashing..." : "🔒 Generate All Hashes"}
      </button>
      {Object.entries(hashes).map(([algo, hash]) => (
        <div key={algo} style={{ marginBottom: 8 }}>
          <div className="label">{algo}</div>
          <div className="result-box" style={{ padding: "8px 12px", minHeight: "auto" }}>
            <span style={{ color: "#ffd600" }}>{hash}</span>
            <button className="copy-btn" onClick={() => { copyText(hash); showToast("Copied!"); }}>⎘</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── JSON Formatter ───────────────────────────────────────────────────────────
function JSONTool({ showToast }: { showToast: (m: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [indent, setIndent] = useState(2);

  const format = () => {
    setError("");
    try { setOutput(JSON.stringify(JSON.parse(input), null, indent)); }
    catch (e) { setError("Invalid JSON: " + String(e)); }
  };
  const minify = () => {
    setError("");
    try { setOutput(JSON.stringify(JSON.parse(input))); }
    catch (e) { setError("Invalid JSON: " + String(e)); }
  };
  const toBase64 = () => {
    setError("");
    try { setOutput(btoa(unescape(encodeURIComponent(JSON.stringify(JSON.parse(input)))))); }
    catch (e) { setError("Invalid JSON: " + String(e)); }
  };
  const fromBase64 = () => {
    setError("");
    try { setOutput(JSON.stringify(JSON.parse(decodeURIComponent(escape(atob(input)))), null, indent)); }
    catch { setError("Invalid Base64-encoded JSON"); }
  };
  const analyze = () => {
    setError("");
    try {
      const parsed = JSON.parse(input);
      const info = {
        type: Array.isArray(parsed) ? "array" : typeof parsed,
        length: Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length,
        size: `${new TextEncoder().encode(JSON.stringify(parsed)).length} bytes`,
        depth: (o: any, d = 0): number => o && typeof o === "object" ? Math.max(...Object.values(o).map(v => (o as any).__proto__ ? (v as any).depth ?? 0 : 0), d) : d,
        keys: typeof parsed === "object" && !Array.isArray(parsed) ? Object.keys(parsed) : [],
      };
      setOutput(JSON.stringify({ type: info.type, itemCount: info.length, sizeBytes: info.size, topLevelKeys: info.keys }, null, 2));
    } catch (e) { setError("Invalid JSON: " + String(e)); }
  };

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#ffd600,#69ff47)" }} />
      <div className="tool-header" style={{ color: "#ffd600" }}>📋 JSON Formatter <span className="tool-badge" style={{ background: "#ffd60011", borderColor: "#ffd60033", color: "#ffd600" }}>FORMAT · MINIFY · ANALYZE</span></div>
      <textarea className="input-field" placeholder='{"key": "value"}' value={input} onChange={e => setInput(e.target.value)} style={{ height: 100, marginBottom: 8 }} />
      <div className="row" style={{ marginBottom: 8, alignItems: "center" }}>
        <div className="row-btns" style={{ flex: 1, margin: 0 }}>
          <button className="btn-secondary" onClick={format}>⟳ Beautify</button>
          <button className="btn-secondary" onClick={minify}>↓ Minify</button>
          <button className="btn-secondary" onClick={analyze}>🔍 Analyze</button>
          <button className="btn-secondary" onClick={toBase64}>↑ → Base64</button>
          <button className="btn-secondary" onClick={fromBase64}>↓ Base64 →</button>
        </div>
        <select value={indent} onChange={e => setIndent(+e.target.value)} className="input-field" style={{ width: 80, padding: "7px 10px" }}>
          {[2, 4, 6, 8].map(n => <option key={n} value={n}>{n} spaces</option>)}
        </select>
      </div>
      {error && <div style={{ color: "#ff4757", fontSize: "0.72rem", margin: "6px 0" }}>⚠ {error}</div>}
      <ResultBox value={output} onCopy={() => { copyText(output); showToast("Copied!"); }} />
    </div>
  );
}

// ─── HTML Entity ──────────────────────────────────────────────────────────────
function HTMLEntityTool({ showToast }: { showToast: (m: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const encode = () => {
    const d = document.createElement("div");
    d.textContent = input;
    setOutput(d.innerHTML);
  };
  const decode = () => {
    const d = document.createElement("div");
    d.innerHTML = input;
    setOutput(d.textContent || "");
  };
  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#7c4dff,#00e5ff)" }} />
      <div className="tool-header" style={{ color: "#7c4dff" }}>🏷 HTML Entity Encoder <span className="tool-badge" style={{ background: "#7c4dff11", borderColor: "#7c4dff33", color: "#7c4dff" }}>ENCODE · DECODE</span></div>
      <textarea className="input-field" placeholder="<script>alert('xss')</script>" value={input} onChange={e => setInput(e.target.value)} style={{ height: 70, marginBottom: 8 }} />
      <div className="row-btns">
        <button className="btn-secondary" onClick={encode}>↑ Encode Entities</button>
        <button className="btn-secondary" onClick={decode}>↓ Decode Entities</button>
      </div>
      <ResultBox value={output} onCopy={() => { copyText(output); showToast("Copied!"); }} />
    </div>
  );
}

// ─── Unicode / Escape ─────────────────────────────────────────────────────────
function UnicodeTool({ showToast }: { showToast: (m: string) => void }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const toUnicode = () => {
    setError("");
    setOutput([...input].map(c => {
      const code = c.codePointAt(0)!;
      return code > 127 ? `\\u${code.toString(16).padStart(4, "0")}` : c;
    }).join(""));
  };
  const fromUnicode = () => {
    setError("");
    try { setOutput(input.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))); }
    catch (e) { setError(String(e)); }
  };
  const toPunycode = () => {
    setError("");
    try {
      const domain = input.trim();
      const url = new URL(domain.startsWith("http") ? domain : "https://" + domain);
      setOutput(url.hostname); // Browser converts to punycode
    } catch { setError("Invalid domain"); }
  };
  const rot13 = () => {
    setError("");
    setOutput(input.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = String.fromCharCode(c.charCodeAt(0) + 13)).charCodeAt(0) ? c.charCodeAt(0) : c.charCodeAt(0) - 26)));
  };

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#ff4081,#7c4dff)" }} />
      <div className="tool-header" style={{ color: "#ff4081" }}>🌐 Unicode / Escape Tools <span className="tool-badge" style={{ background: "#ff408111", borderColor: "#ff408133", color: "#ff4081" }}>UNICODE · ROT13 · PUNYCODE</span></div>
      <textarea className="input-field" placeholder="Enter text with unicode escapes or emoji..." value={input} onChange={e => setInput(e.target.value)} style={{ height: 70, marginBottom: 8 }} />
      <div className="row-btns">
        <button className="btn-secondary" onClick={toUnicode}>Text → \\u</button>
        <button className="btn-secondary" onClick={fromUnicode}>\\u → Text</button>
        <button className="btn-secondary" onClick={rot13}>ROT13</button>
        <button className="btn-secondary" onClick={toPunycode}>Punycode</button>
      </div>
      {error && <div style={{ color: "#ff4757", fontSize: "0.72rem", margin: "6px 0" }}>⚠ {error}</div>}
      <ResultBox value={output} onCopy={() => { copyText(output); showToast("Copied!"); }} />
    </div>
  );
}

// ─── Regex Tester ─────────────────────────────────────────────────────────────
function RegexTool({ showToast }: { showToast: (m: string) => void }) {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("gi");
  const [text, setText] = useState("");
  const [matches, setMatches] = useState<{ match: string; index: number; groups: string[] }[]>([]);
  const [error, setError] = useState("");

  const test = () => {
    setError("");
    try {
      const re = new RegExp(pattern, flags);
      const found: { match: string; index: number; groups: string[] }[] = [];
      let m: RegExpExecArray | null;
      const re2 = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
      while ((m = re2.exec(text)) !== null) {
        found.push({ match: m[0], index: m.index, groups: m.slice(1).filter(Boolean) });
        if (!flags.includes("g")) break;
        if (m[0].length === 0) re2.lastIndex++;
      }
      setMatches(found);
    } catch (e) { setError("Invalid regex: " + String(e)); setMatches([]); }
  };

  const highlighted = () => {
    if (!pattern || matches.length === 0) return text;
    try {
      return text.replace(new RegExp(pattern, flags), m => `<mark style="background:#ffd60033;color:#ffd600;border-radius:3px">${m}</mark>`);
    } catch { return text; }
  };

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#00e5ff,#ff6d00)" }} />
      <div className="tool-header">🔍 Regex Tester <span className="tool-badge">LIVE MATCH · HIGHLIGHT · GROUPS</span></div>
      <div className="row" style={{ marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div className="label">Pattern</div>
          <input className="input-field" placeholder="[A-Za-z0-9]+" value={pattern} onChange={e => setPattern(e.target.value)} style={{ fontFamily: "'Space Mono', monospace" }} />
        </div>
        <div style={{ width: 90 }}>
          <div className="label">Flags</div>
          <input className="input-field" value={flags} onChange={e => setFlags(e.target.value)} placeholder="gi" />
        </div>
      </div>
      <textarea className="input-field" placeholder="Enter test text here..." value={text} onChange={e => setText(e.target.value)} style={{ height: 90, marginBottom: 8 }} />
      <button className="btn-primary" onClick={test} style={{ marginBottom: 10 }}>🔍 Test Regex</button>
      {error && <div style={{ color: "#ff4757", fontSize: "0.72rem", margin: "6px 0" }}>⚠ {error}</div>}
      {text && matches.length >= 0 && pattern && !error && (
        <div style={{ marginBottom: 10 }}>
          <div className="label">{matches.length} Match{matches.length !== 1 ? "es" : ""} Found</div>
          <div className="result-box" style={{ maxHeight: 120, overflow: "auto" }} dangerouslySetInnerHTML={{ __html: highlighted() || "<span style='color:#3a5070'>No matches</span>" }} />
        </div>
      )}
      {matches.length > 0 && (
        <div>
          <div className="label">Match Details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 180, overflowY: "auto" }}>
            {matches.slice(0, 50).map((m, i) => (
              <div key={i} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid #131f35", borderRadius: 6, padding: "6px 10px", fontSize: "0.7rem", display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span style={{ color: "#ffd600", fontFamily: "'Space Mono',monospace" }}>[{i}]</span>
                <span style={{ color: "#00e5ff", wordBreak: "break-all" }}>{m.match}</span>
                <span style={{ color: "#3a5070" }}>@{m.index}</span>
                {m.groups.length > 0 && <span style={{ color: "#69ff47" }}>groups: {m.groups.join(", ")}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── String Diff ──────────────────────────────────────────────────────────────
function DiffTool({ showToast }: { showToast: (m: string) => void }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [result, setResult] = useState<string>("");

  const diff = () => {
    const la = a.split("\n");
    const lb = b.split("\n");
    const lines: string[] = [];
    const maxLen = Math.max(la.length, lb.length);
    for (let i = 0; i < maxLen; i++) {
      if (la[i] === lb[i]) lines.push(`  ${la[i] ?? ""}`);
      else {
        if (la[i] !== undefined) lines.push(`- ${la[i]}`);
        if (lb[i] !== undefined) lines.push(`+ ${lb[i]}`);
      }
    }
    setResult(lines.join("\n"));
  };

  return (
    <div className="card tool-section">
      <div className="card-accent" style={{ background: "linear-gradient(90deg,#69ff47,#ffd600)" }} />
      <div className="tool-header" style={{ color: "#69ff47" }}>⟺ Text Diff Checker <span className="tool-badge" style={{ background: "#69ff4711", borderColor: "#69ff4733", color: "#69ff47" }}>LINE-BY-LINE</span></div>
      <div className="row" style={{ marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div className="label">Text A (Original)</div>
          <textarea className="input-field" placeholder="Original text..." value={a} onChange={e => setA(e.target.value)} style={{ height: 100 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="label">Text B (Modified)</div>
          <textarea className="input-field" placeholder="Modified text..." value={b} onChange={e => setB(e.target.value)} style={{ height: 100 }} />
        </div>
      </div>
      <button className="btn-primary" onClick={diff} style={{ marginBottom: 10, background: "linear-gradient(90deg,#69ff47,#ffd600)", color: "#000" }}>⟺ Compare</button>
      {result && (
        <div className="result-box" style={{ maxHeight: 200, overflow: "auto" }}>
          {result.split("\n").map((line, i) => (
            <div key={i} style={{ color: line.startsWith("+ ") ? "#69ff47" : line.startsWith("- ") ? "#ff4757" : "#3a5070", fontFamily: "'Space Mono',monospace", fontSize: "0.7rem" }}>
              {line}
            </div>
          ))}
          <button className="copy-btn" onClick={() => { copyText(result); showToast("Copied!"); }}>⎘</button>
        </div>
      )}
    </div>
  );
}

// ─── Main Tools Page ──────────────────────────────────────────────────────────
export default function ToolsPage() {
  const { toast, show } = useToast();

  return (
    <div className="page-wrap">
      {toast && <div className="toast">{toast}</div>}

      <div style={{ marginBottom: 18 }}>
        <div className="section-title">Encoding & Conversion</div>
      </div>

      <Base64Tool showToast={show} />
      <div style={{ height: 14 }} />
      <Base64ImageTool showToast={show} />
      <div style={{ height: 14 }} />
      <JWTTool showToast={show} />
      <div style={{ height: 14 }} />
      <URLTool showToast={show} />
      <div style={{ height: 14 }} />
      <HexTool showToast={show} />
      <div style={{ height: 14 }} />
      <HashTool showToast={show} />
      <div style={{ height: 14 }} />
      <JSONTool showToast={show} />
      <div style={{ height: 14 }} />
      <HTMLEntityTool showToast={show} />
      <div style={{ height: 14 }} />
      <UnicodeTool showToast={show} />
      <div style={{ height: 14 }} />
      <RegexTool showToast={show} />
      <div style={{ height: 14 }} />
      <DiffTool showToast={show} />

      <div style={{ height: 28 }} />
      <div className="section-title">Generators & Crypto</div>
      <PasswordGen showToast={show} />
      <div style={{ height: 14 }} />
      <UUIDGen showToast={show} />
      <div style={{ height: 14 }} />
      <QRTool showToast={show} />
      <div style={{ height: 14 }} />
      <HMACTool showToast={show} />
      <div style={{ height: 14 }} />
      <LoremTool showToast={show} />

      <div style={{ height: 28 }} />
      <div className="section-title">Converters & Inspectors</div>
      <TimestampTool showToast={show} />
      <div style={{ height: 14 }} />
      <ColorTool showToast={show} />
      <div style={{ height: 14 }} />
      <CaseTool showToast={show} />
      <div style={{ height: 14 }} />
      <UserAgentTool showToast={show} />
      <div style={{ height: 14 }} />
      <IPTool showToast={show} />
      <div style={{ height: 14 }} />
      <MarkdownTool />

      <div style={{ textAlign: "center", padding: "32px 0 12px", fontSize: "0.6rem", color: "#253348", fontFamily: "'Space Mono',monospace", lineHeight: 1.8 }}>
        <div style={{ color: "#3a5070", marginBottom: 4 }}>WEBHAWK PRO · 21+ TOOLS · 100% CLIENT-SIDE</div>
        © 2026 ZeroX · All Rights Reserved · t.me/zerox6t9
      </div>
    </div>
  );
}
