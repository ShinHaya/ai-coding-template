/**
 * The single model-listing path for every runtime. Resolves the CLI, checks
 * authentication, and reads the runtime's own model list without executing a
 * model: either a list command (`models.args`) or one control-protocol request
 * (`models.control`). Only model identifiers, labels, the CLI path and closed
 * reason codes leave this module; raw CLI output and other response fields
 * (accounts, commands, ...) are dropped here.
 */

import { DEFAULT_PROBE_TIMEOUT_MS, REASON_CODES, resolveExecutable, runProcess } from "./shared.mjs";
import { parseAuthentication, parseCatalog } from "./parsers.mjs";
import { fetchUsage } from "./usage.mjs";
import { isRetiredCommand } from "../ai-template/registry.mjs";

/**
 * @typedef {{ model: string, label: string }} CatalogModel
 * @typedef {{ status: "ok", cliPath: string, source: string, models: CatalogModel[] }
 *   | { status: "failed", reason: string, cliPath?: string, source?: string }} RuntimeListing
 */

/** @param {Record<string, any>} definition */
export function catalogSource(definition) {
  return definition.models?.control ? `control:${definition.models.control.request.method}` : "command";
}

/**
 * @param {Record<string, any>} definition runtime definition from the registry
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv, pathEnv?: string, timeoutMs?: number, cliPath?: string,
 *   runProcess?: typeof runProcess, resolveExecutable?: Function, spawn?: Function }} [ctx]
 * @returns {Promise<RuntimeListing>}
 */
export async function fetchRuntimeCatalog(definition, ctx = {}) {
  const timeoutMs = ctx.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
  const run = ctx.runProcess ?? runProcess;
  const resolve = ctx.resolveExecutable ?? resolveExecutable;
  const env = ctx.env ?? process.env;
  const source = catalogSource(definition);
  if (definition.retired) return { status: "failed", reason: REASON_CODES.CLI_NOT_FOUND, source };
  let cliPath;
  for (const name of ctx.cliPath ? [ctx.cliPath] : definition.commands) {
    if (isRetiredCommand(name, ctx.cwd)) continue;
    const resolved = await resolve(name, { env, pathEnv: ctx.pathEnv });
    if (resolved && !isRetiredCommand(resolved, ctx.cwd)) { cliPath = resolved; break; }
  }
  if (!cliPath) return { status: "failed", reason: REASON_CODES.CLI_NOT_FOUND, source };
  const failed = reason => ({ status: /** @type {const} */ ("failed"), reason, cliPath, source });
  if (definition.auth) {
    const auth = await run(cliPath, definition.auth.args, { timeoutMs, env, cwd: ctx.cwd });
    if (auth.timedOut) return failed(REASON_CODES.VERIFICATION_TIMEOUT);
    if (!parseAuthentication(definition.auth.parser, auth)) return failed(REASON_CODES.AUTH_UNAVAILABLE);
  }
  let parsed;
  if (definition.models.control) {
    const { args, request } = definition.models.control;
    let response;
    try {
      response = await fetchUsage({ transport: "control-stdio", command: [cliPath, ...args], request },
        { timeoutMs, env, cwd: ctx.cwd, ...(ctx.spawn ? { spawn: ctx.spawn } : {}) });
    } catch (error) {
      return failed(error?.message === "parent-usage-timeout" ? REASON_CODES.VERIFICATION_TIMEOUT : REASON_CODES.PROBE_FAILED);
    }
    parsed = await parseCatalog(definition.models.parser, { response });
  } else {
    const listed = definition.models.args.length
      ? await run(cliPath, definition.models.args, { timeoutMs, env, cwd: ctx.cwd }) : { code: 0, stdout: "" };
    if (listed.timedOut) return failed(REASON_CODES.VERIFICATION_TIMEOUT);
    parsed = await parseCatalog(definition.models.parser, listed);
    if (listed.code !== 0) return failed(definition.auth || parsed.loggedIn ? REASON_CODES.PROBE_FAILED : REASON_CODES.AUTH_UNAVAILABLE);
  }
  if (!parsed.models?.length) return failed(parsed.loggedIn === false ? REASON_CODES.AUTH_UNAVAILABLE : REASON_CODES.MODEL_NOT_SELECTABLE);
  const models = [];
  for (const entry of parsed.models) {
    if (typeof entry?.model !== "string" || !entry.model || models.some(model => model.model === entry.model)) continue;
    models.push({ model: entry.model, label: typeof entry.requestedModel === "string" && entry.requestedModel ? entry.requestedModel : entry.model });
  }
  return { status: "ok", cliPath, source, models };
}
