<div align="center">

# 🦅 WEBHAWK PRO

### **The Premium All-In-One Web Reconnaissance & Security Toolkit**

> *Engineered for the modern security professional. Built for speed, designed for power.*

---

[![License: PROPRIETARY](https://img.shields.io/badge/License-PROPRIETARY-ff4081?style=for-the-badge&logo=lock&logoColor=white)](LICENSE)
[![Status](https://img.shields.io/badge/Status-ACTIVE-69ff47?style=for-the-badge&logo=statuspage&logoColor=white)]()
[![Version](https://img.shields.io/badge/Version-2.0.0-00e5ff?style=for-the-badge&logo=semver&logoColor=white)]()
[![Mobile](https://img.shields.io/badge/Mobile-First-7c4dff?style=for-the-badge&logo=android&logoColor=white)]()
[![Render](https://img.shields.io/badge/Deploy-RENDER-46e3b7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)

[![Node](https://img.shields.io/badge/Node.js-24+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

---

```
██╗    ██╗███████╗██████╗ ██╗  ██╗ █████╗ ██╗    ██╗██╗  ██╗
██║    ██║██╔════╝██╔══██╗██║  ██║██╔══██╗██║    ██║██║ ██╔╝
██║ █╗ ██║█████╗  ██████╔╝███████║███████║██║ █╗ ██║█████╔╝ 
██║███╗██║██╔══╝  ██╔══██╗██╔══██║██╔══██║██║███╗██║██╔═██╗ 
╚███╔███╔╝███████╗██████╔╝██║  ██║██║  ██║╚███╔███╔╝██║  ██╗
 ╚══╝╚══╝ ╚══════╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝
                          ★ PRO EDITION ★
```

---

</div>

## 🌌 OVERVIEW

**WebHawk Pro** is a premium, mobile-first, browser-native web reconnaissance and security toolkit that consolidates the firepower of dozens of standalone tools into one beautifully crafted, lightning-fast application. Built from the ground up to feel like the future of security tooling — with a minimalist neon dark-mode UI, real-time streaming results, and zero compromises.

> Whether you're a bug-bounty hunter sweeping for exposed secrets, a penetration tester mapping attack surface, or a developer debugging your own production endpoints — **WebHawk Pro** gives you the entire arsenal in your pocket.

---

## ⚡ THREE PRECISION MODULES

<table>
<tr>
<td width="33%" align="center" valign="top">

### 🔍 **SCANNER**
*Deep Web Reconnaissance*

9-step intelligence pipeline that uncovers everything an endpoint exposes — APIs, secrets, forms, JS files, CORS misconfigurations, GraphQL endpoints, OpenAPI schemas, and far more. Live SSE-streamed results with category filtering and downloadable reports.

</td>
<td width="33%" align="center" valign="top">

### 📡 **NETWORK MONITOR**
*DevTools-Style Live Capture*

A full-blown browser DevTools experience inside your phone. Embedded proxied browser pane on one side, live network waterfall on the other. Inspect every request, response header, timing breakdown, and payload as the target site loads.

</td>
<td width="33%" align="center" valign="top">

### 🛠 **TOOLS**
*21+ Premium Utilities*

Twenty-one curated power-tools every security professional needs. Base64, JWT, hash generators, regex tester, color converter, QR generator, password generator, IP/CIDR calculator, and more — all client-side, all instantaneous.

</td>
</tr>
</table>

---

## 🎯 SCANNER FEATURES

The Scanner module runs a **9-stage deep reconnaissance pipeline** with live SSE streaming:

| # | Stage | What It Does |
|---|---|---|
| 1 | **Headers** | Captures all response headers, security headers (CSP, HSTS, X-Frame-Options), powered-by signatures |
| 2 | **Robots & Sitemap** | Parses `robots.txt`, all sitemaps, discovers hidden paths |
| 3 | **HTML Crawl** | Multi-depth crawl extracting every link, form, hidden input, comment, and meta tag |
| 4 | **JavaScript Analysis** | Downloads and analyzes every JS file (up to 6MB each) for endpoints, secrets, env vars, source maps |
| 5 | **Path Probing** | Probes 100+ common paths (`/api`, `/admin`, `/.env`, `/swagger.json`, `/.git/config`, etc.) |
| 6 | **GraphQL Discovery** | Detects GraphQL endpoints, runs introspection queries, extracts operation names |
| 7 | **OpenAPI/Swagger** | Locates and parses Swagger/OpenAPI specs to enumerate every documented endpoint |
| 8 | **Authentication Discovery** | Probes OIDC discovery, OAuth endpoints, login flows |
| 9 | **Security Audit** | Tests CORS misconfigurations, exposed Firebase configs, internal IP leakage, secret patterns |

### 🔐 30+ Secret Detection Patterns

> AWS Access Keys · GCP Service Accounts · Stripe Keys · GitHub Tokens · JWT Tokens · Slack Webhooks · SendGrid API Keys · Mailgun · Twilio · Heroku · Firebase · Square · Mailchimp · PayPal · Discord Tokens · npm Tokens · DigitalOcean · Algolia · Cloudinary · OpenAI · and many more.

---

## 🛠 THE 21+ TOOLS ARSENAL

<table>
<tr><th width="25%">Encoding</th><th width="25%">Cryptography</th><th width="25%">Generators</th><th width="25%">Utilities</th></tr>
<tr valign="top">
<td>

- 🔐 Base64 (URL-safe + auto-detect)
- 🖼 Base64 Image Viewer
- 🔗 URL Encoder / Parser
- ⬡ Hex / Binary / Octal
- 🌐 Unicode / ROT13 / Punycode
- 🏷 HTML Entity

</td>
<td>

- 🔑 JWT Decoder (with expiry)
- 🔒 Hash Generator (SHA-1/256/384/512)
- 🔏 HMAC Generator (SHA family)

</td>
<td>

- 🔐 Password Generator (crypto-random)
- 🆔 UUID Generator (v4)
- 📱 QR Code Generator (custom colors)
- 📝 Lorem Ipsum Generator

</td>
<td>

- 📋 JSON Formatter (analyze + minify)
- 🔍 Regex Tester (live highlight)
- ⟺ Text Diff Checker
- ⏱ Timestamp / Epoch Converter
- 🎨 Color Converter (HEX/RGB/HSL/CMYK)
- Aa String Case Converter (13 cases)
- 🌐 User-Agent Parser
- 📡 IP / CIDR Calculator
- 📄 Markdown Live Preview

</td>
</tr>
</table>

---

## 💎 PREMIUM DESIGN PHILOSOPHY

```
✦ MOBILE-FIRST           — bottom navigation bar, touch-optimized, every pixel responsive
✦ DARK FUTURISTIC        — neon cyan/green/purple on jet-black, Space Grotesk + Space Mono
✦ ZERO LATENCY           — all utilities run 100% client-side, zero round trips
✦ LIVE STREAMING         — Scanner & Network use Server-Sent Events for real-time updates
✦ COPY-EVERYWHERE        — every result tap-to-copy with elegant toast feedback
✦ SAFE-AREA AWARE        — respects iPhone notch, Android navigation gestures
```

---

## 🚀 DEPLOYMENT — RENDER (FROM A → Z)

### Option 1: One-Click Blueprint (Recommended)

1. Fork this repo to your own GitHub.
2. Go to [render.com](https://render.com) → **New** → **Blueprint**.
3. Connect your forked repo. Render will auto-detect the included `render.yaml`.
4. Click **Apply** — Render builds and deploys automatically.

### Option 2: Manual Web Service

1. Go to [Render Dashboard](https://dashboard.render.com) → **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure:

| Field | Value |
|---|---|
| **Environment** | Node |
| **Region** | Singapore (or closest) |
| **Branch** | `main` |
| **Root Directory** | *(leave empty)* |
| **Build Command** | `npm install -g pnpm && pnpm install && cd artifacts/api-hunter && BASE_PATH=/ PORT=3000 pnpm build && cd backend && pnpm install` |
| **Start Command** | `cd artifacts/api-hunter/backend && node server.js` |
| **Instance Type** | Free (or higher for sustained traffic) |

4. Add Environment Variables:
   - `NODE_ENV` = `production`

5. Click **Create Web Service**. First build takes ~3–5 minutes. Subsequent deploys ~60 seconds.

### Option 3: Docker (Advanced)

A Dockerfile-based deployment is ready to add — open an issue on the official repo if you need an official image.

---

## 🖥 LOCAL DEVELOPMENT

### Prerequisites
- Node.js **24+**
- pnpm **10+**

### Setup

```bash
# clone (you must be authorized)
git clone <your-fork-url>
cd webhawk-pro

# install all workspaces
pnpm install

# install backend deps
cd artifacts/api-hunter/backend && pnpm install && cd ../../..

# in terminal 1 — start backend on :5555
cd artifacts/api-hunter/backend && BACKEND_PORT=5555 node server.js

# in terminal 2 — start frontend dev server
pnpm --filter @workspace/api-hunter run dev
```

### Production Build & Run

```bash
cd artifacts/api-hunter && BASE_PATH=/ PORT=3000 pnpm build
cd backend && PORT=3000 node server.js
# → open http://localhost:3000
```

---

## 📂 PROJECT ARCHITECTURE

```
webhawk-pro/
├── artifacts/
│   └── api-hunter/                      WebHawk Pro main artifact
│       ├── src/
│       │   ├── App.tsx                  Mobile-first shell + bottom nav
│       │   ├── pages/
│       │   │   ├── ScannerPage.tsx      Deep recon scanner UI
│       │   │   ├── NetworkMonitorPage.tsx   DevTools-style network monitor
│       │   │   ├── ToolsPage.tsx        Encoding/crypto/JSON tools
│       │   │   └── ToolsExtras.tsx      Generators, color, QR, IP, etc.
│       │   └── lib/
│       │       └── api.ts               REST + SSE client
│       └── backend/
│           ├── server.js                Node.js Express backend
│           └── package.json             Backend dependencies
│
├── render.yaml                          Render Blueprint config
├── LICENSE                              Strict proprietary license
├── README.md                            ← you are here
└── .gitignore
```

---

## 🔒 LICENSE & LEGAL

This project is released under a **strict proprietary license**. See [LICENSE](LICENSE) for the complete terms.

> ⚠️ **You may NOT** edit, modify, redistribute, fork, mirror, download, or commercialize this software. All rights are reserved by the owner. Unauthorized use is a copyright violation under international law.

For commercial licensing or partnership inquiries, contact the owner directly through the official channels listed below.

---

<div align="center">

## 👤 OWNER & SOLE COPYRIGHT HOLDER

<table>
<tr>
<td align="center">

### **ZeroX**
*Founder · Architect · Sole Owner*

[![Telegram](https://img.shields.io/badge/Telegram-@zerox6t9-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/zerox6t9)
[![Mobile](https://img.shields.io/badge/WhatsApp-+8801650194635-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/8801650194635)
[![GitHub](https://img.shields.io/badge/GitHub-memevaiya2O-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/memevaiya2O)

**📞 +880 1650 194635**
**🚀 [t.me/zerox6t9](https://t.me/zerox6t9)**

</td>
</tr>
</table>

---

### ⚠️ ETHICAL USE NOTICE

> **WebHawk Pro is intended for ethical security research and authorized penetration testing only.**
> Use against systems you do not own or are not explicitly authorized to test may violate laws including but not limited to the Computer Misuse Act, the CFAA, and the Bangladesh Information & Communication Technology Act.
> *The user assumes full responsibility for ensuring lawful, authorized use.*

---

<sub>**© 2026 ZeroX. All rights reserved.** · WebHawk and WebHawk Pro are unregistered trademarks of ZeroX.</sub>

</div>
