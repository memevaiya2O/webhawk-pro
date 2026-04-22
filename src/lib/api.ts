const BASE = import.meta.env.VITE_BACKEND_URL || "";

export async function startScan(url: string, depth: number, threads: number) {
  const r = await fetch(`${BASE}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, depth, threads }),
  });
  return r.json();
}

export function openScanStream(scanId: string) {
  return new EventSource(`${BASE}/stream/${scanId}`);
}

export async function getResult(scanId: string) {
  const r = await fetch(`${BASE}/result/${scanId}`);
  return r.json();
}

export function downloadReport(scanId: string, fmt: "json" | "txt") {
  window.open(`${BASE}/download/${scanId}/${fmt}`, "_blank");
}

export async function startNetwork(url: string) {
  const r = await fetch(`${BASE}/network/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return r.json();
}

export function openNetworkStream(sessionId: string) {
  return new EventSource(`${BASE}/network/stream/${sessionId}`);
}

export function getProxyUrl(url: string, sessionId?: string) {
  const params = new URLSearchParams({ url });
  if (sessionId) params.set("session", sessionId);
  return `${BASE}/proxy?${params}`;
}
