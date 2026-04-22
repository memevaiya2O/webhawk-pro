const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5555;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const SCANS = new Map();
const NETWORK_SESSIONS = new Map();

const TIMEOUT = 14000;
const MAX_JS = 6 * 1024 * 1024;

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

const PROBE_PATHS = [
  '/api','/api/v1','/api/v2','/api/v3','/v1','/v2','/v3',
  '/rest','/graphql','/gql','/api/graphql',
  '/swagger','/swagger.json','/swagger/v1/swagger.json',
  '/openapi.json','/openapi.yaml','/api-docs','/api-docs.json',
  '/health','/healthz','/status','/ping','/ready','/metrics',
  '/api/health','/api/status','/api/me','/api/auth','/api/login',
  '/api/token','/api/refresh','/api/users','/api/search',
  '/api/config','/api/version','/version',
  '/robots.txt','/sitemap.xml','/sitemap_index.xml',
  '/.env','/.env.local','/.env.production','/.env.development',
  '/config.json','/appsettings.json','/settings.json','/app.json',
  '/wp-json','/wp-json/wp/v2','/.git/config','/web.config',
  '/.well-known/security.txt','/.well-known/openid-configuration',
  '/auth','/auth/callback','/oauth/token','/oauth2/token',
  '/admin','/admin/api','/dashboard','/console',
  '/api/admin','/api/settings','/api/keys',
  '/api/internal','/internal/api','/private/api',
  '/debug','/trace','/actuator','/actuator/health',
  '/actuator/env','/actuator/beans','/actuator/mappings',
  '/package.json','/composer.json','/Gemfile',
  '/api/swagger','/api/swagger-ui','/api/openapi',
  '/api/docs','/docs','/documentation',
  '/api/user','/api/profile','/api/account','/api/data',
  '/api/products','/api/orders','/api/payments',
  '/api/webhook','/api/webhooks','/api/callback',
  '/api/upload','/api/files','/api/media',
  '/api/report','/api/analytics','/api/stats',
  '/api/notifications','/api/messages','/api/events',
  '/server-status','/server-info','/_ah/health','/healthcheck',
  '/api/healthcheck','/status.json','/build.json','/__version__',
];

const SECRET_PATTERNS = [
  [/(?:api[_\-]?key|apikey)\s*[=:]\s*["']?([A-Za-z0-9_\-]{20,})/gi, 'API Key'],
  [/(?:secret|token)\s*[=:]\s*["']?([A-Za-z0-9_\-\.]{20,})/gi, 'Secret/Token'],
  [/(?:password|passwd|pwd)\s*[=:]\s*["']([^"'<>\s]{6,})/gi, 'Password'],
  [/eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g, 'JWT Token'],
  [/(?:aws_access_key_id|aws_key)\s*[=:]\s*["']?([A-Z0-9]{20})/gi, 'AWS Access Key'],
  [/(?:aws_secret_access_key)\s*[=:]\s*["']?([A-Za-z0-9/+=]{40})/gi, 'AWS Secret Key'],
  [/AKIA[0-9A-Z]{16}/g, 'AWS Key ID'],
  [/(?:github_token|gh_token|github_pat)\s*[=:]\s*["']?([A-Za-z0-9_]{40,})/gi, 'GitHub Token'],
  [/ghp_[A-Za-z0-9]{36}/g, 'GitHub PAT'],
  [/gho_[A-Za-z0-9]{36}/g, 'GitHub OAuth Token'],
  [/ghs_[A-Za-z0-9]{36}/g, 'GitHub Server Token'],
  [/sk_(?:live|test)_[A-Za-z0-9]{24,}/g, 'Stripe Secret Key'],
  [/pk_(?:live|test)_[A-Za-z0-9]{24,}/g, 'Stripe Public Key'],
  [/AIza[0-9A-Za-z\-_]{35}/g, 'Google API Key'],
  [/-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g, 'Private Key'],
  [/-----BEGIN CERTIFICATE-----/g, 'Certificate'],
  [/xox[bpaso]-[A-Za-z0-9\-]{10,}/g, 'Slack Token'],
  [/SG\.[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}/g, 'SendGrid Key'],
  [/mongodb(?:\+srv)?:\/\/[^\s"'<>]{10,}/g, 'MongoDB URL'],
  [/postgres(?:ql)?:\/\/[^\s"'<>]{10,}/g, 'PostgreSQL URL'],
  [/mysql:\/\/[^\s"'<>]{10,}/g, 'MySQL URL'],
  [/(?:client_secret|clientSecret)\s*[=:]\s*["']?([A-Za-z0-9_\-]{20,})/gi, 'OAuth Client Secret'],
  [/(?:access_token|accessToken)\s*[=:]\s*["']?([A-Za-z0-9_\-\.]{20,})/gi, 'Access Token'],
  [/(?:refresh_token|refreshToken)\s*[=:]\s*["']?([A-Za-z0-9_\-\.]{20,})/gi, 'Refresh Token'],
  [/(?:private_key|privateKey)\s*[=:]\s*["']?([A-Za-z0-9+/=]{40,})/gi, 'Private Key Material'],
  [/(?:consumer_key|consumerKey)\s*[=:]\s*["']?([A-Za-z0-9_\-]{20,})/gi, 'OAuth Consumer Key'],
  [/(?:app_secret|appSecret)\s*[=:]\s*["']?([A-Za-z0-9_\-]{20,})/gi, 'App Secret'],
  [/(?:webhook_secret|webhookSecret)\s*[=:]\s*["']?([A-Za-z0-9_\-]{20,})/gi, 'Webhook Secret'],
  [/sq0csp-[A-Za-z0-9_\-]{43}/g, 'Square Secret Key'],
  [/AC[a-f0-9]{32}/g, 'Twilio Account SID'],
  [/SK[a-f0-9]{32}/g, 'Twilio Auth Token'],
];

const TECH_MAP = {
  '__next': 'Next.js', '__nuxt': 'Nuxt.js', 'react': 'React', 'angular': 'Angular',
  'vue': 'Vue.js', 'svelte': 'Svelte', 'gatsby': 'Gatsby', 'wordpress': 'WordPress',
  'wp-content': 'WordPress', 'shopify': 'Shopify', 'graphql': 'GraphQL',
  'apollo': 'Apollo GraphQL', 'swagger': 'Swagger', 'firebase': 'Firebase',
  'supabase': 'Supabase', 'stripe': 'Stripe', 'sentry': 'Sentry',
  'posthog': 'PostHog', 'cloudflare': 'Cloudflare', 'vercel': 'Vercel',
  'netlify': 'Netlify', 'laravel': 'Laravel', 'django': 'Django',
  'rails': 'Ruby on Rails', 'spring': 'Spring', 'fastapi': 'FastAPI',
  'express': 'Express.js', 'remix': 'Remix', 'astro': 'Astro',
  'nuxt': 'Nuxt.js', 'tailwind': 'Tailwind CSS', 'bootstrap': 'Bootstrap',
  'jquery': 'jQuery', 'webpack': 'Webpack', 'vite': 'Vite',
  'contentful': 'Contentful', 'sanity': 'Sanity', 'prisma': 'Prisma',
  'auth0': 'Auth0', 'okta': 'Okta', 'clerk': 'Clerk', 'nextauth': 'NextAuth',
  'amplify': 'AWS Amplify', 'cognito': 'AWS Cognito', 'heroku': 'Heroku',
  'mongodb': 'MongoDB', 'redis': 'Redis', 'elasticsearch': 'Elasticsearch',
  'socket.io': 'Socket.IO', 'pusher': 'Pusher', 'ably': 'Ably',
  'intercom': 'Intercom', 'hubspot': 'HubSpot', 'zendesk': 'Zendesk',
  'datadog': 'Datadog', 'newrelic': 'New Relic', 'amplitude': 'Amplitude',
  'segment': 'Segment', 'mixpanel': 'Mixpanel', 'hotjar': 'Hotjar',
};

const NOISE_EXT = /\.(png|jpg|jpeg|gif|ico|webp|mp4|mp3|woff2?|ttf|eot|otf|pdf|zip|svg)(\?|$)/i;
const ALL_URL_RE = /(?:https?:|wss?:)\/\/[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=%]{8,500}/g;
const RELATIVE_RE = /(?:fetch|axios|http\.(?:get|post|put|delete|patch)|(?:url|src|href|endpoint|api|path|route)\s*[=:]+\s*)\s*[`'"](\/((?!\/)[^`'"<>\s]{2,300}))[`'"]/gi;
const JS_CALL_RE = /(?:fetch|axios\.(?:get|post|put|delete|patch|request)|\$\.(?:get|post|ajax|getJSON)|\.open\s*\(\s*['"](?:GET|POST|PUT|DELETE|PATCH)['"],|http\.(?:get|post|put|delete|patch))\s*\(?\s*[`'"](\/[^`'"<>\s]{4,400})[`'"]/gi;
const ENV_VAR_RE = /process\.env\.([A-Z_][A-Z0-9_]{2,})/gi;
const GQL_OP_RE = /(?:query|mutation|subscription)\s+([A-Z][A-Za-z0-9_]+)\s*[\({]/gi;
const INTERNAL_IP_RE = /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|127\.\d+\.\d+\.\d+)\b/g;
const SOURCEMAP_RE = /sourceMappingURL=([^\s]+\.map)/g;

function categorize(url) {
  const u = url.toLowerCase();
  if (u.startsWith('ws://') || u.startsWith('wss://')) return 'WebSocket';
  if (/\/graph(?:ql)?|\/gql/.test(u)) return 'GraphQL';
  if (/\/api\/|\/v[1-9]\/|\/rest\/|\/rpc/.test(u)) return 'API';
  if (/\/auth\/|\/oauth|\/token|\/login|\/logout|\/signup|\/session|\/password|\/sso/.test(u)) return 'Auth';
  if (/\/ws\/|\/socket\.io|\/realtime|\/sse|\/events\/|\/stream|\/push|\/subscribe/.test(u)) return 'Realtime';
  if (/cdn\.|jsdelivr|unpkg\.com|cdnjs|fastly|cloudfront|akamai|\/static\/|\/assets\/|\/dist\/|\/build\//.test(u)) return 'CDN/Asset';
  if (/\/admin|\/console|\/dashboard|\/internal|\/private|\/management|\/backoffice/.test(u)) return 'Admin';
  if (/\/\.env|\/\.git|\/config|\/secret|\/credential|\/passwd|\/\.well-known/.test(u)) return 'Sensitive';
  if (NOISE_EXT.test(u)) return 'Asset';
  if (u.startsWith('http')) return 'External';
  return 'Path';
}

function normalizeUrl(base, path) {
  if (/^(?:https?|wss?):\/\//.test(path)) return path;
  try { return new URL(path, base).href; } catch { return null; }
}

function sameDomain(u1, u2) {
  try { return new URL(u1).hostname === new URL(u2).hostname; } catch { return false; }
}

function cleanUrl(url) {
  return url.replace(/\/+$/, '').split('?')[0].split('#')[0];
}

function okUrl(url) {
  if (!url || url.length < 5) return false;
  return !['javascript:', 'data:', 'blob:', 'mailto:', 'tel:', 'void(', '#'].some(b => url.startsWith(b));
}

async function safeGet(url, http) {
  try {
    return await http.get(url);
  } catch (e) {
    return e.response || null;
  }
}

function extractUrls(text, base) {
  const found = new Set();
  let m;
  const re1 = new RegExp(ALL_URL_RE.source, ALL_URL_RE.flags);
  while ((m = re1.exec(text)) !== null) {
    const u = m[0].replace(/["',;)>\s]+$/, '');
    if (okUrl(u)) found.add(u);
  }
  const re2 = new RegExp(RELATIVE_RE.source, RELATIVE_RE.flags);
  while ((m = re2.exec(text)) !== null) {
    const p = m[1];
    if (okUrl(p)) { const f = normalizeUrl(base, p); if (f) found.add(f); }
  }
  const re3 = new RegExp(JS_CALL_RE.source, JS_CALL_RE.flags);
  while ((m = re3.exec(text)) !== null) {
    const p = m[1];
    if (okUrl(p)) { const f = normalizeUrl(base, p); if (f) found.add(f); }
  }
  return [...found];
}

function extractSecrets(text, source) {
  const found = [];
  const seen = new Set();
  for (const [pattern, label] of SECRET_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m;
    while ((m = re.exec(text)) !== null) {
      let val = m[0];
      if (val.length > 500) val = val.slice(0, 500);
      const key = crypto.createHash('md5').update(val).digest('hex');
      if (!seen.has(key)) { seen.add(key); found.push({ type: label, value: val, source }); }
    }
  }
  return found;
}

async function limitedMap(arr, fn, concurrency = 10) {
  let i = 0;
  async function worker() {
    while (i < arr.length) { const idx = i++; await fn(arr[idx]); }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, arr.length) }, worker));
}

class Scan {
  constructor(sid, target, depth, threads) {
    this.sid = sid; this.target = target; this.depth = depth; this.threads = threads;
    this.listeners = []; this.items = []; this.keys = new Set();
    this.secrets = []; this.secretKeys = new Set();
    this.js = []; this.pages = []; this.tech = new Set();
    this.headers = {}; this.cookies = {};
    this.envVars = new Set(); this.graphqlOps = new Set();
    this.sourcemaps = new Set(); this.internalIps = new Set();
    this.corsMisconfig = new Set(); this.firebaseConfigs = new Set();
    this.forms = []; this.links = []; this.metaTags = [];
    this.hiddenInputs = []; this.comments = [];
    this.done = false; this.t0 = Date.now();
  }

  push(event, data = {}) {
    const msg = `data: ${JSON.stringify({ event, data })}\n\n`;
    this.listeners.forEach(res => { try { res.write(msg); } catch {} });
  }

  addListener(res) {
    this.listeners.push(res);
    this.items.forEach(item => { try { res.write(`data: ${JSON.stringify({ event: 'item', data: item })}\n\n`); } catch {}; });
    this.secrets.forEach(s => { try { res.write(`data: ${JSON.stringify({ event: 'secret', data: s })}\n\n`); } catch {}; });
  }

  add(url, method = '–', cat = null, source = '', status = null, auth = false, preview = '', contentType = '', locked = false) {
    url = url.replace(/["',;)]+$/, '').trim();
    if (!url || url.length < 5) return;
    cat = cat || categorize(url);
    const key = `${method}:${url}`;
    if (this.keys.has(key)) return;
    this.keys.add(key);
    const item = { url, method, cat, source, status, auth, preview, content_type: contentType, locked };
    this.items.push(item);
    this.push('item', item);
  }

  addSecret(type, value, source) {
    const key = crypto.createHash('md5').update(`${type}:${value}`).digest('hex');
    if (this.secretKeys.has(key)) return;
    this.secretKeys.add(key);
    const s = { type, value, source };
    this.secrets.push(s);
    this.push('secret', s);
  }

  processIntel(text, source) {
    let m;
    const re1 = new RegExp(ENV_VAR_RE.source, ENV_VAR_RE.flags);
    while ((m = re1.exec(text)) !== null) this.envVars.add(m[1]);
    const re2 = new RegExp(GQL_OP_RE.source, GQL_OP_RE.flags);
    while ((m = re2.exec(text)) !== null) this.graphqlOps.add(m[1]);
    const re3 = new RegExp(INTERNAL_IP_RE.source, INTERNAL_IP_RE.flags);
    while ((m = re3.exec(text)) !== null) this.internalIps.add(m[0]);
    const re4 = new RegExp(SOURCEMAP_RE.source, SOURCEMAP_RE.flags);
    while ((m = re4.exec(text)) !== null) this.sourcemaps.add(m[1]);
    if (/initializeApp\s*\(\s*\{[^}]+apiKey/i.test(text)) {
      const fm = text.match(/initializeApp\s*\(\s*(\{[^}]+\})/s);
      if (fm) this.firebaseConfigs.add(fm[1].slice(0, 500));
    }
    extractSecrets(text, source).forEach(s => this.addSecret(s.type, s.value, s.source));
  }
}

async function runScan(scan) {
  const parsed = new URL(scan.target);
  const root = `${parsed.protocol}//${parsed.host}`;
  const http = axios.create({
    headers: DEFAULT_HEADERS, timeout: TIMEOUT,
    validateStatus: () => true, maxRedirects: 5,
  });

  // Step 1
  scan.push('step', { n: 1, label: 'Headers & tech stack' });
  let mainRes = await safeGet(scan.target, http);
  if (!mainRes) {
    scan.push('log', { t: 'e', msg: 'Cannot reach target' });
    scan.done = true; scan.push('done', {}); return;
  }

  scan.headers = mainRes.headers;
  const elapsed0 = ((Date.now() - scan.t0) / 1000).toFixed(2);
  const size = JSON.stringify(mainRes.data || '').length;
  scan.push('log', { t: 'i', msg: `HTTP ${mainRes.status} · ${size}B · ${elapsed0}s` });

  for (const k of ['server','x-powered-by','x-framework','x-generator','x-runtime','x-backend','x-aspnet-version','x-aspnetmvc-version']) {
    const v = mainRes.headers[k];
    if (v) { scan.tech.add(`${k}: ${v}`); scan.push('log', { t: 't', msg: `${k}: ${v}` }); }
  }

  const cors = mainRes.headers['access-control-allow-origin'];
  if (cors) { scan.tech.add(`CORS: ${cors}`); scan.push('log', { t: 't', msg: `CORS: ${cors}` }); }

  // Security headers check
  const secHeaders = ['strict-transport-security','content-security-policy','x-frame-options','x-content-type-options','referrer-policy','permissions-policy'];
  const missing = secHeaders.filter(h => !mainRes.headers[h]);
  if (missing.length > 0) scan.push('log', { t: 'w', msg: `Missing security headers: ${missing.join(', ')}` });

  const setCookie = mainRes.headers['set-cookie'];
  if (setCookie) {
    for (const c of (Array.isArray(setCookie) ? setCookie : [setCookie])) {
      const name = c.split('=')[0].trim();
      scan.cookies[name] = { secure: /secure/i.test(c), httponly: /httponly/i.test(c), samesite: c.match(/samesite=([^;]+)/i)?.[1] || '', domain: c.match(/domain=([^;]+)/i)?.[1] || parsed.hostname };
    }
  }

  const csp = mainRes.headers['content-security-policy'] || '';
  for (const u of csp.matchAll(/https?:\/\/[^\s;'"]+/g)) scan.add(u[0], '–', 'External', 'CSP header');

  // Step 2
  scan.push('step', { n: 2, label: 'robots.txt / sitemap / security.txt' });
  for (const path of ['/robots.txt', '/sitemap.xml', '/sitemap_index.xml', '/.well-known/security.txt', '/humans.txt']) {
    const rr = await safeGet(root + path, http);
    if (!rr || rr.status !== 200) continue;
    scan.push('log', { t: 'f', msg: `Found ${path}` });
    const text = typeof rr.data === 'string' ? rr.data : JSON.stringify(rr.data);
    if (path.includes('robots')) {
      for (const line of text.split('\n')) {
        if (line.includes(':')) {
          const val = line.split(':').slice(1).join(':').trim();
          if (val && okUrl(val)) scan.add(normalizeUrl(root, val) || val, '–', null, 'robots.txt');
        }
      }
    } else if (path.includes('sitemap')) {
      for (const m of text.matchAll(/<loc>([^<]+)<\/loc>/g)) scan.add(m[1].trim(), '–', null, 'sitemap.xml');
    } else if (path.includes('security.txt')) {
      for (const line of text.split('\n')) {
        if (line.startsWith('Contact:') || line.startsWith('Policy:')) {
          const val = line.split(':').slice(1).join(':').trim();
          if (val) scan.push('log', { t: 'k', msg: `security.txt: ${line.trim()}` });
        }
      }
    }
  }

  // Step 3
  scan.push('step', { n: 3, label: 'Crawling pages & extracting all data' });
  const visited = new Set();
  const toVisit = [[scan.target, 0]];
  const jsSet = new Set();

  while (toVisit.length > 0 && visited.size < 80) {
    const [url, depth] = toVisit.shift();
    const cUrl = cleanUrl(url);
    if (visited.has(cUrl) || depth > scan.depth) continue;
    visited.add(cUrl);
    let rr;
    try { rr = await http.get(url); } catch { continue; }
    if (!rr) continue;
    const ct = rr.headers['content-type'] || '';
    if (!ct.includes('html')) continue;
    scan.pages.push(url);
    scan.push('log', { t: 'p', msg: url });

    const html = typeof rr.data === 'string' ? rr.data : '';
    const lower = html.toLowerCase();
    const $ = cheerio.load(html);

    for (const [key, name] of Object.entries(TECH_MAP)) {
      if (lower.includes(key) && !scan.tech.has(name)) { scan.tech.add(name); scan.push('log', { t: 't', msg: name }); }
    }

    scan.processIntel(html, `page:${url}`);

    // Meta tags
    $('meta').each((_, el) => {
      const name = $(el).attr('name') || $(el).attr('property') || '';
      const content = $(el).attr('content') || '';
      if (name && content) {
        scan.metaTags.push({ name, content, source: url });
        if (content.startsWith('http') && okUrl(content)) scan.add(content, '–', 'External', `meta:${name}`);
      }
    });

    // Link tags
    $('link[href]').each((_, el) => {
      const href = $(el).attr('href');
      const rel = $(el).attr('rel') || '';
      if (href && okUrl(href)) {
        const full = normalizeUrl(url, href);
        if (full) { scan.add(full, '–', null, `HTML <link rel="${rel}">`); scan.links.push({ url: full, rel }); }
      }
    });

    // All elements with data attributes
    $('[src],[href],[data-src],[data-url],[data-href],[action],[data-endpoint],[data-api],[data-base-url],[data-host]').each((_, el) => {
      const tag = $(el);
      for (const attr of ['src','href','data-src','data-url','data-href','action','data-endpoint','data-api','data-base-url','data-host']) {
        const val = tag.attr(attr);
        if (val && okUrl(val) && !val.startsWith('mailto:') && !val.startsWith('tel:') && !val.startsWith('#')) {
          const full = normalizeUrl(url, val);
          if (full) scan.add(full, '–', null, `HTML <${el.tagName}> @${attr}`);
        }
      }
    });

    // HTML comments (may contain endpoints/tokens)
    const commentRe = /<!--([\s\S]*?)-->/g;
    let cm;
    while ((cm = commentRe.exec(html)) !== null) {
      const content = cm[1].trim();
      if (content.length > 5 && content.length < 500) {
        scan.comments.push({ content, source: url });
        extractUrls(content, root).forEach(u => scan.add(u, '–', null, `HTML comment@${url}`));
        extractSecrets(content, `HTML comment@${url}`).forEach(s => scan.addSecret(s.type, s.value, s.source));
      }
    }

    // Forms
    $('form').each((_, form) => {
      const action = $(form).attr('action') || url;
      const method = ($(form).attr('method') || 'GET').toUpperCase();
      const inputs = [];
      $(form).find('input,textarea,select').each((_, inp) => {
        const name = $(inp).attr('name');
        const type = $(inp).attr('type') || 'text';
        const value = $(inp).attr('value') || '';
        if (name) inputs.push({ name, type, value });
        if (type === 'hidden' && name && value) scan.hiddenInputs.push({ name, value, source: url });
      });
      const fullAction = normalizeUrl(url, action);
      if (fullAction) {
        scan.add(fullAction, method, 'API', `HTML form@${url}`, null, false, `Inputs: ${inputs.map(i => i.name).join(', ')}`);
        scan.forms.push({ url: fullAction, method, inputs, source: url });
      }
    });

    // Follow links
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && okUrl(href) && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        const full = normalizeUrl(url, href);
        if (full && sameDomain(scan.target, full) && !visited.has(cleanUrl(full))) toVisit.push([cleanUrl(full), depth + 1]);
      }
    });

    // Scripts
    $('script').each((_, script) => {
      const src = $(script).attr('src');
      if (src) { const full = normalizeUrl(url, src); if (full) jsSet.add(full); }
      else {
        const code = $(script).text();
        if (code.trim()) {
          extractUrls(code, root).forEach(u => scan.add(u, '–', null, `inline-JS@${url}`));
          scan.processIntel(code, `inline-JS@${url}`);
        }
      }
    });

    extractUrls(html, root).forEach(u => scan.add(u, '–', null, `page-text@${url}`));

    // Embedded JSON data
    for (const pat of [
      /window\.__(?:NEXT_DATA|INITIAL_STATE|APP_STATE|nuxt|data)__\s*=\s*(\{.{20,}?\});?\s*(?:<\/|\/\/|\n)/s,
      /<script[^>]*type=["']application\/json["'][^>]*>(.*?)<\/script>/si,
    ]) {
      const m = html.match(pat);
      if (m) { extractUrls(m[1] || '', root).forEach(u => scan.add(u, '–', null, `embedded-JSON@${url}`)); }
    }
  }

  scan.js = [...jsSet];
  scan.push('log', { t: 'i', msg: `Crawled ${scan.pages.length} pages · ${jsSet.size} JS files · ${scan.forms.length} forms` });

  // Step 4
  scan.push('step', { n: 4, label: `Analyzing ${jsSet.size} JS files` });
  await limitedMap([...jsSet], async (jurl) => {
    try {
      const rr = await http.get(jurl, { responseType: 'text' });
      if (!rr) return;
      const text = typeof rr.data === 'string' ? rr.data : '';
      if (text.length > MAX_JS) { scan.push('log', { t: 'w', msg: `Skip large: ${jurl.split('/').pop()}` }); return; }
      const before = scan.items.length;
      extractUrls(text, root).forEach(u => scan.add(u, '–', null, jurl));
      for (const m of text.matchAll(/(?:import\s+.*?\s+from|require\s*\()\s*[`'"]([^`'"]+)[`'"]/g)) {
        const p = m[1];
        if (p.startsWith('/') || p.startsWith('http')) { const full = normalizeUrl(root, p); if (full) scan.add(full, '–', 'Import', jurl); }
      }
      scan.processIntel(text, jurl);
      const n = scan.items.length - before;
      if (n > 0) scan.push('log', { t: 'f', msg: `+${n} · ${jurl.split('/').pop()}` });
    } catch {}
  }, scan.threads);

  // Step 5
  scan.push('step', { n: 5, label: `Probing ${PROBE_PATHS.length} known paths` });
  await limitedMap(PROBE_PATHS, async (path) => {
    const url = root + path;
    try {
      const rr = await http.get(url);
      if (!rr || [404, 410].includes(rr.status)) return;
      const ct = rr.headers['content-type'] || '';
      const auth = [401, 403].includes(rr.status);
      let preview = '';
      const data = rr.data;
      if (ct.includes('json') && data) {
        try { preview = JSON.stringify(data, null, 2).slice(0, 400); } catch { preview = String(data).slice(0, 200); }
      } else if (rr.status === 200 && data) {
        preview = String(data).slice(0, 200);
      }
      scan.add(url, 'GET', null, 'probe', rr.status, auth, preview, ct.split(';')[0], auth);
      if (rr.status === 200 && data) scan.processIntel(String(data), `probe:${path}`);
    } catch {}
  }, scan.threads);

  // Step 6
  scan.push('step', { n: 6, label: 'GraphQL introspection' });
  const gqlQuery = { query: '{ __schema { queryType{name} mutationType{name} subscriptionType{name} types{name kind fields{name type{name kind ofType{name kind}}}} } }' };
  for (const path of ['/graphql', '/api/graphql', '/gql', '/query', '/api/gql', '/graph']) {
    try {
      const rr = await http.post(root + path, gqlQuery);
      if (rr.status === 200 && rr.data?.data) {
        const types = rr.data.data.__schema?.types || [];
        const names = types.filter(t => !t.name.startsWith('__')).map(t => t.name);
        scan.add(root + path, 'POST', 'GraphQL', 'GraphQL introspection', 200, false, `Types: ${names.slice(0, 20).join(', ')}`);
        scan.push('log', { t: 'f', msg: `GraphQL @ ${path} · ${names.length} types` });
        names.forEach(n => scan.graphqlOps.add(n));
      }
    } catch {}
  }

  // Step 7
  scan.push('step', { n: 7, label: 'OpenAPI / Swagger / AsyncAPI discovery' });
  for (const path of ['/swagger.json','/swagger/v1/swagger.json','/openapi.json','/api-docs','/v1/swagger.json','/v2/swagger.json','/openapi.yaml','/api/swagger.json','/api/openapi.json']) {
    try {
      const rr = await http.get(root + path);
      if (rr.status !== 200 || !rr.data || typeof rr.data !== 'object') continue;
      const spec = rr.data;
      const title = spec.info?.title || '';
      const ver = spec.info?.version || '';
      scan.push('log', { t: 'f', msg: `OpenAPI: ${title} ${ver}` });
      for (const [apiPath, methods] of Object.entries(spec.paths || {})) {
        for (const [method, op] of Object.entries(methods || {})) {
          if (!['get','post','put','delete','patch','head','options'].includes(method.toLowerCase())) continue;
          const summary = typeof op === 'object' ? (op.summary || op.description || '') : '';
          const full = normalizeUrl(root, apiPath);
          if (full) scan.add(full, method.toUpperCase(), 'API', 'OpenAPI spec', null, false, summary);
        }
      }
      for (const srv of spec.servers || []) { if (srv.url) scan.add(srv.url, '–', 'API', 'OpenAPI server'); }
    } catch {}
  }

  // Step 8
  scan.push('step', { n: 8, label: 'Auth & OIDC discovery' });
  for (const path of ['/.well-known/openid-configuration','/.well-known/oauth-authorization-server','/oauth/.well-known/openid-configuration','/auth/.well-known/openid-configuration']) {
    try {
      const rr = await http.get(root + path);
      if (rr.status === 200 && rr.data) {
        scan.push('log', { t: 'k', msg: `OIDC config at ${path}` });
        const d = rr.data;
        for (const key of ['issuer','authorization_endpoint','token_endpoint','userinfo_endpoint','jwks_uri','registration_endpoint','introspection_endpoint','revocation_endpoint']) {
          if (d[key]) scan.add(d[key], 'GET', 'Auth', 'OIDC config');
        }
      }
    } catch {}
  }

  // Step 9
  scan.push('step', { n: 9, label: 'CORS check & security analysis' });
  try {
    const rr = await http.get(scan.target, { headers: { ...DEFAULT_HEADERS, 'Origin': 'https://evil.com' } });
    const acao = rr.headers['access-control-allow-origin'] || '';
    const acac = rr.headers['access-control-allow-credentials'] || '';
    if (acao === '*' && acac.toLowerCase() === 'true') scan.corsMisconfig.add('Wildcard CORS with credentials');
    else if (acao === 'https://evil.com') scan.corsMisconfig.add('CORS reflects arbitrary origin');
    else if (acao === 'null') scan.corsMisconfig.add('CORS allows null origin');
    if ([...scan.corsMisconfig].length > 0) scan.push('log', { t: 'w', msg: `CORS issues: ${[...scan.corsMisconfig].join('; ')}` });
  } catch {}

  const elapsed = ((Date.now() - scan.t0) / 1000).toFixed(1);
  scan.done = true;
  scan.push('done', { total: scan.items.length, secrets: scan.secrets.length, pages: scan.pages.length, js: scan.js.length, elapsed });
}

// Routes
app.post('/scan', (req, res) => {
  const { url, depth = 2, threads = 10 } = req.body;
  if (!url) return res.json({ error: 'URL required' });
  try { new URL(url); } catch { return res.json({ error: 'Invalid URL' }); }
  const sid = uuidv4();
  const scan = new Scan(sid, url, Math.min(depth, 5), Math.min(threads, 25));
  SCANS.set(sid, scan);
  runScan(scan).catch(e => { scan.push('log', { t: 'e', msg: String(e) }); scan.done = true; scan.push('done', {}); });
  res.json({ scan_id: sid });
});

app.get('/stream/:id', (req, res) => {
  const scan = SCANS.get(req.params.id);
  if (!scan) return res.status(404).end();
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  scan.addListener(res);
  req.on('close', () => { scan.listeners = scan.listeners.filter(r => r !== res); });
});

app.get('/result/:id', (req, res) => {
  const scan = SCANS.get(req.params.id);
  if (!scan) return res.status(404).json({ error: 'Not found' });
  res.json({
    headers: scan.headers, cookies: scan.cookies, tech: [...scan.tech],
    env_vars: [...scan.envVars], graphql_ops: [...scan.graphqlOps],
    sourcemaps: [...scan.sourcemaps], internal_ips: [...scan.internalIps],
    cors_misconfig: [...scan.corsMisconfig], firebase_configs: [...scan.firebaseConfigs],
    forms: scan.forms, links: scan.links, meta_tags: scan.metaTags,
    hidden_inputs: scan.hiddenInputs, comments: scan.comments,
    pages: scan.pages, js_files: scan.js,
  });
});

app.get('/download/:id/:fmt', (req, res) => {
  const scan = SCANS.get(req.params.id);
  if (!scan) return res.status(404).end();
  if (req.params.fmt === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="webhawk-scan.json"');
    return res.json({ target: scan.target, items: scan.items, secrets: scan.secrets, tech: [...scan.tech], headers: scan.headers, cookies: scan.cookies, env_vars: [...scan.envVars], graphql_ops: [...scan.graphqlOps], forms: scan.forms, meta_tags: scan.metaTags, hidden_inputs: scan.hiddenInputs });
  }
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="webhawk-scan.txt"');
  let out = `WebHawk Pro Scan Report\nTarget: ${scan.target}\n${'='.repeat(60)}\n\nURLs (${scan.items.length}):\n`;
  scan.items.forEach(i => { out += `${i.method} ${i.url} [${i.cat}] ${i.status ? `HTTP ${i.status}` : ''}\n`; });
  out += `\nSecrets (${scan.secrets.length}):\n`;
  scan.secrets.forEach(s => { out += `[${s.type}]\n  Value: ${s.value}\n  Source: ${s.source}\n\n`; });
  out += `\nTech Stack:\n${[...scan.tech].join('\n')}\n`;
  out += `\nForms (${scan.forms.length}):\n`;
  scan.forms.forEach(f => { out += `${f.method} ${f.url}\n  Inputs: ${f.inputs.map(i => `${i.name}(${i.type})`).join(', ')}\n`; });
  res.send(out);
});

app.post('/network/start', (req, res) => {
  const sid = uuidv4();
  NETWORK_SESSIONS.set(sid, { events: [], listeners: [], url: req.body.url });
  res.json({ session_id: sid });
});

app.get('/network/stream/:id', (req, res) => {
  const session = NETWORK_SESSIONS.get(req.params.id);
  if (!session) return res.status(404).end();
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  session.events.forEach(ev => { try { res.write(`data: ${JSON.stringify(ev)}\n\n`); } catch {} });
  session.listeners.push(res);
  req.on('close', () => { session.listeners = session.listeners.filter(r => r !== res); });
});

app.get('/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).end();
  try {
    const start = Date.now();
    const rr = await axios.get(url, { headers: { ...DEFAULT_HEADERS, 'Referer': url }, responseType: 'arraybuffer', timeout: 15000, validateStatus: () => true });
    const duration = Date.now() - start;
    const sid = req.query.session;
    if (sid && NETWORK_SESSIONS.has(sid)) {
      const ev = { id: uuidv4(), url, method: 'GET', status: rr.status, type: (rr.headers['content-type'] || '').split(';')[0] || 'unknown', size: rr.data.length, duration, time: Date.now(), headers: rr.headers };
      const session = NETWORK_SESSIONS.get(sid);
      session.events.push(ev);
      session.listeners.forEach(r => { try { r.write(`data: ${JSON.stringify(ev)}\n\n`); } catch {} });
    }
    res.status(rr.status);
    for (const [k, v] of Object.entries(rr.headers)) {
      if (!['transfer-encoding','content-encoding','content-security-policy'].includes(k.toLowerCase())) {
        try { res.setHeader(k, v); } catch {}
      }
    }
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.send(Buffer.from(rr.data));
  } catch (e) { res.status(502).json({ error: String(e) }); }
});

app.get('/health', (req, res) => res.json({ ok: true, version: '2.0.0', name: 'WebHawk Pro' }));

// Serve built frontend (production / Render deployment)
const STATIC_CANDIDATES = [path.join(__dirname, '..', 'dist', 'public'), path.join(__dirname, 'dist', 'public'), path.join(__dirname, '..', 'frontend', 'dist', 'public')];
  const STATIC_DIR = STATIC_CANDIDATES.find(p => fs.existsSync(p));
if (STATIC_DIR) {
  app.use(express.static(STATIC_DIR, { maxAge: '1h', etag: true }));
  app.get('*', (req, res, next) => {
    const reserved = ['/scan', '/stream', '/result', '/download', '/network', '/proxy', '/health'];
    if (reserved.some(p => req.path.startsWith(p))) return next();
    const indexPath = path.join(STATIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
    next();
  });
  console.log(`[WebHawk] Serving static frontend from ${STATIC_DIR}`);
}

app.listen(PORT, '0.0.0.0', () => { console.log(`WebHawk Pro backend on port ${PORT}`); });
