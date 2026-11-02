import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../scripts/setup-hooks.sh");

/** A throwaway repository holding a copy of setup-hooks.sh and a non-executable fake hook. */
function repository(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "setup-hooks-")));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "-q", root]);
  fs.mkdirSync(path.join(root, "scripts"));
  fs.copyFileSync(script, path.join(root, "scripts/setup-hooks.sh"));
  fs.mkdirSync(path.join(root, ".githooks"));
  fs.writeFileSync(path.join(root, ".githooks/pre-commit"), "#!/bin/sh\nexit 0\n", { mode: 0o644 });
  return root;
}
const setup = (root) => spawnSync("bash", ["scripts/setup-hooks.sh"], { cwd: root, encoding: "utf8" });
const hooksPath = (root) =>
  spawnSync("git", ["config", "--local", "--get", "core.hooksPath"], { cwd: root, encoding: "utf8" }).stdout.trim();
const executable = (file) => (fs.statSync(file).mode & 0o111) !== 0;

test("setup-hooks sets an unset core.hooksPath and is idempotent", (t) => {
  const root = repository(t);
  const first = setup(root);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(hooksPath(root), ".githooks");
  assert.equal(executable(path.join(root, ".githooks/pre-commit")), true);

  const again = setup(root);
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /already set to \.githooks/);
  assert.equal(hooksPath(root), ".githooks");
});

test("setup-hooks refuses to replace another core.hooksPath and changes nothing", (t) => {
  const root = repository(t);
  execFileSync("git", ["config", "--local", "core.hooksPath", "custom-hooks"], { cwd: root });

  const refused = setup(root);
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /existing core\.hooksPath = custom-hooks/);
  assert.match(refused.stderr, /git config --local --unset core\.hooksPath/);
  assert.equal(hooksPath(root), "custom-hooks");
  assert.equal(executable(path.join(root, ".githooks/pre-commit")), false);

  execFileSync("git", ["config", "--local", "--unset", "core.hooksPath"], { cwd: root });
  assert.equal(setup(root).status, 0);
  assert.equal(hooksPath(root), ".githooks");
});
