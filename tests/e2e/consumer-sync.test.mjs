// End-to-end check of template delivery: run the same CLI steps as
// .github/workflows/sync-consumers.yml against throwaway local consumers, then
// run the managed suite from inside the synced consumer. Template-only, so it
// lives outside the managed tests/ai-template/ tree. Uses fake data and local
// Git repositories only; nothing is pushed.

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { listManagedFiles } from "../../scripts/ai-template/sync.mjs";

const source = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const git = (cwd, ...args) =>
  execFileSync(
    "git",
    ["-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false", ...args],
    {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
const commitAll = (cwd) => {
  git(cwd, "add", "-A");
  git(
    cwd,
    "-c",
    "user.name=Fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "commit",
    "-qm",
    "fixture",
  );
};
const put = (root, file, content, mode = 0o644) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), content);
  fs.chmodSync(path.join(root, file), mode);
};
const temp = (t, prefix) => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
};
/**
 * Run a CLI the way the workflow does: a separate Node process in `cwd`.
 * NODE_TEST_CONTEXT is dropped so a nested `node --test` reports normally
 * instead of streaming to this runner.
 */
const childEnv = { ...process.env };
delete childEnv.NODE_TEST_CONTEXT;
const node = (cwd, args) =>
  spawnSync(process.execPath, args, {
    cwd,
    env: childEnv,
    encoding: "utf8",
    timeout: 600_000,
  });

/**
 * A clean template checkout holding the working tree's manifest and managed
 * files, so the test also runs before they are committed.
 */
function templateCheckout(t) {
  const root = temp(t, "e2e-template-");
  git(root, "init", "-q", "-b", "main");
  put(
    root,
    "ai-template.manifest.json",
    fs.readFileSync(path.join(source, "ai-template.manifest.json")),
  );
  for (const { file, content, executable } of listManagedFiles(source, {
    requireClean: false,
  }).files)
    put(root, file, content, executable ? 0o755 : 0o644);
  commitAll(root);
  return root;
}

const CONSUMER_CONFIG = {
  repository: { baseBranch: "develop" },
  agents: { enabled: ["claude", "codex"] },
  localSkills: ["fixture-skill"],
};
const LOCAL_SKILL =
  "---\nname: fixture-skill\n---\nRepository-owned fixture skill\n";

/**
 * A consumer on a non-default trunk. By default it has repository settings and
 * one repository-owned skill; `config: null` leaves both out.
 */
function consumerCheckout(t, { config = CONSUMER_CONFIG, files = {} } = {}) {
  const root = temp(t, "e2e-consumer-");
  git(root, "init", "-q", "-b", "develop");
  if (config) {
    put(
      root,
      ".ai-template/config.json",
      `${JSON.stringify(config, null, 2)}\n`,
    );
    put(root, "skills/fixture-skill/SKILL.md", LOCAL_SKILL);
  }
  put(root, "README.md", "Fixture consumer\n");
  for (const [file, content] of Object.entries(files)) put(root, file, content);
  commitAll(root);
  return root;
}

/** The workflow's "Sync managed files and regenerate" step. */
function syncStep(template, consumer, { adopt = false } = {}) {
  const body = path.join(
    consumer,
    "..",
    `${path.basename(consumer)}-pr-body.md`,
  );
  const sync = node(consumer, [
    path.join(template, "scripts/ai-template.mjs"),
    "sync",
    "--from",
    template,
    "--source-repository",
    "example/template",
    "--pr-body",
    body,
    ...(adopt ? ["--adopt"] : []),
  ]);
  return {
    sync,
    body: fs.existsSync(body) ? fs.readFileSync(body, "utf8") : null,
  };
}
const consumerCli = (consumer, ...args) =>
  node(consumer, [path.join(consumer, "scripts/ai-template.mjs"), ...args]);
const statusLines = (cwd) =>
  git(cwd, "status", "--porcelain=v1", "--untracked-files=all")
    .split("\n")
    .filter(Boolean);

test("a fresh consumer syncs, regenerates and passes check, then stays stable", async (t) => {
  const template = templateCheckout(t);
  const consumer = consumerCheckout(t);

  const { sync, body } = syncStep(template, consumer);
  assert.equal(sync.status, 0, sync.stderr);
  assert.match(
    body,
    /Automated sync of managed AI template files from `example\/template`/,
  );
  for (const step of ["generate", "check"]) {
    const result = consumerCli(consumer, step);
    assert.equal(result.status, 0, `${step}: ${result.stderr}`);
  }
  assert.equal(
    fs.readlinkSync(path.join(consumer, ".claude/skills/fixture-skill")),
    "../../skills/fixture-skill",
  );
  assert.equal(
    fs.readFileSync(
      path.join(consumer, "skills/fixture-skill/SKILL.md"),
      "utf8",
    ),
    LOCAL_SKILL,
  );
  commitAll(consumer);

  // A second run is the workflow's "already matches the template" path.
  const again = syncStep(template, consumer);
  assert.equal(again.sync.status, 0, again.sync.stderr);
  assert.deepEqual(JSON.parse(again.sync.stdout).written, []);
  assert.equal(consumerCli(consumer, "generate").status, 0);
  assert.deepEqual(statusLines(consumer), []);
});

test("the managed suite passes inside a synced consumer", async (t) => {
  // The consumer has its own settings (non-default trunk, two enabled
  // runtimes, a local skill); the managed suite must not depend on them (#31).
  const template = templateCheckout(t);
  const consumer = consumerCheckout(t);
  assert.equal(syncStep(template, consumer).sync.status, 0);
  assert.equal(consumerCli(consumer, "generate").status, 0);
  // The consumer layout has no manifest, consumer list or template-only
  // files. Dependencies come from the template checkout.
  fs.symlinkSync(
    path.join(source, "node_modules"),
    path.join(consumer, "node_modules"),
    "dir",
  );

  const suite = consumerCli(consumer, "test");
  assert.equal(
    suite.status,
    0,
    `managed suite failed in the consumer:\n${suite.stdout.slice(-4000)}${suite.stderr}`,
  );
  // Node 22 reports TAP ("# pass N") without a TTY; newer releases use spec ("ℹ pass N").
  const count = (name) =>
    Number(
      suite.stdout.match(new RegExp(`^(?:ℹ|#) ${name} (\\d+)$`, "m"))?.[1],
    );
  assert.ok(count("pass") > 0, "the managed suite ran no tests");
  assert.equal(count("fail"), 0);
});

test("a local edit to a managed file fails check and is reverted by the next sync", async (t) => {
  const template = templateCheckout(t);
  const consumer = consumerCheckout(t);
  assert.equal(syncStep(template, consumer).sync.status, 0);
  assert.equal(consumerCli(consumer, "generate").status, 0);
  commitAll(consumer);

  const managed = path.join(consumer, "scripts/issue-dispatch.mjs");
  const original = fs.readFileSync(managed, "utf8");
  fs.appendFileSync(managed, "// local edit\n");
  const drifted = consumerCli(consumer, "check");
  assert.equal(drifted.status, 1);
  assert.match(drifted.stdout, /managed-modified:scripts\/issue-dispatch\.mjs/);

  const { sync, body } = syncStep(template, consumer);
  assert.equal(sync.status, 0, sync.stderr);
  assert.deepEqual(JSON.parse(sync.stdout).drift, [
    "scripts/issue-dispatch.mjs",
  ]);
  assert.match(
    body,
    /Locally modified managed files reverted to the template[\s\S]*scripts\/issue-dispatch\.mjs/,
  );
  assert.equal(fs.readFileSync(managed, "utf8"), original);
  assert.equal(consumerCli(consumer, "check").status, 0);
});

test("first sync stops on a differing repo-owned file until adoption is explicit", async (t) => {
  const template = templateCheckout(t);
  const existing = "#!/bin/sh\necho repository-owned hooks\n";
  const consumer = consumerCheckout(t, {
    files: { "scripts/setup-hooks.sh": existing },
  });

  const refused = syncStep(template, consumer);
  assert.equal(refused.sync.status, 1);
  assert.match(
    refused.sync.stderr,
    /managed-collision:scripts\/setup-hooks\.sh/,
  );
  // Validation runs before any write, so the consumer is untouched.
  assert.deepEqual(statusLines(consumer), []);
  assert.equal(refused.body, null);

  const adopted = syncStep(template, consumer, { adopt: true });
  assert.equal(adopted.sync.status, 0, adopted.sync.stderr);
  assert.match(
    adopted.body,
    /Existing files adopted as managed[\s\S]*scripts\/setup-hooks\.sh/,
  );
  assert.equal(consumerCli(consumer, "generate").status, 0);
  assert.equal(consumerCli(consumer, "check").status, 0);
});
