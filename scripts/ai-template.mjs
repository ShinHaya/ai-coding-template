#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRuntimeRegistry } from "./ai-template/registry.mjs";
import { generate } from "./ai-template/generate.mjs";

export function run(argv, root = process.cwd()) {
  const args = [...argv];
  const index = args.indexOf("--root");
  if (index >= 0) {
    if (!args[index + 1]) throw new Error("ai-template-root-missing");
    root = path.resolve(args[index + 1]); args.splice(index, 2);
  }
  if (args.length === 2 && args[0] === "agents" && args[1] === "list") {
    const registry = loadRuntimeRegistry(root);
    return registry.runtimes.map(r => ({ id: r.id, name: r.name, aliases: r.aliases,
      status: r.retired ? "retired" : registry.enabled.includes(r) ? "enabled" : "disabled" }));
  }
  if (args.length === 2 && args[0] === "agents" && args[1].startsWith("resolve=")) {
    const r = loadRuntimeRegistry(root).aliases.get(args[1].slice(8).trim().toLowerCase());
    if (!r || r.retired) throw new Error("runtime-agent-invalid");
    return r.id;
  }
  if (args.length === 1 && args[0] === "generate") return generate(root);
  throw new Error("usage: ai-template.mjs agents list | agents resolve=<alias> | generate [--root <path>]");
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const result = run(process.argv.slice(2)); console.log(typeof result === "string" ? result : JSON.stringify(result, null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
