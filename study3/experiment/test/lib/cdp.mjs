// Minimal Chrome DevTools Protocol client and headless-Chrome launcher (no npm packages).
// Uses Node's global WebSocket (Node >= 22). Flattened sessions: every command can carry a
// sessionId, and events are dispatched with the sessionId they belong to.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class CDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map(); // method -> Set(fn(params, sessionId))
    this.closed = false;
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', (e) => reject(new Error('CDP websocket error: ' + (e.message || 'connect failed'))), { once: true });
    });
    this.ws.addEventListener('message', (ev) => this._onMessage(ev.data));
    this.ws.addEventListener('close', (ev) => {
      this.closed = true;
      this.closeInfo = `code ${ev.code}${ev.reason ? ' ' + ev.reason : ''}`;
      for (const { reject, method } of this.pending.values()) reject(new Error('CDP connection closed during ' + method));
      this.pending.clear();
    });
    return this;
  }

  _onMessage(data) {
    let msg;
    try { msg = JSON.parse(typeof data === 'string' ? data : Buffer.from(data).toString('utf8')); } catch { return; }
    if (msg.id !== undefined) {
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.error) p.reject(new Error(`${p.method}: ${msg.error.message}${msg.error.data ? ' (' + msg.error.data + ')' : ''}`));
      else p.resolve(msg.result || {});
      return;
    }
    const set = this.handlers.get(msg.method);
    if (set) for (const fn of [...set]) {
      try {
        const r = fn(msg.params || {}, msg.sessionId);
        if (r && typeof r.catch === 'function') r.catch((e) => console.error('[cdp handler]', msg.method, e.message));
      } catch (e) { console.error('[cdp handler]', msg.method, e.message); }
    }
  }

  send(method, params = {}, sessionId) {
    if (this.closed) return Promise.reject(new Error('CDP closed (' + method + '; websocket ' + (this.closeInfo || '?') + ')'));
    const id = this.nextId++;
    const msg = { id, method, params };
    if (process.env.DEBUG_CDP && method !== 'Runtime.evaluate') console.log('[cdp>]', Date.now() % 100000, method, JSON.stringify(params).slice(0, 120));
    if (process.env.DEBUG_CDP && method === 'Runtime.evaluate') console.log('[cdp>]', Date.now() % 100000, 'eval', String(params.expression).slice(0, 80));
    if (sessionId) msg.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.ws.send(JSON.stringify(msg));
    });
  }

  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, new Set());
    this.handlers.get(method).add(fn);
    return () => this.handlers.get(method).delete(fn);
  }

  close() { try { this.ws.close(); } catch { /* ignore */ } }
}

// Launch Chrome headless with a fresh profile under `profileRoot`. All background networking is
// switched off and the browser is pointed at a dead proxy (127.0.0.1:9), so any request that the
// harness does not intercept (including Chrome's own background traffic) cannot leave the machine.
// Loopback addresses bypass the proxy (Chrome's implicit rule), so the local server still works.
export async function launchChrome({ chromePath, profileRoot, tag, windowSize = '1280,800' }) {
  fs.mkdirSync(profileRoot, { recursive: true });
  const userDataDir = fs.mkdtempSync(path.join(profileRoot, `chrome-${tag}-`));
  const args = [
    '--headless=new',
    '--remote-debugging-port=0',
    '--remote-allow-origins=*',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run', '--no-default-browser-check', '--no-service-autorun', '--password-store=basic', '--use-mock-keychain',
    '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-default-apps',
    // NOTE: no --disable-extensions: with it, headless Chrome 155 on macOS exits (code 0) a few
    // seconds after start. Component extensions cannot reach the network (dead proxy below).
    '--disable-client-side-phishing-detection', '--disable-domain-reliability',
    '--disable-breakpad', '--disable-crash-reporter', '--metrics-recording-only', '--safebrowsing-disable-auto-update',
    '--disable-features=Translate,OptimizationHints,OptimizationGuideModelDownloading,MediaRouter,DialMediaRouteProvider,AutofillServerCommunication,CertificateTransparencyComponentUpdater,InterestFeedContentSuggestions,PrivacySandboxSettings4,NetworkTimeServiceQuerying',
    '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows',
    '--proxy-server=http://127.0.0.1:9',
    `--window-size=${windowSize}`,
    'about:blank',
  ];
  const proc = spawn(chromePath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  proc.stdout.on('data', () => {});
  let stderr = '';
  proc.stderr.on('data', (d) => { stderr += d.toString(); if (stderr.length > 20000) stderr = stderr.slice(-20000); });
  const portFile = path.join(userDataDir, 'DevToolsActivePort');
  const t0 = Date.now();
  while (!fs.existsSync(portFile) || fs.readFileSync(portFile, 'utf8').split('\n').length < 2) {
    if (proc.exitCode !== null) throw new Error('Chrome exited early: ' + stderr.slice(-500));
    if (Date.now() - t0 > 20000) throw new Error('Chrome did not open a DevTools port within 20 s');
    await sleep(100);
  }
  const [port, wsPath] = fs.readFileSync(portFile, 'utf8').trim().split('\n');
  const cdp = await new CDP(`ws://127.0.0.1:${port.trim()}${wsPath.trim()}`).connect();
  const close = async () => {
    try { await Promise.race([cdp.send('Browser.close'), sleep(3000)]); } catch { /* ignore */ }
    cdp.close();
    const t1 = Date.now();
    while (proc.exitCode === null && Date.now() - t1 < 5000) await sleep(100);
    if (proc.exitCode === null) { try { proc.kill('SIGKILL'); } catch { /* ignore */ } }
    await sleep(200);
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch { /* ignore */ }
  };
  const info = () => `chrome exit=${proc.exitCode} signal=${proc.signalCode}; stderr tail: ${stderr.slice(-400).replace(/\s+/g, ' ')}`;
  return { cdp, proc, userDataDir, close, info };
}
