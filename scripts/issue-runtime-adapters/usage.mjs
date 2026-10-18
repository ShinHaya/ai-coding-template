import { spawn as nodeSpawn } from "node:child_process";

const MAX_OUTPUT_BYTES = 1024 * 1024;
const KILL_GRACE_MS = 2_000;
const PATH = /^(?:\$\.)?[A-Za-z_][A-Za-z0-9_-]*(?:\.[A-Za-z_][A-Za-z0-9_-]*)*$/;
const condition = /^(.*?)\s+(== false|!= null)$/;
const unknown = (reason, fetchedAt) => ({ status: "unknown", reason, ...(fetchedAt ? { fetchedAt } : {}) });

/** A deliberately small JSON-path vocabulary, never JavaScript or shell code. */
export function validateUsageDefinition(usage) {
  if (!usage) return;
  const validPath = value => typeof value === "string" && PATH.test(value);
  if (!usage.windows.split("|").every(p => p.trim().startsWith("$.") && validPath(p.trim())) ||
      !validPath(usage.usedPercent) || usage.usedPercent.startsWith("$.") ||
      !validPath(usage.windowDurationMins) || usage.windowDurationMins.startsWith("$."))
    throw new Error("runtime-usage-path-invalid");
  for (const expression of usage.blocked ?? []) {
    const match = expression.match(condition);
    if (!match || !validPath(match[1])) throw new Error("runtime-usage-condition-invalid");
  }
  if (usage.transport === "jsonrpc-stdio" ? !usage.request || (usage.initialized && !usage.initialize)
      : usage.request || usage.initialize || usage.initialized)
    throw new Error("runtime-usage-transport-invalid");
}

function at(object, selector) {
  for (const key of selector.replace(/^\$\./, "").split(".")) {
    if (!object || typeof object !== "object" || !Object.hasOwn(object, key)) return undefined;
    object = object[key];
  }
  return object;
}

/** Select exactly one 300-minute window; expose no account or raw response fields. */
export function normalizeUsage(result, usage, { fetchedAt } = {}) {
  if (!result || typeof result !== "object" || Array.isArray(result))
    return unknown("parent-usage-invalid-response", fetchedAt);
  let snapshot;
  for (const selector of usage.windows.split("|")) {
    const candidate = at(result, selector.trim());
    if (candidate !== undefined && candidate !== null) { snapshot = candidate; break; }
  }
  if (!snapshot || typeof snapshot !== "object") return unknown("parent-usage-invalid-response", fetchedAt);
  const windows = Object.values(snapshot).filter(window => window && typeof window === "object" &&
    at(window, usage.windowDurationMins) === 300);
  if (windows.length !== 1) return unknown("parent-usage-window-missing", fetchedAt);
  const used = at(windows[0], usage.usedPercent);
  if (!Number.isSafeInteger(used) || used < 0 || used > 100) return unknown("parent-usage-invalid-value", fetchedAt);
  for (const expression of usage.blocked ?? []) {
    const [, selector, operator] = expression.match(condition);
    const value = at(selector.startsWith("$.") ? result : snapshot, selector);
    if (operator === "== false" ? value === false : value !== undefined && value !== null)
      return unknown("parent-usage-blocked", fetchedAt);
  }
  return { status: "ok", remainingPercent: 100 - used, windowDurationMins: 300, ...(fetchedAt ? { fetchedAt } : {}) };
}

/** Bounded, argv-only local transports. Raw data never leaves this boundary's caller. */
export function fetchUsage(usage, { timeoutMs = 15_000, spawn = nodeSpawn, env = process.env, cwd = process.cwd() } = {}) {
  return new Promise((resolve, reject) => {
    let child;
    let settled = false;
    let buffer = "";
    let bytes = 0;
    let initialized = false;
    const fail = () => new Error("parent-usage-fetch-failed");
    let timer;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { child?.stdin?.end(); } catch { /* already closed */ }
      if (child && child.exitCode === null && child.signalCode === null) {
        child.kill("SIGTERM");
        const killTimer = setTimeout(() => child.kill("SIGKILL"), KILL_GRACE_MS);
        killTimer.unref?.();
        child.once("exit", () => clearTimeout(killTimer));
      }
      if (error) reject(error); else resolve(value);
    };
    try { child = spawn(usage.command[0], usage.command.slice(1), { cwd, env, stdio: ["pipe", "pipe", "ignore"] }); }
    catch { finish(fail()); return; }
    timer = setTimeout(() => finish(new Error("parent-usage-timeout")), timeoutMs);
    const send = message => {
      if (settled) return;
      try { child.stdin.write(`${JSON.stringify(message)}\n`); } catch { finish(fail()); }
    };
    const request = () => send({ id: 2, ...usage.request });
    child.on("error", () => finish(fail()));
    child.stdin.on("error", () => finish(fail()));
    child.on("close", code => {
      if (usage.transport !== "exec-json" || code !== 0) { finish(fail()); return; }
      try { finish(null, JSON.parse(buffer)); } catch { finish(fail()); }
    });
    // JSON-RPC needs a newline-framed response while the server is still alive.
    child.on("exit", () => { if (usage.transport === "jsonrpc-stdio") finish(fail()); });
    child.stdout.on("data", chunk => {
      if (settled) return;
      bytes += Buffer.byteLength(chunk);
      if (bytes > MAX_OUTPUT_BYTES) { finish(fail()); return; }
      buffer += chunk;
      if (usage.transport === "exec-json") return;
      let newline;
      while (!settled && (newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        let message;
        try { message = JSON.parse(line); } catch { continue; }
        if (!message || typeof message !== "object") continue;
        if (message.id === 1 && usage.initialize && !initialized) {
          if (message.error || !Object.hasOwn(message, "result")) { finish(fail()); return; }
          initialized = true;
          if (usage.initialized) send({ method: usage.initialized });
          request();
        } else if (message.id === 2 && (!usage.initialize || initialized)) {
          if (message.error || !Object.hasOwn(message, "result")) { finish(fail()); return; }
          finish(null, message.result);
        }
      }
    });
    if (usage.transport === "exec-json") child.stdin.end();
    else if (usage.initialize) send({ id: 1, ...usage.initialize });
    else request();
  });
}
